/**
 * Simple currency conversion utility
 * Fetches ETH to EUR rate and converts amounts
 */
export class CurrencyConverter {
  private static cachedRate: number | null = null;
  private static cacheTimestamp: number | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  /**
   * Check if cached rate is still valid
   */
  private static isCacheValid(): boolean {
    if (!this.cachedRate || !this.cacheTimestamp) return false;
    return Date.now() - this.cacheTimestamp < this.CACHE_DURATION;
  }

  /**
   * Fetch current ETH to EUR rate from CoinGecko
   */
  private static async fetchEthToEurRate(): Promise<number> {
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=eur",
        { method: "GET" }
      );

      if (!response.ok) throw new Error("API request failed");

      const data = await response.json();
      const rate = data.ethereum?.eur;

      if (!rate || typeof rate !== "number") {
        throw new Error("Invalid rate data");
      }

      // Update cache
      this.cachedRate = rate;
      this.cacheTimestamp = Date.now();

      return rate;
    } catch (error) {
      console.error("Failed to fetch EUR rate:", error);
      throw error;
    }
  }

  /**
   * Convert ETH amount to EUR
   * Uses cache if available, otherwise fetches fresh rate
   */
  public static async convertEthToEur(
    ethAmount: number
  ): Promise<number | null> {
    try {
      let rate: number;

      // Use cached rate if valid
      if (this.isCacheValid() && this.cachedRate) {
        rate = this.cachedRate;
      } else {
        // Fetch fresh rate
        rate = await this.fetchEthToEurRate();
      }

      return ethAmount * rate;
    } catch (error) {
      console.error("Conversion failed:", error);
      return null;
    }
  }
}
