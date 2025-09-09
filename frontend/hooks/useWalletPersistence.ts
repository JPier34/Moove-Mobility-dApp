"use client";

import { useWalletAutoConnect } from "./useWalletAutoConnect";

export function useWalletPersistence() {
  return useWalletAutoConnect();
}
