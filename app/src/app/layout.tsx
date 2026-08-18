import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Navigation } from "@/components/Navigation";
import { Splash } from "@/components/Splash";
import "./globals.css";

export const metadata: Metadata = {
  title: "Midnight | Zero-Knowledge Access Gateway",
  description: "A Midnight Preprod access gateway for private credential proofs.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_LIVE_DEMO_URL || "http://localhost:3000"),
  openGraph: {
    title: "Midnight",
    description: "Private credential membership proofs on Midnight Preprod.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col antialiased">
        <Splash />
        <Navigation />
        {children}
        <Footer />
      </body>
    </html>
  );
}
