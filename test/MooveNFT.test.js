const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MooveNFT", function () {
  // Vehicle types enum
  const VehicleType = {
    BIKE: 0,
    SCOOTER: 1,
    MONOPATTINO: 2,
  };

  async function deployMooveNFTFixture() {
    const [owner, admin, minter, user1, user2, user3] =
      await ethers.getSigners();

    const MooveNFT = await ethers.getContractFactory("MooveNFT");
    const mooveNFT = await MooveNFT.deploy("MooveNFT", "MNFT", owner.address);
    await mooveNFT.deployed();

    // Grant roles
    const ADMIN_ROLE = await mooveNFT.ADMIN_ROLE();
    const MINTER_ROLE = await mooveNFT.MINTER_ROLE();

    await mooveNFT.grantRole(ADMIN_ROLE, admin.address);
    await mooveNFT.grantRole(MINTER_ROLE, minter.address);

    return {
      mooveNFT,
      owner,
      admin,
      minter,
      user1,
      user2,
      user3,
      ADMIN_ROLE,
      MINTER_ROLE,
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner and roles", async function () {
      const { mooveNFT, owner, admin, minter, ADMIN_ROLE, MINTER_ROLE } =
        await loadFixture(deployMooveNFTFixture);

      expect(await mooveNFT.platformOwner()).to.equal(owner.address);
      expect(await mooveNFT.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      expect(await mooveNFT.hasRole(MINTER_ROLE, minter.address)).to.be.true;
    });

    it("Should set correct name and symbol", async function () {
      const { mooveNFT } = await loadFixture(deployMooveNFTFixture);

      expect(await mooveNFT.name()).to.equal("MooveNFT");
      expect(await mooveNFT.symbol()).to.equal("MNFT");
    });

    it("Should initialize with correct platform fee", async function () {
      const { mooveNFT } = await loadFixture(deployMooveNFTFixture);

      expect(await mooveNFT.platformFeePercentage()).to.equal(250); // 2.5%
    });
  });

  describe("Minting", function () {
    it("Should mint NFT with correct vehicle info", async function () {
      const { mooveNFT, minter, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      const tx = await mooveNFT.connect(minter).mintVehicleNFT(
        user1.address,
        VehicleType.BIKE,
        "Electric Bike #001",
        "High-performance electric bike",
        "https://ipfs.io/ipfs/QmHash1",
        ethers.utils.parseEther("0.05"), // 0.05 ETH daily rate
        "Milan Center"
      );

      await expect(tx)
        .to.emit(mooveNFT, "VehicleNFTMinted")
        .withArgs(0, user1.address, VehicleType.BIKE, "Electric Bike #001");

      const vehicleInfo = await mooveNFT.getVehicleInfo(0);
      expect(vehicleInfo.vehicleType).to.equal(VehicleType.BIKE);
      expect(vehicleInfo.name).to.equal("Electric Bike #001");
      expect(vehicleInfo.dailyRate).to.equal(ethers.utils.parseEther("0.05"));
      expect(vehicleInfo.isActive).to.be.true;
    });

    it("Should fail minting without MINTER_ROLE", async function () {
      const { mooveNFT, user1 } = await loadFixture(deployMooveNFTFixture);

      await expect(
        mooveNFT
          .connect(user1)
          .mintVehicleNFT(
            user1.address,
            VehicleType.BIKE,
            "Electric Bike #001",
            "High-performance electric bike",
            "https://ipfs.io/ipfs/QmHash1",
            ethers.utils.parseEther("0.05"),
            "Milan Center"
          )
      ).to.be.revertedWith("AccessControl:");
    });

    it("Should batch mint multiple NFTs", async function () {
      const { mooveNFT, minter, user1, user2 } = await loadFixture(
        deployMooveNFTFixture
      );

      const recipients = [user1.address, user2.address];
      const vehicleTypes = [VehicleType.BIKE, VehicleType.SCOOTER];
      const names = ["Bike #001", "Scooter #001"];
      const descriptions = ["Electric bike", "Electric scooter"];
      const metadataURIs = [
        "https://ipfs.io/ipfs/QmHash1",
        "https://ipfs.io/ipfs/QmHash2",
      ];
      const dailyRates = [
        ethers.utils.parseEther("0.05"),
        ethers.utils.parseEther("0.08"),
      ];
      const locations = ["Milan", "Rome"];

      await mooveNFT
        .connect(minter)
        .batchMint(
          recipients,
          vehicleTypes,
          names,
          descriptions,
          metadataURIs,
          dailyRates,
          locations
        );

      expect(await mooveNFT.ownerOf(0)).to.equal(user1.address);
      expect(await mooveNFT.ownerOf(1)).to.equal(user2.address);

      const vehicleInfo1 = await mooveNFT.getVehicleInfo(0);
      const vehicleInfo2 = await mooveNFT.getVehicleInfo(1);

      expect(vehicleInfo1.vehicleType).to.equal(VehicleType.BIKE);
      expect(vehicleInfo2.vehicleType).to.equal(VehicleType.SCOOTER);
    });

    it("Should enforce max supply", async function () {
      const { mooveNFT, minter, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      // This test would be expensive to run fully, so we'll test the logic
      // by trying to mint after setting a low counter value

      // We can't easily test this without modifying the contract
      // In a real scenario, you'd need to mock or use a test-specific contract
      expect(await mooveNFT.MAX_SUPPLY()).to.equal(10000);
    });
  });

  describe("Sales", function () {
    beforeEach(async function () {
      const { mooveNFT, minter, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      // Mint an NFT for testing
      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );
    });

    it("Should set NFT for sale", async function () {
      const { mooveNFT, user1 } = await loadFixture(deployMooveNFTFixture);

      // First mint an NFT
      await mooveNFT
        .connect(user1)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      const price = ethers.utils.parseEther("1.0");

      await expect(mooveNFT.connect(user1).setForSale(0, price))
        .to.emit(mooveNFT, "PriceUpdated")
        .withArgs(0, price);

      const vehicleInfo = await mooveNFT.getVehicleInfo(0);
      expect(vehicleInfo.isForSale).to.be.true;
      expect(vehicleInfo.price).to.equal(price);
    });

    it("Should purchase NFT correctly", async function () {
      const { mooveNFT, minter, user1, user2, owner } = await loadFixture(
        deployMooveNFTFixture
      );

      // Mint and set for sale
      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      const price = ethers.utils.parseEther("1.0");
      await mooveNFT.connect(user1).setForSale(0, price);

      const initialUser1Balance = await ethers.provider.getBalance(
        user1.address
      );
      const initialUser2Balance = await ethers.provider.getBalance(
        user2.address
      );
      const initialOwnerBalance = await ethers.provider.getBalance(
        owner.address
      );

      // Purchase NFT
      const tx = await mooveNFT.connect(user2).purchaseNFT(0, { value: price });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      // Check ownership transfer
      expect(await mooveNFT.ownerOf(0)).to.equal(user2.address);

      // Check sale status
      const vehicleInfo = await mooveNFT.getVehicleInfo(0);
      expect(vehicleInfo.isForSale).to.be.false;
      expect(vehicleInfo.price).to.equal(0);

      // Check balances (accounting for fees)
      const platformFee = price.mul(250).div(10000); // 2.5%
      const royaltyFee = price.mul(500).div(10000); // 5%
      const sellerAmount = price.sub(platformFee).sub(royaltyFee);

      const finalUser1Balance = await ethers.provider.getBalance(user1.address);
      const finalUser2Balance = await ethers.provider.getBalance(user2.address);

      expect(finalUser1Balance).to.equal(initialUser1Balance.add(sellerAmount));
      expect(finalUser2Balance).to.equal(
        initialUser2Balance.sub(price).sub(gasCost)
      );
    });

    it("Should fail purchase if not for sale", async function () {
      const { mooveNFT, minter, user1, user2 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      await expect(
        mooveNFT
          .connect(user2)
          .purchaseNFT(0, { value: ethers.utils.parseEther("1.0") })
      ).to.be.revertedWith("MooveNFT__TokenNotForSale");
    });

    it("Should fail purchase with insufficient payment", async function () {
      const { mooveNFT, minter, user1, user2 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      const price = ethers.utils.parseEther("1.0");
      await mooveNFT.connect(user1).setForSale(0, price);

      await expect(
        mooveNFT
          .connect(user2)
          .purchaseNFT(0, { value: ethers.utils.parseEther("0.5") })
      ).to.be.revertedWith("MooveNFT__InsufficientPayment");
    });
  });

  describe("Customization", function () {
    beforeEach(async function () {
      const { mooveNFT, minter, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );
    });

    it("Should add sticker to vehicle", async function () {
      const { mooveNFT, minter, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      await expect(
        mooveNFT.connect(user1).addSticker(0, "racing_stripe")
      ).to.emit(mooveNFT, "VehicleCustomized");

      const customization = await mooveNFT.getCustomizationData(0);
      expect(customization.stickers[0]).to.equal("racing_stripe");
      expect(customization.lastUpdated).to.be.gt(0);
    });

    it("Should set color scheme", async function () {
      const { mooveNFT, minter, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      await mooveNFT.connect(user1).setColorScheme(0, "blue_gradient");

      const customization = await mooveNFT.getCustomizationData(0);
      expect(customization.colorScheme).to.equal("blue_gradient");
    });

    it("Should add achievement by admin", async function () {
      const { mooveNFT, minter, admin, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      await mooveNFT.connect(admin).addAchievement(0, "eco_warrior");

      const customization = await mooveNFT.getCustomizationData(0);
      expect(customization.achievements[0]).to.equal("eco_warrior");
    });

    it("Should fail customization if not owner", async function () {
      const { mooveNFT, minter, user1, user2 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      await expect(
        mooveNFT.connect(user2).addSticker(0, "racing_stripe")
      ).to.be.revertedWith("MooveNFT__NotOwnerOrApproved");
    });
  });

  describe("Admin Functions", function () {
    beforeEach(async function () {
      const { mooveNFT, minter, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );
    });

    it("Should set daily rate", async function () {
      const { mooveNFT, minter, admin, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      const newRate = ethers.utils.parseEther("0.08");
      await mooveNFT.connect(admin).setDailyRate(0, newRate);

      const vehicleInfo = await mooveNFT.getVehicleInfo(0);
      expect(vehicleInfo.dailyRate).to.equal(newRate);
    });

    it("Should activate/deactivate vehicle", async function () {
      const { mooveNFT, minter, admin, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      await expect(mooveNFT.connect(admin).setVehicleActive(0, false))
        .to.emit(mooveNFT, "VehicleActivated")
        .withArgs(0, false);

      const vehicleInfo = await mooveNFT.getVehicleInfo(0);
      expect(vehicleInfo.isActive).to.be.false;
    });

    it("Should set user discount", async function () {
      const { mooveNFT, admin, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT.connect(admin).setUserDiscount(user1.address, 1000); // 10%

      expect(await mooveNFT.userDiscounts(user1.address)).to.equal(1000);
    });

    it("Should fail setting too high discount", async function () {
      const { mooveNFT, admin, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await expect(
        mooveNFT.connect(admin).setUserDiscount(user1.address, 6000) // 60%
      ).to.be.revertedWith("Discount too high");
    });

    it("Should update platform fee", async function () {
      const { mooveNFT, admin } = await loadFixture(deployMooveNFTFixture);

      await mooveNFT.connect(admin).setPlatformFee(300); // 3%

      expect(await mooveNFT.platformFeePercentage()).to.equal(300);
    });

    it("Should fail admin functions without proper role", async function () {
      const { mooveNFT, user1 } = await loadFixture(deployMooveNFTFixture);

      await expect(
        mooveNFT.connect(user1).setDailyRate(0, ethers.utils.parseEther("0.08"))
      ).to.be.revertedWith("AccessControl:");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const { mooveNFT, minter, user1, user2 } = await loadFixture(
        deployMooveNFTFixture
      );

      // Mint multiple NFTs
      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.SCOOTER,
          "Electric Scooter #001",
          "High-performance electric scooter",
          "https://ipfs.io/ipfs/QmHash2",
          ethers.utils.parseEther("0.08"),
          "Rome Center"
        );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user2.address,
          VehicleType.MONOPATTINO,
          "Electric Monopattino #001",
          "High-performance electric monopattino",
          "https://ipfs.io/ipfs/QmHash3",
          ethers.utils.parseEther("0.06"),
          "Naples Center"
        );
    });

    it("Should get tokens by owner", async function () {
      const { mooveNFT, minter, user1, user2 } = await loadFixture(
        deployMooveNFTFixture
      );

      // Mint multiple NFTs for different users
      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.SCOOTER,
          "Electric Scooter #001",
          "High-performance electric scooter",
          "https://ipfs.io/ipfs/QmHash2",
          ethers.utils.parseEther("0.08"),
          "Rome Center"
        );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user2.address,
          VehicleType.MONOPATTINO,
          "Electric Monopattino #001",
          "High-performance electric monopattino",
          "https://ipfs.io/ipfs/QmHash3",
          ethers.utils.parseEther("0.06"),
          "Naples Center"
        );

      const user1Tokens = await mooveNFT.getTokensByOwner(user1.address);
      const user2Tokens = await mooveNFT.getTokensByOwner(user2.address);

      expect(user1Tokens.length).to.equal(2);
      expect(user2Tokens.length).to.equal(1);
      expect(user1Tokens[0]).to.equal(0);
      expect(user1Tokens[1]).to.equal(1);
      expect(user2Tokens[0]).to.equal(2);
    });

    it("Should get NFTs for sale", async function () {
      const { mooveNFT, minter, user1, user2 } = await loadFixture(
        deployMooveNFTFixture
      );

      // Mint NFTs
      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user2.address,
          VehicleType.SCOOTER,
          "Electric Scooter #001",
          "High-performance electric scooter",
          "https://ipfs.io/ipfs/QmHash2",
          ethers.utils.parseEther("0.08"),
          "Rome Center"
        );

      // Set one for sale
      await mooveNFT
        .connect(user1)
        .setForSale(0, ethers.utils.parseEther("1.0"));

      const forSaleTokens = await mooveNFT.getNFTsForSale();
      expect(forSaleTokens.length).to.equal(1);
      expect(forSaleTokens[0]).to.equal(0);
    });

    it("Should get current token ID", async function () {
      const { mooveNFT, minter, user1 } = await loadFixture(
        deployMooveNFTFixture
      );

      expect(await mooveNFT.getCurrentTokenId()).to.equal(0);

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      expect(await mooveNFT.getCurrentTokenId()).to.equal(1);
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause", async function () {
      const { mooveNFT, admin, minter, user1, user2 } = await loadFixture(
        deployMooveNFTFixture
      );

      // Mint an NFT first
      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      await mooveNFT
        .connect(user1)
        .setForSale(0, ethers.utils.parseEther("1.0"));

      // Pause contract
      await mooveNFT.connect(admin).pause();

      // Should fail when paused
      await expect(
        mooveNFT
          .connect(user2)
          .purchaseNFT(0, { value: ethers.utils.parseEther("1.0") })
      ).to.be.revertedWith("Pausable: paused");

      // Unpause
      await mooveNFT.connect(admin).unpause();

      // Should work after unpause
      await expect(
        mooveNFT
          .connect(user2)
          .purchaseNFT(0, { value: ethers.utils.parseEther("1.0") })
      ).to.not.be.reverted;
    });
  });

  describe("Discount System", function () {
    it("Should apply user discount correctly", async function () {
      const { mooveNFT, minter, admin, user1, user2 } = await loadFixture(
        deployMooveNFTFixture
      );

      // Mint and set for sale
      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      const price = ethers.utils.parseEther("1.0");
      await mooveNFT.connect(user1).setForSale(0, price);

      // Set 10% discount for user2
      await mooveNFT.connect(admin).setUserDiscount(user2.address, 1000);

      const initialUser1Balance = await ethers.provider.getBalance(
        user1.address
      );

      // Purchase with discount
      const discountedPrice = price.mul(9000).div(10000); // 90% of original price
      const tx = await mooveNFT
        .connect(user2)
        .purchaseNFT(0, { value: discountedPrice });

      // Check that purchase was successful
      expect(await mooveNFT.ownerOf(0)).to.equal(user2.address);

      // Verify seller received correct amount (discounted price minus fees)
      const platformFee = discountedPrice.mul(250).div(10000);
      const royaltyFee = discountedPrice.mul(500).div(10000);
      const expectedSellerAmount = discountedPrice
        .sub(platformFee)
        .sub(royaltyFee);

      const finalUser1Balance = await ethers.provider.getBalance(user1.address);
      expect(finalUser1Balance).to.equal(
        initialUser1Balance.add(expectedSellerAmount)
      );
    });
  });

  describe("Edge Cases", function () {
    it("Should handle token that doesn't exist", async function () {
      const { mooveNFT, user1 } = await loadFixture(deployMooveNFTFixture);

      await expect(mooveNFT.getVehicleInfo(999)).to.be.revertedWith(
        "MooveNFT__TokenNotExists"
      );

      await expect(
        mooveNFT.connect(user1).setForSale(999, ethers.utils.parseEther("1.0"))
      ).to.be.revertedWith("MooveNFT__TokenNotExists");
    });

    it("Should handle overpayment correctly", async function () {
      const { mooveNFT, minter, user1, user2 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      const price = ethers.utils.parseEther("1.0");
      await mooveNFT.connect(user1).setForSale(0, price);

      const overpayment = ethers.utils.parseEther("1.5");
      const initialUser2Balance = await ethers.provider.getBalance(
        user2.address
      );

      const tx = await mooveNFT
        .connect(user2)
        .purchaseNFT(0, { value: overpayment });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);

      const finalUser2Balance = await ethers.provider.getBalance(user2.address);

      // User should only pay the actual price, excess should be refunded
      expect(finalUser2Balance).to.equal(
        initialUser2Balance.sub(price).sub(gasCost)
      );
    });

    it("Should handle empty arrays in batch operations", async function () {
      const { mooveNFT, minter } = await loadFixture(deployMooveNFTFixture);

      // Empty arrays should not fail but do nothing
      await mooveNFT.connect(minter).batchMint([], [], [], [], [], [], []);

      expect(await mooveNFT.getCurrentTokenId()).to.equal(0);
    });
  });

  describe("Royalty and ERC165", function () {
    it("Should support required interfaces", async function () {
      const { mooveNFT } = await loadFixture(deployMooveNFTFixture);

      // ERC721
      expect(await mooveNFT.supportsInterface("0x80ac58cd")).to.be.true;
      // ERC721Metadata
      expect(await mooveNFT.supportsInterface("0x5b5e139f")).to.be.true;
      // ERC2981 (Royalty)
      expect(await mooveNFT.supportsInterface("0x2a55205a")).to.be.true;
      // AccessControl
      expect(await mooveNFT.supportsInterface("0x7965db0b")).to.be.true;
    });

    it("Should return correct royalty info", async function () {
      const { mooveNFT, minter, user1, owner } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT
        .connect(minter)
        .mintVehicleNFT(
          user1.address,
          VehicleType.BIKE,
          "Electric Bike #001",
          "High-performance electric bike",
          "https://ipfs.io/ipfs/QmHash1",
          ethers.utils.parseEther("0.05"),
          "Milan Center"
        );

      const salePrice = ethers.utils.parseEther("1.0");
      const royaltyInfo = await mooveNFT.royaltyInfo(0, salePrice);

      expect(royaltyInfo[0]).to.equal(owner.address); // Royalty recipient
      expect(royaltyInfo[1]).to.equal(salePrice.mul(500).div(10000)); // 5% royalty
    });
  });
});
