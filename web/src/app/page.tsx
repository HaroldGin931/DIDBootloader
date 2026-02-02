"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("did_attestations") ?? "{}");
      const keys = Object.keys(stored);
      if (keys.length > 0) {
        router.replace(`/profile/${keys[0]}`);
      } else {
        router.replace("/attest");
      }
    } catch {
      router.replace("/attest");
    }
  }, [router]);

  return null;
}
