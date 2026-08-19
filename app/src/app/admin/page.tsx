"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clipboard,
  Copy,
  ExternalLink,
  Link2,
  LoaderCircle,
  Rocket,
  ShieldCheck,
  UserPlus,
  WalletCards,
} from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { MidnightClient, verifyContractIndexed } from "@/lib/midnight-client";
import type { TransactionProgressStage, WalletOption } from "@/lib/midnight-client";
import {
  DEFAULT_GATE,
  formatContractId,
  gateUrl,
  getGate,
  isValidContractId,
  resetGateToDraft,
  restorePublishedGate,
  saveGate,
  type GateRecord,
} from "@/lib/gate-store";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { WalletSessionBar } from "@/components/WalletSessionBar";
import { LoadingState, BusyButtonContent } from "@/components/ui/LoadingState";
import { StatusBanner, StageBadge } from "@/components/ui/StatusBanner";
import { ProgressPanel } from "@/components/ui/ProgressPanel";
import { PageShell } from "@/components/ui/PageShell";
import { ProofReference } from "@/components/ui/ProofReference";
import { progressLabel, type ProgressStage } from "@/lib/transaction-stages";
import { explorerHomeUrl } from "@/lib/explorer";

type DeploymentStage =
  | "configure"
  | "connecting"
  | "connected"
  | "deploying"
  | "confirming"
  | "published"
  | "error";

type EnrollmentStage =
  | "idle"
  | TransactionProgressStage
  | "confirming"
  | "confirmation_pending"
  | "confirmed"
  | "error";

type PendingEnrollment = {
  credentialHash: Uint8Array;
  txId: string | null;
};

