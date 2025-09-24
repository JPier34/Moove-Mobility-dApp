export function shortenAddress(address: string | undefined | null): string {
  if (!address || typeof address !== "string") return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
