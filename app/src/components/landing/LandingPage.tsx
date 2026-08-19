import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircuitBoard,
  EyeOff,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Network,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { LandingFooter } from "./LandingFooter";
import { LandingNavbar } from "./LandingNavbar";
import styles from "./Landing.module.css";

const ecosystem = ["Midnight", "Compact", "Zero-Knowledge", "Lace", "1AM Wallet"];

const howSteps = [
  { icon: Network, label: "Create a private gate" },
  { icon: KeyRound, label: "Issue private credentials" },
  { icon: EyeOff, label: "Verify access without revealing them" },
];

const capabilities = [
  { icon: LockKeyhole, title: "Private Gates", text: "Create controlled access experiences backed by Midnight." },
  { icon: KeyRound, title: "Credential Enrollment", text: "Enroll credential hashes while raw credentials remain private." },
  { icon: Fingerprint, title: "Zero-Knowledge Verification", text: "Prove membership without revealing the underlying credential." },
  { icon: BadgeCheck, title: "One-Time Access", text: "Use nullifiers to prevent credential reuse when configured." },
];

const technology = [
  { value: "Midnight", label: "Preprod" },
  { value: "Zero-Knowledge", label: "Proofs" },
  { value: "Lace + 1AM", label: "Wallet Support" },
  { value: "Private", label: "Credentials" },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className={styles.eyebrow}>{children}</p>;
}

