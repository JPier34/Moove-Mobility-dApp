import { ethers } from "ethers";

/**
 * Creates an ethers provider, preferring BrowserProvider (window.ethereum)
 * over public RPC to avoid rate limits
 */
export function getBestProvider(): ethers.Provider {
  // Prefer browser provider (window.ethereum) over public RPC to avoid rate limits
  if (typeof window !== "undefined" && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  
  // Fallback to public RPC (with rate limit risk)
  return new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia"
  );
}

/**
 * Helper to add delay between RPC calls to avoid rate limiting
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry helper with exponential backoff for rate-limited requests
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = 
        error?.message?.includes("429") ||
        error?.message?.includes("rate limit") ||
        error?.code === 429 ||
        error?.response?.status === 429;
      
      if (!isRateLimit || attempt === maxRetries - 1) {
        throw error;
      }
      
      const delayMs = baseDelay * Math.pow(2, attempt);
      console.warn(`⚠️ Rate limit hit, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
      await delay(delayMs);
    }
  }
  
  throw new Error("Max retries exceeded");
}



