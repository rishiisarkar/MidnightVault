import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-surface/90 backdrop-blur-md">
      <div className="relative flex h-24 w-24 items-center justify-center">
        {/* Outer glowing pulse */}
        <div className="absolute inset-0 animate-ping rounded-full bg-accent/15"></div>
        
        {/* Spinning border ring */}
        <div className="absolute inset-2 animate-[spin_3s_linear_infinite] rounded-full border-r-2 border-t-2 border-accent/70"></div>
        
        {/* Inner logo SVG */}
        <div className="relative flex h-10 w-10 animate-pulse items-center justify-center text-primary">
          <Image src="/logo.svg" alt="Privora" width={40} height={40} className="h-full w-full" priority />
        </div>
      </div>
      <p className="mt-8 animate-pulse font-mono text-xs font-medium uppercase tracking-[0.16em] text-faint">
        Initializing Vault
      </p>
    </div>
  );
}
