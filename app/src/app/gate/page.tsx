"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  EyeOff,
  KeyRound,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { FormEvent, Suspense, useEffect, useRef, useState } from "react";
import { PrivoraClient } from "@/lib/midnight-client";
import type { TransactionProgressStage, WalletOption } from "@/lib/midnight-client";
import { vaultUrl } from "@/lib/gate-store";
import { markGateUnlocked, clearGateAccess } from "@/lib/access-session";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { WalletSessionBar } from "@/components/WalletSessionBar";
import { PageShell } from "@/components/ui/PageShell";
import { LoadingState, PageLoadingFallback, BusyButtonContent } from "@/components/ui/LoadingState";
import { StageBadge, StatusBanner } from "@/components/ui/StatusBanner";
import { ProgressPanel } from "@/components/ui/ProgressPanel";
import { ProofReference } from "@/components/ui/ProofReference";
import { useGate } from "@/hooks/useGate";
import { isActiveProgress, progressLabel, type ProgressStage } from "@/lib/transaction-stages";

type GateStep = "ready" | "connecting" | ProgressStage | "credential" | "confirmed" | "error";

function parseCredential(value: string): Uint8Array {
  const normalized = value.trim().replace(/^0x/, "");
  if (!/^[0-9a-f]{64}$/i.test(normalized)) throw new Error("CREDENTIAL_FORMAT");
  const bytes = new Uint8Array(32);
  for (let index = 0; index < 32; index += 1) {
    bytes[index] = Number.parseInt(normalized.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function stepTone(step: GateStep): "neutral" | "busy" | "success" | "error" | "warning" {
  if (step === "confirmed") return "success";
  if (step === "error") return "error";
  if (step === "connecting" || isActiveProgress(step as ProgressStage)) return "busy";
  return "neutral";
}

function stepLabel(step: GateStep): string {
  if (step === "ready") return "Wallet required";
  if (step === "connecting") return "Connecting wallet";
  if (step === "credential") return "Credential ready";
  if (step === "confirmed") return "Access confirmed";
  if (step === "error") return "Action needed";
  return progressLabel(step as ProgressStage, "prove");
}

function GatePageContent() {
  const searchParams = useSearchParams();
  const clientRef = useRef<PrivoraClient | null>(null);
  const getClient = () => clientRef.current ?? (clientRef.current = new PrivoraClient());
  const { gate, ready } = useGate({
    gate: searchParams.get("gate"),
    contract: searchParams.get("contract"),
    name: searchParams.get("name"),
    description: searchParams.get("description"),
    network: searchParams.get("network"),
  });

  const [step, setStep] = useState<GateStep>("ready");
  const [message, setMessage] = useState("");
  const [txId, setTxId] = useState("");
  const [credential, setCredential] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [selectedWalletRdns, setSelectedWalletRdns] = useState<string | null>(null);
  const [selectedWalletName, setSelectedWalletName] = useState("");

  useEffect(() => {
    const client = getClient();
    const updateWallets = () => setWallets(client.getInjectedWallets());
    updateWallets();
    const timer = window.setInterval(updateWallets, 500);
    return () => window.clearInterval(timer);
  }, []);

  const connect = async (selectedWallet?: WalletOption) => {
    setStep("connecting");
    setMessage("");
    try {
      const wallet = selectedWallet ?? wallets[0];
      if (!wallet) throw new Error("NO_WALLET");
      setSelectedWalletRdns(wallet.rdns);
      setSelectedWalletName(wallet.name);
      setWalletModalOpen(false);
      await getClient().disconnect();
      const session = await getClient().connectWallet(gate.network, wallet);
      setWalletAddress(session.unshieldedAddress);
      setStep("credential");
    } catch (error) {
      setWalletAddress(null);
      setSelectedWalletName("");
      setSelectedWalletRdns(null);
      setStep("error");
      setMessage(PrivoraClient.messageFor(error));
    }
  };

  const handleProofProgress = (stage: TransactionProgressStage) => {
    setStep(stage);
  };

  const submitProof = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isActiveProgress(step as ProgressStage) || step === "connecting") return;
    setMessage("");
    try {
      const secret = parseCredential(credential);
      setCredential("");
      setStep("preparing");
      const id = await getClient().verifyCredential(secret, gate.contractId ?? "", handleProofProgress);
      setTxId(id);
      markGateUnlocked({
        gateId: gate.id,
        contractId: gate.contractId,
        txId: id,
        unlockedAt: Date.now(),
      });
      setStep("confirmed");
    } catch (error) {
      setStep("error");
      setMessage(PrivoraClient.messageFor(error));
    }
  };

  const disconnectWallet = async (clearVaultSession = false) => {
    if (proving || step === "connecting") return;
    await getClient().disconnect();
    if (clearVaultSession) clearGateAccess(gate.id);
    setWalletAddress(null);
    setCredential("");
    setSelectedWalletName("");
    setSelectedWalletRdns(null);
    setMessage("");
    if (step !== "confirmed") {
      setTxId("");
      setStep("ready");
    }
  };

  const reset = () => {
    void (async () => {
      await getClient().disconnect();
      clearGateAccess(gate.id);
      setWalletAddress(null);
      setCredential("");
      setTxId("");
      setMessage("");
      setSelectedWalletName("");
      setSelectedWalletRdns(null);
      setStep("ready");
    })();
  };

  const deployed = Boolean(gate.contractId) && gate.status === "published";
  const proving = isActiveProgress(step as ProgressStage);

  if (!ready) {
    return (
      <main className="flex-1 bg-surface px-6 pb-20 pt-24 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <LoadingState label="Loading gate configuration" detail="Reading the local gate record for this session." />
        </div>
      </main>
    );
  }

  return (
    <>
      <PageShell
        eyebrow="Private access gate"
        title={gate.name}
        description={gate.description}
        actions={<StageBadge label={stepLabel(step)} tone={stepTone(step)} />}
        maxWidth="5xl"
      >
        <div className="paper-card grid overflow-hidden lg:grid-cols-[0.8fr_1.2fr]">
          <aside className="border-b border-border-subtle bg-card p-7 sm:p-10 lg:border-b-0 lg:border-r">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full border ${
                step === "confirmed"
                  ? "border-accent-soft bg-accent-dim text-accent"
                  : "border-border-subtle text-accent"
              }`}
              aria-hidden="true"
            >
              {step === "confirmed" ? (
                <CheckCircle2 size={37} strokeWidth={1.3} />
              ) : (
                <ShieldCheck size={37} strokeWidth={1.3} />
              )}
            </div>
            <h2 className="mt-9 text-xl font-bold text-primary">
              {step === "confirmed" ? "The gate is open" : "Verify without revealing"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              Privora proves that your private credential belongs to this gate. The credential itself is never
              displayed in the result.
            </p>
            <div className="mt-6 rounded-2xl border border-border-subtle bg-surface p-4 text-xs leading-5 text-muted">
              <p className="font-semibold text-primary">Privacy notice</p>
              <p className="mt-2">
                Your raw credential and Merkle path are used as private witness inputs during proof generation. The
                chain records the successful state transition, including a spent nullifier, but not the raw credential.
              </p>
            </div>
            <div className="mt-10 space-y-4 border-t border-border-subtle pt-6 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-faint">Network</span>
                <span className="font-mono text-accent">{gate.network}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-faint">Proof policy</span>
                <span className="text-right text-muted">
                  {gate.oneTimeProof ? "One-time access" : "Reusable access"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-faint">Contract</span>
                <span className={deployed ? "font-mono text-muted" : "text-amber-200"}>
                  {deployed ? "Published" : gate.contractId ? "Awaiting confirmation" : "Not published"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-faint">Gate id</span>
                <span className="font-mono text-faint">{gate.id}</span>
              </div>
            </div>
          </aside>

          <section className="p-7 sm:p-10" aria-labelledby="gate-action-title">
            <h2 id="gate-action-title" className="text-2xl font-bold text-primary">
              {step === "confirmed" ? "Access confirmed" : "Complete verification"}
            </h2>

            {(proving || step === "connecting") && (
              <div className="mt-6">
                <ProgressPanel
                  stage={step === "connecting" ? "preparing" : (step as ProgressStage)}
                  context="prove"
                  message={
                    step === "connecting"
                      ? "Waiting for wallet authorization in your extension."
                      : undefined
                  }
                />
              </div>
            )}

            {!deployed && step !== "confirmed" && (
              <div className="mt-6">
                <StatusBanner tone="warning" title="This gate is not published yet.">
                  The administrator must deploy the gate and enroll credentials before members can verify access.
                  <div className="mt-3">
                    <Link
                      href="/admin"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      Open admin console <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </StatusBanner>
              </div>
            )}

            {step === "error" && message && (
              <div className="mt-6">
                <StatusBanner tone="error">{message}</StatusBanner>
              </div>
            )}

            {step === "confirmed" ? (
              <div className="mt-8 rounded-2xl border border-accent-soft/40 bg-accent-dim p-6">
                <p className="text-lg font-semibold text-accent">{gate.name} access is unlocked.</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  The network confirmed a valid proof without revealing your credential. The vault page unlocks for
                  this browser session as convenience UX-the on-chain proof is the source of truth.
                </p>
                <Link
                  href={vaultUrl(gate)}
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-dark px-5 text-sm font-bold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Open protected vault <ArrowRight size={17} aria-hidden="true" />
                </Link>
                {txId && (
                  <div className="mt-4 space-y-3 border-t border-accent-soft/40 pt-4">
                    <ProofReference
                      value={txId}
                      label="Access proof transaction"
                      kind="transaction"
                      network={gate.network}
                    />
                    {gate.contractId && (
                      <ProofReference
                        value={gate.contractId}
                        label="Gate contract"
                        kind="contract"
                        network={gate.network}
                      />
                    )}
                  </div>
                )}
              </div>
            ) : proving ? (
              <div className="mt-8">
                <StatusBanner tone="busy" title="Proof in progress">
                  Keep this tab open and approve any wallet prompts. Progress stages update as the transaction moves
                  through prove, balance, and submit.
                </StatusBanner>
              </div>
            ) : step === "credential" || (step === "error" && Boolean(walletAddress)) ? (
              <>
                {walletAddress && (
                  <div className="mt-5">
                    <WalletSessionBar
                      walletName={selectedWalletName || "Member wallet"}
                      address={walletAddress}
                      network={gate.network}
                      busy={proving}
                      onDisconnect={() => {
                        void disconnectWallet(false);
                      }}
                      onSwitch={() => setWalletModalOpen(true)}
                    />
                  </div>
                )}
                <form className="mt-8 space-y-5" onSubmit={submitProof}>
                  <div>
                    <label htmlFor="credential" className="block text-sm font-semibold text-primary">
                      Private gate credential
                    </label>
                    <p id="credential-help" className="mt-2 text-sm leading-6 text-muted">
                      Paste the <strong className="font-semibold text-primary">raw secret</strong> the operator sent you
                      (64 hex characters). Privora hashes it locally and proves the hash is on the allowlist. The
                      secret is cleared before proof generation and never stored by Privora.
                    </p>
                    <StatusBanner tone="info" className="mt-4" title="What becomes public">
                      The contract checks a public allowlist root and records a public nullifier after success. It does
                      not publish your raw credential or the Merkle path used to prove membership.
                    </StatusBanner>
                    <input
                      id="credential"
                      name="credential"
                      inputMode="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={credential}
                      onChange={(event) => {
                        setCredential(event.target.value);
                        if (step === "error") {
                          setStep("credential");
                          setMessage("");
                        }
                      }}
                      aria-describedby="credential-help"
                      disabled={proving}
                      className="mt-4 min-h-12 w-full rounded-2xl border border-border-subtle bg-card px-4 font-mono text-sm text-primary outline-none transition-colors placeholder:text-faint focus:border-accent-soft focus:ring-2 focus:ring-accent/30 disabled:opacity-50"
                      placeholder="64 hexadecimal characters"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!deployed || !walletAddress || !credential || proving}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-dark px-5 text-sm font-bold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <BusyButtonContent
                      busy={proving}
                      busyLabel={stepLabel(step)}
                      idleLabel="Generate private proof"
                      icon={<KeyRound size={17} aria-hidden="true" />}
                    />
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-8">
                <div className="mb-4 flex items-center gap-2 text-xs text-faint" role="status">
                  <span
                    className={`h-2 w-2 rounded-full ${wallets.length > 0 ? "bg-accent" : "bg-amber-300"}`}
                    aria-hidden="true"
                  />
                  {wallets.length > 0
                    ? `${wallets.length} compatible wallet${wallets.length === 1 ? "" : "s"} detected`
                    : "No Midnight wallet detected yet"}
                </div>
                <button
                  type="button"
                  onClick={() => setWalletModalOpen(true)}
                  disabled={step === "connecting"}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-dark px-5 text-sm font-bold text-white transition-colors hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <BusyButtonContent
                    busy={step === "connecting"}
                    busyLabel="Connecting wallet"
                    idleLabel="Choose compatible wallet"
                    icon={<WalletCards size={17} aria-hidden="true" />}
                  />
                </button>
                <p className="mt-4 flex items-start gap-2 text-sm leading-6 text-faint">
                  <CircleHelp size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
                  Your wallet must be connected to the{" "}
                  <span className="font-mono text-muted">{gate.network}</span> network.
                </p>
              </div>
            )}

            {step !== "ready" && step !== "connecting" && step !== "confirmed" && !proving && walletAddress && (
              <button
                type="button"
                onClick={() => {
                  void disconnectWallet(false);
                }}
                className="mt-6 inline-flex items-center gap-2 text-sm text-faint underline underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Disconnect wallet <EyeOff size={15} aria-hidden="true" />
              </button>
            )}
            {step === "confirmed" && (
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                {walletAddress && (
                  <button
                    type="button"
                    onClick={() => {
                      void disconnectWallet(false);
                    }}
                    className="inline-flex items-center gap-2 text-sm text-faint underline underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Disconnect wallet
                  </button>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-2 text-sm text-faint underline underline-offset-4 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Start another session (clear vault unlock)
                </button>
              </div>
            )}
          </section>
        </div>
      </PageShell>
      <WalletConnectModal
        open={walletModalOpen}
        wallets={wallets}
        selectedRdns={selectedWalletRdns}
        onClose={() => setWalletModalOpen(false)}
        onSelect={(wallet) => {
          void connect(wallet);
        }}
      />
    </>
  );
}

export default function GatePage() {
  return (
    <Suspense fallback={<PageLoadingFallback title="Loading access gate" />}>
      <GatePageContent />
    </Suspense>
  );
}
