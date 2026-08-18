"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Copy, ExternalLink, KeyRound, Rocket, ShieldCheck, WalletCards } from "lucide-react";
import { useGate } from "@/hooks/useGate";
import {
  APP_NETWORK_LABEL,
  MidnightClient,
  uint8ArrayToHex,
  verifyContractIndexed,
  type SessionInfo,
  type TransactionProgressStage,
  type WalletOption,
} from "@/lib/midnight-client";
import {
  formatContractId,
  gateUrl,
  isValidContractId,
  resetGateToDraft,
  restorePublishedGate,
  saveGate,
  shorten,
  vaultUrl,
  type GateRecord,
} from "@/lib/gate-store";
import { explorerContractUrl, explorerTransactionUrl } from "@/lib/explorer";
import { markGateUnlocked } from "@/lib/access-session";
import { ProgressPanel } from "@/components/ui/ProgressPanel";
import { ProofReference } from "@/components/ui/ProofReference";
import { StatusBanner, StageBadge, type StatusTone } from "@/components/ui/StatusBanner";
import { PageShell } from "@/components/ui/PageShell";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { WalletSessionBar } from "@/components/WalletSessionBar";

type GateConsoleProps = {
  mode: "admin" | "gate" | "vault";
};

type UiStatus = {
  tone: StatusTone;
  title: string;
  message: string;
};

const titles = {
  admin: {
    eyebrow: "Operator console",
    title: "Deploy and manage a Midnight access gate.",
    description: "Connect a funded Preprod wallet, deploy the real Compact contract, then enroll credential hashes for members.",
  },
  gate: {
    eyebrow: "Gate restore",
    title: "Load a published Midnight gate.",
    description: "Paste a Preprod contract address or open a shared gate link to verify the deployment and prepare wallet access.",
  },
  vault: {
    eyebrow: "Member vault",
    title: "Generate a private access proof.",
    description: "Connect a Preprod wallet and submit the credential proof against the deployed Midnight contract.",
  },
} as const;

function firstParam(value: string | string[] | null): string | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function parseCredential(value: string): Uint8Array {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("CREDENTIAL_REQUIRED");
  const hex = trimmed.replace(/^0x/i, "");
  if (/^[0-9a-fA-F]{64}$/.test(hex)) {
    return Uint8Array.from(hex.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)));
  }
  const encoded = new TextEncoder().encode(trimmed);
  if (encoded.length > 32) throw new Error("CREDENTIAL_FORMAT");
  const bytes = new Uint8Array(32);
  bytes.set(encoded);
  return bytes;
}

function statusFromError(error: unknown): UiStatus {
  return {
    tone: "error",
    title: "Action failed",
    message: MidnightClient.messageFor(error),
  };
}

