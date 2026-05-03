import { ReactNode, useEffect } from "react";
import { LanguageSelector } from "@/contexts/LanguageContext";
import adeGlobaLogo from "@assets/logo-gu-5770B_1777775485509.png";

interface AuthShellProps {
  hero: ReactNode;
  children: ReactNode;
}

/**
 * Operator-style auth shell:
 * Top half = #FFDD57 yellow with brand/hero
 * Bottom half = white card overlapping the split
 * Used by Giris / Kayit / SifreGuncelle / ForgotPassword.
 */
export default function AuthShell({ hero, children }: AuthShellProps) {
  useEffect(() => {
    document.documentElement.style.background = "#F7F8FA";
    return () => { document.documentElement.style.background = ""; };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col">
      {/* Top yellow zone */}
      <div className="relative bg-[#FFDD57] pt-3 pb-20 px-4">
        <div className="mx-auto max-w-md flex items-center justify-between">
          <img src={adeGlobaLogo} alt="AdeGloba" className="h-12 w-auto" />
          <LanguageSelector variant="light" />
        </div>
        <div className="mx-auto max-w-md mt-6 mb-2 text-slate-900">
          {hero}
        </div>
        {/* Decorative wave/curve */}
        <svg
          className="absolute left-0 right-0 -bottom-px w-full h-8 text-[#F7F8FA]"
          viewBox="0 0 1440 64"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0,32 C240,80 480,0 720,16 C960,32 1200,80 1440,32 L1440,64 L0,64 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Bottom card */}
      <main className="flex-1 px-4 -mt-12 pb-8 relative z-10">
        <div className="mx-auto max-w-md">
          <div className="user-card-elevated p-6">
            {children}
          </div>
          <p className="text-center text-xs text-slate-400 mt-5">© 2025 AdeGloba Limited</p>
        </div>
      </main>
    </div>
  );
}
