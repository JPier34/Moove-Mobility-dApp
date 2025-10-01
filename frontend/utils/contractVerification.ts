/**
 * Contract Verification Utility
 * Verifies if the deployed contract matches our ABI expectations
 */

import { ethers } from "ethers";
import { contracts } from "./contracts";

export interface ContractVerificationResult {
  isValid: boolean;
  issues: string[];
  contractInfo: {
    address: string;
    codeHash: string;
    isVerified: boolean;
  };
}

/**
 * Verifies the deployed contract against our expectations
 */
export async function verifyDeployedContract(): Promise<ContractVerificationResult> {
  const issues: string[] = [];

  try {
    // Connect to the contract
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL ||
        "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
    );

    const contractAddress = contracts.MooveAuction.address;
    const contractABI = contracts.MooveAuction.abi;

    // Create contract instance
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    // Test basic contract functions
    console.log("🔍 Verifying deployed contract...");

    // Test 1: Check if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === "0x") {
      issues.push("Contract does not exist at the specified address");
      return {
        isValid: false,
        issues,
        contractInfo: {
          address: contractAddress,
          codeHash: "0x",
          isVerified: false,
        },
      };
    }

    // Test 2: Check totalAuctions function
    try {
      const totalAuctions = await contract.totalAuctions();
      console.log(`📊 Total auctions: ${totalAuctions}`);

      if (totalAuctions < 0) {
        issues.push("totalAuctions returned negative value");
      }
    } catch (error) {
      issues.push(`totalAuctions function failed: ${error}`);
    }

    // Test 3: Check if we can read auction data
    try {
      const auction0 = await contract.getAuction(0);
      console.log(`📊 Auction 0 data:`, {
        auctionId: auction0.auctionId.toString(),
        seller: auction0.seller,
        highestBidder: auction0.highestBidder,
        status: auction0.status.toString(),
      });

      // Check for corrupted data patterns
      if (auction0.auctionId > 1000000) {
        issues.push(
          `Auction 0 has suspicious auctionId: ${auction0.auctionId}`
        );
      }

      if (
        auction0.highestBidder === "0x0000000000000000000000000000000000000001"
      ) {
        issues.push("Auction 0 has corrupted highestBidder address");
      }
    } catch (error) {
      issues.push(`getAuction function failed: ${error}`);
    }

    // Test 4: Check event signature
    try {
      const eventSignature = "BidPlaced(uint256,address,uint256,bool)";
      const eventTopic = ethers.id(eventSignature);
      console.log(`📊 BidPlaced event topic: ${eventTopic}`);

      // This should match: 0x8f06251a01f1c60f43d914574d31d4eb5be776df9d23e7f94e7c07c578b9753d
      const expectedTopic =
        "0x8f06251a01f1c60f43d914574d31d4eb5be776df9d23e7f94e7c07c578b9753d";

      if (eventTopic !== expectedTopic) {
        issues.push(
          `Event signature mismatch. Expected: ${expectedTopic}, Got: ${eventTopic}`
        );
      }
    } catch (error) {
      issues.push(`Event signature check failed: ${error}`);
    }

    const isValid = issues.length === 0;

    return {
      isValid,
      issues,
      contractInfo: {
        address: contractAddress,
        codeHash: ethers.keccak256(code),
        isVerified: isValid,
      },
    };
  } catch (error) {
    issues.push(`Contract verification failed: ${error}`);

    return {
      isValid: false,
      issues,
      contractInfo: {
        address: contracts.MooveAuction.address,
        codeHash: "unknown",
        isVerified: false,
      },
    };
  }
}

/**
 * Analyzes recent BidPlaced events for corruption patterns
 */
