import type { Metadata } from "next";

interface Props {
  params: Promise<{ address: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { address } = await params;
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const ogUrl = `${baseUrl}/api/og?wallet=${address}&pnl=Verified&tier=Verified&label=DID+Bootloader`;

  return {
    title: `${shortAddr} | ZK Card`,
    description: `View verified credentials for ${shortAddr}. Powered by zkTLS.`,
    openGraph: {
      title: `${shortAddr} — Verified Credentials`,
      description: "Identity-bound credential verification via zkTLS. Privacy-preserving, cryptographically proven.",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${shortAddr} — Verified Credentials`,
      description: "Identity-bound credential verification via zkTLS.",
      images: [ogUrl],
    },
  };
}

export default function ProfileLayout({ children }: Props) {
  return children;
}
