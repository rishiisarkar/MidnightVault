import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  KeyRound,
} from "lucide-react";

const roles = [
  {
    number: "01",
    title: "Operators verify once",
    text: "Deploy a gate, generate a private credential, and enroll only the hash on Midnight Preprod.",
    caption: "writes a commitment",
  },
  {
    number: "02",
    title: "Members hold it privately",
    text: "A member keeps the raw credential off-chain and uses it locally to generate a proof.",
    caption: "holds the secret",
  },
  {
    number: "03",
    title: "Any app verifies",
    text: "The app reads a narrow verified result and never needs the credential or identity behind it.",
    caption: "reads a verified result",
  },
];

const checks = [
  "The raw credential never needs to be displayed in the public result.",
  "A nullifier prevents replay when the gate uses one-time proof policy.",
  "Session unlocks are browser-local UX after a confirmed proof.",
  "Explorer links keep the on-chain proof auditable during demos.",
];

const demoScript = [
  "admin.connectWallet('preprod')",
  "gate = deployCredentialGate()",
  "credential = generateSecret()",
  "enroll(hash(credential))",
  "member.verify(credential)",
  "vault.unlockForSession()",
];

function TerminalCard({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="terminal-card">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 font-mono text-[11px] text-white/45">
        <div className="flex items-center gap-2">
          <span className="traffic-dot bg-red-300" />
          <span className="traffic-dot bg-amber-300" />
          <span className="traffic-dot bg-accent" />
          <span className="ml-2">{title}</span>
        </div>
        <span>copy</span>
      </div>
      <pre className="overflow-x-auto p-5 font-mono text-xs leading-6 text-white/75">
        {lines.map((line) => (
          <code key={line} className="block">
            <span className="text-accent-soft">$</span> {line}
          </code>
        ))}
      </pre>
    </div>
  );
}

