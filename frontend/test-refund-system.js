// Test script per verificare il sistema di refund
// Questo script simula il processo di refund tra utenti diversi

const { ethers } = require("ethers");

// Configurazione
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia";
const AUCTION_CONTRACT_ADDRESS = "0x..."; // Inserisci l'indirizzo del contratto
const AUCTION_ABI = require("./src/abis/MooveAuction.json");

async function testRefundSystem() {
  console.log("🧪 Testing refund system for different users...");

  try {
    // Setup provider
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const auctionContract = new ethers.Contract(
      AUCTION_CONTRACT_ADDRESS,
      AUCTION_ABI,
      provider
    );

    // Test 1: Verifica che gli eventi BidRefunded siano emessi
    console.log("\n📡 Checking for BidRefunded events...");

    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(currentBlock - 1000, 0); // Ultimi 1000 blocchi

    const refundFilter = auctionContract.filters.BidRefunded();
    const refundEvents = await auctionContract.queryFilter(
      refundFilter,
      fromBlock,
      currentBlock
    );

    console.log(
      `🔍 Found ${refundEvents.length} BidRefunded events in last 1000 blocks`
    );

    for (const event of refundEvents) {
      const { auctionId, bidder, amount } = event.args;
      console.log(`💰 Refund event:`, {
        auctionId: auctionId.toString(),
        bidder: bidder,
        amount: ethers.formatEther(amount),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
      });
    }

    // Test 2: Verifica che le aste abbiano il sistema di refund attivo
    console.log("\n🏆 Checking auction refund system...");

    const totalAuctions = await auctionContract.totalAuctions();
    console.log(`📊 Total auctions: ${totalAuctions.toString()}`);

    // Controlla le ultime 5 aste
    const startAuction = Math.max(Number(totalAuctions) - 5, 0);

    for (let i = startAuction; i < Number(totalAuctions); i++) {
      try {
        const auction = await auctionContract.getAuction(i);
        const bids = await auctionContract.getAuctionBids(i);

        console.log(`\n🔍 Auction #${i}:`, {
          status: Number(auction.status),
          highestBidder: auction.highestBidder,
          highestBid: ethers.formatEther(auction.highestBid),
          totalBids: bids.length,
          isSettled: auction.isSettled,
        });

        // Verifica se ci sono bid non rimborsati
        const unrefundedBids = bids.filter(
          (bid) => !bid.isRefunded && bid.bidder !== auction.highestBidder
        );
        if (unrefundedBids.length > 0) {
          console.log(
            `⚠️ Found ${unrefundedBids.length} unrefunded bids:`,
            unrefundedBids.map((bid) => ({
              bidder: bid.bidder,
              amount: ethers.formatEther(bid.amount),
              isRefunded: bid.isRefunded,
            }))
          );
        }
      } catch (error) {
        console.log(`❌ Error checking auction ${i}:`, error.message);
      }
    }

    // Test 3: Verifica il sistema di notifiche
    console.log("\n🔔 Testing notification system...");

    // Simula la creazione di una notifica di refund
    const mockRefundEvent = {
      args: {
        auctionId: ethers.BigNumber.from("1"),
        bidder: "0x1234567890123456789012345678901234567890",
        amount: ethers.parseEther("0.1"),
      },
      blockNumber: currentBlock,
      transactionHash: "0xabcdef...",
    };

    console.log("📝 Mock refund notification:", {
      auctionId: mockRefundEvent.args.auctionId.toString(),
      bidder: mockRefundEvent.args.bidder,
      amount: ethers.formatEther(mockRefundEvent.args.amount),
      message: `You received a refund of ${ethers.formatEther(
        mockRefundEvent.args.amount
      )} ETH from auction #${mockRefundEvent.args.auctionId}`,
    });

    console.log("\n✅ Refund system test completed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Esegui il test
testRefundSystem();



