"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, LoaderCircle, Menu, WalletCards, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WalletConnectModal } from "@/components/WalletConnectModal";
import { APP_NETWORK, MidnightClient } from "@/lib/midnight-client";
import type { WalletOption } from "@/lib/midnight-client";
import styles from "./Landing.module.css";

const links = [
  { href: "/", label: "Try it" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#privacy", label: "Why Midnight" },
  { href: "/admin", label: "Install" },
];

export function LandingNavbar() {
  const clientRef = useRef<MidnightClient | null>(null);
  const getClient = () => clientRef.current ?? (clientRef.current = new MidnightClient());
  const [menuOpen, setMenuOpen] = useState(false);
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [selectedWalletRdns, setSelectedWalletRdns] = useState<string | null>(null);
  const [selectedWalletName, setSelectedWalletName] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletError, setWalletError] = useState("");

  useEffect(() => {
    const client = getClient();
    const updateWallets = () => setWallets(client.getInjectedWallets());
    updateWallets();
    const timer = window.setInterval(updateWallets, 750);
    return () => window.clearInterval(timer);
  }, []);

  const openWalletSelector = () => {
    setMenuOpen(false);
    setWalletError("");
    setWalletModalOpen(true);
  };

  const connectWallet = async (wallet: WalletOption) => {
    setWalletModalOpen(false);
    setWalletConnecting(true);
    setWalletError("");
    try {
      await getClient().disconnect();
      const session = await getClient().connectWallet(APP_NETWORK, wallet);
      setSelectedWalletRdns(wallet.rdns);
      setSelectedWalletName(wallet.name);
      setWalletAddress(session.unshieldedAddress);
    } catch (error) {
      setSelectedWalletRdns(null);
      setSelectedWalletName("");
      setWalletAddress(null);
      setWalletError(MidnightClient.messageFor(error));
    } finally {
      setWalletConnecting(false);
    }
  };

  const walletLabel = walletConnecting
    ? "Connecting"
    : walletAddress
      ? `${selectedWalletName || "Wallet"} connected`
      : "Connect wallet";

  return (
    <>
      <header className={styles.navbar}>
        <div className={styles.navInner}>
          <Link href="/" className={styles.brand} onClick={() => setMenuOpen(false)}>
            <span className={styles.brandMark} aria-hidden="true">
              <Image src="/logo.svg" alt="" width={20} height={20} priority />
            </span>
            <span>Nexora</span>
          </Link>

          <nav className={styles.desktopNav} aria-label="Landing navigation">
            {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          </nav>

          <div className={styles.navActions}>
            <button type="button" className={`${styles.walletButton} ${walletAddress ? styles.walletConnected : ""}`} onClick={openWalletSelector} disabled={walletConnecting} title={walletAddress ?? undefined}>
              {walletConnecting ? <LoaderCircle size={14} className={styles.spinner} aria-hidden="true" /> : walletAddress ? <Check size={14} aria-hidden="true" /> : <WalletCards size={14} aria-hidden="true" />}
              <span>{walletLabel}</span>
            </button>
            <button type="button" className={styles.menuButton} onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="landing-mobile-nav" aria-label={menuOpen ? "Close navigation" : "Open navigation"}>
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav id="landing-mobile-nav" className={styles.mobileNav} aria-label="Mobile landing navigation">
            {links.map((link) => <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}>{link.label}</Link>)}
            <button type="button" onClick={openWalletSelector}>{walletLabel}</button>
          </nav>
        )}

        {walletError && <div className={styles.walletError} role="alert">{walletError}</div>}
      </header>

      <WalletConnectModal
        open={walletModalOpen}
        wallets={wallets}
        selectedRdns={selectedWalletRdns}
        onClose={() => setWalletModalOpen(false)}
        onSelect={(wallet) => { void connectWallet(wallet); }}
      />
    </>
  );
}