export async function analyzeBidPlacedEvents(): Promise<{
  totalEvents: number;
  corruptedEvents: number;
  corruptionPatterns: {
    invalidAuctionIds: number[];
    invalidBidders: string[];
    zeroValues: number[];
  };
  additionalInfo: {
    rawLogCount: number;
    contractQueryEvents: number;
    eventDetails: any[];
  };
}> {
  try {
    const provider = new ethers.JsonRpcProvider(
      process.env.NEXT_PUBLIC_RPC_URL ||
        "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"
    );

    const contractAddress = contracts.MooveAuction.address;
    const contractABI = contracts.MooveAuction.abi;
    const contract = new ethers.Contract(
      contractAddress,
      contractABI,
      provider
    );

    // Get recent BidPlaced events - try different time ranges
    const filter = contract.filters.BidPlaced();

    // Try last 1000 blocks first
    let events = await contract.queryFilter(filter, -1000);
    console.log(
      `🔍 Found ${events.length} BidPlaced events in last 1000 blocks`
    );

    // If no events found, try a larger range
    if (events.length === 0) {
      console.log(
        "🔍 No events in last 1000 blocks, trying last 10000 blocks..."
      );
      events = await contract.queryFilter(filter, -10000);
      console.log(
        `🔍 Found ${events.length} BidPlaced events in last 10000 blocks`
      );
    }

    // If still no events, try from deployment
    if (events.length === 0) {
      console.log(
        "🔍 No events in last 10000 blocks, trying from deployment..."
      );
      try {
        events = await contract.queryFilter(filter);
        console.log(
          `🔍 Found ${events.length} BidPlaced events from deployment`
        );
      } catch (error) {
        console.log("🔍 Error querying all events:", error);
      }
    }

    console.log(`🔍 Found ${events.length} BidPlaced events`);

    let corruptedEvents = 0;
    const invalidAuctionIds: number[] = [];
    const invalidBidders: string[] = [];
    const zeroValues: number[] = [];
    const eventDetails: any[] = [];

    for (const event of events) {
      if ("args" in event && event.args) {
        const { auctionId, bidder, amount, isHighestBid } = event.args;

        // Store event details for analysis
        const eventDetail = {
          auctionId: auctionId.toString(),
          bidder,
          amount: amount.toString(),
          isHighestBid,
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
          blockHash: event.blockHash,
        };

        eventDetails.push(eventDetail);

        console.log(`📊 Event Details:`, eventDetail);

        // Check for corruption patterns
        let isCorrupted = false;

        // Check auctionId
        if (auctionId > 1000000) {
          invalidAuctionIds.push(Number(auctionId));
          isCorrupted = true;
          console.log(
            `🚨 Suspicious auctionId: ${auctionId} (expected < 1000000)`
          );
        }

        // Check bidder
        if (bidder === "0x0000000000000000000000000000000000000001") {
          invalidBidders.push(bidder);
          isCorrupted = true;
          console.log(`🚨 Corrupted bidder address: ${bidder}`);
        }

        // Check amount
        if (amount === 0n) {
          zeroValues.push(Number(auctionId));
          isCorrupted = true;
          console.log(`🚨 Zero amount for auction ${auctionId}`);
        }

        if (isCorrupted) {
          corruptedEvents++;
          console.log(`🚨 CORRUPTED EVENT DETECTED:`, eventDetail);
        } else {
          console.log(`✅ Valid event:`, eventDetail);
        }
      }
    }

    // Additional analysis: Check if there are any transactions to the contract
    let transactionCount = 0;
    try {
      console.log("🔍 Checking recent transactions to contract...");
      const currentBlock = await provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 1000);

      // Get logs for the contract address
      const logs = await provider.getLogs({
        address: contractAddress,
        fromBlock: fromBlock,
        toBlock: currentBlock,
      });

      transactionCount = logs.length;
      console.log(
        `🔍 Found ${transactionCount} logs for contract in last 1000 blocks`
      );

      // Check for any BidPlaced events in the logs
      const bidPlacedLogs = logs.filter(
        (log) =>
          log.topics[0] ===
          "0x8f06251a01f1c60f43d914574d31d4eb5be776df9d23e7f94e7c07c578b9753d"
      );

      console.log(
        `🔍 Found ${bidPlacedLogs.length} BidPlaced logs in raw logs`
      );

      if (bidPlacedLogs.length > 0) {
        console.log(
          "🚨 Found BidPlaced events in raw logs but not in contract query!"
        );
        console.log(
          "This suggests a potential issue with the contract interface or ABI"
        );
      }
    } catch (error) {
      console.log("🔍 Error checking raw logs:", error);
    }

    return {
      totalEvents: events.length,
      corruptedEvents,
      corruptionPatterns: {
        invalidAuctionIds,
        invalidBidders,
        zeroValues,
      },
      additionalInfo: {
        rawLogCount: transactionCount,
        contractQueryEvents: events.length,
        eventDetails,
      },
    };
  } catch (error) {
    console.error("❌ Error analyzing BidPlaced events:", error);
    return {
      totalEvents: 0,
      corruptedEvents: 0,
      corruptionPatterns: {
        invalidAuctionIds: [],
        invalidBidders: [],
        zeroValues: [],
      },
      additionalInfo: {
        rawLogCount: 0,
        contractQueryEvents: 0,
        eventDetails: [],
      },
    };
  }
}


