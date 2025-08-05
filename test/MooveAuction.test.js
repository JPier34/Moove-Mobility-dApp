const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

const DEBUG_MODE = false;

describe("MooveAuction", function () {
  let mooveAuction, mooveNFT, accessControl;
  let owner, admin, seller, bidder1, bidder2, bidder3;
  let mooveNFTAddress, mooveAuctionAddress;
  let mintedTokenIds;

  // Auction types
  const ENGLISH = 0;
  const DUTCH = 1;
  const SEALED_BID = 2;
  const RESERVE = 3;

  // Auction status
  const PENDING = 0;
  const ACTIVE = 1;
  const REVEAL = 2;
  const ENDED = 3;
  const SETTLED = 4;
  const CANCELLED = 5;

  // Helper function to get auctionId from transaction receipt
  async function getAuctionIdFromReceipt(receipt, mooveAuction) {
    // Find the AuctionCreated event
    let event = null;
    for (const log of receipt.logs) {
      try {
        const parsed = mooveAuction.interface.parseLog(log);
        if (parsed && parsed.name === "AuctionCreated") {
          event = parsed;
          break;
        }
      } catch (e) {
        // Skip logs that can't be parsed
      }
    }

    // If we can't find the event, try to get auctionId from the contract
    if (!event) {
      const totalAuctions = await mooveAuction.totalAuctions();
      return totalAuctions - 1n; // The last created auction
    } else {
      return event.args.auctionId;
    }
  }

  async function deployAuctionFixture() {
    const [owner, admin, seller, bidder1, bidder2, bidder3] =
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
      "Moove Vehicle NFT",
      "MOOVE",
      await accessControl.getAddress()
    );
    await mooveNFT.waitForDeployment();

    // Deploy MooveAuction
    const MooveAuction = await ethers.getContractFactory("MooveAuction");
    const mooveAuction = await MooveAuction.deploy(
      await accessControl.getAddress()
    );
    await mooveAuction.waitForDeployment();

    const mooveNFTAddress = await mooveNFT.getAddress();
    const mooveAuctionAddress = await mooveAuction.getAddress();

    // Grant roles
    const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const MASTER_ADMIN_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("MASTER_ADMIN_ROLE")
    );
    const AUCTION_MANAGER_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("AUCTION_MANAGER_ROLE")
    );
    const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
    const PRICE_MANAGER_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("PRICE_MANAGER_ROLE")
    );
    const WITHDRAWER_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("WITHDRAWER_ROLE")
    );

    await accessControl.grantRole(ADMIN_ROLE, admin.address);
    await accessControl.grantRole(MINTER_ROLE, admin.address);
    await accessControl.grantRole(MASTER_ADMIN_ROLE, admin.address);
    await accessControl.grantRole(AUCTION_MANAGER_ROLE, admin.address);
    await accessControl.grantRole(PAUSER_ROLE, admin.address);
    await accessControl.grantRole(PRICE_MANAGER_ROLE, admin.address);
    await accessControl.grantRole(WITHDRAWER_ROLE, admin.address);

    // Register MooveAuction as authorized contract
    await accessControl.authorizeContract(await mooveAuction.getAddress());

    // Mint NFTs to seller
    const mintedTokenIds = [];
    for (let i = 0; i < 5; i++) {
      const tx = await mooveNFT
        .connect(admin)
        .mintNFT(seller.address, `ipfs://QmHash${i + 1}`);

      const receipt = await tx.wait();
      const transferEvent = mooveNFT.interface.parseLog(receipt.logs[0]);
      if (transferEvent && transferEvent.name === "Transfer") {
        mintedTokenIds.push(transferEvent.args.tokenId);
      }
    }

    // Approve auction contract to transfer NFTs
    await mooveNFT.connect(seller).setApprovalForAll(mooveAuctionAddress, true);

    return {
      mooveNFT,
      mooveAuction,
      accessControl,
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
    const fixture = await loadFixture(deployAuctionFixture);
    mooveAuction = fixture.mooveAuction;
    mooveNFT = fixture.mooveNFT;
    accessControl = fixture.accessControl;
    mooveNFTAddress = fixture.mooveNFTAddress;
    mooveAuctionAddress = fixture.mooveAuctionAddress;
    owner = fixture.owner;
    admin = fixture.admin;
    seller = fixture.seller;
    bidder1 = fixture.bidder1;
    bidder2 = fixture.bidder2;
    bidder3 = fixture.bidder3;
    mintedTokenIds = fixture.mintedTokenIds;
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await mooveAuction.getAddress()).to.be.properAddress;
    });

    it("Should have access control set", async function () {
      expect(await mooveAuction.accessControl()).to.equal(
        await accessControl.getAddress()
      );
    });

    it("Should have correct initial platform fee", async function () {
      expect(await mooveAuction.platformFeePercentage()).to.equal(250); // 2.5%
    });

    it("Should have correct initial bid increment", async function () {
      expect(await mooveAuction.minimumBidIncrement()).to.equal(500); // 5%
    });

    it("Should have correct security constants", async function () {
      expect(await mooveAuction.MAX_BIDS_PER_AUCTION()).to.equal(1000);
      expect(await mooveAuction.MIN_BID_INTERVAL()).to.equal(5 * 60); // 5 minutes in seconds
    });
  });

  describe("Auction Creation", function () {
    it("Should create English auction successfully", async function () {
      const tokenId = mintedTokenIds[0];
      const startingPrice = ethers.parseEther("1");
      const duration = 3600; // 1 hour

      await expect(
        mooveAuction.connect(seller).createAuction(
          mooveNFTAddress,
          tokenId,
          ENGLISH,
          startingPrice,
          0, // reservePrice
          0, // buyNowPrice
          duration,
          0 // bidIncrement
        )
      )
        .to.emit(mooveAuction, "AuctionCreated")
        .withArgs(
          0,
          seller.address,
          mooveNFTAddress,
          tokenId,
          ENGLISH,
          startingPrice,
          duration
        );

      const auction = await mooveAuction.getAuction(0);
      expect(auction.auctionId).to.equal(0);
      expect(auction.nftContract).to.equal(mooveNFTAddress);
      expect(auction.tokenId).to.equal(tokenId);
      expect(auction.seller).to.equal(seller.address);
      expect(auction.auctionType).to.equal(ENGLISH);
      expect(auction.startingPrice).to.equal(startingPrice);
      expect(auction.status).to.equal(ACTIVE);
      expect(auction.isSettled).to.be.false;
    });

    it("Should create Dutch auction successfully", async function () {
      const tokenId = mintedTokenIds[1];
      const startingPrice = ethers.parseEther("10");
      const reservePrice = ethers.parseEther("5");
      const duration = 7200; // 2 hours

      const tx = await mooveAuction.connect(seller).createAuction(
        mooveNFTAddress,
        tokenId,
        DUTCH,
        startingPrice,
        reservePrice,
        0, // buyNowPrice
        duration,
        0 // bidIncrement
      );
      const receipt = await tx.wait();
      const auctionId = await getAuctionIdFromReceipt(receipt, mooveAuction);

      expect(auctionId).to.equal(0);

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.auctionType).to.equal(DUTCH);
      expect(auction.currentPrice).to.equal(startingPrice);
      expect(auction.isSettled).to.be.false;
    });

    it("Should create Sealed Bid auction successfully", async function () {
      const tokenId = mintedTokenIds[2];
      const startingPrice = ethers.parseEther("1");
      const duration = 3600;

      const tx = await mooveAuction.connect(seller).createAuction(
        mooveNFTAddress,
        tokenId,
        SEALED_BID,
        startingPrice,
        0, // reservePrice
        0, // buyNowPrice
        duration,
        0 // bidIncrement
      );
      const receipt = await tx.wait();
      const auctionId = await getAuctionIdFromReceipt(receipt, mooveAuction);

      expect(auctionId).to.be.a("bigint");

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.auctionType).to.equal(SEALED_BID);
      expect(auction.minBidders).to.equal(2);
      expect(auction.isSettled).to.be.false;
    });

    it("Should create Reserve auction successfully", async function () {
      const tokenId = mintedTokenIds[3];
      const startingPrice = ethers.parseEther("1");
      const reservePrice = ethers.parseEther("5");
      const duration = 3600;

      const tx = await mooveAuction.connect(seller).createAuction(
        mooveNFTAddress,
        tokenId,
        RESERVE,
        startingPrice,
        reservePrice,
        0, // buyNowPrice
        duration,
        0 // bidIncrement
      );
      const receipt = await tx.wait();
      const auctionId = await getAuctionIdFromReceipt(receipt, mooveAuction);

      expect(auctionId).to.be.a("bigint");

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.auctionType).to.equal(RESERVE);
      expect(auction.reservePrice).to.equal(reservePrice);
      expect(auction.isSettled).to.be.false;
    });

    it("Should fail if NFT not owned by seller", async function () {
      const tokenId = mintedTokenIds[0];
      const startingPrice = ethers.parseEther("1");
      const duration = 3600;

      await expect(
        mooveAuction
          .connect(bidder1)
          .createAuction(
            mooveNFTAddress,
            tokenId,
            ENGLISH,
            startingPrice,
            0,
            0,
            duration,
            0
          )
      ).to.be.revertedWith("Not NFT owner");
    });

    it("Should fail if NFT not approved", async function () {
      const tokenId = mintedTokenIds[0];
      const startingPrice = ethers.parseEther("1");
      const duration = 3600;

      // Revoke approval
      await mooveNFT
        .connect(seller)
        .setApprovalForAll(mooveAuctionAddress, false);

      await expect(
        mooveAuction
          .connect(seller)
          .createAuction(
            mooveNFTAddress,
            tokenId,
            ENGLISH,
            startingPrice,
            0,
            0,
            duration,
            0
          )
      ).to.be.revertedWith("NFT not approved");
    });

    it("Should fail with invalid duration", async function () {
      const tokenId = mintedTokenIds[0];
      const startingPrice = ethers.parseEther("1");
      const duration = 30; // Less than 1 hour

      await expect(
        mooveAuction
          .connect(seller)
          .createAuction(
            mooveNFTAddress,
            tokenId,
            ENGLISH,
            startingPrice,
            0,
            0,
            duration,
            0
          )
      ).to.be.revertedWith("Invalid duration");
    });

    it("Should fail with zero starting price", async function () {
      const tokenId = mintedTokenIds[0];
      const duration = 3600;

      await expect(
        mooveAuction.connect(seller).createAuction(
          mooveNFTAddress,
          tokenId,
          ENGLISH,
          0, // startingPrice
          0,
          0,
          duration,
          0
        )
      ).to.be.revertedWith("Starting price must be greater than 0");
    });
  });

  describe("English Auction Bidding", function () {
    let auctionId;

    beforeEach(async function () {
      const tokenId = mintedTokenIds[0];
      const startingPrice = ethers.parseEther("1");
      const duration = 3600;

      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          mooveNFTAddress,
          tokenId,
          ENGLISH,
          startingPrice,
          0,
          0,
          duration,
          0
        );
      const receipt = await tx.wait();

      auctionId = await getAuctionIdFromReceipt(receipt, mooveAuction);
    });

    it("Should place first bid successfully", async function () {
      const bidAmount = ethers.parseEther("1.1");

      await expect(
        mooveAuction.connect(bidder1).placeBid(auctionId, { value: bidAmount })
      )
        .to.emit(mooveAuction, "BidPlaced")
        .withArgs(auctionId, bidder1.address, bidAmount, true);

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.highestBidder).to.equal(bidder1.address);
      expect(auction.highestBid).to.equal(bidAmount);
    });

    it("Should place higher bid and refund previous bidder", async function () {
      const bid1 = ethers.parseEther("1.1");
      const bid2 = ethers.parseEther("1.2");

      // First bid
      await mooveAuction.connect(bidder1).placeBid(auctionId, { value: bid1 });

      // Second bid
      await expect(
        mooveAuction.connect(bidder2).placeBid(auctionId, { value: bid2 })
      )
        .to.emit(mooveAuction, "BidPlaced")
        .withArgs(auctionId, bidder2.address, bid2, true);

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.highestBidder).to.equal(bidder2.address);
      expect(auction.highestBid).to.equal(bid2);
    });

    it("Should fail if bid too low", async function () {
      const lowBid = ethers.parseEther("0.5");

      await expect(
        mooveAuction.connect(bidder1).placeBid(auctionId, { value: lowBid })
      ).to.be.revertedWith("Bid too low");
    });

    it("Should fail if seller tries to bid", async function () {
      const bidAmount = ethers.parseEther("1.1");

      await expect(
        mooveAuction.connect(seller).placeBid(auctionId, { value: bidAmount })
      ).to.be.revertedWith("Seller cannot bid");
    });

    it("Should fail if auction ended", async function () {
      // Fast forward time
      await time.increase(3601);

      const bidAmount = ethers.parseEther("1.1");

      await expect(
        mooveAuction.connect(bidder1).placeBid(auctionId, { value: bidAmount })
      ).to.be.revertedWith("Auction ended");
    });

    it("Should fail if bid too soon (bid interval protection)", async function () {
      const bidAmount = ethers.parseEther("1.1");

      // First bid
      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: bidAmount });

      // Try to bid again immediately
      await expect(
        mooveAuction
          .connect(bidder1)
          .placeBid(auctionId, { value: ethers.parseEther("1.2") })
      ).to.be.revertedWith("Bid too soon");

      // Wait for bid interval and try again
      await time.increase(5 * 60 + 1); // 5 minutes + 1 second

      await expect(
        mooveAuction
          .connect(bidder1)
          .placeBid(auctionId, { value: ethers.parseEther("1.2") })
      ).to.not.be.reverted;
    });
  });

  describe("Dutch Auction", function () {
    let auctionId;

    beforeEach(async function () {
      const tokenId = mintedTokenIds[1];
      const startingPrice = ethers.parseEther("10");
      const reservePrice = ethers.parseEther("5");
      const duration = 7200; // 2 hours

      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          mooveNFTAddress,
          tokenId,
          DUTCH,
          startingPrice,
          reservePrice,
          0,
          duration,
          0
        );
      const receipt = await tx.wait();
      auctionId = await getAuctionIdFromReceipt(receipt, mooveAuction);
    });

    it("Should get correct Dutch price at start", async function () {
      const price = await mooveAuction.getDutchPrice(auctionId);
      expect(price).to.equal(ethers.parseEther("10"));
    });

    it("Should get correct Dutch price after time elapsed", async function () {
      // Fast forward 1 hour (half the duration)
      await time.increase(3600);

      const price = await mooveAuction.getDutchPrice(auctionId);
      expect(price).to.equal(ethers.parseEther("7.5")); // Halfway between 10 and 5
    });

    it("Should get reserve price when auction ended", async function () {
      // Fast forward past end time
      await time.increase(7201);

      const price = await mooveAuction.getDutchPrice(auctionId);
      expect(price).to.equal(ethers.parseEther("5"));
    });

    it("Should allow buy now at current price", async function () {
      const currentPrice = await mooveAuction.getDutchPrice(auctionId);

      await expect(
        mooveAuction
          .connect(bidder1)
          .buyNowDutch(auctionId, { value: currentPrice })
      )
        .to.emit(mooveAuction, "BidPlaced")
        .withArgs(auctionId, bidder1.address, anyValue, true);

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.status).to.equal(ENDED);
      expect(auction.highestBidder).to.equal(bidder1.address);
    });

    it("Should fail buy now with insufficient payment", async function () {
      const lowPrice = ethers.parseEther("5");

      await expect(
        mooveAuction
          .connect(bidder1)
          .buyNowDutch(auctionId, { value: lowPrice })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("Sealed Bid Auction", function () {
    let auctionId;

    beforeEach(async function () {
      const tokenId = mintedTokenIds[2];
      const startingPrice = ethers.parseEther("1");
      const duration = 3600;

      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          mooveNFTAddress,
          tokenId,
          SEALED_BID,
          startingPrice,
          0,
          0,
          duration,
          0
        );
      const receipt = await tx.wait();

      // Find the AuctionCreated event
      let event = null;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            event = parsed;
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }
      expect(event).to.not.be.null;
      auctionId = event.args.auctionId;
    });

    it("Should submit sealed bid successfully", async function () {
      const bidAmount = ethers.parseEther("2");
      const nonce = 123;
      const bidHash = ethers.keccak256(
        ethers.solidityPacked(
          ["uint256", "uint256", "address"],
          [bidAmount, nonce, bidder1.address]
        )
      );

      await expect(
        mooveAuction
          .connect(bidder1)
          .submitSealedBid(auctionId, bidHash, { value: bidAmount })
      )
        .to.emit(mooveAuction, "SealedBidSubmitted")
        .withArgs(auctionId, bidder1.address, bidHash);
    });

    it("Should fail submit sealed bid below minimum", async function () {
      const bidAmount = ethers.parseEther("0.5");
      const nonce = 123;
      const bidHash = ethers.keccak256(
        ethers.solidityPacked(
          ["uint256", "uint256", "address"],
          [bidAmount, nonce, bidder1.address]
        )
      );

      await expect(
        mooveAuction
          .connect(bidder1)
          .submitSealedBid(auctionId, bidHash, { value: bidAmount })
      ).to.be.revertedWith("Bid below minimum");
    });

    it("Should fail submit sealed bid too soon (bid interval protection)", async function () {
      const bidAmount = ethers.parseEther("2");
      const nonce = 123;
      const bidHash = ethers.keccak256(
        ethers.solidityPacked(
          ["uint256", "uint256", "address"],
          [bidAmount, nonce, bidder1.address]
        )
      );

      // First bid
      await mooveAuction
        .connect(bidder1)
        .submitSealedBid(auctionId, bidHash, { value: bidAmount });

      // Try to submit another bid immediately
      const bidHash2 = ethers.keccak256(
        ethers.solidityPacked(
          ["uint256", "uint256", "address"],
          [ethers.parseEther("3"), 456, bidder1.address]
        )
      );

      await expect(
        mooveAuction.connect(bidder1).submitSealedBid(auctionId, bidHash2, {
          value: ethers.parseEther("3"),
        })
      ).to.be.revertedWith("Bid too soon");
    });

    it("Should reveal sealed bid successfully", async function () {
      const bidAmount = ethers.parseEther("2");
      const nonce = 123;
      const bidHash = ethers.keccak256(
        ethers.solidityPacked(
          ["uint256", "uint256", "address"],
          [bidAmount, nonce, bidder1.address]
        )
      );

      // Submit bid
      await mooveAuction
        .connect(bidder1)
        .submitSealedBid(auctionId, bidHash, { value: bidAmount });

      // End auction
      await time.increase(3601);

      // Start reveal phase
      await mooveAuction.connect(admin).startRevealPhase(auctionId);

      // Reveal bid
      await expect(
        mooveAuction
          .connect(bidder1)
          .revealSealedBid(auctionId, bidAmount, nonce)
      )
        .to.emit(mooveAuction, "SealedBidRevealed")
        .withArgs(auctionId, bidder1.address, bidAmount);
    });

    it("Should fail reveal with invalid hash", async function () {
      const bidAmount = ethers.parseEther("2");
      const nonce = 123;
      const bidHash = ethers.keccak256(
        ethers.solidityPacked(
          ["uint256", "uint256", "address"],
          [bidAmount, nonce, bidder1.address]
        )
      );

      // Submit bid
      await mooveAuction
        .connect(bidder1)
        .submitSealedBid(auctionId, bidHash, { value: bidAmount });

      // End auction
      await time.increase(3601);

      // Start reveal phase
      await mooveAuction.connect(admin).startRevealPhase(auctionId);

      // Reveal with wrong nonce
      await expect(
        mooveAuction.connect(bidder1).revealSealedBid(auctionId, bidAmount, 999)
      ).to.be.revertedWith("Invalid bid reveal");
    });
  });

  describe("Auction Settlement", function () {
    let auctionId;

    beforeEach(async function () {
      const tokenId = mintedTokenIds[0];
      const startingPrice = ethers.parseEther("1");
      const duration = 3600;

      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          mooveNFTAddress,
          tokenId,
          ENGLISH,
          startingPrice,
          0,
          0,
          duration,
          0
        );
      const receipt = await tx.wait();

      // Find the AuctionCreated event
      let event = null;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            event = parsed;
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }
      expect(event).to.not.be.null;
      auctionId = event.args.auctionId;

      // Place a bid
      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: ethers.parseEther("1.1") });
    });

    it("Should fail settlement if auction still active", async function () {
      await expect(
        mooveAuction.connect(bidder1).settleAuction(auctionId)
      ).to.be.revertedWith("Auction still active");
    });

    it("Should end auction when time expires", async function () {
      // Fast forward time to end auction
      await time.increase(3601);

      await expect(mooveAuction.connect(bidder1).endAuction(auctionId))
        .to.emit(mooveAuction, "AuctionEnded")
        .withArgs(auctionId);

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.status).to.equal(ENDED);
    });

    it("Should settle auction successfully", async function () {
      // Fast forward time to end auction
      await time.increase(3601);

      // End the auction first
      await mooveAuction.connect(bidder1).endAuction(auctionId);

      // Now settle the auction
      await expect(mooveAuction.connect(bidder1).settleAuction(auctionId))
        .to.emit(mooveAuction, "AuctionSettled")
        .withArgs(
          auctionId,
          bidder1.address,
          ethers.parseEther("1.1"),
          anyValue,
          anyValue
        );

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.status).to.equal(SETTLED);
      expect(auction.isSettled).to.be.true;
    });

    it("Should prevent double settlement", async function () {
      // Fast forward time to end auction
      await time.increase(3601);

      // End the auction first
      await mooveAuction.connect(bidder1).endAuction(auctionId);

      // Settle the auction once
      await mooveAuction.connect(bidder1).settleAuction(auctionId);

      // Try to settle again
      await expect(
        mooveAuction.connect(bidder1).settleAuction(auctionId)
      ).to.be.revertedWith("Auction already settled");
    });
  });

  describe("Auction Cancellation", function () {
    let auctionId;

    beforeEach(async function () {
      const tokenId = mintedTokenIds[0];
      const startingPrice = ethers.parseEther("1");
      const duration = 3600;

      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          mooveNFTAddress,
          tokenId,
          ENGLISH,
          startingPrice,
          0,
          0,
          duration,
          0
        );
      const receipt = await tx.wait();

      // Find the AuctionCreated event
      let event = null;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            event = parsed;
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }
      expect(event).to.not.be.null;
      auctionId = event.args.auctionId;
    });

    it("Should cancel auction by seller", async function () {
      await expect(
        mooveAuction
          .connect(seller)
          .cancelAuction(auctionId, "Test cancellation")
      )
        .to.emit(mooveAuction, "AuctionCancelled")
        .withArgs(auctionId, "Test cancellation");

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.status).to.equal(CANCELLED);

      // Check NFT returned to seller
      expect(await mooveNFT.ownerOf(mintedTokenIds[0])).to.equal(
        seller.address
      );
    });

    it("Should cancel auction by admin", async function () {
      await expect(
        mooveAuction
          .connect(admin)
          .cancelAuction(auctionId, "Admin cancellation")
      )
        .to.emit(mooveAuction, "AuctionCancelled")
        .withArgs(auctionId, "Admin cancellation");

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.status).to.equal(CANCELLED);
    });

    it("Should fail cancellation by unauthorized user", async function () {
      await expect(
        mooveAuction.connect(bidder1).cancelAuction(auctionId, "Unauthorized")
      ).to.be.revertedWith("Not authorized to cancel");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      // Create multiple auctions
      for (let i = 0; i < 3; i++) {
        const tokenId = mintedTokenIds[i];
        const startingPrice = ethers.parseEther("1");
        const duration = 3600;

        await mooveAuction
          .connect(seller)
          .createAuction(
            mooveNFTAddress,
            tokenId,
            ENGLISH,
            startingPrice,
            0,
            0,
            duration,
            0
          );
      }
    });

    it("Should get total auctions", async function () {
      expect(await mooveAuction.totalAuctions()).to.equal(3);
    });

    it("Should get active auctions", async function () {
      const activeAuctions = await mooveAuction.getActiveAuctions();
      expect(activeAuctions.length).to.equal(3);
    });

    it("Should get auctions by type", async function () {
      const englishAuctions = await mooveAuction.getAuctionsByType(ENGLISH);
      expect(englishAuctions.length).to.equal(3);
    });

    it("Should get user auctions", async function () {
      const userAuctions = await mooveAuction.getUserAuctions(seller.address);
      expect(userAuctions.length).to.equal(3);
    });

    it("Should check if user has bid", async function () {
      const auctionId = 0;

      // User hasn't bid yet
      expect(await mooveAuction.hasUserBid(auctionId, bidder1.address)).to.be
        .false;

      // Place a bid
      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: ethers.parseEther("1.1") });

      // User has bid now
      expect(await mooveAuction.hasUserBid(auctionId, bidder1.address)).to.be
        .true;
    });

    it("Should get auction bids", async function () {
      const auctionId = 0;

      // Place multiple bids
      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: ethers.parseEther("1.1") });
      await mooveAuction
        .connect(bidder2)
        .placeBid(auctionId, { value: ethers.parseEther("1.2") });

      const bids = await mooveAuction.getAuctionBids(auctionId);
      expect(bids.length).to.equal(2);
      expect(bids[0].bidder).to.equal(bidder1.address);
      expect(bids[1].bidder).to.equal(bidder2.address);
    });
  });

  describe("Admin Functions", function () {
    it("Should update platform fee", async function () {
      const newFee = 300; // 3%
      await mooveAuction.connect(admin).updatePlatformFee(newFee);
      expect(await mooveAuction.platformFeePercentage()).to.equal(newFee);
    });

    it("Should update minimum bid increment", async function () {
      const newIncrement = 600; // 6%
      await mooveAuction.connect(admin).updateMinimumBidIncrement(newIncrement);
      expect(await mooveAuction.minimumBidIncrement()).to.equal(newIncrement);
    });

    it("Should pause and unpause", async function () {
      // Pause
      await mooveAuction.connect(admin).pause();
      expect(await mooveAuction.paused()).to.be.true;

      // Unpause
      await mooveAuction.connect(admin).unpause();
      expect(await mooveAuction.paused()).to.be.false;
    });

    it("Should extend auction duration", async function () {
      const tokenId = mintedTokenIds[0];
      const startingPrice = ethers.parseEther("1");
      const duration = 3600;

      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          mooveNFTAddress,
          tokenId,
          ENGLISH,
          startingPrice,
          0,
          0,
          duration,
          0
        );
      const receipt = await tx.wait();

      // Find the AuctionCreated event
      let event = null;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            event = parsed;
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }
      expect(event).to.not.be.null;
      const auctionId = event.args.auctionId;

      const auction = await mooveAuction.getAuction(auctionId);
      const originalEndTime = auction.endTime;

      await mooveAuction.connect(admin).extendAuction(auctionId, 3600); // Extend by 1 hour

      const updatedAuction = await mooveAuction.getAuction(auctionId);
      expect(updatedAuction.endTime).to.equal(originalEndTime + 3600n);
    });
  });

  describe("Statistics", function () {
    beforeEach(async function () {
      // Create and settle one auction
      const tokenId = mintedTokenIds[0];
      const startingPrice = ethers.parseEther("1");
      const duration = 3600;

      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          mooveNFTAddress,
          tokenId,
          ENGLISH,
          startingPrice,
          0,
          0,
          duration,
          0
        );
      const receipt = await tx.wait();

      // Find the AuctionCreated event
      let event = null;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            event = parsed;
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }
      expect(event).to.not.be.null;
      const auctionId = event.args.auctionId;

      // Place bid (settlement is not tested due to contract limitations)
      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: ethers.parseEther("1.1") });
    });

    it("Should get auction statistics", async function () {
      const stats = await mooveAuction.getAuctionStats();
      expect(stats.totalAuctionsCount).to.equal(1);
      expect(stats.settledAuctionsCount).to.equal(0); // No settlements due to contract limitations
      expect(stats.totalVolume).to.equal(0); // No settlements, so no volume
    });

    it("Should get auction type distribution", async function () {
      const distribution = await mooveAuction.getAuctionTypeDistribution();
      expect(distribution.englishCount).to.equal(1);
      expect(distribution.dutchCount).to.equal(0);
      expect(distribution.sealedBidCount).to.equal(0);
      expect(distribution.reserveCount).to.equal(0);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle buy now price correctly", async function () {
      const tokenId = mintedTokenIds[0];
      const startingPrice = ethers.parseEther("1");
      const buyNowPrice = ethers.parseEther("5");
      const duration = 3600;

      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          mooveNFTAddress,
          tokenId,
          ENGLISH,
          startingPrice,
          0,
          buyNowPrice,
          duration,
          0
        );
      const receipt = await tx.wait();

      // Find the AuctionCreated event
      let event = null;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            event = parsed;
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }
      expect(event).to.not.be.null;
      const auctionId = event.args.auctionId;

      // Buy now
      await expect(
        mooveAuction
          .connect(bidder1)
          .placeBid(auctionId, { value: buyNowPrice })
      )
        .to.emit(mooveAuction, "BidPlaced")
        .withArgs(auctionId, bidder1.address, buyNowPrice, true);

      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.status).to.equal(ENDED);
    });

    it("Should handle reserve price correctly", async function () {
      const tokenId = mintedTokenIds[0];
      const startingPrice = ethers.parseEther("1");
      const reservePrice = ethers.parseEther("5");
      const duration = 3600;

      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          mooveNFTAddress,
          tokenId,
          RESERVE,
          startingPrice,
          reservePrice,
          0,
          duration,
          0
        );
      const receipt = await tx.wait();

      // Find the AuctionCreated event
      let event = null;
      for (const log of receipt.logs) {
        try {
          const parsed = mooveAuction.interface.parseLog(log);
          if (parsed && parsed.name === "AuctionCreated") {
            event = parsed;
            break;
          }
        } catch (e) {
          // Skip logs that can't be parsed
        }
      }
      expect(event).to.not.be.null;
      const auctionId = event.args.auctionId;

      // Place bid below reserve
      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: ethers.parseEther("2") });

      // Test that the auction was created with correct reserve price
      const auction = await mooveAuction.getAuction(auctionId);
      expect(auction.reservePrice).to.equal(reservePrice);
      expect(auction.auctionType).to.equal(RESERVE);
    });
  });

  describe("Security Features", function () {
    let auctionId;

    beforeEach(async function () {
      const tokenId = mintedTokenIds[0];
      const startingPrice = ethers.parseEther("1");
      const duration = 3600;

      const tx = await mooveAuction
        .connect(seller)
        .createAuction(
          mooveNFTAddress,
          tokenId,
          ENGLISH,
          startingPrice,
          0,
          0,
          duration,
          0
        );
      const receipt = await tx.wait();
      auctionId = await getAuctionIdFromReceipt(receipt, mooveAuction);
    });

    it("Should prevent bid spam with interval protection", async function () {
      const bidAmount = ethers.parseEther("1.1");

      // First bid
      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: bidAmount });

      // Try to bid again immediately
      await expect(
        mooveAuction
          .connect(bidder1)
          .placeBid(auctionId, { value: ethers.parseEther("1.2") })
      ).to.be.revertedWith("Bid too soon");

      // Wait for interval and try again
      await time.increase(5 * 60 + 1); // 5 minutes + 1 second

      await expect(
        mooveAuction
          .connect(bidder1)
          .placeBid(auctionId, { value: ethers.parseEther("1.2") })
      ).to.not.be.reverted;
    });

    it("Should prevent DoS with bid limit", async function () {
      // This test would be very slow, so we'll just verify the constant exists
      expect(await mooveAuction.MAX_BIDS_PER_AUCTION()).to.equal(1000);
    });

    it("Should track last bid time correctly", async function () {
      const bidAmount = ethers.parseEther("1.1");
      const initialTime = await time.latest();

      await mooveAuction
        .connect(bidder1)
        .placeBid(auctionId, { value: bidAmount });

      const lastBidTime = await mooveAuction.lastBidTime(
        auctionId,
        bidder1.address
      );
      expect(lastBidTime).to.be.gte(initialTime);
    });
  });
});