export function GateConsole({ mode }: GateConsoleProps) {
  const searchParams = useSearchParams();
  const [client] = useState(() => new MidnightClient());

  const { gate: resolvedGate } = useGate({
    gate: firstParam(searchParams.get("gate")),
    contract: firstParam(searchParams.get("contract")),
    name: firstParam(searchParams.get("name")),
    description: firstParam(searchParams.get("description")),
    network: firstParam(searchParams.get("network")),
  });

  const [localGate, setLocalGate] = useState<GateRecord | null>(null);
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [walletRdns, setWalletRdns] = useState<string | null>(null);
  const [walletInjectionKey, setWalletInjectionKey] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [credential, setCredential] = useState("");
  const [restoreAddress, setRestoreAddress] = useState("");
  const [stage, setStage] = useState<TransactionProgressStage | "idle" | "confirming" | "confirmed" | "error">("idle");
  const [busy, setBusy] = useState(false);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [status, setStatus] = useState<UiStatus>({
    tone: "info",
    title: "Ready",
    message: "Connect a Midnight Preprod wallet to begin.",
  });

  const current = localGate ?? resolvedGate;
  const published = Boolean(current.contractId);
  const title = titles[mode];
  const contractUrl = current.contractId ? explorerContractUrl(current.contractId, current.network) : null;
  const txUrl = lastTx ? explorerTransactionUrl(lastTx, current.network) : null;
  const controlsBusy = busy || walletConnecting;

  useEffect(() => () => {
    client.dispose();
  }, [client]);

  const connectWallet = async (wallet?: WalletOption) => {
    if (walletConnecting) return;
    setWalletConnecting(true);
    setStage("preparing");
    setWalletModalOpen(false);
    setStatus({
      tone: "info",
      title: "Wallet approval pending",
      message: `Approve the connection request in ${wallet?.name ?? "your Midnight wallet"}.`,
    });
    try {
      const connected = await client.connectWallet("preprod", wallet);
      setSession(connected);
      setWalletName(client.walletName);
      setWalletRdns(client.walletRdns);
      setWalletInjectionKey(client.walletInjectionKey);
      setStage("confirmed");
      setStatus({
        tone: "success",
        title: "Wallet connected",
        message: `${client.walletName ?? "Wallet"} is connected to ${APP_NETWORK_LABEL}.`,
      });
    } catch (error) {
      setStage("error");
      setStatus(statusFromError(error));
    } finally {
      setWalletConnecting(false);
    }
  };

  const chooseWallet = async () => {
    if (walletConnecting) return;
    const detected = client.getInjectedWallets();
    setWallets(detected);
    setWalletModalOpen(true);
  };

  const deployGate = async () => {
    setBusy(true);
    setStage("preparing");
    setLastTx(null);
    try {
      if (!client.isConnected) throw new Error("WALLET_NOT_CONNECTED");
      if (!client.addresses) await client.loadWalletAddresses();
      const deployed = await client.deployContract();
      setStage("confirming");
      await client.waitForContractDeployment(deployed.contractId);
      const next: GateRecord = {
        ...current,
        contractId: formatContractId(deployed.contractId),
        deploymentTxId: deployed.txId,
        network: "preprod",
        status: "published",
      };
      saveGate(next);
      setLocalGate(next);
      setLastTx(deployed.txId);
      setStage("confirmed");
      setStatus({
        tone: "success",
        title: "Gate published",
        message: "The Midnight Preprod indexer returned state for the deployed contract.",
      });
    } catch (error) {
      setStage("error");
      setStatus(statusFromError(error));
    } finally {
      setBusy(false);
    }
  };

  const restoreGate = async () => {
    setBusy(true);
    setStage("preparing");
    try {
      if (!isValidContractId(restoreAddress)) throw new Error("Invalid contract address.");
      const lookup = await verifyContractIndexed(restoreAddress);
      if (!lookup.found || !lookup.resolvedAddress) throw new Error(lookup.detail);
      const restored = restorePublishedGate({
        contractId: lookup.resolvedAddress,
        name: current.name,
        description: current.description,
      });
      setLocalGate(restored);
      setStage("confirmed");
      setStatus({
        tone: "success",
        title: "Gate restored",
        message: lookup.detail,
      });
    } catch (error) {
      setStage("error");
      setStatus(statusFromError(error));
    } finally {
      setBusy(false);
    }
  };

  const enrollCredential = async () => {
    setBusy(true);
    setStage("preparing");
    setLastTx(null);
    try {
      if (!current.contractId) throw new Error("GATE_NOT_CONFIGURED");
      if (!client.isConnected) throw new Error("WALLET_NOT_CONNECTED");
      if (!client.addresses) await client.loadWalletAddresses();
      const secret = parseCredential(credential);
      const result = await client.addCredential(secret, current.contractId, setStage);
      if (result.txId) {
        setLastTx(result.txId);
        setStage("confirming");
        await client.waitForCredentialEnrollment(current.contractId, result.credentialHash);
      }
      setStage("confirmed");
      setStatus({
        tone: "success",
        title: result.alreadyEnrolled ? "Credential already enrolled" : "Credential enrolled",
        message: `Credential hash ${uint8ArrayToHex(result.credentialHash)} is available in the gate Merkle tree.`,
      });
    } catch (error) {
      setStage("error");
      setStatus(statusFromError(error));
    } finally {
      setBusy(false);
    }
  };

  const proveAccess = async () => {
    setBusy(true);
    setStage("preparing");
    setLastTx(null);
    try {
      if (!current.contractId) throw new Error("GATE_NOT_CONFIGURED");
      if (!client.isConnected) throw new Error("WALLET_NOT_CONNECTED");
      if (!client.addresses) await client.loadWalletAddresses();
      const txId = await client.verifyCredential(parseCredential(credential), current.contractId, setStage);
      setLastTx(txId);
      setStage("confirming");
      await client.waitForTransaction(txId);
      markGateUnlocked({
        gateId: current.id,
        contractId: current.contractId,
        txId,
        unlockedAt: Date.now(),
      });
      setStage("confirmed");
      setStatus({
        tone: "success",
        title: "Access confirmed",
        message: "The proof transaction confirmed and this browser session is unlocked.",
      });
    } catch (error) {
      setStage("error");
      setStatus(statusFromError(error));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    await client.disconnect();
    setSession(null);
    setWalletName(null);
    setWalletRdns(null);
    setWalletInjectionKey(null);
    setWalletConnecting(false);
    setStage("idle");
    setStatus({
      tone: "neutral",
      title: "Wallet disconnected",
      message: "The local wallet session was cleared.",
    });
  };

  const resetDraft = () => {
    const next = resetGateToDraft(current);
    setLocalGate(next);
    setLastTx(null);
    setStatus({
      tone: "warning",
      title: "Draft reset",
      message: "The local gate record is back in draft mode. No on-chain state was changed.",
    });
  };

  return (
    <PageShell eyebrow={title.eyebrow} title={title.title} description={title.description} maxWidth="6xl">
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-4">
          <div className="paper-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="eyebrow">Selected gate</p>
                <h2 className="mt-2 break-words text-2xl font-semibold text-primary">{current.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{current.description}</p>
              </div>
              <StageBadge label={published ? "Published" : "Draft"} tone={published ? "success" : "warning"} />
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-primary">Network</dt>
                <dd className="mt-1 text-muted">{APP_NETWORK_LABEL}</dd>
              </div>
              <div>
                <dt className="font-semibold text-primary">Contract</dt>
                <dd className="mt-1 break-all font-mono text-xs text-muted">{shorten(current.contractId, 14)}</dd>
              </div>
              {current.deploymentTxId && (
                <div>
                  <dt className="font-semibold text-primary">Deployment transaction</dt>
                  <dd className="mt-1 break-all font-mono text-xs text-muted">{shorten(current.deploymentTxId, 14)}</dd>
                </div>
              )}
            </dl>
            <div className="mt-5 flex flex-wrap gap-2">
              {contractUrl && (
                <a href={contractUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border-subtle px-4 text-xs font-semibold text-muted hover:bg-secondary hover:text-primary">
                  <ExternalLink size={14} aria-hidden="true" />
                  Explorer
                </a>
              )}
              {published && (
                <>
                  <Link href={gateUrl(current)} className="inline-flex min-h-10 items-center rounded-full border border-border-subtle px-4 text-xs font-semibold text-muted hover:bg-secondary hover:text-primary">
                    Gate link
                  </Link>
                  <Link href={vaultUrl(current)} className="inline-flex min-h-10 items-center rounded-full border border-border-subtle px-4 text-xs font-semibold text-muted hover:bg-secondary hover:text-primary">
                    Vault link
                  </Link>
                </>
              )}
            </div>
          </div>

          {session ? (
            <WalletSessionBar
              walletName={walletName}
              address={session.unshieldedAddress}
              network={session.networkId}
              busy={controlsBusy}
              onDisconnect={disconnect}
              onSwitch={chooseWallet}
            />
          ) : (
            <button
              type="button"
              onClick={chooseWallet}
              disabled={controlsBusy}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-dark px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <WalletCards size={17} aria-hidden="true" />
              {walletConnecting ? "Wallet approval pending" : "Connect Preprod wallet"}
            </button>
          )}

          <StatusBanner tone={status.tone} title={status.title}>{status.message}</StatusBanner>
          <ProgressPanel stage={stage} context={mode === "admin" ? "deploy" : "prove"} />
          {lastTx && <ProofReference value={lastTx} network={current.network} />}
          {txUrl && (
            <a href={txUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-primary">
              View latest transaction
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          )}
        </section>

        <section className="space-y-4">
          {mode === "admin" && (
            <div className="paper-card p-5">
              <div className="flex items-start gap-3">
                <Rocket size={20} className="mt-1 text-accent" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-semibold text-primary">Contract deployment</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Deployment uses the existing Compact contract, local ZK assets, wallet balancing, and Preprod indexer confirmation.
                  </p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={deployGate}
                  disabled={controlsBusy}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-dark px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Deploy contract
                </button>
                <button
                  type="button"
                  onClick={resetDraft}
                  disabled={controlsBusy}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-border-subtle px-5 text-sm font-semibold text-muted transition-colors hover:bg-secondary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset local draft
                </button>
              </div>
            </div>
          )}

          <div className="paper-card p-5">
            <div className="flex items-start gap-3">
              <Copy size={20} className="mt-1 text-accent" aria-hidden="true" />
              <div>
                <h2 className="text-lg font-semibold text-primary">Restore published gate</h2>
                <p className="mt-2 text-sm leading-6 text-muted">Verify a known Preprod contract address through the indexer and save it locally.</p>
              </div>
            </div>
            <label className="mt-5 block">
              <span className="field-label">Contract address</span>
              <input
                className="field-input mt-2 font-mono text-xs"
                value={restoreAddress}
                onChange={(event) => setRestoreAddress(event.target.value)}
                placeholder="8dde1979..."
                disabled={controlsBusy}
              />
            </label>
            <button
              type="button"
              onClick={restoreGate}
              disabled={controlsBusy || !restoreAddress.trim()}
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-primary px-5 text-sm font-semibold text-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              Verify and restore
            </button>
          </div>

          {(mode === "admin" || mode === "vault") && (
            <div className="paper-card p-5">
              <div className="flex items-start gap-3">
                {mode === "admin" ? <KeyRound size={20} className="mt-1 text-accent" aria-hidden="true" /> : <ShieldCheck size={20} className="mt-1 text-accent" aria-hidden="true" />}
                <div>
                  <h2 className="text-lg font-semibold text-primary">{mode === "admin" ? "Enroll credential" : "Submit access proof"}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted">
                    Enter a 64-character hex credential or a short text secret. It is normalized to 32 bytes in this browser.
                  </p>
                </div>
              </div>
              <label className="mt-5 block">
                <span className="field-label">Credential secret</span>
                <textarea
                  className="field-input mt-2 min-h-28 resize-y font-mono text-xs"
                  value={credential}
                  onChange={(event) => setCredential(event.target.value)}
                  disabled={controlsBusy}
                  placeholder="64 hex chars or short text"
                />
              </label>
              <button
                type="button"
                onClick={mode === "admin" ? enrollCredential : proveAccess}
                disabled={controlsBusy || !published || !credential.trim()}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-dark px-5 text-sm font-semibold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {mode === "admin" ? "Enroll credential" : "Generate proof"}
              </button>
            </div>
          )}
        </section>
      </div>

      <WalletConnectModal
        open={walletModalOpen}
        wallets={wallets}
        selectedRdns={walletRdns}
        selectedInjectionKey={walletInjectionKey}
        disabled={walletConnecting}
        onClose={() => {
          if (!walletConnecting) setWalletModalOpen(false);
        }}
        onSelect={connectWallet}
      />
    </PageShell>
  );
}
