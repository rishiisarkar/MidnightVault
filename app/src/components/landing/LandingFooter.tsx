import Image from "next/image";
import Link from "next/link";
import styles from "./Landing.module.css";

export function LandingFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerGrid}>
        <div className={styles.footerBrand}>
          <Link href="/" className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true"><Image src="/logo.svg" alt="" width={20} height={20} /></span>
            <span>Nexora</span>
          </Link>
          <p>Private access infrastructure built with Midnight and zero-knowledge proofs.</p>
        </div>
        <div className={styles.footerColumn}>
          <h3>Product</h3>
          <Link href="/">Try it</Link>
          <Link href="/#how-it-works">How it works</Link>
          <Link href="/admin">Operator Console</Link>
          <Link href="/gate">Member Gate</Link>
        </div>
        <div className={styles.footerColumn}>
          <h3>Technology</h3>
          <a href="https://docs.midnight.network" target="_blank" rel="noreferrer">Midnight</a>
          <a href="https://docs.midnight.network/develop/reference/compact/" target="_blank" rel="noreferrer">Compact</a>
          <Link href="/#privacy">Zero-Knowledge</Link>
        </div>
        <div className={styles.footerColumn}>
          <h3>Access</h3>
          <span>Lace</span>
          <span>1AM Wallet</span>
          <span>Preprod</span>
        </div>
      </div>
      <div className={styles.footerBottom}>
        <span>&copy; 2026 Nexora</span>
        <span>Built on Midnight Preprod</span>
      </div>
    </footer>
  );
}
