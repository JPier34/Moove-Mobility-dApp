export interface Web3Error extends Error {
  code?: number;
  reason?: string;
  transaction?: any;
}

export const handleWeb3Error = (error: Web3Error): string => {
  // User rejected transaction
  if (error.code === 4001 || error.message.includes("User rejected")) {
    return "Transaction was cancelled by user";
  }

  // Insufficient funds
  if (error.message.includes("insufficient funds")) {
    return "Insufficient funds for transaction";
  }

  // Gas estimation failed
  if (error.message.includes("gas required exceeds allowance")) {
    return "Transaction would fail. Please check contract parameters";
  }

  // Network error
  if (error.message.includes("network")) {
    return "Network error. Please check your connection";
  }

  // Contract revert
  if (error.reason) {
    return `Contract error: ${error.reason}`;
  }

  // Default fallback
  return error.message || "An unknown error occurred";
};
