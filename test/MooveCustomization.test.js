const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("MooveCustomization", function () {
  let mooveCustomization, mooveNFT, accessControl;
  let owner, admin, user1, user2, user3;
  let mooveCustomizationAddress, mooveNFTAddress, accessControlAddress;

  // Enums
  const AESTHETIC = 0;
  const PERFORMANCE = 1;
  const SPECIAL = 2;
  const LIMITED_EDITION = 3;

  async function deployCustomizationFixture() {
    const [owner, admin, user1, user2, user3] = await ethers.getSigners();

    // Deploy MooveAccessControl
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

    // Deploy MooveCustomization
    const MooveCustomization = await ethers.getContractFactory(
      "MooveCustomization"
    );
    const mooveCustomization = await MooveCustomization.deploy(
      await mooveNFT.getAddress(),
      admin.address
    );
    await mooveCustomization.waitForDeployment();

    const mooveCustomizationAddress = await mooveCustomization.getAddress();
    const mooveNFTAddress = await mooveNFT.getAddress();
    const accessControlAddress = await accessControl.getAddress();

    // Grant roles
    const CUSTOMIZATION_ADMIN_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("CUSTOMIZATION_ADMIN_ROLE")
    );
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    const MASTER_ADMIN_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("MASTER_ADMIN_ROLE")
    );
    const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));

    await accessControl.grantRole(CUSTOMIZATION_ADMIN_ROLE, admin.address);
    await accessControl.grantRole(MINTER_ROLE, admin.address);
    await accessControl.grantRole(MASTER_ADMIN_ROLE, admin.address);
    await accessControl.grantRole(PAUSER_ROLE, admin.address);

    // Authorize contracts
    await accessControl.authorizeContract(mooveNFTAddress);
    await accessControl.authorizeContract(mooveCustomizationAddress);

    return {
      mooveCustomization,
      mooveNFT,
      accessControl,
      mooveCustomizationAddress,
      mooveNFTAddress,
      accessControlAddress,
      owner,
      admin,
      user1,
      user2,
      user3,
    };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployCustomizationFixture);
    mooveCustomization = fixture.mooveCustomization;
    mooveNFT = fixture.mooveNFT;
    accessControl = fixture.accessControl;
    mooveCustomizationAddress = fixture.mooveCustomizationAddress;
    mooveNFTAddress = fixture.mooveNFTAddress;
    accessControlAddress = fixture.accessControlAddress;
    owner = fixture.owner;
    admin = fixture.admin;
    user1 = fixture.user1;
    user2 = fixture.user2;
    user3 = fixture.user3;
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await mooveCustomization.getAddress()).to.be.properAddress;
    });

    it("Should set MooveNFT address correctly", async function () {
      expect(await mooveCustomization.mooveNFT()).to.equal(mooveNFTAddress);
    });

    it("Should set admin roles correctly", async function () {
      const CUSTOMIZATION_ADMIN_ROLE = ethers.keccak256(
        ethers.toUtf8Bytes("CUSTOMIZATION_ADMIN_ROLE")
      );
      const PRICE_MANAGER_ROLE = ethers.keccak256(
        ethers.toUtf8Bytes("PRICE_MANAGER_ROLE")
      );

      expect(
        await mooveCustomization.hasRole(
          CUSTOMIZATION_ADMIN_ROLE,
          admin.address
        )
      ).to.be.true;
      expect(
        await mooveCustomization.hasRole(PRICE_MANAGER_ROLE, admin.address)
      ).to.be.true;
    });

    it("Should fail deployment with zero MooveNFT address", async function () {
      const MooveCustomization = await ethers.getContractFactory(
        "MooveCustomization"
      );
      await expect(
        MooveCustomization.deploy(ethers.ZeroAddress, admin.address)
      ).to.be.revertedWith("Invalid MooveNFT address");
    });

    it("Should fail deployment with zero admin address", async function () {
      const MooveCustomization = await ethers.getContractFactory(
        "MooveCustomization"
      );
      await expect(
        MooveCustomization.deploy(mooveNFTAddress, ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid admin address");
    });
  });

  describe("Customization Management", function () {
    it("Should create customization successfully", async function () {
      await expect(
        mooveCustomization
          .connect(admin)
          .createCustomization(
            "Test Customization",
            "A test customization",
            AESTHETIC,
            ethers.parseEther("0.1"),
            "ipfs://test",
            100
          )
      )
        .to.emit(mooveCustomization, "CustomizationCreated")
        .withArgs(1, "Test Customization", AESTHETIC, ethers.parseEther("0.1"));

      const customization = await mooveCustomization.getCustomization(1);
      expect(customization.name).to.equal("Test Customization");
      expect(customization.custType).to.equal(AESTHETIC);
      expect(customization.price).to.equal(ethers.parseEther("0.1"));
      expect(customization.isActive).to.be.true;
    });

    it("Should fail creating customization without admin role", async function () {
      await expect(
        mooveCustomization
          .connect(user1)
          .createCustomization(
            "Test Customization",
            "A test customization",
            AESTHETIC,
            ethers.parseEther("0.1"),
            "ipfs://test",
            100
          )
      ).to.be.reverted;
    });

    it("Should fail creating customization with empty name", async function () {
      await expect(
        mooveCustomization
          .connect(admin)
          .createCustomization(
            "",
            "A test customization",
            AESTHETIC,
            ethers.parseEther("0.1"),
            "ipfs://test",
            100
          )
      ).to.be.revertedWith("Name cannot be empty");
    });

    it("Should fail creating customization with empty description", async function () {
      await expect(
        mooveCustomization
          .connect(admin)
          .createCustomization(
            "Test Customization",
            "",
            AESTHETIC,
            ethers.parseEther("0.1"),
            "ipfs://test",
            100
          )
      ).to.be.revertedWith("Description cannot be empty");
    });

    it("Should fail creating customization with empty image URI", async function () {
      await expect(
        mooveCustomization
          .connect(admin)
          .createCustomization(
            "Test Customization",
            "A test customization",
            AESTHETIC,
            ethers.parseEther("0.1"),
            "",
            100
          )
      ).to.be.revertedWith("Image URI cannot be empty");
    });
  });

  describe("Customization Application", function () {
    let tokenId, customizationId;

    beforeEach(async function () {
      // Mint an NFT
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Vehicle",
        "A test vehicle",
        0, // VEHICLE_DECORATION
        0, // COMMON
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: true,
          allowSizeChange: true,
          allowEffectsChange: true,
          availableColors: ["red", "blue", "green"],
          maxTextLength: 50,
        },
        "ipfs://vehicle",
        user1.address,
        500
      );

      // Create a customization
      await mooveCustomization
        .connect(admin)
        .createCustomization(
          "Test Customization",
          "A test customization",
          AESTHETIC,
          ethers.parseEther("0.1"),
          "ipfs://test",
          100
        );

      tokenId = 0;
      customizationId = 1;
    });

    it("Should apply customization successfully", async function () {
      await expect(
        mooveCustomization
          .connect(user1)
          .applyCustomization(tokenId, customizationId, {
            value: ethers.parseEther("0.1"),
          })
      )
        .to.emit(mooveCustomization, "CustomizationApplied")
        .withArgs(
          tokenId,
          customizationId,
          user1.address,
          ethers.parseEther("0.1")
        );

      expect(
        await mooveCustomization.isCustomizationApplied(
          tokenId,
          customizationId
        )
      ).to.be.true;

      const vehicleCustomizations =
        await mooveCustomization.getVehicleCustomizations(tokenId);
      expect(vehicleCustomizations).to.include(BigInt(customizationId));
    });

    it("Should fail applying customization by non-owner", async function () {
      await expect(
        mooveCustomization
          .connect(user2)
          .applyCustomization(tokenId, customizationId, {
            value: ethers.parseEther("0.1"),
          })
      ).to.be.revertedWith("Not token owner");
    });

    it("Should fail applying non-existent customization", async function () {
      await expect(
        mooveCustomization.connect(user1).applyCustomization(tokenId, 999, {
          value: ethers.parseEther("0.1"),
        })
      ).to.be.revertedWith("Customization does not exist");
    });

    it("Should fail applying inactive customization", async function () {
      await mooveCustomization
        .connect(admin)
        .setCustomizationActive(customizationId, false);

      await expect(
        mooveCustomization
          .connect(user1)
          .applyCustomization(tokenId, customizationId, {
            value: ethers.parseEther("0.1"),
          })
      ).to.be.revertedWith("Customization not active");
    });

    it("Should fail applying customization with insufficient payment", async function () {
      await expect(
        mooveCustomization
          .connect(user1)
          .applyCustomization(tokenId, customizationId, {
            value: ethers.parseEther("0.05"),
          })
      ).to.be.revertedWith("Insufficient payment");
    });

    it("Should refund excess payment", async function () {
      const initialBalance = await ethers.provider.getBalance(user1.address);

      await mooveCustomization
        .connect(user1)
        .applyCustomization(tokenId, customizationId, {
          value: ethers.parseEther("0.2"), // Pay more than required
        });

      const finalBalance = await ethers.provider.getBalance(user1.address);
      // Should refund 0.1 ETH (0.2 - 0.1)
      expect(finalBalance).to.be.gt(initialBalance - ethers.parseEther("0.2"));
    });
  });

  describe("Customization Removal", function () {
    let tokenId, customizationId;

    beforeEach(async function () {
      // Mint an NFT
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Vehicle",
        "A test vehicle",
        0,
        0,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: true,
          allowSizeChange: true,
          allowEffectsChange: true,
          availableColors: ["red", "blue", "green"],
          maxTextLength: 50,
        },
        "ipfs://vehicle",
        user1.address,
        500
      );

      // Create and apply a customization
      await mooveCustomization
        .connect(admin)
        .createCustomization(
          "Test Customization",
          "A test customization",
          AESTHETIC,
          ethers.parseEther("0.1"),
          "ipfs://test",
          100
        );

      await mooveCustomization.connect(user1).applyCustomization(0, 1, {
        value: ethers.parseEther("0.1"),
      });

      tokenId = 0;
      customizationId = 1;
    });

    it("Should remove customization successfully", async function () {
      await expect(
        mooveCustomization
          .connect(user1)
          .removeCustomization(tokenId, customizationId)
      )
        .to.emit(mooveCustomization, "CustomizationRemoved")
        .withArgs(tokenId, customizationId, user1.address);

      expect(
        await mooveCustomization.isCustomizationApplied(
          tokenId,
          customizationId
        )
      ).to.be.false;
    });

    it("Should fail removing customization by non-owner", async function () {
      await expect(
        mooveCustomization
          .connect(user2)
          .removeCustomization(tokenId, customizationId)
      ).to.be.revertedWith("Not vehicle owner");
    });

    it("Should fail removing non-applied customization", async function () {
      await expect(
        mooveCustomization.connect(user1).removeCustomization(tokenId, 999)
      ).to.be.revertedWith("Customization not applied");
    });
  });

  describe("Performance Upgrades", function () {
    let tokenId;

    beforeEach(async function () {
      // Mint an NFT
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Vehicle",
        "A test vehicle",
        0,
        0,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: true,
          allowSizeChange: true,
          allowEffectsChange: true,
          availableColors: ["red", "blue", "green"],
          maxTextLength: 50,
        },
        "ipfs://vehicle",
        user1.address,
        500
      );

      tokenId = 0;
    });

    it("Should apply performance upgrade successfully", async function () {
      const upgrade = {
        speedBonus: 10,
        accelerationBonus: 5,
        handlingBonus: 8,
        durabilityBonus: 3,
      };

      const cost =
        upgrade.speedBonus +
        upgrade.accelerationBonus +
        upgrade.handlingBonus +
        upgrade.durabilityBonus;
      const costInEth = BigInt(cost) * ethers.parseEther("0.001");

      await expect(
        mooveCustomization
          .connect(user1)
          .applyPerformanceUpgrade(tokenId, upgrade, {
            value: costInEth,
          })
      ).to.not.be.reverted;

      const performance = await mooveCustomization.getVehiclePerformance(
        tokenId
      );
      expect(performance.speedBonus).to.equal(10);
      expect(performance.accelerationBonus).to.equal(5);
      expect(performance.handlingBonus).to.equal(8);
      expect(performance.durabilityBonus).to.equal(3);
    });

    it("Should fail applying performance upgrade by non-owner", async function () {
      const upgrade = {
        speedBonus: 10,
        accelerationBonus: 5,
        handlingBonus: 8,
        durabilityBonus: 3,
      };

      const cost =
        upgrade.speedBonus +
        upgrade.accelerationBonus +
        upgrade.handlingBonus +
        upgrade.durabilityBonus;
      const costInEth = BigInt(cost) * ethers.parseEther("0.001");

      await expect(
        mooveCustomization
          .connect(user2)
          .applyPerformanceUpgrade(tokenId, upgrade, {
            value: costInEth,
          })
      ).to.be.revertedWith("Not vehicle owner");
    });

    it("Should fail applying invalid performance upgrade", async function () {
      const upgrade = {
        speedBonus: 101, // Exceeds MAX_PERFORMANCE_BONUS
        accelerationBonus: 5,
        handlingBonus: 8,
        durabilityBonus: 3,
      };

      const cost =
        upgrade.speedBonus +
        upgrade.accelerationBonus +
        upgrade.handlingBonus +
        upgrade.durabilityBonus;
      const costInEth = BigInt(cost) * ethers.parseEther("0.001");

      await expect(
        mooveCustomization
          .connect(user1)
          .applyPerformanceUpgrade(tokenId, upgrade, {
            value: costInEth,
          })
      ).to.be.revertedWith("Invalid performance upgrade");
    });
  });

  describe("Aesthetic Customizations", function () {
    let tokenId;

    beforeEach(async function () {
      // Mint an NFT
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Vehicle",
        "A test vehicle",
        0,
        0,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: true,
          allowSizeChange: true,
          allowEffectsChange: true,
          availableColors: ["red", "blue", "green"],
          maxTextLength: 50,
        },
        "ipfs://vehicle",
        user1.address,
        500
      );

      tokenId = 0;
    });

    it("Should apply aesthetic customization successfully", async function () {
      const aesthetic = {
        colorCode: "#FF0000",
        skinId: 1,
        decalIds: [1, 2, 3],
        customURI: "ipfs://aesthetic",
      };

      const cost =
        ethers.parseEther("0.01") + // colorCode
        ethers.parseEther("0.02") + // skinId
        BigInt(3) * ethers.parseEther("0.005") + // decalIds
        ethers.parseEther("0.05"); // customURI

      await expect(
        mooveCustomization
          .connect(user1)
          .applyAestheticCustomization(tokenId, aesthetic, {
            value: cost,
          })
      ).to.not.be.reverted;

      const result = await mooveCustomization.getVehicleAesthetics(tokenId);
      expect(result.colorCode).to.equal("#FF0000");
      expect(result.skinId).to.equal(1);
      expect(result.decalIds).to.deep.equal([1, 2, 3]);
      expect(result.customURI).to.equal("ipfs://aesthetic");
    });

    it("Should fail applying aesthetic customization by non-owner", async function () {
      const aesthetic = {
        colorCode: "#FF0000",
        skinId: 1,
        decalIds: [1, 2, 3],
        customURI: "ipfs://aesthetic",
      };

      const cost =
        ethers.parseEther("0.01") +
        ethers.parseEther("0.02") +
        BigInt(3) * ethers.parseEther("0.005") +
        ethers.parseEther("0.05");

      await expect(
        mooveCustomization
          .connect(user2)
          .applyAestheticCustomization(tokenId, aesthetic, {
            value: cost,
          })
      ).to.be.revertedWith("Not vehicle owner");
    });
  });

  describe("Admin Functions", function () {
    let customizationId;

    beforeEach(async function () {
      // Create a customization
      await mooveCustomization
        .connect(admin)
        .createCustomization(
          "Test Customization",
          "A test customization",
          AESTHETIC,
          ethers.parseEther("0.1"),
          "ipfs://test",
          100
        );

      customizationId = 1;
    });

    it("Should update customization price", async function () {
      const newPrice = ethers.parseEther("0.2");
      await expect(
        mooveCustomization
          .connect(admin)
          .updateCustomizationPrice(customizationId, newPrice)
      )
        .to.emit(mooveCustomization, "CustomizationPriceUpdated")
        .withArgs(customizationId, ethers.parseEther("0.1"), newPrice);

      const customization = await mooveCustomization.getCustomization(
        customizationId
      );
      expect(customization.price).to.equal(newPrice);
    });

    it("Should fail updating price without PRICE_MANAGER_ROLE", async function () {
      await expect(
        mooveCustomization
          .connect(user1)
          .updateCustomizationPrice(customizationId, ethers.parseEther("0.2"))
      ).to.be.reverted;
    });

    it("Should set customization active status", async function () {
      await mooveCustomization
        .connect(admin)
        .setCustomizationActive(customizationId, false);

      const customization = await mooveCustomization.getCustomization(
        customizationId
      );
      expect(customization.isActive).to.be.false;
    });

    it("Should fail setting active status without CUSTOMIZATION_ADMIN_ROLE", async function () {
      await expect(
        mooveCustomization
          .connect(user1)
          .setCustomizationActive(customizationId, false)
      ).to.be.reverted;
    });

    it("Should update customization image", async function () {
      const newImageURI = "ipfs://new-image";
      await mooveCustomization
        .connect(admin)
        .updateCustomizationImage(customizationId, newImageURI);

      const customization = await mooveCustomization.getCustomization(
        customizationId
      );
      expect(customization.imageURI).to.equal(newImageURI);
    });

    it("Should fail updating image with empty URI", async function () {
      await expect(
        mooveCustomization
          .connect(admin)
          .updateCustomizationImage(customizationId, "")
      ).to.be.revertedWith("Image URI cannot be empty");
    });
  });

  describe("Query Functions", function () {
    beforeEach(async function () {
      // Create multiple customizations
      await mooveCustomization
        .connect(admin)
        .createCustomization(
          "Aesthetic Customization",
          "An aesthetic customization",
          AESTHETIC,
          ethers.parseEther("0.1"),
          "ipfs://aesthetic",
          100
        );

      await mooveCustomization
        .connect(admin)
        .createCustomization(
          "Performance Customization",
          "A performance customization",
          PERFORMANCE,
          ethers.parseEther("0.2"),
          "ipfs://performance",
          50
        );

      await mooveCustomization
        .connect(admin)
        .createCustomization(
          "Special Customization",
          "A special customization",
          SPECIAL,
          ethers.parseEther("0.3"),
          "ipfs://special",
          25
        );
    });

    it("Should get all active customizations", async function () {
      const customizations = await mooveCustomization.getActiveCustomizations();
      expect(customizations.length).to.equal(3);
      expect(customizations[0].name).to.equal("Aesthetic Customization");
      expect(customizations[1].name).to.equal("Performance Customization");
      expect(customizations[2].name).to.equal("Special Customization");
    });

    it("Should get customizations by type", async function () {
      const aestheticCustomizations =
        await mooveCustomization.getCustomizationsByType(AESTHETIC);
      expect(aestheticCustomizations.length).to.equal(1);
      expect(aestheticCustomizations[0].name).to.equal(
        "Aesthetic Customization"
      );

      const performanceCustomizations =
        await mooveCustomization.getCustomizationsByType(PERFORMANCE);
      expect(performanceCustomizations.length).to.equal(1);
      expect(performanceCustomizations[0].name).to.equal(
        "Performance Customization"
      );
    });

    it("Should calculate total cost for multiple customizations", async function () {
      const customizationIds = [1, 2, 3];
      const totalCost = await mooveCustomization.calculateTotalCost(
        customizationIds
      );
      expect(totalCost).to.equal(ethers.parseEther("0.6")); // 0.1 + 0.2 + 0.3
    });

    it("Should fail calculating cost for invalid customization ID", async function () {
      const customizationIds = [1, 999, 3];
      await expect(
        mooveCustomization.calculateTotalCost(customizationIds)
      ).to.be.revertedWith("Invalid customization ID");
    });
  });

  describe("Pause and Unpause", function () {
    it("Should pause and unpause by admin", async function () {
      await mooveCustomization.connect(admin).pause();
      expect(await mooveCustomization.paused()).to.be.true;

      await mooveCustomization.connect(admin).unpause();
      expect(await mooveCustomization.paused()).to.be.false;
    });

    it("Should fail pause by non-admin", async function () {
      await expect(mooveCustomization.connect(user1).pause()).to.be.reverted;
    });

    it("Should fail unpause by non-admin", async function () {
      await mooveCustomization.connect(admin).pause();
      await expect(mooveCustomization.connect(user1).unpause()).to.be.reverted;
    });

    it("Should prevent performance upgrades when paused", async function () {
      // Mint an NFT first
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Vehicle",
        "A test vehicle",
        0,
        0,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: true,
          allowSizeChange: true,
          allowEffectsChange: true,
          availableColors: ["red", "blue", "green"],
          maxTextLength: 50,
        },
        "ipfs://vehicle",
        user1.address,
        500
      );

      await mooveCustomization.connect(admin).pause();

      const upgrade = {
        speedBonus: 10,
        accelerationBonus: 5,
        handlingBonus: 8,
        durabilityBonus: 3,
      };

      const cost =
        upgrade.speedBonus +
        upgrade.accelerationBonus +
        upgrade.handlingBonus +
        upgrade.durabilityBonus;
      const costInEth = BigInt(cost) * ethers.parseEther("0.001");

      await expect(
        mooveCustomization.connect(user1).applyPerformanceUpgrade(0, upgrade, {
          value: costInEth,
        })
      ).to.be.reverted;
    });
  });

  describe("Withdraw Function", function () {
    beforeEach(async function () {
      // Send some ETH to the contract
      await user1.sendTransaction({
        to: await mooveCustomization.getAddress(),
        value: ethers.parseEther("1.0"),
      });
    });

    it("Should withdraw funds successfully", async function () {
      const initialBalance = await ethers.provider.getBalance(admin.address);
      const withdrawAmount = ethers.parseEther("0.5");

      await mooveCustomization
        .connect(admin)
        .withdraw(admin.address, withdrawAmount);

      const finalBalance = await ethers.provider.getBalance(admin.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should fail withdraw by non-admin", async function () {
      await expect(
        mooveCustomization
          .connect(user1)
          .withdraw(user1.address, ethers.parseEther("0.1"))
      ).to.be.reverted;
    });

    it("Should fail withdraw to zero address", async function () {
      await expect(
        mooveCustomization
          .connect(admin)
          .withdraw(ethers.ZeroAddress, ethers.parseEther("0.1"))
      ).to.be.revertedWith("Invalid recipient address");
    });

    it("Should fail withdraw to contract", async function () {
      await expect(
        mooveCustomization
          .connect(admin)
          .withdraw(mooveCustomizationAddress, ethers.parseEther("0.1"))
      ).to.be.revertedWith("Cannot withdraw to self");
    });

    it("Should fail withdraw zero amount", async function () {
      await expect(
        mooveCustomization.connect(admin).withdraw(admin.address, 0)
      ).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should fail withdraw more than balance", async function () {
      await expect(
        mooveCustomization
          .connect(admin)
          .withdraw(admin.address, ethers.parseEther("2.0"))
      ).to.be.revertedWith("Insufficient contract balance");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle maximum performance bonus", async function () {
      // Mint an NFT
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Vehicle",
        "A test vehicle",
        0,
        0,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: true,
          allowSizeChange: true,
          allowEffectsChange: true,
          availableColors: ["red", "blue", "green"],
          maxTextLength: 50,
        },
        "ipfs://vehicle",
        user1.address,
        500
      );

      // Create performance customization
      await mooveCustomization
        .connect(admin)
        .createCustomization(
          "Max Performance",
          "Maximum performance upgrade",
          PERFORMANCE,
          ethers.parseEther("0.1"),
          "ipfs://max",
          100
        );

      // Apply customization multiple times to reach max
      for (let i = 0; i < 20; i++) {
        // 20 * 5 = 100 (max)
        await mooveCustomization.connect(user1).applyCustomization(0, 1, {
          value: ethers.parseEther("0.1"),
        });
      }

      const performance = await mooveCustomization.getVehiclePerformance(0);
      expect(performance.speedBonus).to.equal(100);
      expect(performance.accelerationBonus).to.equal(100);
      expect(performance.handlingBonus).to.equal(100);
      expect(performance.durabilityBonus).to.equal(100);
    });

    it("Should handle empty aesthetic customization", async function () {
      // Mint an NFT
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Vehicle",
        "A test vehicle",
        0,
        0,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: true,
          allowSizeChange: true,
          allowEffectsChange: true,
          availableColors: ["red", "blue", "green"],
          maxTextLength: 50,
        },
        "ipfs://vehicle",
        user1.address,
        500
      );

      const aesthetic = {
        colorCode: "",
        skinId: 0,
        decalIds: [],
        customURI: "",
      };

      await expect(
        mooveCustomization
          .connect(user1)
          .applyAestheticCustomization(0, aesthetic, {
            value: 0,
          })
      ).to.be.revertedWith("Invalid aesthetic customization");
    });
  });
});
