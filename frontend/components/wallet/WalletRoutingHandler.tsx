"use client";

import { useWalletRouting } from "@/hooks/useWalletRouting";

interface WalletRoutingHandlerProps {
  children: React.ReactNode;
}

export default function WalletRoutingHandler({
  children,
}: WalletRoutingHandlerProps) {
  // This component handles wallet state during routing
  // The actual logic is in the useWalletRouting hook
  useWalletRouting();

  return <>{children}</>;
}