function parseCredential(value: string): Uint8Array {
  const normalized = value.trim().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/i.test(normalized)) throw new Error("CREDENTIAL_FORMAT");
  const bytes = new Uint8Array(32);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(normalized.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function isActiveEnrollment(stage: EnrollmentStage): boolean {
  return ["preparing", "proving", "balancing", "awaiting_wallet", "submitted", "confirming"].includes(stage);
}

function enrollmentLabel(stage: EnrollmentStage): string {
  if (stage === "confirmation_pending") return "Confirmation still pending";
  if (stage === "idle" || stage === "confirmed" || stage === "error" || stage === "confirming") {
    const labels: Record<string, string> = {
      idle: "Ready to issue",
      confirming: "Waiting for network confirmation",
      confirmed: "Credential enrolled",
      error: "Enrollment needs attention",
    };
    return labels[stage] ?? stage;
  }
  return progressLabel(stage as ProgressStage, "enroll");
}

export default function AdminPage() {
  const clientRef = useRef<MidnightClient | null>(null);
  const getClient = () => clientRef.current ?? (clientRef.current = new MidnightClient());
  // Hydration-safe: start from DEFAULT_GATE, hydrate from localStorage after mount.
  const [gate, setGate] = useState<GateRecord>(DEFAULT_GATE);
  const laceSyncHandled = useRef(false);
  const [gateReady, setGateReady] = useState(false);
  const [name, setName] = useState(DEFAULT_GATE.name);
  const [description, setDescription] = useState(DEFAULT_GATE.description);
  const [deploymentStage, setDeploymentStage] = useState<DeploymentStage>("configure");
  const [deploymentMessage, setDeploymentMessage] = useState("");
  const [credential, setCredential] = useState("");
  const [generatedCredential, setGeneratedCredential] = useState("");
  const [credentialCopied, setCredentialCopied] = useState(false);
  const [enrollmentStage, setEnrollmentStage] = useState<EnrollmentStage>("idle");
  const [enrollmentMessage, setEnrollmentMessage] = useState("");
  const [pendingEnrollment, setPendingEnrollment] = useState<PendingEnrollment | null>(null);
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [selectedWalletRdns, setSelectedWalletRdns] = useState<string | null>(null);
  const [selectedWalletName, setSelectedWalletName] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isAdminConnected, setIsAdminConnected] = useState(false);
  const [copiedGateLink, setCopiedGateLink] = useState(false);
  const [restoreContractId, setRestoreContractId] = useState("");
  const [restoreBusy, setRestoreBusy] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState("");
  const [restoreError, setRestoreError] = useState(false);

  const published = gate.status === "published" && Boolean(gate.contractId);
  const configurationValid = name.trim().length >= 3 && description.trim().length >= 10;

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const stored = getGate();
      setGate(stored);
      setName(stored.name);
      setDescription(stored.description);
      // Stale draft = contractId saved but status is draft (failed deploy). Put UI in error state
      // so the "Reset & redeploy" and "Check deployment confirmation" buttons are immediately visible.
      if (stored.status === "published" && stored.contractId) {
        setDeploymentStage("published");
      } else if (stored.status === "draft" && stored.contractId) {
        setDeploymentStage("error");
        setDeploymentMessage("A previous deployment attempt did not complete. Use \"Check deployment confirmation\" or \"Reset & redeploy\" below.");
      } else {
        setDeploymentStage("configure");
      }
      setGateReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const client = getClient();
    const updateWallets = () => setWallets(client.getInjectedWallets());
    updateWallets();
    const timer = window.setInterval(updateWallets, 500);
    return () => window.clearInterval(timer);
  }, []);

  const saveConfiguration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configurationValid) {
      setDeploymentMessage("Add a gate name and a short description before continuing.");
      return;
    }
    const configured = { ...gate, name: name.trim(), description: description.trim() };
    saveGate(configured);
    setGate(configured);
    setDeploymentMessage("Gate configuration saved locally.");
    if (!published) setDeploymentStage(isAdminConnected ? "connected" : "configure");
  };

  const connectAdminWallet = async (wallet: WalletOption) => {
    setDeploymentStage("connecting");
    setDeploymentMessage("");
    setEnrollmentMessage("");
    setWalletModalOpen(false);
    try {
      // Drop any previous session before authorizing a new wallet.
      await getClient().disconnect();
      const session = await getClient().connectWallet(gate.network, wallet);
      setSelectedWalletRdns(wallet.rdns);
      setSelectedWalletName(wallet.name);
      setWalletAddress(session.unshieldedAddress);
      setIsAdminConnected(true);
      setDeploymentStage(published ? "published" : "connected");
    } catch (error) {
      setIsAdminConnected(false);
      setWalletAddress(null);
      setSelectedWalletName("");
      setSelectedWalletRdns(null);
      setDeploymentStage("error");
      setDeploymentMessage(MidnightClient.messageFor(error));
    }
  };

  const disconnectAdminWallet = async () => {
    if (deployBusy || enrollBusy || restoreBusy) return;
    await getClient().disconnect();
    setIsAdminConnected(false);
    setWalletAddress(null);
    setSelectedWalletName("");
    setSelectedWalletRdns(null);
    setEnrollmentStage("idle");
    setEnrollmentMessage("");
    setPendingEnrollment(null);
    setDeploymentMessage("Wallet disconnected. Reconnect to deploy or enroll credentials.");
    setDeploymentStage(published ? "published" : configurationValid ? "configure" : "configure");
  };

  const deploy = async () => {
    if (!isAdminConnected) {
      setDeploymentMessage("Choose and connect the administrator wallet before deploying.");
      setWalletModalOpen(true);
      return;
    }
    if (!configurationValid) {
      setDeploymentMessage("Save a valid gate configuration before deploying.");
      return;
    }

    setDeploymentStage("deploying");
    setDeploymentMessage("");
    try {
      const result = await getClient().deployContract();
      const submitted = {
        ...gate,
        name: name.trim(),
        description: description.trim(),
        // Bare hex only - Midnight createUnprovenCallTx rejects 0x-prefixed addresses.
        contractId: formatContractId(result.contractId),
        deploymentTxId: result.txId,
        contractVersion: "credential-hash-v2" as const,
        status: "draft" as const,
      };
      saveGate(submitted);
      setGate(submitted);
      setDeploymentStage("confirming");
      await getClient().waitForContractDeployment(result.contractId);
      const confirmed = { ...submitted, status: "published" as const };
      saveGate(confirmed);
      setGate(confirmed);
      setDeploymentStage("published");
      setDeploymentMessage("The Midnight indexer confirmed the contract deployment.");
    } catch (error) {
      const rawMsg = error instanceof Error ? error.message : "";
      
      // Handle the known Lace "first try" sync bug where it throws a generic "Error".
      // Lace uses the first attempt to sync its stale UTXOs, then rejects the tx internally.
      // We only do this once. If it happens again, it's a real persistent error.
      // Do not apply this to 1AM - a bare "Error" there is a real failure.
      if (
        getClient().isLaceWallet() &&
        !laceSyncHandled.current &&
        rawMsg.match(/^DEPLOY_SUBMIT:contractId=[0-9a-f]+:\s*Error$/i)
      ) {
        laceSyncHandled.current = true;
        const draft = {
          ...gate,
          contractId: null,
          deploymentTxId: null,
          status: "draft" as const,
        };
        saveGate(draft);
        setGate(draft);
        setDeploymentStage(isAdminConnected ? "connected" : "configure");
        setDeploymentMessage("Lace wallet just synced its network state. Please click Deploy one more time to complete the transaction.");
        return;
      }

      // If the wallet threw after signing, the tx may have broadcast (Lace). Extract the
      // contractId so "Check deployment confirmation" works. Skip that for hard rejects
      // (temporary ban / no tx id) - those never land and should not enter a dead poll loop.
      const submitMatch = rawMsg.match(/^DEPLOY_SUBMIT:contractId=([0-9a-f]+):(.*)/i);
      if (submitMatch) {
        const recoveredId = formatContractId(submitMatch[1]);
        const submitDetail = submitMatch[2].toLowerCase();
        const hardReject =
          submitDetail.includes("temporarily banned") ||
          submitDetail.includes("temp banned") ||
          submitDetail.includes("no transaction id") ||
          submitDetail.includes("history is empty");
        if (hardReject) {
          const draft = {
            ...gate,
            name: name.trim(),
            description: description.trim(),
            contractId: null,
            deploymentTxId: null,
            status: "draft" as const,
          };
          saveGate(draft);
          setGate(draft);
        } else {
          const draft = {
            ...gate,
            name: name.trim(),
            description: description.trim(),
            contractId: recoveredId,
            deploymentTxId: null,
            contractVersion: "credential-hash-v2" as const,
            status: "draft" as const,
          };
          saveGate(draft);
          setGate(draft);
        }
      }
      setDeploymentStage("error");
      setDeploymentMessage(MidnightClient.messageFor(error));
    }
  };

  const confirmDeployment = async () => {
    if (!gate.contractId) return;
    setDeploymentStage("confirming");
    setDeploymentMessage("Polling the Midnight indexer... (0s elapsed)");
    try {
      await getClient().waitForContractDeployment(gate.contractId, 600000, (elapsed) => {
        setDeploymentMessage(`Polling the Midnight indexer... (${elapsed}s elapsed - indexer can lag up to 5 min)`);
      });
      const confirmed = { ...gate, status: "published" as const };
      saveGate(confirmed);
      setGate(confirmed);
      setDeploymentStage("published");
      setDeploymentMessage("The Midnight indexer confirmed the contract deployment.");
    } catch (error) {
      setDeploymentStage("error");
      setDeploymentMessage(MidnightClient.messageFor(error));
    }
  };

  const restoreGate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRestoreMessage("");
    setRestoreError(false);
    if (!isValidContractId(restoreContractId)) {
      setRestoreError(true);
      setRestoreMessage(
        "Enter a valid hex contract address (even length, at least 32 hex chars, optional 0x). Copy it from Admin after deploy or from Midnight Explorer.",
      );
      return;
    }

    setRestoreBusy(true);
    try {
      const network = gate.network === "undeployed" ? "preprod" : gate.network;
      // Prefer the wallet's live indexer URL when connected (same endpoint deploy/enrollment use).
      const sessionIndexer = getClient().session?.indexerUrl ?? null;
      const lookup = await verifyContractIndexed(restoreContractId, network, sessionIndexer);

      if (!lookup.found) {
        // Still allow local restore so operators can reattach a known address when the public
        // indexer path is flaky - enrollment/prove will fail clearly if the contract is wrong.
        const restoredAnyway = restorePublishedGate({
          contractId: restoreContractId,
          name: name.trim() || DEFAULT_GATE.name,
          description: description.trim() || DEFAULT_GATE.description,
          network,
        });
        setGate(restoredAnyway);
        setName(restoredAnyway.name);
        setDescription(restoredAnyway.description);
        setDeploymentStage("published");
        setDeploymentMessage(
          "Gate saved locally from the contract address. Indexer could not confirm state yet - verify on Explorer before enrolling.",
        );
        setRestoreError(true);
        setRestoreMessage(
          `Saved locally, but on-chain lookup did not confirm state. ${lookup.detail} You can still open the member link; connect a wallet if prove/enroll needs the live indexer.`,
        );
        setRestoreContractId("");
        return;
      }

      const restored = restorePublishedGate({
        contractId: lookup.resolvedAddress ?? restoreContractId,
        name: name.trim() || DEFAULT_GATE.name,
        description: description.trim() || DEFAULT_GATE.description,
        network,
      });
      setGate(restored);
      setName(restored.name);
      setDescription(restored.description);
      setDeploymentStage("published");
      setDeploymentMessage("Published gate restored from the on-chain contract address and saved in this browser.");
      setRestoreMessage(
        "Gate restored and confirmed on the indexer. Copy the member link below - it embeds the contract so others do not need this browser.",
      );
      setRestoreError(false);
      setRestoreContractId("");
    } catch (error) {
      setRestoreError(true);
      setRestoreMessage(error instanceof Error ? error.message : "Could not restore the gate.");
    } finally {
      setRestoreBusy(false);
    }
  };

  const generateCredential = () => {
    if (isActiveEnrollment(enrollmentStage)) return;
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const nextCredential = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    setCredential(nextCredential);
    setGeneratedCredential(nextCredential);
    setCredentialCopied(false);
    setEnrollmentMessage("Credential generated locally. Enroll its hash, then copy the raw value through a private channel.");
    setEnrollmentStage("idle");
    setPendingEnrollment(null);
  };

  const clearCredential = () => {
    setCredential("");
    setGeneratedCredential("");
    setCredentialCopied(false);
    setPendingEnrollment(null);
    if (!isActiveEnrollment(enrollmentStage)) setEnrollmentStage("idle");
  };

  const copyCredential = async () => {
    if (!generatedCredential) return;
    await navigator.clipboard.writeText(generatedCredential);
    setCredentialCopied(true);
    window.setTimeout(() => setCredentialCopied(false), 1800);
  };

  const handleEnrollmentProgress = (stage: TransactionProgressStage) => {
    setEnrollmentStage(stage);
  };

  const completeEnrollment = () => {
    setCredential("");
    setPendingEnrollment(null);
    setEnrollmentStage("confirmed");
    setEnrollmentMessage("Credential hash is confirmed on-chain. Copy the credential below and share it privately before clearing this page.");
  };

  const enrollCredential = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isActiveEnrollment(enrollmentStage)) return;
    if (!published || !gate.contractId) {
      setEnrollmentStage("error");
      setEnrollmentMessage("Wait for the gate deployment to be confirmed before enrolling credentials.");
      return;
    }
    if (!isAdminConnected) {
      setEnrollmentMessage("Connect the original administrator wallet before enrolling a credential.");
      setWalletModalOpen(true);
      return;
    }

    try {
      const secret = parseCredential(credential);
      setEnrollmentMessage("");
      setEnrollmentStage("preparing");
      const contractAddress = formatContractId(gate.contractId);
      if (gate.contractId !== contractAddress) {
        const normalized = { ...gate, contractId: contractAddress };
        saveGate(normalized);
        setGate(normalized);
      }
      const result = await getClient().addCredential(secret, contractAddress, handleEnrollmentProgress);
      if (result.alreadyEnrolled) {
        completeEnrollment();
        setEnrollmentMessage("This credential hash was already enrolled on-chain. No duplicate transaction was submitted.");
        return;
      }

      setPendingEnrollment({ credentialHash: result.credentialHash, txId: result.txId });
      setEnrollmentStage("confirming");
      await getClient().waitForCredentialEnrollment(contractAddress, result.credentialHash);
      completeEnrollment();
    } catch (error) {
      const message = MidnightClient.messageFor(error);
      if (error instanceof Error && error.message.startsWith("CREDENTIAL_CONFIRM:")) {
        setEnrollmentStage("confirmation_pending");
      } else {
        setEnrollmentStage("error");
      }
      setEnrollmentMessage(message);
    }
  };

  const checkEnrollmentConfirmation = async () => {
    if (!gate.contractId || !pendingEnrollment) return;
    setEnrollmentStage("confirming");
    setEnrollmentMessage("");
    try {
      await getClient().waitForCredentialEnrollment(gate.contractId, pendingEnrollment.credentialHash);
      completeEnrollment();
    } catch (error) {
      setEnrollmentStage("confirmation_pending");
      setEnrollmentMessage(MidnightClient.messageFor(error));
    }
  };

  const copyGateLink = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}${gateUrl(gate)}`);
    setCopiedGateLink(true);
    window.setTimeout(() => setCopiedGateLink(false), 1800);
  };

  const deploymentProgress = deploymentStage === "published" ? 100 : deploymentStage === "confirming" ? 90 : deploymentStage === "deploying" ? 75 : isAdminConnected ? 55 : configurationValid ? 30 : 15;
  const deployBusy = deploymentStage === "connecting" || deploymentStage === "deploying" || deploymentStage === "confirming";
  const enrollBusy = isActiveEnrollment(enrollmentStage);

  if (!gateReady) {
    return (
      <main className="flex-1 px-5 pb-20 pt-32 sm:px-8 sm:pt-36">
        <div className="mx-auto max-w-6xl">
          <LoadingState label="Loading admin console" detail="Reading the local gate configuration for this browser." />
        </div>
      </main>
    );
  }

  return (
    <>
      <PageShell
        eyebrow="Admin console"
        title="Publish a private gate."
        description="Configure the member experience, deploy the contract, then issue private member credentials from the administrator wallet."
        actions={
          <Link
            href={gateUrl(gate)}
            className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Open {gate.name} page <ArrowRight size={16} aria-hidden="true" />
          </Link>
        }
        maxWidth="6xl"
      >
        <section className="mb-8 paper-card p-5 sm:p-6" aria-label="Gate setup progress">
          <div className="flex flex-col gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-faint sm:flex-row sm:items-center sm:justify-between">
            <span className="break-words">Gate setup - {gate.name}</span>
            <span>{deploymentProgress}%</span>
          </div>
          <div className="mt-4 h-1 rounded-full bg-secondary">
            <div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${deploymentProgress}%` }} />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-faint">
            <span className={deploymentProgress >= 15 ? "text-accent" : ""}>Configure</span>
            <span className={deploymentProgress >= 55 ? "text-accent" : ""}>Connect</span>
            <span className={deploymentProgress >= 75 ? "text-accent" : ""}>Deploy</span>
            <span className={deploymentProgress >= 100 ? "text-accent" : ""}>Publish</span>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="paper-card p-6 sm:p-8" aria-labelledby="setup-heading">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-accent-soft/40 text-accent" aria-hidden="true">
                  <ShieldCheck size={22} />
                </div>
                <div className="min-w-0">
                  <h2 id="setup-heading" className="text-xl font-bold text-primary">Gate setup</h2>
                  <p className="mt-1 text-sm text-faint">Members see this information before they connect.</p>
                </div>
            </div>
            <form onSubmit={saveConfiguration} className="mt-8 space-y-6">
              <div>
                <label htmlFor="gate-name" className="block text-sm font-semibold text-primary">Gate name</label>
                <input
                  id="gate-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={deployBusy}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-border-subtle bg-card px-4 text-primary outline-none focus:border-accent-soft focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="gate-description" className="block text-sm font-semibold text-primary">What will members open?</label>
                <textarea
                  id="gate-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  disabled={deployBusy}
                  className="mt-2 w-full resize-y rounded-2xl border border-border-subtle bg-card px-4 py-3 text-primary outline-none focus:border-accent-soft focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
                />
                <p className="mt-2 text-xs text-faint">Avoid secrets or personal information. This description is public gate metadata.</p>
              </div>
              <StatusBanner tone="info">
                {gate.network} network  -  one-time proof  -  private credential verification for <strong className="font-semibold">{name || gate.name}</strong>
              </StatusBanner>
              <button
                type="submit"
                disabled={deployBusy}
                className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-dark px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Save gate configuration
              </button>
            </form>

            <div className="mt-10 border-t border-border-subtle pt-8">
              <h3 className="text-lg font-bold text-primary">Wallet and deployment</h3>
              <p className="mt-2 text-sm leading-6 text-muted">
                Deployment is permanent on the selected Midnight network. Reconnect the administrator wallet after every page refresh before signing a new action.
              </p>
              <div className="mt-4 flex items-center gap-2 text-xs text-faint" role="status" aria-live="polite">
                <span className={`h-2 w-2 rounded-full ${wallets.length > 0 ? "bg-accent" : "bg-amber-300"}`} aria-hidden="true" />
                {wallets.length > 0
                  ? `${wallets.length} compatible wallet${wallets.length === 1 ? "" : "s"} detected`
                  : "No Midnight wallet detected in this browser"}
              </div>
              {isAdminConnected && (
                <div className="mt-4">
                  <WalletSessionBar
                    walletName={selectedWalletName || "Administrator wallet"}
                    address={walletAddress}
                    network={gate.network}
                    busy={deployBusy || enrollBusy || restoreBusy}
                    onDisconnect={() => {
                      void disconnectAdminWallet();
                    }}
                    onSwitch={() => setWalletModalOpen(true)}
                  />
                </div>
              )}
              {deploymentMessage && (
                <div className="mt-5">
                  <StatusBanner tone={deploymentStage === "error" ? "error" : "success"}>{deploymentMessage}</StatusBanner>
                </div>
              )}
              {(deploymentStage === "deploying" || deploymentStage === "confirming" || deploymentStage === "connecting") && (
                <div className="mt-5">
                  <ProgressPanel
                    stage={
                      deploymentStage === "connecting"
                        ? "preparing"
                        : deploymentStage === "deploying"
                          ? "proving"
                          : "confirming"
                    }
                    context="deploy"
                    message={
                      deploymentStage === "connecting"
                        ? "Waiting for wallet authorization."
                        : deploymentStage === "deploying"
                          ? "Building and submitting the gate deployment."
                          : "Waiting for the Midnight indexer to confirm deployment."
                    }
                  />
                </div>
              )}
              <div className="mt-6 space-y-3">
                {!isAdminConnected && !published && (
                  <button
                    type="button"
                    onClick={() => setWalletModalOpen(true)}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-dark px-5 text-sm font-bold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <WalletCards size={17} aria-hidden="true" /> Choose administrator wallet
                  </button>
                )}
                {!isAdminConnected && published && (
                  <button
                    type="button"
                    onClick={() => setWalletModalOpen(true)}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-faint underline underline-offset-4 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <WalletCards size={14} aria-hidden="true" /> Reconnect wallet to issue credentials
                  </button>
                )}
                {isAdminConnected && !published && deploymentStage !== "deploying" && deploymentStage !== "confirming" && (
                  <button
                    type="button"
                    onClick={deploy}
                    disabled={!configurationValid || deployBusy}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-primary px-5 text-sm font-semibold text-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <BusyButtonContent
                      busy={false}
                      busyLabel="Deploying"
                      idleLabel={`Deploy gate to ${gate.network}`}
                      icon={<Rocket size={17} aria-hidden="true" />}
                    />
                  </button>
                )}
                {deploymentStage === "error" && gate.contractId && (
                  <button
                    type="button"
                    onClick={confirmDeployment}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-amber-300/50 px-5 text-sm font-semibold text-primary transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                  >
                    <LoaderCircle size={17} aria-hidden="true" /> Check deployment confirmation
                  </button>
                )}
                {deploymentStage === "error" && (
                  <button
                    type="button"
                    onClick={() => {
                      const reset = resetGateToDraft(gate);
                      setGate(reset);
                      setDeploymentStage(isAdminConnected ? "connected" : "configure");
                      setDeploymentMessage("Gate reset. You can now redeploy cleanly.");
                    }}
                    disabled={deployBusy}
                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-border-subtle px-4 text-xs font-semibold text-faint transition-colors hover:bg-secondary hover:text-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Reset &amp; redeploy from scratch
                  </button>
                )}
                {published && (
                  <div className="rounded-2xl border border-accent-soft/40 bg-accent-dim p-5">
                    <p className="font-semibold text-accent">{gate.name} published</p>
                    <p className="mt-2 text-sm text-muted">The Midnight indexer confirmed the contract deployment.</p>
                    {gate.contractId && (
                      <div className="mt-3">
                        <ProofReference
                          value={gate.contractId}
                          label="Gate contract"
                          kind="contract"
                          network={gate.network}
                        />
                      </div>
                    )}
                    {gate.deploymentTxId && (
                      <div className="mt-3">
                        <ProofReference
                          value={gate.deploymentTxId}
                          label="Deploy transaction"
                          kind="transaction"
                          network={gate.network}
                        />
                      </div>
                    )}
                    {explorerHomeUrl(gate.network) && (
                      <p className="mt-3 text-xs text-faint">
                        Network explorer:{" "}
                        <a
                          href={explorerHomeUrl(gate.network)!}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-accent underline underline-offset-4"
                        >
                          {explorerHomeUrl(gate.network)}
                        </a>
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={copyGateLink}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <Copy size={15} aria-hidden="true" /> {copiedGateLink ? "Member link copied" : "Copy member gate link"}
                    </button>
                    <p className="mt-2 text-xs leading-5 text-faint">
                      The member link embeds the contract address so others can open the gate without this browser&apos;s
                      local storage.
                    </p>
                  </div>
                )}

                <div className="mt-8 paper-card p-5">
                  <div className="flex min-w-0 items-center gap-2">
                    <Link2 size={18} className="text-accent" aria-hidden="true" />
                    <h3 className="text-base font-bold tracking-normal text-primary">Restore published gate</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 tracking-normal text-muted">
                    Cleared storage or a new device? Paste an existing on-chain contract address to reattach this Admin
                    console. Optionally set name/description above first - they will be saved with the restore.
                  </p>
                  {restoreMessage && !restoreError && published ? (
                    <div className="mt-4 space-y-3">
                      <StatusBanner tone="success">{restoreMessage}</StatusBanner>
                      <button
                        type="button"
                        onClick={() => {
                          setRestoreMessage("");
                          setRestoreError(false);
                        }}
                        className="text-xs font-semibold text-accent underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Restore a different contract
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={restoreGate} className="mt-4 space-y-3">
                      <div>
                        <label htmlFor="restore-contract" className="block text-sm font-semibold tracking-normal text-primary">
                          Contract address
                        </label>
                        <input
                          id="restore-contract"
                          value={restoreContractId}
                          onChange={(event) => {
                            setRestoreContractId(event.target.value);
                            setRestoreMessage("");
                            setRestoreError(false);
                          }}
                          autoComplete="off"
                          spellCheck={false}
                          disabled={restoreBusy}
                          placeholder="Contract hex from deploy or Explorer (0x optional)"
                          className="mt-2 min-h-12 w-full rounded-2xl border border-border-subtle bg-card px-4 font-mono text-xs tracking-normal text-primary outline-none focus:border-accent-soft focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={restoreBusy || !restoreContractId.trim()}
                        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-primary px-4 text-sm font-semibold tracking-normal text-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <BusyButtonContent
                          busy={restoreBusy}
                          busyLabel="Verifying on indexer..."
                          idleLabel="Restore gate from chain"
                          icon={<Link2 size={16} aria-hidden="true" />}
                        />
                      </button>
                      {restoreMessage && restoreError && (
                        <StatusBanner tone="error">{restoreMessage}</StatusBanner>
                      )}
                    </form>
                  )}
                </div>
              </div>

              {/* Always-visible escape hatch - lets operator nuke a stale gate and start fresh */}
              <div className="mt-6 border-t border-border-subtle pt-6">
                <p className="text-xs text-faint">Need to start completely fresh?</p>
                <button
                  type="button"
                  disabled={deployBusy || enrollBusy || restoreBusy}
                  onClick={() => {
                    if (!window.confirm("This will clear all local gate data (contract address, name, description). Are you sure?")) return;
                    const fresh = resetGateToDraft({ ...DEFAULT_GATE });
                    setGate(fresh);
                    setName(DEFAULT_GATE.name);
                    setDescription(DEFAULT_GATE.description);
                    setDeploymentStage(isAdminConnected ? "connected" : "configure");
                    setDeploymentMessage("");
                    setEnrollmentStage("idle");
                    setEnrollmentMessage("");
                    setPendingEnrollment(null);
                  }}
                  className="mt-2 text-xs text-faint underline underline-offset-4 transition-colors hover:text-faint disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Clear all gate data and start fresh
                </button>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="paper-card p-6 sm:p-8" aria-labelledby="credential-heading">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <UserPlus size={21} className="text-accent" aria-hidden="true" />
                  <div className="min-w-0">
                    <h2 id="credential-heading" className="text-lg font-bold text-primary">Issue a member credential</h2>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-faint">
                      {enrollmentLabel(enrollmentStage)}
                    </p>
                  </div>
                </div>
                <StageBadge
                  label={enrollmentLabel(enrollmentStage)}
                  tone={
                    enrollmentStage === "confirmed"
                      ? "success"
                      : enrollmentStage === "error"
                        ? "error"
                        : enrollmentStage === "confirmation_pending"
                          ? "warning"
                          : enrollBusy
                            ? "busy"
                            : "neutral"
                  }
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">
                Nexora hashes the credential locally before enrollment. Only the hash reaches the contract. Keep the raw credential private and share it only with the intended member.
              </p>
              <StatusBanner tone="info" className="mt-4" title="Privacy notice">
                Enrollment writes the credential hash into the public allowlist tree. The raw credential is not sent to
                the chain, but the hash, admin key bytes, contract address, and later spent nullifiers are public state.
              </StatusBanner>

              <ol className="mt-5 space-y-2 rounded-2xl border border-border-subtle bg-card p-4 text-sm leading-6 text-muted">
                <li className="flex gap-3">
                  <span className="font-mono text-xs text-accent/80">A</span>
                  <span>
                    <strong className="font-semibold text-primary">Generate secret</strong> - 32 random bytes as hex.
                    Never put this raw value on-chain.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-xs text-accent/80">B</span>
                  <span>
                    <strong className="font-semibold text-primary">Enroll hash</strong> - submit from the original
                    admin wallet so the allowlist leaf is public without revealing the secret.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="font-mono text-xs text-accent/80">C</span>
                  <span>
                    <strong className="font-semibold text-primary">Share privately</strong> - send the raw secret to
                    the member (Signal, email, etc.), then clear it from this page.
                  </span>
                </li>
              </ol>

              {!published && (
                <div className="mt-5">
                  <StatusBanner tone="warning">Publish {gate.name} before issuing credentials.</StatusBanner>
                </div>
              )}
              {published && !isAdminConnected && (
                <div className="mt-5">
                  <StatusBanner tone="warning" title="Administrator wallet required">
                    Reconnect the original administrator wallet before enrolling a credential.
                    <button
                      type="button"
                      onClick={() => setWalletModalOpen(true)}
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                    >
                      <WalletCards size={15} aria-hidden="true" /> Choose administrator wallet
                    </button>
                  </StatusBanner>
                </div>
              )}

              {enrollBusy && (
                <div className="mt-5">
                  <ProgressPanel stage={enrollmentStage as ProgressStage} context="enroll" />
                </div>
              )}

              <button
                type="button"
                onClick={generateCredential}
                disabled={!published || enrollBusy}
                className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-border-subtle px-4 text-sm font-semibold text-muted transition-colors hover:bg-secondary hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <UserPlus size={16} aria-hidden="true" /> Generate credential locally
              </button>
              <form onSubmit={enrollCredential} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="admin-credential" className="block text-sm font-semibold text-primary">Private credential</label>
                  <input
                    id="admin-credential"
                    value={credential}
                    onChange={(event) => {
                      setCredential(event.target.value);
                      setGeneratedCredential("");
                      setEnrollmentStage("idle");
                      setEnrollmentMessage("");
                    }}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={enrollBusy}
                    placeholder="64 hexadecimal characters"
                    className="mt-2 min-h-12 w-full rounded-2xl border border-border-subtle bg-card px-4 font-mono text-xs text-primary outline-none focus:border-accent-soft focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
                  />
                  <p className="mt-2 text-xs leading-5 text-faint">This field is cleared after confirmation. It is never stored by Nexora.</p>
                </div>
                <button
                  type="submit"
                  disabled={!published || !isAdminConnected || !credential || enrollBusy || enrollmentStage === "confirmation_pending"}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-primary px-4 text-sm font-semibold text-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <BusyButtonContent
                    busy={enrollBusy}
                    busyLabel={enrollmentLabel(enrollmentStage)}
                    idleLabel={enrollmentStage === "confirmed" ? "Credential enrolled" : "Enroll credential hash"}
                    icon={enrollmentStage === "confirmed" ? <Check size={16} aria-hidden="true" /> : <UserPlus size={16} aria-hidden="true" />}
                  />
                </button>
              </form>
              {enrollmentStage === "confirmation_pending" && (
                <button
                  type="button"
                  onClick={checkEnrollmentConfirmation}
                  className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-amber-300/50 px-4 text-sm font-semibold text-primary transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                >
                  <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> Check enrollment confirmation
                </button>
              )}
              {pendingEnrollment?.txId && (
                <div className="mt-4">
                  <ProofReference
                    value={pendingEnrollment.txId}
                    label="Enrollment transaction"
                    kind="transaction"
                    network={gate.network}
                  />
                </div>
              )}
              {enrollmentMessage && (
                <div className="mt-4">
                  <StatusBanner
                    tone={
                      enrollmentStage === "error"
                        ? "error"
                        : enrollmentStage === "confirmation_pending"
                          ? "warning"
                          : "success"
                    }
                  >
                    {enrollmentMessage}
                  </StatusBanner>
                </div>
              )}
              {generatedCredential && (
                <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-100 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">Share privately</p>
                  <p className="mt-2 break-all font-mono text-xs text-primary/80">{generatedCredential}</p>
                  <div className="mt-3 flex gap-4">
                    <button
                      type="button"
                      onClick={copyCredential}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                    >
                      <Clipboard size={14} aria-hidden="true" /> {credentialCopied ? "Copied" : "Copy credential"}
                    </button>
                    <button
                      type="button"
                      onClick={clearCredential}
                      className="text-xs font-semibold text-primary/75 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                    >
                      Clear from this page
                    </button>
                  </div>
                </div>
              )}
            </section>

            <section className="paper-card p-6 sm:p-8">
              <h2 className="text-lg font-bold text-primary">What members need</h2>
              <ul className="mt-5 space-y-4 text-sm text-muted">
                <li className="flex gap-3">
                  <Check size={17} className="shrink-0 text-accent" aria-hidden="true" />A compatible Midnight wallet on {gate.network}.
                </li>
                <li className="flex gap-3">
                  <Check size={17} className="shrink-0 text-accent" aria-hidden="true" />The raw credential you shared privately for {gate.name}.
                </li>
                <li className="flex gap-3">
                  <Check size={17} className="shrink-0 text-accent" aria-hidden="true" />The member gate link-not this admin console.
                </li>
              </ul>
              <Link
                href={gateUrl(gate)}
                className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-accent underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Open member gate <ExternalLink size={15} aria-hidden="true" />
              </Link>
              <p className="mt-4 text-xs leading-5 text-faint">
                Admin is an operator tool. Prefer sharing only the gate link with members.
              </p>
            </section>
          </aside>
        </div>
      </PageShell>
      <WalletConnectModal
        open={walletModalOpen}
        wallets={wallets}
        selectedRdns={selectedWalletRdns}
        onClose={() => setWalletModalOpen(false)}
        onSelect={(wallet) => {
          void connectAdminWallet(wallet);
        }}
      />
    </>
  );
}
