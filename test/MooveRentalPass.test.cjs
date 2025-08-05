const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("MooveRentalPass", function () {
  // ============= ENUMS =============
  const VehicleType = {
    BIKE: 0,
    SCOOTER: 1,
    MONOPATTINO: 2,
  };

  // ============= FIXTURES =============
  async function deployRentalPassFixture() {
    const [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy MooveAccessControl first
    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );
    const accessControl = await MooveAccessControl.deploy(owner.address);
    await accessControl.waitForDeployment();

    // Deploy MooveRentalPass
    const MooveRentalPass = await ethers.getContractFactory("MooveRentalPass");
    const mooveRentalPass = await MooveRentalPass.deploy(
      await accessControl.getAddress()
    );
    await mooveRentalPass.waitForDeployment();

    // Grant MINTER_ROLE to owner for admin functions
    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await accessControl.grantRole(MINTER_ROLE, owner.address);

    // CRITICAL: Authorize the MooveRentalPass contract to call AccessControl functions
    await accessControl.authorizeContract(await mooveRentalPass.getAddress());

    return {
      mooveRentalPass,
      accessControl,
      owner,
      user1,
      user2,
      user3,
      MINTER_ROLE,
    };
  }

  async function deployWithMintedPass() {
    const fixture = await loadFixture(deployRentalPassFixture);
    const { mooveRentalPass, owner, user1 } = fixture;

    // Mint a rental pass for testing
    await mooveRentalPass
      .connect(owner)
      .mintRentalPass(
        user1.address,
        VehicleType.BIKE,
        "ACCESS123",
        "Milano",
        ethers.parseEther("0.025"),
        "ipfs://QmTestRentalPass123"
      );

    return { ...fixture, tokenId: 1 };
  }

  // ============= DEPLOYMENT TESTS =============
  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { mooveRentalPass, accessControl } = await loadFixture(
        deployRentalPassFixture
      );

      expect(await mooveRentalPass.getAddress()).to.be.properAddress;
      expect(await mooveRentalPass.accessControl()).to.equal(
        await accessControl.getAddress()
      );
    });

    it("Should set correct name and symbol", async function () {
      const { mooveRentalPass } = await loadFixture(deployRentalPassFixture);

      expect(await mooveRentalPass.name()).to.equal("Moove Rental Pass");
      expect(await mooveRentalPass.symbol()).to.equal("MRP");
    });

    it("Should initialize with zero total supply", async function () {
      const { mooveRentalPass } = await loadFixture(deployRentalPassFixture);

      expect(await mooveRentalPass.totalSupply()).to.equal(0);
    });
  });

  // ============= MINTING TESTS =============
  describe("Minting", function () {
    it("Should mint rental pass successfully", async function () {
      const { mooveRentalPass, owner, user1 } = await loadFixture(
        deployRentalPassFixture
      );

      await expect(
        mooveRentalPass
          .connect(owner)
          .mintRentalPass(
            user1.address,
            VehicleType.BIKE,
            "ACCESS123",
            "Milano",
            ethers.parseEther("0.025"),
            "ipfs://QmTestRentalPass123"
          )
      ).to.emit(mooveRentalPass, "RentalPassMinted");

      expect(await mooveRentalPass.balanceOf(user1.address)).to.equal(1);
      expect(await mooveRentalPass.totalSupply()).to.equal(1);
      expect(await mooveRentalPass.ownerOf(1)).to.equal(user1.address);
    });

    it("Should fail minting without MINTER_ROLE", async function () {
      const { mooveRentalPass, user1, user2 } = await loadFixture(
        deployRentalPassFixture
      );

      await expect(
        mooveRentalPass
          .connect(user1)
          .mintRentalPass(
            user2.address,
            VehicleType.BIKE,
            "ACCESS123",
            "Milano",
            ethers.parseEther("0.025"),
            "ipfs://QmTestRentalPass123"
          )
      ).to.be.revertedWith("Access denied");
    });

    it("Should prevent duplicate access codes", async function () {
      const { mooveRentalPass, owner, user1, user2 } = await loadFixture(
        deployRentalPassFixture
      );

      // Mint first pass
      await mooveRentalPass
        .connect(owner)
        .mintRentalPass(
          user1.address,
          VehicleType.BIKE,
          "ACCESS123",
          "Milano",
          ethers.parseEther("0.025"),
          "ipfs://QmTestRentalPass123"
        );

      // Try to mint with same access code
      await expect(
        mooveRentalPass.connect(owner).mintRentalPass(
          user2.address,
          VehicleType.SCOOTER,
          "ACCESS123", // Same access code
          "Roma",
          ethers.parseEther("0.035"),
          "ipfs://QmTestRentalPass456"
        )
      ).to.be.revertedWith("Access code already exists");
    });

    it("Should require valid parameters", async function () {
      const { mooveRentalPass, owner, user1 } = await loadFixture(
        deployRentalPassFixture
      );

      // Invalid recipient
      await expect(
        mooveRentalPass
          .connect(owner)
          .mintRentalPass(
            ethers.ZeroAddress,
            VehicleType.BIKE,
            "ACCESS123",
            "Milano",
            ethers.parseEther("0.025"),
            "ipfs://QmTestRentalPass123"
          )
      ).to.be.revertedWith("Invalid recipient address");

      // Empty access code
      await expect(
        mooveRentalPass
          .connect(owner)
          .mintRentalPass(
            user1.address,
            VehicleType.BIKE,
            "",
            "Milano",
            ethers.parseEther("0.025"),
            "ipfs://QmTestRentalPass123"
          )
      ).to.be.revertedWith("Access code required");

      // Empty location
      await expect(
        mooveRentalPass
          .connect(owner)
          .mintRentalPass(
            user1.address,
            VehicleType.BIKE,
            "ACCESS123",
            "",
            ethers.parseEther("0.025"),
            "ipfs://QmTestRentalPass123"
          )
      ).to.be.revertedWith("Location required");
    });

    it("Should batch mint multiple passes", async function () {
      const { mooveRentalPass, owner, user1, user2 } = await loadFixture(
        deployRentalPassFixture
      );

      const recipients = [user1.address, user2.address];
      const vehicleTypes = [VehicleType.BIKE, VehicleType.SCOOTER];
      const accessCodes = ["ACCESS123", "ACCESS456"];
      const locations = ["Milano", "Roma"];
      const prices = [ethers.parseEther("0.025"), ethers.parseEther("0.035")];
      const tokenURIs = ["ipfs://QmTest123", "ipfs://QmTest456"];

      await mooveRentalPass
        .connect(owner)
        .batchMintRentalPasses(
          recipients,
          vehicleTypes,
          accessCodes,
          locations,
          prices,
          tokenURIs
        );

      expect(await mooveRentalPass.balanceOf(user1.address)).to.equal(1);
      expect(await mooveRentalPass.balanceOf(user2.address)).to.equal(1);
      expect(await mooveRentalPass.totalSupply()).to.equal(2);
    });

    it("Should fail batch mint with mismatched arrays", async function () {
      const { mooveRentalPass, owner, user1 } = await loadFixture(
        deployRentalPassFixture
      );

      const recipients = [user1.address];
      const vehicleTypes = [VehicleType.BIKE, VehicleType.SCOOTER]; // Different length
      const accessCodes = ["ACCESS123"];
      const locations = ["Milano"];
      const prices = [ethers.parseEther("0.025")];
      const tokenURIs = ["ipfs://QmTest123"];

      await expect(
        mooveRentalPass
          .connect(owner)
          .batchMintRentalPasses(
            recipients,
            vehicleTypes,
            accessCodes,
            locations,
            prices,
            tokenURIs
          )
      ).to.be.revertedWith("Array length mismatch");
    });
  });

  // ============= RENTAL PASS MANAGEMENT =============
  describe("Rental Pass Management", function () {
    it("Should get rental pass details", async function () {
      const { mooveRentalPass, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      const rentalPass = await mooveRentalPass.getRentalPass(tokenId);

      expect(rentalPass.vehicleType).to.equal(VehicleType.BIKE);
      expect(rentalPass.accessCode).to.equal("ACCESS123");
      expect(rentalPass.location).to.equal("Milano");
      expect(rentalPass.purchasePrice).to.equal(ethers.parseEther("0.025"));
      expect(rentalPass.isActive).to.be.true;
      expect(rentalPass.expirationDate).to.be.greaterThan(0);
    });

    it("Should check if pass is expired", async function () {
      const { mooveRentalPass, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      // Initially not expired
      expect(await mooveRentalPass.isPassExpired(tokenId)).to.be.false;

      // Fast forward 31 days
      await time.increase(31 * 24 * 60 * 60);

      // Now should be expired
      expect(await mooveRentalPass.isPassExpired(tokenId)).to.be.true;
    });

    it("Should get token by access code", async function () {
      const { mooveRentalPass, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      const foundTokenId = await mooveRentalPass.getTokenByAccessCode(
        "ACCESS123"
      );
      expect(foundTokenId).to.equal(tokenId);
    });

    it("Should fail to get token for invalid access code", async function () {
      const { mooveRentalPass } = await loadFixture(deployWithMintedPass);

      await expect(
        mooveRentalPass.getTokenByAccessCode("INVALID")
      ).to.be.revertedWith("Access code not found");
    });

    it("Should get user active passes", async function () {
      const { mooveRentalPass, owner, user1 } = await loadFixture(
        deployWithMintedPass
      );

      // Mint another pass for the same user
      await mooveRentalPass
        .connect(owner)
        .mintRentalPass(
          user1.address,
          VehicleType.SCOOTER,
          "ACCESS456",
          "Roma",
          ethers.parseEther("0.035"),
          "ipfs://QmTestRentalPass456"
        );

      const activePasses = await mooveRentalPass.getUserActivePasses(
        user1.address
      );
      expect(activePasses.length).to.equal(2);
      expect(activePasses).to.include(1n);
      expect(activePasses).to.include(2n);
    });

    it("Should get passes expiring soon", async function () {
      const { mooveRentalPass, owner, user1 } = await loadFixture(
        deployRentalPassFixture
      );

      // Mint a pass that will expire soon
      await mooveRentalPass
        .connect(owner)
        .mintRentalPass(
          user1.address,
          VehicleType.BIKE,
          "ACCESS123",
          "Milano",
          ethers.parseEther("0.025"),
          "ipfs://QmTestRentalPass123"
        );

      // Fast forward to near expiration (29.5 days)
      await time.increase(29.5 * 24 * 60 * 60);

      const expiringSoon = await mooveRentalPass.getPassesExpiringSoon(
        user1.address
      );
      expect(expiringSoon.length).to.equal(1);
      expect(expiringSoon[0]).to.equal(1);
    });
  });

  // ============= ACCESS CODE VALIDATION =============
  describe("Access Code Validation", function () {
    it("Should validate and use access code", async function () {
      const { mooveRentalPass, owner, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      await expect(
        mooveRentalPass.connect(owner).validateAndUseAccessCode("ACCESS123")
      ).to.not.be.reverted;

      // Verify the pass was used
      const rentalPass = await mooveRentalPass.getRentalPass(tokenId);
      expect(rentalPass.isActive).to.be.true;
    });

    it("Should check if access code is valid", async function () {
      const { mooveRentalPass, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      const result = await mooveRentalPass.isAccessCodeValid("ACCESS123");

      expect(result.valid).to.be.true;
      expect(result.tokenId).to.equal(tokenId);
      expect(result.expirationDate).to.be.greaterThan(0);
    });

    it("Should return false for invalid access code", async function () {
      const { mooveRentalPass } = await loadFixture(deployWithMintedPass);

      const result = await mooveRentalPass.isAccessCodeValid("INVALID");

      expect(result.valid).to.be.false;
      expect(result.tokenId).to.equal(0);
      expect(result.expirationDate).to.equal(0);
    });

    it("Should return false for expired pass", async function () {
      const { mooveRentalPass } = await loadFixture(deployWithMintedPass);

      // Fast forward past expiration
      await time.increase(31 * 24 * 60 * 60);

      const result = await mooveRentalPass.isAccessCodeValid("ACCESS123");
      expect(result.valid).to.be.false;
    });

    it("Should fail validation without proper role", async function () {
      const { mooveRentalPass, user1 } = await loadFixture(
        deployWithMintedPass
      );

      await expect(
        mooveRentalPass.connect(user1).validateAndUseAccessCode("ACCESS123")
      ).to.be.revertedWith("Access denied");
    });
  });

  // ============= ADMIN FUNCTIONS =============
  describe("Admin Functions", function () {
    it("Should deactivate pass", async function () {
      const { mooveRentalPass, owner, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      await expect(
        mooveRentalPass.connect(owner).deactivatePass(tokenId, "Violation")
      ).to.emit(mooveRentalPass, "PassDeactivated");

      const rentalPass = await mooveRentalPass.getRentalPass(tokenId);
      expect(rentalPass.isActive).to.be.false;
    });

    it("Should cleanup expired passes", async function () {
      const { mooveRentalPass, owner, user1, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      // Fast forward past expiration
      await time.increase(31 * 24 * 60 * 60);

      await expect(mooveRentalPass.cleanupExpiredPasses([tokenId])).to.emit(
        mooveRentalPass,
        "PassExpired"
      );

      const rentalPass = await mooveRentalPass.getRentalPass(tokenId);
      expect(rentalPass.isActive).to.be.false;
    });

    it("Should fail admin functions without proper role", async function () {
      const { mooveRentalPass, user1, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      await expect(
        mooveRentalPass.connect(user1).deactivatePass(tokenId, "Violation")
      ).to.be.revertedWith("Access denied");
    });

    it("Should pause and unpause contract", async function () {
      const { mooveRentalPass, owner, user1 } = await loadFixture(
        deployRentalPassFixture
      );

      // Pause contract
      await mooveRentalPass.connect(owner).pause();

      // Check that contract is paused
      expect(await mooveRentalPass.paused()).to.be.true;

      // Unpause
      await mooveRentalPass.connect(owner).unpause();

      // Should work again
      await expect(
        mooveRentalPass
          .connect(owner)
          .mintRentalPass(
            user1.address,
            VehicleType.BIKE,
            "ACCESS123",
            "Milano",
            ethers.parseEther("0.025"),
            "ipfs://QmTestRentalPass123"
          )
      ).to.not.be.reverted;
    });
  });

  // ============= NON-TRANSFERABLE FUNCTIONALITY =============
  describe("Non-transferable Functionality", function () {
    it("Should prevent transfers", async function () {
      const { mooveRentalPass, user1, user2, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      await expect(
        mooveRentalPass
          .connect(user1)
          .transferFrom(user1.address, user2.address, tokenId)
      ).to.be.revertedWith("Rental passes are non-transferable");
    });

    it("Should prevent safe transfers", async function () {
      const { mooveRentalPass, user1, user2, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      await expect(
        mooveRentalPass
          .connect(user1)
          ["safeTransferFrom(address,address,uint256)"](
            user1.address,
            user2.address,
            tokenId
          )
      ).to.be.revertedWith("Rental passes are non-transferable");
    });

    it("Should prevent approvals", async function () {
      const { mooveRentalPass, user1, user2, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      // Approve should work (not overridden)
      await expect(
        mooveRentalPass.connect(user1).approve(user2.address, tokenId)
      ).to.not.be.reverted;
    });

    it("Should prevent approval for all", async function () {
      const { mooveRentalPass, user1, user2 } = await loadFixture(
        deployWithMintedPass
      );

      // setApprovalForAll should work (not overridden)
      await expect(
        mooveRentalPass.connect(user1).setApprovalForAll(user2.address, true)
      ).to.not.be.reverted;
    });

    it("Should allow minting (zero address transfers)", async function () {
      const { mooveRentalPass, owner, user1 } = await loadFixture(
        deployRentalPassFixture
      );

      // Minting should work (from zero address)
      await expect(
        mooveRentalPass
          .connect(owner)
          .mintRentalPass(
            user1.address,
            VehicleType.BIKE,
            "ACCESS123",
            "Milano",
            ethers.parseEther("0.025"),
            "ipfs://QmTestRentalPass123"
          )
      ).to.not.be.reverted;
    });
  });

  // ============= EDGE CASES =============
  describe("Edge Cases", function () {
    it("Should handle non-existent token queries", async function () {
      const { mooveRentalPass } = await loadFixture(deployRentalPassFixture);

      await expect(mooveRentalPass.getRentalPass(999)).to.be.revertedWith(
        "Token does not exist"
      );

      await expect(mooveRentalPass.isPassExpired(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });

    it("Should handle empty user active passes", async function () {
      const { mooveRentalPass, user1 } = await loadFixture(
        deployRentalPassFixture
      );

      const activePasses = await mooveRentalPass.getUserActivePasses(
        user1.address
      );
      expect(activePasses.length).to.equal(0);
    });

    it("Should handle cleanup of non-expired passes", async function () {
      const { mooveRentalPass, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      // Try to cleanup non-expired pass (should not emit event)
      await expect(mooveRentalPass.cleanupExpiredPasses([tokenId])).to.not.emit(
        mooveRentalPass,
        "PassExpired"
      );
    });

    it("Should handle large batch operations", async function () {
      const { mooveRentalPass, owner } = await loadFixture(
        deployRentalPassFixture
      );

      // Create arrays for batch minting (10 passes)
      const recipients = [];
      const vehicleTypes = [];
      const accessCodes = [];
      const locations = [];
      const prices = [];
      const tokenURIs = [];

      for (let i = 0; i < 10; i++) {
        recipients.push(ethers.Wallet.createRandom().address);
        vehicleTypes.push(i % 3); // Cycle through vehicle types
        accessCodes.push(`ACCESS${i}`);
        locations.push(`Location${i}`);
        prices.push(ethers.parseEther("0.025"));
        tokenURIs.push(`ipfs://QmTest${i}`);
      }

      await expect(
        mooveRentalPass
          .connect(owner)
          .batchMintRentalPasses(
            recipients,
            vehicleTypes,
            accessCodes,
            locations,
            prices,
            tokenURIs
          )
      ).to.not.be.reverted;

      expect(await mooveRentalPass.totalSupply()).to.equal(10);
    });
  });

  // ============= INTERFACE SUPPORT =============
  describe("Interface Support", function () {
    it("Should support required interfaces", async function () {
      const { mooveRentalPass } = await loadFixture(deployRentalPassFixture);

      // ERC721
      expect(await mooveRentalPass.supportsInterface("0x80ac58cd")).to.be.true;
      // ERC721Metadata
      expect(await mooveRentalPass.supportsInterface("0x5b5e139f")).to.be.true;
    });

    it("Should have correct metadata", async function () {
      const { mooveRentalPass, tokenId } = await loadFixture(
        deployWithMintedPass
      );

      const tokenURI = await mooveRentalPass.tokenURI(tokenId);
      expect(tokenURI).to.equal("ipfs://QmTestRentalPass123");
    });
  });
});
