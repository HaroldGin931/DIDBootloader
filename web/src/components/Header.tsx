"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

function useLastAddress(): string {
  const [addr, setAddr] = useState("");
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("did_attestations") ?? "{}");
      const keys = Object.keys(stored);
      if (keys.length > 0) setAddr(keys[0]);
    } catch {
      /* empty */
    }
  }, []);
  return addr;
}

const NAV_ITEMS = [
  { href: "/attest", label: "Verify" },
];

export function Header() {
  const pathname = usePathname();
  const lastAddr = useLastAddress();

  const profileHref = lastAddr ? `/profile/${lastAddr}` : null;

  return (
    <header className="sticky top-0 z-50 border-b border-border-muted bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[960px] items-center justify-between px-4">
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`h-8 rounded-md px-3 text-sm font-medium leading-8 transition-colors ${
                  active
                    ? "bg-bg-hover text-text"
                    : "text-text-alt hover:bg-bg-hover hover:text-text"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          {profileHref && (
            <Link
              href={profileHref}
              className={`h-8 rounded-md px-3 text-sm font-medium leading-8 transition-colors ${
                pathname.startsWith("/profile")
                  ? "bg-bg-hover text-text"
                  : "text-text-alt hover:bg-bg-hover hover:text-text"
              }`}
            >
              ZKCard
            </Link>
          )}
        </nav>

        <ConnectButton showBalance={false} />
      </div>
    </header>
  );
}
