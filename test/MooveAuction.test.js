const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("MooveAuction", function () {
  // ============= ENUMS =============
  const AuctionType = {
    ENGLISH: 0,
    DUTCH: 1,
    SEALED_BID: 2,
    RESERVE: 3,
  };

  const AuctionStatus = {
    PENDING: 0,
    ACTIVE: 1,
    REVEAL: 2,
    ENDED: 3,
    SETTLED: 4,
    CANCELLED: 5,
  };

  // ============= FIXTURES =============
  async function deployAuctionFixture() {
    const [owner, admin, seller, bidder1, bidder2, bidder3, feeRecipient] =
      await ethers.getSigners();

    // Deploy MooveAccessControl first
    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );
    const accessControl = await MooveAccessControl.deploy(owner.address);
    await accessControl.waitForDeployment();

    // Deploy MooveNFT
    const MooveNFT = await ethers.getContractFactory("MooveNFT");
    const mooveNFT = await MooveNFT.deploy(
      "MooveNFT",
      "MNFT",
      await accessControl.getAddress()
    );
    await mooveNFT.waitForDeployment();

    // Deploy RentalPass (mock contract)
    const RentalPass = await ethers.getContractFactory("MooveNFT"); // Using same contract as mock
    const rentalPass = await RentalPass.deploy(
      "RentalPass",
      "RENTAL",
      await accessControl.getAddress()
    );
    await rentalPass.waitForDeployment();

    // Deploy MooveAuction
    const MooveAuction = await ethers.getContractFactory("MooveAuction");
    const mooveAuction = await MooveAuction.deploy(
      await accessControl.getAddress(),
      await mooveNFT.getAddress(),
      await rentalPass.getAddress()
    );
    await mooveAuction.waitForDeployment();

    // Authorize contracts
    await accessControl.authorizeContract(await mooveNFT.getAddress());
    await accessControl.authorizeContract(await mooveAuction.getAddress());

    // Grant roles
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const PRICE_MANAGER_ROLE = await accessControl.PRICE_MANAGER_ROLE();
    const PAUSER_ROLE = await accessControl.PAUSER_ROLE();
    const WITHDRAWER_ROLE = await accessControl.WITHDRAWER_ROLE();
    const AUCTION_MANAGER_ROLE = await accessControl.AUCTION_MANAGER_ROLE();

    await accessControl.grantRole(MINTER_ROLE, admin.address);
    await accessControl.grantRole(PRICE_MANAGER_ROLE, admin.address);
    await accessControl.grantRole(PAUSER_ROLE, admin.address);
    await accessControl.grantRole(WITHDRAWER_ROLE, admin.address);
    await accessControl.grantRole(AUCTION_MANAGER_ROLE, admin.address);

    const mooveNFTAddress = await mooveNFT.getAddress();
    const mooveAuctionAddress = await mooveAuction.getAddress();

    // Mint NFTs for testing
    const mintedTokenIds = [];
    for (let i = 0; i < 5; i++) {
      const tx = await mooveNFT
        .connect(admin)
        .mintNFT(seller.address, `https://ipfs.io/ipfs/QmHash${i + 1}`);

      const receipt = await tx.wait();
      const transferEvent = receipt.logs.find((log) => {
        try {
          const parsed = mooveNFT.interface.parseLog(log);
          return parsed && parsed.name === "Transfer";
        } catch (e) {
          return false;
        }
      });

      if (transferEvent) {
        const parsed = mooveNFT.interface.parseLog(transferEvent);
        mintedTokenIds.push(parsed.args.tokenId);
      }
    }

    // Approve auction contract to transfer NFTs
    await mooveNFT.connect(seller).setApprovalForAll(mooveAuctionAddress, true);

    return {
      mooveNFT,
      mooveAuction,
      accessControl,
      rentalPass,
      mooveNFTAddress,
      mooveAuctionAddress,
      owner,
      admin,
      seller,
      bidder1,
      bidder2,
      bidder3,
      feeRecipient,
      mintedTokenIds,
    };
  }

  // Helper function to create auction
  async function createAuctionHelper(
    mooveAuction,
    seller,
    nftContract,
    tokenId,
    auctionType = AuctionType.ENGLISH,
    startPrice = ethers.parseEther("1.0"),
    reservePrice = ethers.parseEther("1.5"),
    buyNowPrice = ethers.parseEther("3.0"),
    duration = 24 * 60 * 60, // 24 hours (minimum is 1 hour)
    bidIncrement = ethers.parseEther("0.1")
  ) {
    // Ensure minimum duration of 1 hour
    const minDuration = 60 * 60; // 1 hour in seconds
    const validDuration = Math.max(duration, minDuration);

    const tx = await mooveAuction
      .connect(seller)
      .createAuction(
        nftContract,
        tokenId,
        auctionType,
        startPrice,
        reservePrice,
        buyNowPrice,
        validDuration,
        bidIncrement
      );

    const receipt = await tx.wait();
    const auctionCreatedEvent = receipt.logs.find((log) => {
      try {
        const parsed = mooveAuction.interface.parseLog(log);
        return parsed && parsed.name === "AuctionCreated";
      } catch (e) {
        return false;
      }
    });

    return mooveAuction.interface.parseLog(auctionCreatedEvent).args.auctionId;
  }

  // ============= DEPLOYMENT TESTS =============
  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { mooveAuction, accessControl } = await loadFixture(
        deployAuctionFixture
      );

      expect(await mooveAuction.getAddress()).to.be.properAddress;
      expect(await mooveAuction.accessControl()).to.equal(
        await accessControl.getAddress()
      );
    });

    it("Should set correct platform fee", async function () {
      const { mooveAuction } = await loadFixture(deployAuctionFixture);

      expect(await mooveAuction.platformFeePercentage()).to.equal(250); // 2.5%
    });

    it("Should set correct minimum bid increment", async function () {
      const { mooveAuction } = await loadFixture(deployAuctionFixture);

      expect(await mooveAuction.minimumBidIncrement()).to.equal(500); // 5%
    });

    it("Should revert deployment with invalid addresses", async function () {
      const MooveAuction = await ethers.getContractFactory("MooveAuction");

      await expect(
        MooveAuction.deploy(
          ethers.ZeroAddress,
          ethers.ZeroAddress,
          ethers.ZeroAddress
        )
      ).to.be.revertedWith("Invalid access control address");
    });
  });

  // ============= ENGLISH AUCTION TESTS =============
  describe("English Auction", function () {
    it("Should create English auction successfully", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const startPrice = ethers.parseEther("1.0");
      const reservePrice = ethers.parseEther("1.5");
      const buyNowPrice = ethers.parseEther("3.0");
      const duration = 24 * 60 * 60; // 24 hours
      const bidIncrement = ethers.parseEther("0.1");

      const tokenId = mintedTokenIds[0];

      await expect(
        mooveAuction
          .connect(seller)
          .createAuction(
            mooveNFTAddress,
            tokenId,
            AuctionType.ENGLISH,
            startPrice,
            reservePrice,
            buyNowPrice,
            duration,
            bidIncrement
          )
      ).to.emit(mooveAuction, "AuctionCreated");
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

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId
      );

      // Place first bid
      const firstBid = ethers.parseEther("1.0");
      await expect(
        mooveAuction.connect(bidder1).placeBid(auctionId, { value: firstBid })
      ).to.emit(mooveAuction, "BidPlaced");

      // Place higher bid
      const secondBid = ethers.parseEther("1.2");
      await expect(
        mooveAuction.connect(bidder2).placeBid(auctionId, { value: secondBid })
      ).to.emit(mooveAuction, "BidPlaced");

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.highestBidder).to.equal(bidder2.address);
      expect(auction.highestBid).to.equal(secondBid);
    });

    it("Should handle buy now functionality", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId
      );

      // Buy now at buy now price
      const buyNowPrice = ethers.parseEther("3.0");
      await expect(
        mooveAuction
          .connect(bidder1)
          .placeBid(auctionId, { value: buyNowPrice })
      ).to.emit(mooveAuction, "BidPlaced");

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.status).to.equal(AuctionStatus.ENDED);
      expect(auction.highestBidder).to.equal(bidder1.address);
    });

    it("Should refund previous bidders", async function () {
      const {
        mooveAuction,
        mooveNFTAddress,
        seller,
        bidder1,
        bidder2,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId
      );

      const firstBid = ethers.parseEther("1.0");
      const secondBid = ethers.parseEther("1.2");

      // Track bidder1's balance
      const bidder1InitialBalance = await ethers.provider.getBalance(
        bidder1.address
      );

      // Place first bid
      const tx1 = await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: firstBid });
      const receipt1 = await tx1.wait();
      const gasCost1 = receipt1.gasUsed * tx1.gasPrice;

      // Place higher bid (should refund bidder1)
      await expect(
        mooveAuction.connect(bidder2).placeBid(auctionId, { value: secondBid })
      ).to.emit(mooveAuction, "BidRefunded");

      // Check bidder1 was refunded
      const bidder1FinalBalance = await ethers.provider.getBalance(
        bidder1.address
      );
      expect(bidder1FinalBalance).to.equal(bidder1InitialBalance - gasCost1);
    });

    it("Should reject invalid bids", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId
      );

      // Test seller cannot bid
      await expect(
        mooveAuction
          .connect(seller)
          .placeBid(auctionId, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWith("Seller cannot bid");

      // Test zero bid
      await expect(
        mooveAuction.connect(bidder1).placeBid(auctionId, { value: 0 })
      ).to.be.revertedWith("Bid must be greater than 0");

      // Test bid too low
      await expect(
        mooveAuction
          .connect(bidder1)
          .placeBid(auctionId, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Bid too low");
    });

    it("Should settle English auction correctly", async function () {
      const {
        mooveAuction,
        mooveNFT,
        mooveNFTAddress,
        seller,
        bidder1,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      // Create auction
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId,
        AuctionType.ENGLISH,
        ethers.parseEther("1.0"),
        0,
        0,
        3600
      );

      // Winning bid
      const winningBid = ethers.parseEther("2.0");
      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: winningBid });

      // Stato before settlement
      const auctionBefore = await mooveAuction.getAuction(auctionId);
      console.log("Auction before settlement:", {
        endTime: auctionBefore.endTime.toString(),
        now: (await time.latest()).toString(),
        status: auctionBefore.status,
        highestBid: auctionBefore.highestBid.toString(),
        highestBidder: auctionBefore.highestBidder,
      });

      await time.increaseTo(Number(auctionBefore.endTime) + 1);

      console.log("Time after increase:", (await time.latest()).toString());

      // Check state before settlement
      const auctionActive = await mooveAuction.getAuction(auctionId);
      expect(auctionActive.status).to.equal(AuctionStatus.ACTIVE);

      // Settlement
      await expect(mooveAuction.settleAuction(auctionId))
        .to.emit(mooveAuction, "AuctionSettled")
        .withArgs(auctionId, bidder1.address, winningBid);

      // NFT trasferred
      expect(await mooveNFT.ownerOf(tokenId)).to.equal(bidder1.address);

      // Final stete
      const auctionAfter = await mooveAuction.getAuction(auctionId);
      console.log("Auction after settlement:", { status: auctionAfter.status });
      expect(auctionAfter.status).to.equal(AuctionStatus.SETTLED);
    });
  });

  // ============= DUTCH AUCTION TESTS =============
  describe("Dutch Auction", function () {
    it("Should create Dutch auction successfully", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const startPrice = ethers.parseEther("3.0");
      const reservePrice = ethers.parseEther("1.0");

      await expect(
        mooveAuction.connect(seller).createAuction(
          mooveNFTAddress,
          tokenId,
          AuctionType.DUTCH,
          startPrice,
          reservePrice,
          0, // No buy now for Dutch
          3600, // 1 hour
          0
        )
      ).to.emit(mooveAuction, "AuctionCreated");
    });

    it("Should calculate decreasing price correctly", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const startPrice = ethers.parseEther("3.0");
      const reservePrice = ethers.parseEther("1.0");
      const duration = 3600; // 1 hour

      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId,
        AuctionType.DUTCH,
        startPrice,
        reservePrice,
        0,
        duration,
        0
      );

      // Check initial price
      let currentPrice = await mooveAuction.getDutchPrice(auctionId);
      expect(currentPrice).to.equal(startPrice);

      // Advance time by half duration
      await time.increase(1800); // 30 minutes

      // Price should be halfway between start and reserve
      currentPrice = await mooveAuction.getDutchPrice(auctionId);
      const expectedPrice = ethers.parseEther("2.0"); // Halfway point
      expect(currentPrice).to.be.closeTo(
        expectedPrice,
        ethers.parseEther("0.1")
      );

      // Advance past end time
      await time.increase(1801);

      // Price should be at reserve
      currentPrice = await mooveAuction.getDutchPrice(auctionId);
      expect(currentPrice).to.equal(reservePrice);
    });

    it("Should allow buy now at current Dutch price", async function () {
      const {
        mooveAuction,
        mooveNFT,
        mooveNFTAddress,
        seller,
        bidder1,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId,
        AuctionType.DUTCH,
        ethers.parseEther("3.0"),
        ethers.parseEther("1.0"),
        0,
        3600,
        0
      );

      // Get current price
      const currentPrice = await mooveAuction.getDutchPrice(auctionId);

      // Buy now
      await expect(
        mooveAuction
          .connect(bidder1)
          .buyNowDutch(auctionId, { value: currentPrice })
      ).to.emit(mooveAuction, "BidPlaced");

      // Check auction ended
      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.status).to.equal(AuctionStatus.ENDED);
    });

    it("Should refund excess payment in Dutch auction", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId,
        AuctionType.DUTCH,
        ethers.parseEther("3.0"),
        ethers.parseEther("1.0"),
        0,
        3600,
        0
      );

      const currentPrice = await mooveAuction.getDutchPrice(auctionId);
      const overpayment = ethers.parseEther("1.0");
      const totalPayment = currentPrice + overpayment;

      const initialBalance = await ethers.provider.getBalance(bidder1.address);

      const tx = await mooveAuction
        .connect(bidder1)
        .buyNowDutch(auctionId, { value: totalPayment });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * tx.gasPrice;

      const finalBalance = await ethers.provider.getBalance(bidder1.address);

      // Should only pay current price, not the overpayment
      // Allow for small gas estimation differences
      const expectedFinalBalance = initialBalance - currentPrice - gasCost;
      const difference =
        expectedFinalBalance > finalBalance
          ? expectedFinalBalance - finalBalance
          : finalBalance - expectedFinalBalance;

      // Allow for a small margin of error (0.001 ETH) due to gas estimation variations
      expect(difference).to.be.lt(ethers.parseEther("0.001"));
    });
  });

  // ============= SEALED BID AUCTION TESTS =============
  describe("Sealed Bid Auction", function () {
    it("Should create sealed bid auction successfully", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      await expect(
        mooveAuction
          .connect(seller)
          .createAuction(
            mooveNFTAddress,
            tokenId,
            AuctionType.SEALED_BID,
            ethers.parseEther("1.0"),
            ethers.parseEther("1.5"),
            0,
            3600,
            0
          )
      ).to.emit(mooveAuction, "AuctionCreated");
    });

    it("Should accept sealed bids", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId,
        AuctionType.SEALED_BID,
        ethers.parseEther("1.0"),
        ethers.parseEther("1.5"),
        0,
        3600,
        0
      );

      // Create sealed bid
      const bidAmount = ethers.parseEther("2.0");
      const nonce = 12345;
      const bidHash = ethers.keccak256(
        ethers.solidityPacked(
          ["uint256", "uint256", "address"],
          [bidAmount, nonce, bidder1.address]
        )
      );

      await expect(
        mooveAuction.connect(bidder1).submitSealedBid(auctionId, bidHash, {
          value: bidAmount,
        })
      ).to.emit(mooveAuction, "SealedBidSubmitted");
    });

    it("Should handle reveal phase correctly", async function () {
      const {
        mooveAuction,
        mooveNFTAddress,
        seller,
        bidder1,
        bidder2,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId,
        AuctionType.SEALED_BID,
        ethers.parseEther("1.0"),
        ethers.parseEther("1.5"),
        0,
        3600,
        0
      );

      // Submit sealed bids
      const bid1Amount = ethers.parseEther("2.0");
      const bid1Nonce = 12345;
      const bid1Hash = ethers.keccak256(
        ethers.solidityPacked(
          ["uint256", "uint256", "address"],
          [bid1Amount, bid1Nonce, bidder1.address]
        )
      );

      const bid2Amount = ethers.parseEther("2.5");
      const bid2Nonce = 67890;
      const bid2Hash = ethers.keccak256(
        ethers.solidityPacked(
          ["uint256", "uint256", "address"],
          [bid2Amount, bid2Nonce, bidder2.address]
        )
      );

      await mooveAuction.connect(bidder1).submitSealedBid(auctionId, bid1Hash, {
        value: bid1Amount,
      });
      await mooveAuction.connect(bidder2).submitSealedBid(auctionId, bid2Hash, {
        value: bid2Amount,
      });

      // End auction and start reveal phase
      await time.increase(3601);
      await mooveAuction.startRevealPhase(auctionId);

      // Reveal bids
      await expect(
        mooveAuction
          .connect(bidder1)
          .revealSealedBid(auctionId, bid1Amount, bid1Nonce)
      ).to.emit(mooveAuction, "SealedBidRevealed");

      await expect(
        mooveAuction
          .connect(bidder2)
          .revealSealedBid(auctionId, bid2Amount, bid2Nonce)
      ).to.emit(mooveAuction, "SealedBidRevealed");

      // Check highest bidder
      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.highestBidder).to.equal(bidder2.address);
      expect(auction.highestBid).to.equal(bid2Amount);
    });

    it("Should reject invalid reveals", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId,
        AuctionType.SEALED_BID,
        ethers.parseEther("1.0"),
        ethers.parseEther("1.5"),
        0,
        3600,
        0
      );

      const bidAmount = ethers.parseEther("2.0");
      const nonce = 12345;
      const bidHash = ethers.keccak256(
        ethers.solidityPacked(
          ["uint256", "uint256", "address"],
          [bidAmount, nonce, bidder1.address]
        )
      );

      await mooveAuction.connect(bidder1).submitSealedBid(auctionId, bidHash, {
        value: bidAmount,
      });

      // Start reveal phase
      await time.increase(3601);
      await mooveAuction.startRevealPhase(auctionId);

      // Try to reveal with wrong nonce
      await expect(
        mooveAuction
          .connect(bidder1)
          .revealSealedBid(auctionId, bidAmount, 99999)
      ).to.be.revertedWith("Invalid bid reveal");
    });
  });

  // ============= RESERVE AUCTION TESTS =============
  describe("Reserve Auction", function () {
    it("Should create reserve auction successfully", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      await expect(
        mooveAuction.connect(seller).createAuction(
          mooveNFTAddress,
          tokenId,
          AuctionType.RESERVE,
          ethers.parseEther("1.0"),
          ethers.parseEther("2.0"), // Higher reserve
          ethers.parseEther("5.0"),
          3600,
          ethers.parseEther("0.1")
        )
      ).to.emit(mooveAuction, "AuctionCreated");
    });

    it("Should emit ReserveReached event when reserve is met", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const reservePrice = ethers.parseEther("2.0");

      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId,
        AuctionType.RESERVE,
        ethers.parseEther("1.0"),
        reservePrice,
        ethers.parseEther("5.0"),
        3600,
        ethers.parseEther("0.1")
      );

      // Bid meeting reserve price
      await expect(
        mooveAuction
          .connect(bidder1)
          .placeBid(auctionId, { value: reservePrice })
      ).to.emit(mooveAuction, "ReserveReached");
    });

    it("Should cancel auction if reserve not met", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const reservePrice = ethers.parseEther("2.0");

      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId,
        AuctionType.RESERVE,
        ethers.parseEther("1.0"),
        reservePrice,
        ethers.parseEther("5.0"),
        3600, // 1 hour minimum
        ethers.parseEther("0.1")
      );

      // Place bid below reserve
      await mooveAuction.connect(bidder1).placeBid(auctionId, {
        value: ethers.parseEther("1.5"),
      });

      // End auction
      await time.increase(3601);

      // Try to settle - should be cancelled
      await expect(mooveAuction.settleAuction(auctionId)).to.emit(
        mooveAuction,
        "AuctionCancelled"
      );
    });
  });

  // ============= FEE CALCULATION TESTS =============
  describe("Fee Calculations", function () {
    it("Should calculate platform fees correctly", async function () {
      const {
        mooveAuction,
        mooveNFT,
        mooveNFTAddress,
        seller,
        bidder1,
        mintedTokenIds,
        feeRecipient,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId,
        AuctionType.ENGLISH,
        ethers.parseEther("1.0"),
        0,
        0,
        3600, // 1 hour minimum
        0
      );

      const winningBid = ethers.parseEther("10.0");
      const expectedPlatformFee = (winningBid * 250n) / 10000n; // 2.5%

      // Track seller's initial balance
      const sellerInitialBalance = await ethers.provider.getBalance(
        seller.address
      );

      // Place winning bid
      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: winningBid });

      // End auction
      await time.increase(3601);

      // Settle auction
      const tx = await mooveAuction.settleAuction(auctionId);
      const receipt = await tx.wait();

      // Find AuctionSettled event
      const settledEvent = receipt.logs.find((log) => {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          return parsed && parsed.name === "AuctionSettled";
        } catch (e) {
          return false;
        }
      });

      const parsedEvent = mooveAuction.interface.parseLog(settledEvent);
      expect(parsedEvent.args.platformFee).to.equal(expectedPlatformFee);

      // Check seller received correct amount (winning bid - platform fee)
      const sellerFinalBalance = await ethers.provider.getBalance(
        seller.address
      );
      const expectedSellerProceeds = winningBid - expectedPlatformFee;
      expect(sellerFinalBalance).to.equal(
        sellerInitialBalance + expectedSellerProceeds
      );
    });

    it("Should handle royalty fees if supported", async function () {
      // This test would require a mock NFT contract with EIP-2981 support
      // For now, we'll test the case where no royalties are present
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId,
        AuctionType.ENGLISH,
        ethers.parseEther("1.0"),
        0,
        0,
        3600, // 1 hour minimum
        0
      );

      const winningBid = ethers.parseEther("10.0");

      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: winningBid });
      await time.increase(3601);

      const tx = await mooveAuction.settleAuction(auctionId);
      const receipt = await tx.wait();

      const settledEvent = receipt.logs.find((log) => {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          return parsed && parsed.name === "AuctionSettled";
        } catch (e) {
          return false;
        }
      });

      const parsedEvent = mooveAuction.interface.parseLog(settledEvent);
      expect(parsedEvent.args.royaltyFee).to.equal(0); // No royalties in basic NFT
    });
  });

  // ============= ACCESS CONTROL TESTS =============
  describe("Access Control", function () {
    it("Should allow only authorized users to update platform fee", async function () {
      const { mooveAuction, admin, bidder1 } = await loadFixture(
        deployAuctionFixture
      );

      // Admin should be able to update
      await expect(
        mooveAuction.connect(admin).updatePlatformFee(300) // 3%
      ).not.to.be.reverted;

      expect(await mooveAuction.platformFeePercentage()).to.equal(300);

      // Non-admin should be rejected
      await expect(mooveAuction.connect(bidder1).updatePlatformFee(400)).to.be
        .reverted;
    });

    it("Should allow only authorized users to pause/unpause", async function () {
      const { mooveAuction, admin, owner, bidder1 } = await loadFixture(
        deployAuctionFixture
      );

      // Admin should be able to pause
      await expect(mooveAuction.connect(admin).pause()).not.to.be.reverted;

      // Check contract is paused
      expect(await mooveAuction.paused()).to.be.true;

      // Only master admin should be able to unpause
      await expect(mooveAuction.connect(owner).unpause()).not.to.be.reverted;

      expect(await mooveAuction.paused()).to.be.false;

      // Non-admin should be rejected
      await expect(mooveAuction.connect(bidder1).pause()).to.be.reverted;
    });

    it("Should allow fee withdrawal by authorized users", async function () {
      const { mooveAuction, admin, feeRecipient, bidder1 } = await loadFixture(
        deployAuctionFixture
      );

      // First, we need some fees in the contract
      // Send some ETH to simulate platform fees
      await bidder1.sendTransaction({
        to: await mooveAuction.getAddress(),
        value: ethers.parseEther("1.0"),
      });

      const initialBalance = await ethers.provider.getBalance(
        feeRecipient.address
      );

      // Admin should be able to withdraw
      await expect(
        mooveAuction
          .connect(admin)
          .withdrawPlatformFees(feeRecipient.address, ethers.parseEther("0.5"))
      ).not.to.be.reverted;

      const finalBalance = await ethers.provider.getBalance(
        feeRecipient.address
      );
      expect(finalBalance).to.equal(initialBalance + ethers.parseEther("0.5"));

      // Non-admin should be rejected
      await expect(
        mooveAuction
          .connect(bidder1)
          .withdrawPlatformFees(feeRecipient.address, ethers.parseEther("0.1"))
      ).to.be.reverted;
    });
  });

  // ============= AUCTION MANAGEMENT TESTS =============
  describe("Auction Management", function () {
    it("Should allow seller to cancel auction", async function () {
      const {
        mooveAuction,
        mooveNFT,
        mooveNFTAddress,
        seller,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId
      );

      // Seller should be able to cancel
      await expect(
        mooveAuction.connect(seller).cancelAuction(auctionId, "Changed mind")
      ).to.emit(mooveAuction, "AuctionCancelled");

      // Check NFT returned to seller
      expect(await mooveNFT.ownerOf(tokenId)).to.equal(seller.address);

      // Check auction status
      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.status).to.equal(AuctionStatus.CANCELLED);
    });

    it("Should allow admin to emergency cancel", async function () {
      const {
        mooveAuction,
        mooveNFT,
        mooveNFTAddress,
        seller,
        owner,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId
      );

      // Master admin should be able to emergency cancel
      await expect(
        mooveAuction
          .connect(owner)
          .emergencyCancel(auctionId, "Emergency situation")
      ).to.emit(mooveAuction, "AuctionCancelled");

      // Check NFT returned to seller
      expect(await mooveNFT.ownerOf(tokenId)).to.equal(seller.address);
    });

    it("Should allow admin to extend auction", async function () {
      const { mooveAuction, mooveNFTAddress, seller, admin, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId
      );

      const auction = await mooveAuction.getAuction(auctionId);
      const originalEndTime = auction.endTime;
      const extension = 3600; // 1 hour

      // Admin should be able to extend
      await expect(
        mooveAuction.connect(admin).extendAuction(auctionId, extension)
      ).not.to.be.reverted;

      const updatedAuction = await mooveAuction.getAuction(auctionId);
      expect(updatedAuction.endTime).to.equal(
        originalEndTime + BigInt(extension)
      );
    });

    it("Should refund bidders when auction is cancelled", async function () {
      const {
        mooveAuction,
        mooveNFTAddress,
        seller,
        bidder1,
        bidder2,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId
      );

      // Place some bids
      const bid1 = ethers.parseEther("1.0");
      const bid2 = ethers.parseEther("1.5");

      const bidder1InitialBalance = await ethers.provider.getBalance(
        bidder1.address
      );
      const bidder2InitialBalance = await ethers.provider.getBalance(
        bidder2.address
      );

      const tx1 = await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: bid1 });
      const receipt1 = await tx1.wait();
      const gasCost1 = receipt1.gasUsed * tx1.gasPrice;

      const tx2 = await mooveAuction
        .connect(bidder2)
        .placeBid(auctionId, { value: bid2 });
      const receipt2 = await tx2.wait();
      const gasCost2 = receipt2.gasUsed * tx2.gasPrice;

      // Cancel auction - should emit BidRefunded events for all bidders
      const cancelTx = await mooveAuction
        .connect(seller)
        .cancelAuction(auctionId, "Cancelled");

      // Wait for transaction and check events
      await expect(cancelTx).to.emit(mooveAuction, "AuctionCancelled");

      // Check bidders were refunded
      const bidder1FinalBalance = await ethers.provider.getBalance(
        bidder1.address
      );
      const bidder2FinalBalance = await ethers.provider.getBalance(
        bidder2.address
      );

      // bidder1 should get refund since bidder2 was highest bidder
      expect(bidder1FinalBalance).to.equal(bidder1InitialBalance - gasCost1);

      // bidder2 should also get refund when auction is cancelled
      expect(bidder2FinalBalance).to.equal(bidder2InitialBalance - gasCost2);
    });
  });

  // ============= VIEW FUNCTIONS TESTS =============
  describe("View Functions", function () {
    it("Should return user auctions correctly", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId1 = mintedTokenIds[0];
      const tokenId2 = mintedTokenIds[1];

      const auctionId1 = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId1
      );

      const auctionId2 = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId2
      );

      const userAuctions = await mooveAuction.getUserAuctions(seller.address);
      expect(userAuctions).to.have.length(2);
      expect(userAuctions[0]).to.equal(auctionId1);
      expect(userAuctions[1]).to.equal(auctionId2);
    });

    it("Should return user bids correctly", async function () {
      const { mooveAuction, mooveNFTAddress, seller, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId1 = mintedTokenIds[0];
      const tokenId2 = mintedTokenIds[1];

      const auctionId1 = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId1
      );

      const auctionId2 = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId2
      );

      // Place bids
      await mooveAuction.connect(bidder1).placeBid(auctionId1, {
        value: ethers.parseEther("1.0"),
      });
      await mooveAuction.connect(bidder1).placeBid(auctionId2, {
        value: ethers.parseEther("1.0"),
      });

      const userBids = await mooveAuction.getUserBids(bidder1.address);
      expect(userBids).to.have.length(2);
      expect(userBids[0]).to.equal(auctionId1);
      expect(userBids[1]).to.equal(auctionId2);
    });

    it("Should return active auctions correctly", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId1 = mintedTokenIds[0];
      const tokenId2 = mintedTokenIds[1];

      // Create active auction
      const auctionId1 = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId1,
        AuctionType.ENGLISH,
        ethers.parseEther("1.0"),
        0,
        0,
        7200 // 2 hours
      );

      // Create auction that will end soon
      const auctionId2 = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId2,
        AuctionType.ENGLISH,
        ethers.parseEther("1.0"),
        0,
        0,
        60 // 1 minute
      );

      // Initially, both auctions should be active
      let activeAuctions = await mooveAuction.getActiveAuctions();
      expect(activeAuctions).to.have.length(2);

      // Advance time to expire the second auction
      await time.increase(61);

      // Now only the first auction should be active
      activeAuctions = await mooveAuction.getActiveAuctions();
      expect(activeAuctions).to.have.length(1);
      expect(activeAuctions[0]).to.equal(auctionId1);
    });

    it("Should return auctions by type correctly", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      // Create different types of auctions
      await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        mintedTokenIds[0],
        AuctionType.ENGLISH
      );

      await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        mintedTokenIds[1],
        AuctionType.DUTCH,
        ethers.parseEther("3.0"),
        ethers.parseEther("1.0"),
        0,
        3600,
        0
      );

      await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        mintedTokenIds[2],
        AuctionType.SEALED_BID
      );

      const englishAuctions = await mooveAuction.getAuctionsByType(
        AuctionType.ENGLISH
      );
      const dutchAuctions = await mooveAuction.getAuctionsByType(
        AuctionType.DUTCH
      );
      const sealedBidAuctions = await mooveAuction.getAuctionsByType(
        AuctionType.SEALED_BID
      );

      expect(englishAuctions).to.have.length(1);
      expect(dutchAuctions).to.have.length(1);
      expect(sealedBidAuctions).to.have.length(1);
    });

    it("Should return ending soon auctions correctly", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      // Create auction ending in 1 hour (should be in ending soon)
      const auctionId1 = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        mintedTokenIds[0],
        AuctionType.ENGLISH,
        ethers.parseEther("1.0"),
        0,
        0,
        3600 // 1 hour
      );

      // Create auction ending in 25 hours (should not be in ending soon)
      await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        mintedTokenIds[1],
        AuctionType.ENGLISH,
        ethers.parseEther("1.0"),
        0,
        0,
        25 * 3600 // 25 hours
      );

      const endingSoon = await mooveAuction.getEndingSoonAuctions();
      expect(endingSoon).to.have.length(1);
      expect(endingSoon[0]).to.equal(auctionId1);
    });

    it("Should check if user has bid correctly", async function () {
      const {
        mooveAuction,
        mooveNFTAddress,
        seller,
        bidder1,
        bidder2,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId
      );

      // Initially no one has bid
      expect(await mooveAuction.hasUserBid(auctionId, bidder1.address)).to.be
        .false;
      expect(await mooveAuction.hasUserBid(auctionId, bidder2.address)).to.be
        .false;

      // Bidder1 places bid
      await mooveAuction.connect(bidder1).placeBid(auctionId, {
        value: ethers.parseEther("1.0"),
      });

      expect(await mooveAuction.hasUserBid(auctionId, bidder1.address)).to.be
        .true;
      expect(await mooveAuction.hasUserBid(auctionId, bidder2.address)).to.be
        .false;
    });
  });

  // ============= STATISTICS TESTS =============
  describe("Statistics", function () {
    it("Should return auction statistics correctly", async function () {
      const {
        mooveAuction,
        mooveNFT,
        mooveNFTAddress,
        seller,
        bidder1,
        mintedTokenIds,
      } = await loadFixture(deployAuctionFixture);

      // Initially no auctions
      let stats = await mooveAuction.getAuctionStats();
      expect(stats.totalAuctionsCount).to.equal(0);
      expect(stats.activeAuctionsCount).to.equal(0);
      expect(stats.settledAuctionsCount).to.equal(0);
      expect(stats.cancelledAuctionsCount).to.equal(0);
      expect(stats.totalVolume).to.equal(0);

      // Create and settle an auction
      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId,
        AuctionType.ENGLISH,
        ethers.parseEther("1.0"),
        0,
        0,
        3600 // 1 hour minimum
      );

      const winningBid = ethers.parseEther("2.0");
      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: winningBid });

      await time.increase(3601);
      await mooveAuction.settleAuction(auctionId);

      stats = await mooveAuction.getAuctionStats();
      expect(stats.totalAuctionsCount).to.equal(1);
      expect(stats.activeAuctionsCount).to.equal(0);
      expect(stats.settledAuctionsCount).to.equal(1);
      expect(stats.totalVolume).to.equal(winningBid);
    });

    it("Should return auction type distribution correctly", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      // Create one of each type
      await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        mintedTokenIds[0],
        AuctionType.ENGLISH
      );

      await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        mintedTokenIds[1],
        AuctionType.DUTCH,
        ethers.parseEther("3.0"),
        ethers.parseEther("1.0"),
        0,
        3600,
        0
      );

      await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        mintedTokenIds[2],
        AuctionType.SEALED_BID
      );

      await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        mintedTokenIds[3],
        AuctionType.RESERVE
      );

      const distribution = await mooveAuction.getAuctionTypeDistribution();
      expect(distribution.englishCount).to.equal(1);
      expect(distribution.dutchCount).to.equal(1);
      expect(distribution.sealedBidCount).to.equal(1);
      expect(distribution.reserveCount).to.equal(1);
    });
  });

  // ============= ERROR HANDLING & EDGE CASES =============
  describe("Error Handling & Edge Cases", function () {
    it("Should reject auction creation with invalid parameters", async function () {
      const { mooveAuction, mooveNFTAddress, seller, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];

      // Zero starting price
      await expect(
        mooveAuction.connect(seller).createAuction(
          mooveNFTAddress,
          tokenId,
          AuctionType.ENGLISH,
          0, // Invalid
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          3600,
          0
        )
      ).to.be.revertedWith("Starting price must be greater than 0");

      // Invalid duration (too short)
      await expect(
        mooveAuction.connect(seller).createAuction(
          mooveNFTAddress,
          tokenId,
          AuctionType.ENGLISH,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          30, // Too short
          0
        )
      ).to.be.revertedWith("Invalid duration");

      // Invalid duration (too long)
      await expect(
        mooveAuction.connect(seller).createAuction(
          mooveNFTAddress,
          tokenId,
          AuctionType.ENGLISH,
          ethers.parseEther("1.0"),
          ethers.parseEther("1.5"),
          ethers.parseEther("3.0"),
          31 * 24 * 60 * 60, // Too long
          0
        )
      ).to.be.revertedWith("Invalid duration");
    });

    it("Should reject auction creation for non-owned NFTs", async function () {
      const { mooveAuction, mooveNFTAddress, bidder1, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0]; // Owned by seller, not bidder1

      await expect(
        mooveAuction
          .connect(bidder1)
          .createAuction(
            mooveNFTAddress,
            tokenId,
            AuctionType.ENGLISH,
            ethers.parseEther("1.0"),
            ethers.parseEther("1.5"),
            ethers.parseEther("3.0"),
            3600,
            0
          )
      ).to.be.revertedWith("Not NFT owner");
    });

    it("Should reject auction creation for rental passes", async function () {
      const { mooveAuction, rentalPass, seller, admin } = await loadFixture(
        deployAuctionFixture
      );

      // Mint a rental pass
      const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
      const tx = await rentalPass
        .connect(admin)
        .mintNFT(seller.address, "https://ipfs.io/ipfs/QmRentalPass1");

      const receipt = await tx.wait();
      const transferEvent = receipt.logs.find((log) => {
        try {
          const parsed = rentalPass.interface.parseLog(log);
          return parsed && parsed.name === "Transfer";
        } catch (e) {
          return false;
        }
      });

      const tokenId = rentalPass.interface.parseLog(transferEvent).args.tokenId;

      // The contract checks for mooveNFTContract first, so it will reject with "Only MooveNFT can be auctioned"
      await expect(
        mooveAuction
          .connect(seller)
          .createAuction(
            await rentalPass.getAddress(),
            tokenId,
            AuctionType.ENGLISH,
            ethers.parseEther("1.0"),
            ethers.parseEther("1.5"),
            ethers.parseEther("3.0"),
            3600,
            0
          )
      ).to.be.revertedWith("Only MooveNFT can be auctioned");
    });

    it("Should reject operations when paused", async function () {
      const { mooveAuction, mooveNFTAddress, seller, admin, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      // Pause contract
      await mooveAuction.connect(admin).pause();

      const tokenId = mintedTokenIds[0];

      // Should reject auction creation when paused
      await expect(
        mooveAuction
          .connect(seller)
          .createAuction(
            mooveNFTAddress,
            tokenId,
            AuctionType.ENGLISH,
            ethers.parseEther("1.0"),
            ethers.parseEther("1.5"),
            ethers.parseEther("3.0"),
            3600,
            0
          )
      ).to.be.revertedWithCustomError(mooveAuction, "EnforcedPause");
    });

    it("Should handle fee limits correctly", async function () {
      const { mooveAuction, admin } = await loadFixture(deployAuctionFixture);

      // Should reject platform fee that's too high
      await expect(
        mooveAuction.connect(admin).updatePlatformFee(1001) // Over 10%
      ).to.be.revertedWith("Fee too high");

      // Should reject bid increment that's too high
      await expect(
        mooveAuction.connect(admin).updateMinimumBidIncrement(2001) // Over 20%
      ).to.be.revertedWith("Increment too high");
    });

    it("Should reject invalid withdrawal amounts", async function () {
      const { mooveAuction, admin, feeRecipient } = await loadFixture(
        deployAuctionFixture
      );

      // Should reject withdrawal to zero address
      await expect(
        mooveAuction
          .connect(admin)
          .withdrawPlatformFees(ethers.ZeroAddress, ethers.parseEther("0.1"))
      ).to.be.revertedWith("Invalid recipient");

      // Should reject withdrawal of more than balance
      await expect(
        mooveAuction
          .connect(admin)
          .withdrawPlatformFees(
            feeRecipient.address,
            ethers.parseEther("999999.0")
          )
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Should handle auction extension limits", async function () {
      const { mooveAuction, mooveNFTAddress, seller, admin, mintedTokenIds } =
        await loadFixture(deployAuctionFixture);

      const tokenId = mintedTokenIds[0];
      const auctionId = await createAuctionHelper(
        mooveAuction,
        seller,
        mooveNFTAddress,
        tokenId
      );

      // Should reject extension that's too long
      await expect(
        mooveAuction.connect(admin).extendAuction(auctionId, 25 * 60 * 60) // 25 hours
      ).to.be.revertedWith("Extension too long");
    });

    it("Should reject operations on non-existent auctions", async function () {
      const { mooveAuction, bidder1 } = await loadFixture(deployAuctionFixture);

      const nonExistentAuctionId = 999;

      await expect(
        mooveAuction.connect(bidder1).placeBid(nonExistentAuctionId, {
          value: ethers.parseEther("1.0"),
        })
      ).to.be.revertedWith("Auction does not exist");

      await expect(
        mooveAuction.getAuction(nonExistentAuctionId)
      ).to.be.revertedWith("Auction does not exist");
    });
  });
});
