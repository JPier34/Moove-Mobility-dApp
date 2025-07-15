const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("MooveAuction", function () {
  const AuctionType = {
    TRADITIONAL: 0,
    ENGLISH: 1,
    DUTCH: 2,
    SEALED_BID: 3,
  };

  const AuctionStatus = {
    ACTIVE: 0,
    ENDED: 1,
    CANCELLED: 2,
    REVEALING: 3,
  };

  const VehicleType = {
    BIKE: 0,
    SCOOTER: 1,
    MONOPATTINO: 2,
  };

  let mooveNFT;
  let mooveAuction;
  let mooveNFTAddress;
  let owner;
  let seller;
  let mintedTokenIds;

  async function deployAuctionFixture() {
    const [owner, admin, seller, bidder1, bidder2, bidder3] =
      await ethers.getSigners();

    const MooveNFT = await ethers.getContractFactory("MooveNFT");
    const mooveNFT = await MooveNFT.deploy("MooveNFT", "MNFT", owner.address);
    await mooveNFT.waitForDeployment();

    const MooveAuction = await ethers.getContractFactory("MooveAuction");
    const mooveAuction = await MooveAuction.deploy(owner.address);
    await mooveAuction.waitForDeployment();

    const mooveNFTAddress = await mooveNFT.getAddress();
    const mooveAuctionAddress = await mooveAuction.getAddress();

    const ADMIN_ROLE = await mooveNFT.ADMIN_ROLE();
    const MINTER_ROLE = await mooveNFT.MINTER_ROLE();
    await mooveNFT.grantRole(ADMIN_ROLE, admin.address);
    await mooveNFT.grantRole(MINTER_ROLE, admin.address);

    const ADMIN_ROLE_AUCTION = await mooveAuction.DEFAULT_ADMIN_ROLE();
    await mooveAuction.grantRole(ADMIN_ROLE_AUCTION, admin.address);

    const ADMIN_ROLE_AUCTION_ONLY = await mooveAuction.ADMIN_ROLE();
    await mooveAuction.grantRole(ADMIN_ROLE_AUCTION_ONLY, admin.address);

    const mintedTokenIds = [];
    for (let i = 0; i < 5; i++) {
      const tx = await mooveNFT
        .connect(admin)
        .mintVehicleNFT(
          seller.address,
          VehicleType.BIKE,
          `Test Bike #${i + 1}`,
          `Test description ${i}`,
          `https://ipfs.io/ipfs/QmHash${i + 1}`,
          ethers.parseEther("0.05"),
          "Test Location"
        );

      const receipt = await tx.wait();
      const transferEvent = mooveNFT.interface.parseLog(receipt.logs[0]);
      if (transferEvent && transferEvent.name === "Transfer") {
        console.log(
          `[Fixture] NFT Minted! ID: ${transferEvent.args.tokenId}, Owner: ${transferEvent.args.to}`
        );
        mintedTokenIds.push(transferEvent.args.tokenId);
      } else {
        console.error(
          "[Fixture] Errore: Evento 'Transfer' non trovato o non parsato correttamente."
        );
      }
    }

    await mooveNFT.connect(seller).setApprovalForAll(mooveAuctionAddress, true);

    return {
      mooveNFT,
      mooveAuction,
      mooveNFTAddress,
      mooveAuctionAddress,
      owner,
      admin,
      seller,
      bidder1,
      bidder2,
      bidder3,
      mintedTokenIds,
    };
  }

  beforeEach(async function () {
    ({
      mooveNFT,
      mooveAuction,
      mooveNFTAddress,
      mooveAuctionAddress,
      owner,
      admin,
      seller,
      bidder1,
      bidder2,
      bidder3,
      mintedTokenIds,
    } = await loadFixture(deployAuctionFixture));
  });

  describe("Deployment", function () {
    it("Should set the right platform owner", async function () {
      expect(await mooveAuction.platformOwner()).to.equal(owner.address);
    });

    it("Should set correct platform fee", async function () {
      expect(await mooveAuction.platformFeePercentage()).to.equal(250);
    });
  });

  describe("Traditional Auction", function () {
    it("Should create traditional auction successfully", async function () {
      const startPrice = ethers.parseEther("1.0");
      const reservePrice = ethers.parseEther("1.5");
      const buyNowPrice = ethers.parseEther("3.0");
      const duration = 24 * 60 * 60; // 24 hours
      const bidIncrement = ethers.parseEther("0.1");

      const tokenId = mintedTokenIds[0];

      expect(await mooveNFT.ownerOf(tokenId)).to.equal(seller.address);

      await expect(
        mooveAuction
          .connect(seller)
          .createAuction(
            tokenId,
            mooveNFTAddress,
            AuctionType.TRADITIONAL,
            startPrice,
            reservePrice,
            buyNowPrice,
            duration,
            bidIncrement
          )
      ).to.emit(mooveAuction, "AuctionCreated");
    });
  });

  it("Should place bids correctly", async function () {
    const {
      mooveAuction,
      mooveNFTAddress,
      seller,
      bidder1,
      bidder2,
      mintedTokenIds,
    } = await loadFixture(deployAuctionFixture);

    console.log('--- Debug Test: "Should place bids correctly" ---');
    console.log("mooveNFTAddress:", mooveNFTAddress);
    console.log("Contenuto di mintedTokenIds:", mintedTokenIds);

    const tokenId = mintedTokenIds[0];

    // Create auction
    const startPrice = ethers.parseEther("1.0");
    const reservePrice = ethers.parseEther("1.5");
    const buyNowPrice = ethers.parseEther("3.0");
    const duration = 24 * 60 * 60;
    const bidIncrement = ethers.parseEther("0.1");

    console.log("token id:", tokenId);
    console.log("mooveNFTAddress:", mooveNFTAddress);
    console.log("AuctionType.TRADITIONAL:", AuctionType.TRADITIONAL);
    console.log("buyNowPrice:", buyNowPrice);
    console.log("startPrice:", startPrice);
    console.log("reservePrice:", reservePrice);
    console.log("duration:", duration);
    console.log("bidIncrement:", bidIncrement);

    await mooveAuction
      .connect(seller)
      .createAuction(
        tokenId,
        mooveNFTAddress,
        AuctionType.TRADITIONAL,
        startPrice,
        reservePrice,
        buyNowPrice,
        duration,
        bidIncrement
      );

    // Place first bid
    const firstBid = ethers.parseEther("1.0");
    await expect(mooveAuction.connect(bidder1).placeBid(0, { value: firstBid }))
      .to.emit(mooveAuction, "BidPlaced")
      .withArgs(0, bidder1.address, firstBid, await time.latestBlock());

    // Place higher bid
    const secondBid = ethers.parseEther("1.2");
    await expect(
      mooveAuction.connect(bidder2).placeBid(0, { value: secondBid })
    ).to.emit(mooveAuction, "BidPlaced");

    const auction = await mooveAuction.getAuction(0);
    expect(auction.highestBidder).to.equal(bidder2.address);
    expect(auction.highestBid).to.equal(secondBid);
  });

  it("Should fail bid below minimum", async function () {
    const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
      await loadFixture(deployAuctionFixture);

    const tokenId = mintedTokenIds[0];

    await mooveAuction
      .connect(seller)
      .createAuction(
        tokenId,
        mooveNFTAddress,
        AuctionType.TRADITIONAL,
        ethers.parseEther("1.0"),
        ethers.parseEther("1.5"),
        ethers.parseEther("3.0"),
        24 * 60 * 60,
        ethers.parseEther("0.1")
      );

    await expect(
      mooveAuction
        .connect(bidder1)
        .placeBid(0, { value: ethers.parseEther("0.5") })
    ).to.be.revertedWithCustomError(mooveAuction, "MooveAuction__BidTooLow");
  });

  it("Should handle buy now correctly", async function () {
    const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
      await loadFixture(deployAuctionFixture);

    const buyNowPrice = ethers.parseEther("3.0");

    const tokenId = mintedTokenIds[0];

    await mooveAuction
      .connect(seller)
      .createAuction(
        tokenId,
        mooveNFTAddress,
        AuctionType.TRADITIONAL,
        ethers.parseEther("1.0"),
        ethers.parseEther("1.5"),
        buyNowPrice,
        24 * 60 * 60,
        ethers.parseEther("0.1")
      );

    await expect(
      mooveAuction.connect(bidder1).placeBid(0, { value: buyNowPrice })
    )
      .to.emit(mooveAuction, "AuctionEnded")
      .withArgs(0, bidder1.address, buyNowPrice);

    const auction = await mooveAuction.getAuction(0);
    expect(auction.status).to.equal(AuctionStatus.ENDED);
  });

  it("Should end auction and transfer NFT correctly", async function () {
    const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
      await loadFixture(deployAuctionFixture);

    const tokenId = mintedTokenIds[0];

    await mooveAuction.connect(seller).createAuction(
      tokenId,
      mooveNFTAddress,
      AuctionType.TRADITIONAL,
      ethers.parseEther("1.0"),
      ethers.parseEther("1.5"),
      ethers.parseEther("3.0"),
      3600,
      ethers.parseEther("0.1") // 1 second duration
    );

    const bidAmount = ethers.parseEther("2.0");
    await mooveAuction.connect(bidder1).placeBid(0, { value: bidAmount });

    // Wait for auction to end
    await time.increase(2);

    await mooveAuction.endAuction(0);

    // Claim NFT
    await mooveAuction.connect(bidder1).claimNFT(0);
    expect(await mooveNFT.ownerOf(0)).to.equal(bidder1.address);
  });

  describe("English Auction", function () {
    it("Should extend auction on late bids", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      const duration = 3600; // 1 hour
      await expect(
        mooveAuction
          .connect(seller)
          .createAuction(
            tokenId,
            mooveNFTAddress,
            AuctionType.ENGLISH,
            ethers.parseEther("1.0"),
            ethers.parseEther("1.5"),
            ethers.parseEther("3.0"),
            duration,
            ethers.parseEther("0.1")
          )
      ).to.emit(mooveAuction, "AuctionCreated");

      const auctionBefore = await mooveAuction.getAuction(0);
      const originalEndTime = auctionBefore.endTime;

      // Wait until near end
      await time.increaseTo(Number(originalEndTime) - 5); // 5 seconds before end

      // Place bid (should extend auction)
      await mooveAuction
        .connect(bidder1)
        .placeBid(0, { value: ethers.parseEther("1.0") });

      const auctionAfter = await mooveAuction.getAuction(0);
      expect(auctionAfter.endTime).to.be.gt(originalEndTime);
    });

    it("Should not extend if bid placed early", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      const duration = 3600; // 1 hour
      await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.ENGLISH,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          duration,
          ethers.parseEther("0.1")
        );

      const auctionBefore = await mooveAuction.getAuction(0);
      const originalEndTime = auctionBefore.endTime;

      // Place bid early
      await mooveAuction
        .connect(bidder1)
        .placeBid(0, { value: ethers.parseEther("1.0") });

      const auctionAfter = await mooveAuction.getAuction(0);
      expect(auctionAfter.endTime).to.equal(originalEndTime);
    });
  });

  describe("Dutch Auction", function () {
    it("Should calculate decreasing price correctly", async function () {
      const { mooveAuction, mooveNFTAddress, seller, admin, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      const startPrice = ethers.parseEther("3.0");
      const reservePrice = ethers.parseEther("2.0");
      const duration = 3600; // 1 hour

      await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.DUTCH,
          startPrice,
          reservePrice,
          ethers.parseEther("3.0"),
          duration,
          ethers.parseEther("0.1")
        );

      const initialPrice = await mooveAuction.getCurrentDutchPrice(0);
      expect(initialPrice).to.equal(startPrice);

      // Wait half duration
      await time.increase(duration / 2);

      const midPrice = await mooveAuction.getCurrentDutchPrice(0);
      const expectedMidPrice = (startPrice + reservePrice) / 2n;

      // Allow small rounding differences
      expect(midPrice).to.be.closeTo(
        expectedMidPrice,
        ethers.parseEther("0.01")
      );

      // Wait full duration
      await time.increase(duration / 2 + 1);

      const finalPrice = await mooveAuction.getCurrentDutchPrice(0);
      expect(finalPrice).to.equal(reservePrice);
    });

    it("Should accept bid at current Dutch price", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      const startPrice = ethers.parseEther("1.0");
      const reservePrice = ethers.parseEther("2.0");
      const duration = 3600;

      await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.DUTCH,
          startPrice,
          reservePrice,
          ethers.parseEther("3.0"),
          duration,
          ethers.parseEther("0.1")
        );

      // Wait some time for price to decrease
      await time.increase(duration / 4);

      const currentPrice = await mooveAuction.getCurrentDutchPrice(0);

      await expect(
        mooveAuction.connect(bidder1).placeBid(0, { value: currentPrice })
      ).to.emit(mooveAuction, "BidPlaced");
    });
  });

  describe("Sealed Bid Auction", function () {
    it("Should submit sealed bids correctly", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      const duration = 3600; // 1 hour
      await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.SEALED_BID,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          duration,
          ethers.parseEther("0.1")
        );

      const bidAmount = ethers.parseEther("2.0");
      const nonce = 12345;
      const bidHash = await mooveAuction.generateBidHash(
        bidAmount,
        nonce,
        bidder1.address
      );

      await expect(
        mooveAuction
          .connect(bidder1)
          .submitSealedBid(0, bidHash, { value: bidAmount })
      )
        .to.emit(mooveAuction, "SealedBidSubmitted")
        .withArgs(0, bidder1.address, bidHash);
    });

    it("Should reveal sealed bids correctly", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      const duration = 3600; // 1 hour
      await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.SEALED_BID,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          duration,
          ethers.parseEther("0.1")
        );

      const bidAmount = ethers.parseEther("2.0");
      const nonce = 12345;
      const bidHash = await mooveAuction.generateBidHash(
        bidAmount,
        nonce,
        bidder1.address
      );

      // Submit sealed bid
      await mooveAuction
        .connect(bidder1)
        .submitSealedBid(0, bidHash, { value: bidAmount });

      // Wait for reveal phase
      const auction = await mooveAuction.getAuction(0);
      await time.increaseTo(Number(auction.endTime) - 24 * 60 * 60 + 1); // Start of reveal phase

      // Reveal bid
      await expect(
        mooveAuction.connect(bidder1).revealSealedBid(0, bidAmount, nonce)
      )
        .to.emit(mooveAuction, "SealedBidRevealed")
        .withArgs(0, bidder1.address, bidAmount);
    });

    it("Should fail reveal with wrong parameters", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      const duration = 3600;
      await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.SEALED_BID,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          duration,
          ethers.parseEther("0.1")
        );

      const bidAmount = ethers.parseEther("2.0");
      const nonce = 12345;
      const bidHash = await mooveAuction.generateBidHash(
        bidAmount,
        nonce,
        bidder1.address
      );

      await mooveAuction
        .connect(bidder1)
        .submitSealedBid(0, bidHash, { value: bidAmount });

      // Wait for reveal phase
      const auction = await mooveAuction.getAuction(0);
      await time.increaseTo(Number(auction.endTime) - 24 * 60 * 60 + 1);

      // Try to reveal with wrong amount
      await expect(
        mooveAuction
          .connect(bidder1)
          .revealSealedBid(0, ethers.parseEther("1.5"), nonce)
      ).to.be.revertedWithCustomError(
        mooveAuction,
        "MooveAuction__InvalidReveal"
      );

      // Try to reveal with wrong nonce
      await expect(
        mooveAuction.connect(bidder1).revealSealedBid(0, bidAmount, 54321)
      ).to.be.revertedWithCustomError(
        mooveAuction,
        "MooveAuction__InvalidReveal"
      );
    });
  });

  describe("Payment and Claims", function () {
    it("Should handle payment claims correctly", async function () {
      const {
        mooveAuction,
        mooveNFTAddress,
        seller,
        bidder1,
        owner,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          ethers.parseEther("0.1")
        );

      const bidAmount = ethers.parseEther("2.0");
      await mooveAuction.connect(bidder1).placeBid(0, { value: bidAmount });

      await time.increase(2);
      await mooveAuction.endAuction(0);

      const sellerBalanceBefore = await ethers.provider.getBalance(
        seller.address
      );
      const ownerBalanceBefore = await ethers.provider.getBalance(
        owner.address
      );

      // Claim payment
      await expect(mooveAuction.connect(seller).claimPayment(0)).to.emit(
        mooveAuction,
        "PaymentClaimed"
      );

      const sellerBalanceAfter = await ethers.provider.getBalance(
        seller.address
      );
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      // Calculate expected amounts
      const platformFee = (bidAmount * 250n) / 10000n; // 2.5%
      const expectedSellerAmount = bidAmount - platformFee;

      expect(sellerBalanceAfter - sellerBalanceBefore).to.be.closeTo(
        expectedSellerAmount,
        ethers.parseEther("0.01")
      );
      expect(ownerBalanceAfter - ownerBalanceBefore).to.be.closeTo(
        platformFee,
        ethers.parseEther("0.01")
      );
    });

    it("Should handle refunds correctly", async function () {
      const {
        mooveAuction,
        mooveNFTAddress,
        seller,
        bidder1,
        bidder2,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          ethers.parseEther("0.1")
        );

      // Place multiple bids
      await mooveAuction
        .connect(bidder1)
        .placeBid(0, { value: ethers.parseEther("1.0") });
      await mooveAuction
        .connect(bidder2)
        .placeBid(0, { value: ethers.parseEther("2.0") });

      await time.increase(2);
      await mooveAuction.endAuction(0);

      const bidder1BalanceBefore = await ethers.provider.getBalance(
        bidder1.address
      );

      // Losing bidder should get refund
      await expect(mooveAuction.connect(bidder1).claimRefund(0))
        .to.emit(mooveAuction, "BidRefunded")
        .withArgs(0, bidder1.address, ethers.parseEther("1.0"));

      const bidder1BalanceAfter = await ethers.provider.getBalance(
        bidder1.address
      );
      expect(bidder1BalanceAfter - bidder1BalanceBefore).to.be.closeTo(
        ethers.parseEther("1.0"),
        ethers.parseEther("0.01")
      );
    });

    it("Should fail if reserve price not met", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      await mooveAuction.connect(seller).createAuction(
        tokenId,
        mooveNFTAddress,
        AuctionType.TRADITIONAL,
        ethers.parseEther("1.0"),
        ethers.parseEther("2.0"), // High reserve
        ethers.parseEther("3.0"),
        3600,
        ethers.parseEther("0.1")
      );

      // Bid below reserve
      await mooveAuction
        .connect(bidder1)
        .placeBid(0, { value: ethers.parseEther("1.5") });

      await time.increase(2);
      await mooveAuction.endAuction(0);

      // Should not be able to claim NFT
      await expect(
        mooveAuction.connect(bidder1).claimNFT(0)
      ).to.be.revertedWithCustomError(mooveAuction, "Reserve not met");

      // NFT should be returned to seller
      expect(await mooveNFT.ownerOf(0)).to.equal(seller.address);
    });
  });

  describe("Admin Functions", function () {
    it("Should cancel auction by admin", async function () {
      const { mooveAuction, mooveNFTAddress, seller, admin, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          ethers.parseEther("0.1")
        );

      await expect(mooveAuction.connect(admin).cancelAuction(0))
        .to.emit(mooveAuction, "AuctionCancelled")
        .withArgs(0);

      const auction = await mooveAuction.getAuction(0);
      expect(auction.status).to.equal(AuctionStatus.CANCELLED);

      // NFT should be returned to seller
      expect(await mooveNFT.ownerOf(0)).to.equal(seller.address);
    });

    it("Should update platform fee", async function () {
      const { mooveAuction, admin } = await loadFixture(deployAuctionFixture);

      await mooveAuction.connect(admin).setPlatformFee(300); // 3%
      expect(await mooveAuction.platformFeePercentage()).to.equal(300);
    });

    it("Should fail admin functions without proper role", async function () {
      const { mooveAuction, seller } = await loadFixture(deployAuctionFixture);

      await expect(
        mooveAuction.connect(seller).setPlatformFee(300)
      ).to.be.revertedWithCustomError(
        mooveAuction,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      // Create multiple auctions con tokenId diversi
      for (let i = 0; i < 3; i++) {
        await mooveAuction.connect(seller).createAuction(
          mintedTokenIds[i],
          mooveNFTAddress,
          i, // Different auction types
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          ethers.parseEther("0.1")
        );
      }
    });

    it("Should get active auctions", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      // Create multiple auctions con tokenId diversi
      for (let i = 0; i < 3; i++) {
        await mooveAuction
          .connect(seller)
          .createAuction(
            mintedTokenIds[i],
            mooveNFTAddress,
            i,
            ethers.parseEther("1.0"),
            ethers.parseEther("1.5"),
            ethers.parseEther("3.0"),
            3600,
            ethers.parseEther("0.1")
          );
      }

      const activeAuctions = await mooveAuction.getActiveAuctions();
      expect(activeAuctions.length).to.equal(3);
      expect(activeAuctions[0]).to.equal(1);
      expect(activeAuctions[1]).to.equal(2);
      expect(activeAuctions[2]).to.equal(3);
    });

    it("Should get auctions by seller", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const auctionIds = [];
      for (let i = 0; i < 3; i++) {
        const tx = await mooveAuction
          .connect(seller)
          .createAuction(
            mintedTokenIds[i],
            mooveNFTAddress,
            i,
            ethers.parseEther("1.0"),
            ethers.parseEther("1.5"),
            ethers.parseEther("3.0"),
            3600,
            ethers.parseEther("0.1")
          );
        const receipt = await tx.wait();
        for (const log of receipt.logs) {
          try {
            const parsed = mooveAuction.interface.parseLog(log);
            if (parsed && parsed.name === "AuctionCreated") {
              auctionIds.push(parsed.args.auctionId);
              break;
            }
          } catch (e) {}
        }
      }
      expect(auctionIds.length).to.equal(3);

      const sellerAuctions = await mooveAuction.getAuctionsBySeller(
        seller.address
      );
      expect(sellerAuctions.length).to.equal(3);
      expect(sellerAuctions[0]).to.equal(1);
      expect(sellerAuctions[1]).to.equal(2);
      expect(sellerAuctions[2]).to.equal(3);
    });

    it("Should check if user has bid", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          ethers.parseEther("0.1")
        );
      const receipt = await tx.wait();
      let auctionId;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            auctionId = parsed.args.auctionId;
            break;
          }
        } catch (e) {}
      }

      const hasBid = await mooveAuction.hasUserBid(auctionId, bidder1.address);
      expect(hasBid).to.be.false;

      expect(auctionId).to.not.be.undefined;

      expect(await mooveAuction.hasUserBid(auctionId, bidder1.address)).to.be
        .false;

      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: ethers.parseEther("1.0") });

      expect(await mooveAuction.hasUserBid(auctionId, bidder1.address)).to.be
        .true;
    });

    it("Should get auction bids", async function () {
      const {
        mooveAuction,
        mooveNFTAddress,
        seller,
        bidder1,
        bidder2,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          ethers.parseEther("0.1")
        );
      const receipt = await tx.wait();
      let auctionId;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            auctionId = parsed.args.auctionId;
            break;
          }
        } catch (e) {}
      }
      expect(auctionId).to.not.be.undefined;

      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: ethers.parseEther("1.0") });
      await mooveAuction
        .connect(bidder2)
        .placeBid(auctionId, { value: ethers.parseEther("1.2") });

      const bids = await mooveAuction.getAuctionBids(auctionId);
      expect(bids.length).to.equal(2);
      expect(bids[0].bidder).to.equal(bidder1.address);
      expect(bids[1].bidder).to.equal(bidder2.address);
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should prevent seller from bidding on own auction", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      // Crea l'asta e recupera l'auctionId
      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          ethers.parseEther("0.1")
        );
      const receipt = await tx.wait();
      let auctionId;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            auctionId = parsed.args.auctionId;
            break;
          }
        } catch (e) {}
      }
      expect(auctionId).to.not.be.undefined;

      await expect(
        mooveAuction
          .connect(seller)
          .placeBid(auctionId, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(
        mooveAuction,
        "MooveAuction__NotAuthorized"
      );
    });

    it("Should prevent double claiming", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      // Crea l'asta e recupera l'auctionId dall'evento
      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          ethers.parseEther("0.1")
        );
      const receipt = await tx.wait();
      let auctionId;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            auctionId = parsed.args.auctionId;
            break;
          }
        } catch (e) {}
      }
      expect(auctionId).to.not.be.undefined;

      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: ethers.parseEther("2.0") });

      // Porta il tempo oltre la fine dell'asta
      const auction = await mooveAuction.getAuction(auctionId);
      await time.increaseTo(Number(auction.endTime) + 1);

      await mooveAuction.endAuction(auctionId);

      // First claim should succeed
      await mooveAuction.connect(bidder1).claimNFT(auctionId);

      // Second claim should fail con errore custom corretto
      await expect(
        mooveAuction.connect(bidder1).claimNFT(auctionId)
      ).to.be.revertedWithCustomError(
        mooveAuction,
        "MooveAuction__AlreadyClaimed"
      );
    });

    it("Should handle invalid auction duration", async function () {
      const { mooveAuction, mooveNFTAddress, seller } = await loadFixture(
        deployAuctionFixture
      );

      // Too short duration
      await expect(
        mooveAuction.connect(seller).createAuction(
          0,
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          30, // 30 seconds (too short)
          ethers.parseEther("0.1")
        )
      ).to.be.revertedWithCustomError(
        mooveAuction,
        "MooveAuction__InvalidDuration"
      );

      // Too long duration
      await expect(
        mooveAuction.connect(seller).createAuction(
          0,
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          31 * 24 * 60 * 60, // 31 days (too long)
          ethers.parseEther("0.1")
        )
      ).to.be.revertedWithCustomError(
        mooveAuction,
        "MooveAuction__InvalidDuration"
      );
    });

    it("Should handle NFT not owned by seller", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1 } =
        await loadFixture(deployAuctionFixture);

      await expect(
        mooveAuction.connect(bidder1).createAuction(
          // bidder1 doesn't own NFT
          0,
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          ethers.parseEther("0.1")
        )
      ).to.be.revertedWithCustomError(mooveNFT, "ERC721NonexistentToken");
    });

    it("Should handle pause functionality", async function () {
      const {
        mooveAuction,
        mooveNFTAddress,
        seller,
        bidder1,
        admin,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      // Crea l'asta e recupera l'id
      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          ethers.parseEther("0.1")
        );
      const receipt = await tx.wait();
      let auctionId;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            auctionId = parsed.args.auctionId;
            break;
          }
        } catch (e) {}
      }
      expect(auctionId).to.not.be.undefined;

      // Pause contract
      await mooveAuction.connect(admin).pause();

      // Should fail when paused
      await expect(
        mooveAuction
          .connect(bidder1)
          .placeBid(auctionId, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(mooveAuction, "EnforcedPause");

      // Unpause
      await mooveAuction.connect(admin).unpause();

      // Should work after unpause
      await expect(
        mooveAuction
          .connect(bidder1)
          .placeBid(auctionId, { value: ethers.parseEther("1.0") })
      ).to.not.be.reverted;
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should handle batch operations efficiently", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      // Create multiple auctions and measure gas
      const gasUsed = [];

      const tokenId = mintedTokenIds[0];

      for (let i = 0; i < 3; i++) {
        const tx = await mooveAuction.connect(seller).createAuction(
          mintedTokenIds[i], // Usa un tokenId diverso ogni volta
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          ethers.parseEther("0.1")
        );
        const receipt = await tx.wait();
        gasUsed.push(receipt.gasUsed);
      }

      // Gas usage should be relatively consistent
      const avgGas =
        gasUsed.reduce((a, b) => a + b, 0n) / BigInt(gasUsed.length);
      gasUsed.forEach((gas) => {
        expect(gas).to.be.closeTo(avgGas, avgGas / 10n); // Within 10% of average
      });
    });
  });

  describe("Integration with NFT Contract", function () {
    it("Should work correctly with NFT transfers", async function () {
      const {
        mooveAuction,
        mooveNFT,
        mooveNFTAddress,
        seller,
        bidder1,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      // Verify NFT is with seller initially
      expect(await mooveNFT.ownerOf(tokenId)).to.equal(seller.address);

      // Listen for Transfer event and get auctionId from AuctionCreated
      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          tokenId,
          mooveNFTAddress,
          AuctionType.TRADITIONAL,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          ethers.parseEther("0.1")
        );
      const receipt = await tx.wait();
      // Find AuctionCreated event
      let auctionId;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            auctionId = parsed.args.auctionId;
            break;
          }
        } catch (e) {}
      }
      expect(auctionId).to.not.be.undefined;

      // NFT should be with auction contract
      expect(await mooveNFT.ownerOf(tokenId)).to.equal(
        await mooveAuction.getAddress()
      );

      // Check approval is set
      expect(
        await mooveNFT.isApprovedForAll(
          seller.address,
          await mooveAuction.getAddress()
        )
      ).to.be.true;

      // Place a valid bid
      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: ethers.parseEther("2.0") });

      const auction = await mooveAuction.getAuction(auctionId);
      await time.increaseTo(Number(auction.endTime) + 1);

      await mooveAuction.endAuction(auctionId);

      // Assert Transfer event is emitted when NFT is claimed by winner
      await expect(mooveAuction.connect(bidder1).claimNFT(auctionId))
        .to.emit(mooveNFT, "Transfer")
        .withArgs(await mooveAuction.getAddress(), bidder1.address, tokenId);

      // NFT should be with winner
      expect(await mooveNFT.ownerOf(tokenId)).to.equal(bidder1.address);
    });
  });
});