export default function Home() {
  return (
    <main className="bg-surface">
      <section className="px-6 py-20 sm:py-28 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <h1 className="max-w-3xl font-display text-6xl leading-[1.02] text-primary sm:text-7xl lg:text-8xl">
              Prove you belong.
              <br />
              Show <em className="italic">nothing</em> else.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-muted">
              Verify membership with a trusted issuer, then prove access to any app on Midnight. Privora shows a single
              result, not your name, your credential, or your wallet history.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/gate"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-dark px-6 text-sm font-semibold text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Try the live demo <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link
                href="/admin"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-primary px-6 text-sm font-semibold text-primary transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Open operator console
              </Link>
            </div>
          </div>

          <div className="lg:justify-self-end">
            <div className="paper-card max-w-md p-4">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-5">
                <div className="rounded-xl bg-card p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">You keep</p>
                  <p className="mt-3 font-mono text-xs text-muted">credential, issuer salt</p>
                </div>
                <ArrowRight size={18} className="text-muted" aria-hidden="true" />
                <div className="rounded-xl bg-card p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-faint">The app sees</p>
                  <p className="mt-3 flex items-center gap-2 font-mono text-xs font-semibold text-accent">
                    <Check size={14} aria-hidden="true" /> verified
                  </p>
                </div>
              </div>
              <p className="mt-4 text-center text-xs leading-5 text-muted">
                The chain sees explicit public state, such as hashes and nullifiers, while the raw credential stays private.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary px-6 py-20 sm:py-28 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-5 flex items-center justify-between gap-4">
            <p className="font-mono text-[11px] text-faint">preprod, not connected  -  proofs run in your wallet</p>
            <Link href="/gate" className="rounded-full bg-dark px-4 py-2 text-xs font-semibold text-white hover:bg-black">
              Connect wallet
            </Link>
          </div>
          <div className="paper-card flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted" aria-hidden="true">
              <KeyRound size={20} />
            </span>
            <h2 className="mt-5 text-base font-semibold text-primary">Connect a Midnight wallet</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-muted">
              Use Lace or 1AM with the dApp connector, set to Preprod. Proofs are generated by your wallet proof server.
            </p>
            <Link href="/gate" className="mt-6 rounded-full bg-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">
              Connect wallet
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="px-6 py-20 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-primary sm:text-5xl">
              Three roles, one credential, zero leakage.
            </h2>
            <p className="mt-4 text-base leading-7 text-muted">
              Privacy is load bearing, not decorative. Midnight keeps your attributes on your device, and Compact makes
              every value that reaches the chain explicit.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {roles.map((role) => (
              <article key={role.number} className="paper-card flex min-h-72 flex-col p-7">
                <p className="font-display text-2xl italic text-muted">{role.number}</p>
                <h3 className="mt-8 text-base font-semibold text-primary">{role.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted">{role.text}</p>
                <p className="mt-auto pt-8 font-mono text-[11px] text-faint">{role.caption}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="privacy" className="bg-secondary px-6 py-20 sm:py-32 lg:px-10">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="eyebrow">Why it must be on Midnight</p>
            <h2 className="mt-4 max-w-xl font-display text-4xl leading-tight text-primary sm:text-5xl">
              One deployment. Every app. Selective disclosure.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted">
              The Privora contract is deployed once and becomes a shared primitive. Membership is proven against a
              Merkle root, so a proof never reveals which credential it used.
            </p>
            <ul className="mt-8 space-y-4">
              {checks.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-muted">
                  <Check size={17} className="mt-1 shrink-0 text-accent" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <TerminalCard title="verify.ts" lines={demoScript} />
        </div>
      </section>

      <section id="demo-script" className="px-6 py-20 sm:py-32 lg:px-10">
        <div className="mx-auto max-w-5xl text-center">
          <p className="eyebrow">Install</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-primary sm:text-5xl">
            Plug it into your stack.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted">
            A small, typed Preprod demo. Deploy the contract, enroll a hash, and ship a gate.
          </p>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <article className="paper-card p-5 text-left">
              <div className="mb-4 flex items-center justify-between text-xs">
                <p className="font-semibold text-primary">privora</p>
                <Copy size={14} className="text-faint" aria-hidden="true" />
              </div>
              <TerminalCard title="terminal" lines={["npm install", "npm run dev", "open /admin"]} />
            </article>
            <article className="paper-card p-5 text-left">
              <div className="mb-4 flex items-center justify-between text-xs">
                <p className="font-semibold text-primary">privora-react</p>
                <Copy size={14} className="text-faint" aria-hidden="true" />
              </div>
              <TerminalCard title="gate.tsx" lines={["connectAdminWallet()", "deployContract()", "addCredential(hash)", "verifyCredential(secret)"]} />
            </article>
          </div>
        </div>
      </section>

      <section className="bg-secondary px-6 py-20 lg:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="eyebrow">Live and docs</p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-primary sm:text-5xl">
            It is configured for Preprod submission.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Link href="/admin" className="paper-card p-6 transition-transform hover:-translate-y-0.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Operator console</p>
              <p className="mt-4 text-sm font-semibold text-primary">Deploy and enroll.</p>
              <p className="mt-2 text-sm text-muted">Open admin</p>
            </Link>
            <Link href="/gate" className="paper-card p-6 transition-transform hover:-translate-y-0.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Demo</p>
              <p className="mt-4 text-sm font-semibold text-primary">Issue, prove, verified.</p>
              <p className="mt-2 text-sm text-muted">Run it above</p>
            </Link>
            <a href="https://docs.midnight.network" target="_blank" rel="noreferrer" className="paper-card p-6 transition-transform hover:-translate-y-0.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">Documentation</p>
              <p className="mt-4 text-sm font-semibold text-primary">Guides and API reference.</p>
              <p className="mt-2 text-sm text-muted">Read the docs</p>
            </a>
          </div>
        </div>
      </section>

      <section className="border-t border-border-subtle px-6 py-24 text-center sm:py-32 lg:px-10">
        <h2 className="mx-auto max-w-2xl font-display text-5xl leading-[1.05] text-primary sm:text-6xl">
          Verify once.
          <br />
          Prove anywhere.
          <br />
          Reveal less.
        </h2>
        <p className="mx-auto mt-6 max-w-md text-sm leading-6 text-muted">
          Any app can consume the verified result without receiving the raw credential.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/gate" className="rounded-full bg-dark px-5 py-2.5 text-sm font-semibold text-white hover:bg-black">
            Try the live demo
          </Link>
          <Link href="/admin" className="rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary hover:bg-secondary">
            Open admin
          </Link>
        </div>
      </section>
    </main>
  );
}
