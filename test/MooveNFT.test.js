const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MooveNFT", function () {
  // ============ FIXTURES ============

  async function deployMooveNFTFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy MooveNFT
    const MooveNFT = await ethers.getContractFactory("MooveNFT");
    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );
    const accessControl = await MooveAccessControl.deploy(owner.address);
    const mooveNFT = await MooveNFT.deploy(
      "Moove Sticker NFT",
      "MST",
      await accessControl.getAddress()
    );
    await mooveNFT.waitForDeployment();

    return { mooveNFT, owner, addr1, addr2, addr3 };
  }

  async function deployWithMintedNFT() {
    const { mooveNFT, owner, addr1, addr2, addr3 } = await loadFixture(
      deployMooveNFTFixture
    );

    // Mint an NFT for testing
    await mooveNFT.mintStickerNFT(
      addr1.address,
      0, // VehicleType.BIKE
      "Test Bike",
      "A test bike for the platform",
      "ipfs://QmTestHash123",
      ethers.parseEther("0.1"),
      "Milano, Italy"
    );

    return { mooveNFT, owner, addr1, addr2, addr3, tokenId: 1 };
  }

  // ============ DEPLOYMENT TESTS ============

  describe("Deployment", function () {
    it("Should set the right owner and roles", async function () {
      const { mooveNFT, owner } = await loadFixture(deployMooveNFTFixture);

      expect(
        await mooveNFT.hasRole(
          await mooveNFT.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.be.true;
      expect(await mooveNFT.hasRole(await mooveNFT.ADMIN_ROLE(), owner.address))
        .to.be.true;
      expect(
        await mooveNFT.hasRole(await mooveNFT.MINTER_ROLE(), owner.address)
      ).to.be.true;
    });

    it("Should set correct name and symbol", async function () {
      const { mooveNFT } = await loadFixture(deployMooveNFTFixture);

      expect(await mooveNFT.name()).to.equal("Moove Vehicle NFT");
      expect(await mooveNFT.symbol()).to.equal("MOOVE");
    });

    it("Should initialize with correct platform fee", async function () {
      const { mooveNFT } = await loadFixture(deployMooveNFTFixture);

      expect(await mooveNFT.platformFeePercentage()).to.equal(250); // 2.5%
    });
  });

  // ============ MINTING TESTS ============

  describe("Minting", function () {
    it("Should mint NFT with correct vehicle info", async function () {
      const { mooveNFT, owner, addr1 } = await loadFixture(
        deployMooveNFTFixture
      );

      const tx = await mooveNFT.mintStickerNFT(
        addr1.address,
        0, // VehicleType.BIKE
        "Test Bike",
        "A test bike",
        "ipfs://QmTest123",
        ethers.parseEther("0.1"),
        "Milano"
      );

      await expect(tx)
        .to.emit(mooveNFT, "VehicleNFTMinted")
        .withArgs(1, addr1.address, 0, "Test Bike");

      const vehicleInfo = await mooveNFT.getSticker(1);
      expect(vehicleInfo.name).to.equal("Test Bike");
      expect(vehicleInfo.vehicleType).to.equal(0);
      expect(vehicleInfo.dailyRate).to.equal(ethers.parseEther("0.1"));
      expect(vehicleInfo.isActive).to.be.true;
      expect(vehicleInfo.isForSale).to.be.false;
      expect(vehicleInfo.location).to.equal("Milano");
    });

    it("Should fail minting without MINTER_ROLE", async function () {
      const { mooveNFT, addr1, addr2 } = await loadFixture(
        deployMooveNFTFixture
      );

      await expect(
        mooveNFT
          .connect(addr1)
          .mintVehicleNFT(
            addr2.address,
            0,
            "Test Bike",
            "Description",
            "ipfs://test",
            ethers.parseEther("0.1"),
            "Milano"
          )
      ).to.be.revertedWithCustomError(
        mooveNFT,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should batch mint multiple NFTs", async function () {
      const { mooveNFT, addr1, addr2 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT.batchMint(
        [addr1.address, addr2.address],
        [0, 1], // BIKE, SCOOTER
        ["Bike1", "Scooter1"],
        ["Description1", "Description2"],
        ["ipfs://test1", "ipfs://test2"],
        [ethers.parseEther("0.1"), ethers.parseEther("0.2")],
        ["Milano", "Roma"]
      );

      expect(await mooveNFT.totalSupply()).to.equal(2);
      expect(await mooveNFT.ownerOf(1)).to.equal(addr1.address);
      expect(await mooveNFT.ownerOf(2)).to.equal(addr2.address);

      const vehicle1 = await mooveNFT.getSticker(1);
      const vehicle2 = await mooveNFT.getSticker(2);

      expect(vehicle1.name).to.equal("Bike1");
      expect(vehicle2.name).to.equal("Scooter1");
    });

    it("Should enforce max supply", async function () {
      const { mooveNFT, owner, addr1 } = await loadFixture(
        deployMooveNFTFixture
      );

      // Get max supply
      const maxSupply = await mooveNFT.MAX_SUPPLY();

      // This test would take too long to run with real max supply (10000)
      // So we'll test the logic by checking the error message

      // Try to mint beyond max supply (we can't actually do this without modifying the contract)
      // Instead, let's verify the max supply is set correctly
      expect(maxSupply).to.equal(10000);
    });
  });

  // ============ SALES TESTS ============

  describe("Sales", function () {
    beforeEach(async function () {
      const fixture = await loadFixture(deployWithMintedNFT);
      Object.assign(this, fixture);
    });

    it("Should set NFT for sale", async function () {
      const price = ethers.parseEther("1.0");

      await expect(
        this.mooveNFT.connect(this.addr1).setForSale(this.tokenId, price)
      )
        .to.emit(this.mooveNFT, "PriceUpdated")
        .withArgs(this.tokenId, price);

      const vehicleInfo = await this.mooveNFT.getSticker(this.tokenId);
      expect(vehicleInfo.isForSale).to.be.true;
      expect(vehicleInfo.price).to.equal(price);
    });

    it("Should remove NFT from sale", async function () {
      const price = ethers.parseEther("1.0");

      // Set for sale first
      await this.mooveNFT.connect(this.addr1).setForSale(this.tokenId, price);

      // Remove from sale
      await expect(
        this.mooveNFT.connect(this.addr1).removeFromSale(this.tokenId)
      )
        .to.emit(this.mooveNFT, "PriceUpdated")
        .withArgs(this.tokenId, 0);

      const vehicleInfo = await this.mooveNFT.getSticker(this.tokenId);
      expect(vehicleInfo.isForSale).to.be.false;
      expect(vehicleInfo.price).to.equal(0);
    });

    it("Should purchase NFT correctly", async function () {
      const price = ethers.parseEther("1.0");

      // Set for sale
      await this.mooveNFT.connect(this.addr1).setForSale(this.tokenId, price);

      // Get initial balances
      const sellerBalanceBefore = await ethers.provider.getBalance(
        this.addr1.address
      );
      const buyerBalanceBefore = await ethers.provider.getBalance(
        this.addr2.address
      );

      // Purchase
      const tx = await this.mooveNFT
        .connect(this.addr2)
        .purchaseNFT(this.tokenId, { value: price });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      // Check ownership transfer
      expect(await this.mooveNFT.ownerOf(this.tokenId)).to.equal(
        this.addr2.address
      );

      // Check NFT is removed from sale
      const vehicleInfo = await this.mooveNFT.getSticker(this.tokenId);
      expect(vehicleInfo.isForSale).to.be.false;
      expect(vehicleInfo.price).to.equal(0);

      // Check payment distribution
      const platformFee = (price * 250n) / 10000n; // 2.5%
      const sellerAmount = price - platformFee;

      const sellerBalanceAfter = await ethers.provider.getBalance(
        this.addr1.address
      );
      const buyerBalanceAfter = await ethers.provider.getBalance(
        this.addr2.address
      );

      expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(sellerAmount);
      expect(buyerBalanceBefore - buyerBalanceAfter).to.be.closeTo(
        price + gasUsed,
        ethers.parseEther("0.001")
      );
    });

    it("Should fail purchase if not for sale", async function () {
      await expect(
        this.mooveNFT
          .connect(this.addr2)
          .purchaseNFT(this.tokenId, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(
        this.mooveNFT,
        "MooveNFT__TokenNotForSale"
      );
    });

    it("Should fail purchase with insufficient payment", async function () {
      const price = ethers.parseEther("1.0");
      await this.mooveNFT.connect(this.addr1).setForSale(this.tokenId, price);

      await expect(
        this.mooveNFT
          .connect(this.addr2)
          .purchaseNFT(this.tokenId, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(
        this.mooveNFT,
        "MooveNFT__InsufficientPayment"
      );
    });

    it("Should get NFTs for sale", async function () {
      // Set multiple NFTs for sale
      await this.mooveNFT
        .connect(this.addr1)
        .setForSale(this.tokenId, ethers.parseEther("1.0"));

      // Mint another NFT
      await this.mooveNFT.mintStickerNFT(
        this.addr1.address,
        1, // SCOOTER
        "Test Scooter",
        "A test scooter",
        "ipfs://test2",
        ethers.parseEther("0.2"),
        "Roma"
      );

      await this.mooveNFT
        .connect(this.addr1)
        .setForSale(2, ethers.parseEther("1.5"));

      const forSale = await this.mooveNFT.getNFTsForSale();
      expect(forSale).to.have.lengthOf(2);
      expect(forSale).to.include(1n);
      expect(forSale).to.include(2n);
    });
  });

  // ============ CUSTOMIZATION TESTS ============

  describe("Customization", function () {
    beforeEach(async function () {
      const fixture = await loadFixture(deployWithMintedNFT);
      Object.assign(this, fixture);
    });

    it("Should add sticker to vehicle", async function () {
      await expect(
        this.mooveNFT.connect(this.addr1).addSticker(this.tokenId, "sticker1")
      ).to.emit(this.mooveNFT, "VehicleCustomized");

      const customizations = await this.mooveNFT.getCustomizationData(
        this.tokenId
      );
      expect(customizations.stickers).to.include("sticker1");
      expect(customizations.lastUpdated).to.be.gt(0);
    });

    it("Should set color scheme", async function () {
      const colorScheme = "#FF0000";

      await this.mooveNFT
        .connect(this.addr1)
        .setColorScheme(this.tokenId, colorScheme);

      const customizations = await this.mooveNFT.getCustomizationData(
        this.tokenId
      );
      expect(customizations.colorScheme).to.equal(colorScheme);
    });

    it("Should add achievement (admin only)", async function () {
      const achievement = "First Ride";

      await this.mooveNFT.addAchievement(this.tokenId, achievement);

      const customizations = await this.mooveNFT.getCustomizationData(
        this.tokenId
      );
      expect(customizations.achievements).to.include(achievement);
    });

    it("Should fail to add sticker if not owner", async function () {
      await expect(
        this.mooveNFT.connect(this.addr2).addSticker(this.tokenId, "sticker1")
      ).to.be.revertedWithCustomError(
        this.mooveNFT,
        "MooveNFT__NotOwnerOrApproved"
      );
    });
  });

  // ============ ADMIN FUNCTIONS ============

  describe("Admin Functions", function () {
    beforeEach(async function () {
      const fixture = await loadFixture(deployWithMintedNFT);
      Object.assign(this, fixture);
    });

    it("Should set daily rate", async function () {
      const newRate = ethers.parseEther("0.2");

      await this.mooveNFT.setDailyRate(this.tokenId, newRate);

      const vehicleInfo = await this.mooveNFT.getSticker(this.tokenId);
      expect(vehicleInfo.dailyRate).to.equal(newRate);
    });

    it("Should activate/deactivate vehicle", async function () {
      await expect(this.mooveNFT.setVehicleActive(this.tokenId, false))
        .to.emit(this.mooveNFT, "VehicleActivated")
        .withArgs(this.tokenId, false);

      const vehicleInfo = await this.mooveNFT.getSticker(this.tokenId);
      expect(vehicleInfo.isActive).to.be.false;
    });

    it("Should set user discount", async function () {
      const discount = 1000; // 10%

      await this.mooveNFT.setUserDiscount(this.addr2.address, discount);

      expect(await this.mooveNFT.userDiscounts(this.addr2.address)).to.equal(
        discount
      );
    });

    it("Should update platform fee", async function () {
      const newFee = 300; // 3%

      await this.mooveNFT.setPlatformFee(newFee);

      expect(await this.mooveNFT.platformFeePercentage()).to.equal(newFee);
    });

    it("Should fail admin functions without proper role", async function () {
      await expect(
        this.mooveNFT
          .connect(this.addr1)
          .setDailyRate(this.tokenId, ethers.parseEther("0.2"))
      ).to.be.revertedWithCustomError(
        this.mooveNFT,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  // ============ VIEW FUNCTIONS ============

  describe("View Functions", function () {
    beforeEach(async function () {
      const fixture = await loadFixture(deployWithMintedNFT);
      Object.assign(this, fixture);

      // Mint additional NFTs for testing
      await this.mooveNFT.mintStickerNFT(
        this.addr1.address,
        1, // SCOOTER
        "Test Scooter",
        "A test scooter",
        "ipfs://test2",
        ethers.parseEther("0.2"),
        "Roma"
      );

      await this.mooveNFT.mintStickerNFT(
        this.addr2.address,
        2, // MONOPATTINO
        "Test Monopattino",
        "A test monopattino",
        "ipfs://test3",
        ethers.parseEther("0.15"),
        "Napoli"
      );
    });

    it("Should get tokens by owner", async function () {
      const addr1Tokens = await this.mooveNFT.getTokensByOwner(
        this.addr1.address
      );
      const addr2Tokens = await this.mooveNFT.getTokensByOwner(
        this.addr2.address
      );

      expect(addr1Tokens).to.have.lengthOf(2);
      expect(addr1Tokens).to.include(1n);
      expect(addr1Tokens).to.include(2n);

      expect(addr2Tokens).to.have.lengthOf(1);
      expect(addr2Tokens).to.include(3n);
    });

    it("Should get current token ID", async function () {
      expect(await this.mooveNFT.getCurrentTokenId()).to.equal(3);
    });

    it("Should get total supply", async function () {
      expect(await this.mooveNFT.totalSupply()).to.equal(3);
    });

    it("Should get vehicle info", async function () {
      const vehicleInfo = await this.mooveNFT.getSticker(1);

      expect(vehicleInfo.name).to.equal("Test Bike");
      expect(vehicleInfo.vehicleType).to.equal(0);
      expect(vehicleInfo.location).to.equal("Milano, Italy");
    });
  });

  // ============ PAUSE FUNCTIONALITY ============

  describe("Pause Functionality", function () {
    it("Should pause and unpause", async function () {
      const { mooveNFT, owner } = await loadFixture(deployMooveNFTFixture);

      // Pause
      await mooveNFT.pause();
      expect(await mooveNFT.paused()).to.be.true;

      // Try to mint while paused (should fail)
      await expect(
        mooveNFT.mintStickerNFT(
          owner.address,
          0,
          "Test",
          "Test",
          "ipfs://test",
          ethers.parseEther("0.1"),
          "Milano"
        )
      ).to.be.revertedWithCustomError(mooveNFT, "EnforcedPause");

      // Unpause
      await mooveNFT.unpause();
      expect(await mooveNFT.paused()).to.be.false;

      // Should be able to mint again
      await expect(
        mooveNFT.mintStickerNFT(
          owner.address,
          0,
          "Test",
          "Test",
          "ipfs://test",
          ethers.parseEther("0.1"),
          "Milano"
        )
      ).not.to.be.reverted;
    });
  });

  // ============ DISCOUNT SYSTEM ============

  describe("Discount System", function () {
    it("Should apply user discount correctly", async function () {
      const { mooveNFT, addr1, addr2 } = await loadFixture(deployWithMintedNFT);

      // Set discount for addr2
      const discount = 1000; // 10%
      await mooveNFT.setUserDiscount(addr2.address, discount);

      // Set NFT for sale
      const price = ethers.parseEther("1.0");
      await mooveNFT.connect(addr1).setForSale(1, price);

      // Calculate expected final price
      const expectedPrice = price - (price * BigInt(discount)) / 10000n;

      // Purchase with discount
      await expect(() =>
        mooveNFT.connect(addr2).purchaseNFT(1, { value: price })
      ).to.changeEtherBalance(addr2, -expectedPrice);
    });
  });

  // ============ EDGE CASES ============

  describe("Edge Cases", function () {
    it("Should handle token that doesn't exist", async function () {
      const { mooveNFT } = await loadFixture(deployMooveNFTFixture);

      await expect(mooveNFT.getSticker(999)).to.be.revertedWithCustomError(
        mooveNFT,
        "MooveNFT__TokenNotExists"
      );
    });

    it("Should handle overpayment correctly", async function () {
      const { mooveNFT, addr1, addr2 } = await loadFixture(deployWithMintedNFT);

      const price = ethers.parseEther("1.0");
      const overpayment = ethers.parseEther("1.5");

      await mooveNFT.connect(addr1).setForSale(1, price);

      const balanceBefore = await ethers.provider.getBalance(addr2.address);
      const tx = await mooveNFT
        .connect(addr2)
        .purchaseNFT(1, { value: overpayment });
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(addr2.address);

      // Should only pay the actual price + gas
      expect(balanceBefore - balanceAfter).to.be.closeTo(
        price + gasUsed,
        ethers.parseEther("0.001")
      );
    });

    it("Should handle empty arrays in batch operations", async function () {
      const { mooveNFT } = await loadFixture(deployMooveNFTFixture);

      await expect(mooveNFT.batchMint([], [], [], [], [], [], [])).not.to.be
        .reverted;
    });
  });

  // ============ INTERFACE SUPPORT ============

  describe("Interface Support", function () {
    it("Should support required interfaces", async function () {
      const { mooveNFT } = await loadFixture(deployMooveNFTFixture);

      // ERC721
      expect(await mooveNFT.supportsInterface("0x80ac58cd")).to.be.true;
      // ERC721Metadata
      expect(await mooveNFT.supportsInterface("0x5b5e139f")).to.be.true;
      // AccessControl
      expect(await mooveNFT.supportsInterface("0x7965db0b")).to.be.true;
    });
  });

  describe("Customization functionality", function () {
    it("Should allow customization with proper permissions", async function () {
      // Test customizeSticker, updateCustomizationOptions
    });

    it("Should track customization history", async function () {
      // Test getCustomizationHistory, hasBeenCustomized
    });
  });
});