function Hero() {
  return (
    <section className={styles.heroSection}>
      <div className={styles.hero}>
        <div className={styles.heroGrid} aria-hidden="true" />
        <div className={styles.heroBloom} aria-hidden="true" />
        <div className={styles.heroContent}>
          <span className={styles.heroBadge}><span />Private access on Midnight</span>
          <h1>Prove access.<strong>Reveal nothing.</strong></h1>
          <p>Nexora lets operators create private gates, issue credentials, and let approved members prove access with zero-knowledge proofs without revealing their credential.</p>
          <div className={styles.heroActions}>
            <Link href="/gate" className={styles.primaryButton}>Try the Live Demo <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link href="/admin" className={styles.secondaryButton}>Open Operator Console</Link>
          </div>
        </div>
        <div className={styles.ecosystem}>
          <p>Built with privacy-first infrastructure</p>
          <div>
            {ecosystem.map((item, index) => (
              <span key={item} className={styles.ecosystemItem}>
                <i aria-hidden="true">{[0, 1, 2, 3].map((cell) => <b key={cell} className={cell === index % 4 ? styles.activePixel : ""} />)}</i>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProofNetwork() {
  return (
    <div className={styles.proofNetwork} role="img" aria-label="Credential proof moving through a private verification network">
      <svg viewBox="0 0 620 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <defs>
          <linearGradient id="nx-proof-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0" />
            <stop offset="0.5" stopColor="currentColor" stopOpacity="0.72" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.08" />
          </linearGradient>
        </defs>
        <path d="M88 116 L310 250 L526 94" />
        <path d="M66 340 L310 250 L554 358" />
        <path d="M178 430 L310 250 L446 426" />
        <path d="M310 250 L310 54" />
        <circle cx="88" cy="116" r="5" />
        <circle cx="526" cy="94" r="5" />
        <circle cx="66" cy="340" r="5" />
        <circle cx="554" cy="358" r="5" />
        <circle cx="178" cy="430" r="5" />
        <circle cx="446" cy="426" r="5" />
        <circle cx="310" cy="54" r="5" />
      </svg>
      <span className={`${styles.networkNode} ${styles.nodeOne}`}>01</span>
      <span className={`${styles.networkNode} ${styles.nodeTwo}`}>A7</span>
      <span className={`${styles.networkNode} ${styles.nodeThree}`}>ZK</span>
      <span className={`${styles.networkNode} ${styles.nodeFour}`}><Check size={13} /></span>
      <div className={styles.coreLayerOne} aria-hidden="true" />
      <div className={styles.coreLayerTwo} aria-hidden="true" />
      <div className={styles.proofCore}>
        <ShieldCheck size={54} strokeWidth={1.35} aria-hidden="true" />
        <small>Proof core</small>
      </div>
      <span className={styles.privateSignal}>credential private</span>
      <span className={styles.verifiedSignal}>proof verified</span>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className={`${styles.section} ${styles.howSection}`}>
      <div className={`${styles.sectionInner} ${styles.howGrid} ${styles.reveal}`}>
        <div className={styles.sectionCopy}>
          <Eyebrow>How it works</Eyebrow>
          <h2>Private access,<span>made simple.</span></h2>
          <p>Create a gate, issue a credential, and let approved members prove access privately.</p>
          <div className={styles.stepList}>
            {howSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.label} className={styles.stepRow}>
                  <small>0{index + 1}</small>
                  <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
                  <strong>{step.label}</strong>
                  <ArrowRight size={15} aria-hidden="true" />
                </div>
              );
            })}
          </div>
        </div>
        <ProofNetwork />
      </div>
    </section>
  );
}

function Pipeline({ label, icon: Icon, steps }: { label: string; icon: typeof Network; steps: string[] }) {
  return (
    <div className={styles.pipeline}>
      <div className={styles.pipelineLabel}><Icon size={18} strokeWidth={1.6} aria-hidden="true" /><span>{label}</span></div>
      <div className={styles.pipelineTrack}>
        {steps.map((step, index) => (
          <div key={step} className={`${styles.pipelineNode} ${index === steps.length - 1 ? styles.pipelineComplete : ""}`}>
            <i aria-hidden="true">{index === steps.length - 1 ? <Check size={12} /> : String(index + 1).padStart(2, "0")}</i>
            <span>{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductFlow() {
  return (
    <section className={styles.section}>
      <div className={`${styles.sectionInner} ${styles.reveal}`}>
        <div className={styles.splitHeading}>
          <div><Eyebrow>Product flow</Eyebrow><h2>Two paths.<br />One private gate.</h2></div>
          <p>Operators publish the access rules. Members prove they satisfy them. Private credentials never enter the public experience.</p>
        </div>
        <div className={styles.pipelineStage}>
          <div className={styles.pipelineGrid} aria-hidden="true" />
          <Pipeline label="Operator" icon={Network} steps={["Configure", "Connect", "Publish", "Issue credential"]} />
          <Pipeline label="Member" icon={WalletCards} steps={["Open gate", "Connect", "Credential", "Generate proof", "Access granted"]} />
          <div className={styles.ledgerStatus}><span /> Ledger state synchronized <b>PREPROD</b></div>
        </div>
      </div>
    </section>
  );
}

function ArchitectureVisual() {
  return (
    <div className={styles.architecture} role="img" aria-label="Private credential converted to a zero-knowledge proof and public verification result">
      <div className={styles.architectureGrid} aria-hidden="true" />
      <div className={styles.layerHeader}><span>Private layer</span><small>local only</small></div>
      <div className={styles.privateLayer}>
        <div><KeyRound size={18} aria-hidden="true" /><span><small>SECRET</small>Credential</span></div>
        <div><EyeOff size={18} aria-hidden="true" /><span><small>WITNESS</small>Private inputs</span></div>
      </div>
      <div className={styles.proofConnector}><i /><i /><i /></div>
      <div className={styles.proofBlock}>
        <CircuitBoard size={24} aria-hidden="true" />
        <span><small>ZERO-KNOWLEDGE</small>Proof generated locally</span>
        <b>VALID</b>
      </div>
      <div className={styles.proofConnector}><i /><i /><i /></div>
      <div className={styles.layerHeader}><span>Public layer</span><small>Midnight</small></div>
      <div className={styles.publicLayer}>
        <div><small>ROOT</small><span>Allowlist</span></div>
        <div><small>NULLIFIER</small><span>One-time signal</span></div>
        <div className={styles.publicResult}><small>RESULT</small><span><Check size={14} /> Access confirmed</span></div>
      </div>
    </div>
  );
}

function PrivacySection() {
  return (
    <section id="privacy" className={`${styles.section} ${styles.privacySection}`}>
      <div className={`${styles.sectionInner} ${styles.privacyGrid} ${styles.reveal}`}>
        <div className={styles.sectionCopy}>
          <Eyebrow>Why Midnight</Eyebrow>
          <h2>Privacy is part of<span>the architecture.</span></h2>
          <p>Nexora uses Midnight and zero-knowledge proofs so members can prove they hold an approved credential without revealing the credential itself.</p>
          <div className={styles.privacyNotes}>
            <div><small>Stays private</small><span>Credential, witness, proof inputs</span></div>
            <div><small>Can be public</small><span>Allowlist root, nullifier, result</span></div>
          </div>
        </div>
        <ArchitectureVisual />
      </div>
    </section>
  );
}

function Capabilities() {
  return (
    <section className={styles.section}>
      <div className={`${styles.sectionInner} ${styles.reveal}`}>
        <div className={styles.splitHeading}>
          <div><Eyebrow>Private by design</Eyebrow><h2>Everything needed for<br />verifiable access.</h2></div>
          <p>A focused infrastructure layer for operators and members, from private gate creation through proof verification.</p>
        </div>
        <div className={styles.capabilityGrid}>
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <article key={capability.title} className={styles.capability}>
                <span className={styles.cardIndex}>0{index + 1}</span>
                <div className={styles.capabilityIcon}><Icon size={25} strokeWidth={1.45} aria-hidden="true" /></div>
                <h3>{capability.title}</h3>
                <p>{capability.text}</p>
                <div className={styles.cardSignal} aria-hidden="true"><i /><i /><i /></div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TechnologyStrip() {
  return (
    <section className={styles.technologyStrip}>
      <div className={styles.technologyInner}>
        {technology.map((item) => <div key={item.value}><strong>{item.value}</strong><span>{item.label}</span></div>)}
      </div>
    </section>
  );
}

function Statement() {
  return (
    <section className={styles.section}>
      <div className={`${styles.statement} ${styles.reveal}`}>
        <div className={styles.statementCopy}>
          <Eyebrow>Product principle</Eyebrow>
          <blockquote>&ldquo;Access should prove<br />eligibility &mdash; not expose<br />identity.&rdquo;</blockquote>
          <p>Nexora turns private credentials into verifiable access while keeping sensitive membership data out of the public experience.</p>
        </div>
        <div className={styles.statementVisual} aria-hidden="true">
          <svg viewBox="0 0 440 420"><path d="M54 307 L220 92 L386 307 Z" /><path d="M112 307 L220 162 L328 307 Z" /><circle cx="220" cy="92" r="6" /><circle cx="54" cy="307" r="6" /><circle cx="386" cy="307" r="6" /></svg>
          <span>&ldquo;</span>
          <i className={styles.statementNodeOne} />
          <i className={styles.statementNodeTwo} />
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className={styles.ctaSection}>
      <div className={styles.finalCta}>
        <div className={styles.ctaGrid} aria-hidden="true" />
        <div className={styles.ctaContent}>
          <h2>Ready to create private access?</h2>
          <p>Launch a gate, issue credentials, and let members verify access privately on Midnight.</p>
          <div>
            <Link href="/gate" className={styles.primaryButton}>Try the Live Demo <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link href="/admin" className={styles.secondaryButton}>Open Operator Console</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  return (
    <div className={styles.landingShell}>
      <LandingNavbar />
      <main>
        <Hero />
        <HowItWorks />
        <ProductFlow />
        <PrivacySection />
        <Capabilities />
        <TechnologyStrip />
        <Statement />
        <FinalCTA />
      </main>
      <LandingFooter />
    </div>
  );
}
