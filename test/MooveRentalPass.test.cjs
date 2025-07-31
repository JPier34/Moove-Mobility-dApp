// test/MooveRentalPass.test.cjs - Test file matching actual contract interface
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MooveRentalPass", function () {
  let mooveRentalPass;
  let accessControl;
  let owner;
  let user1;
  let user2;

  // Vehicle types enum - matches contract
  const VehicleType = {
    BIKE: 0,
    SCOOTER: 1,
    MONOPATTINO: 2,
  };

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy MooveAccessControl first
    const MooveAccessControlFactory = await ethers.getContractFactory(
      "MooveAccessControl"
    );
    accessControl = await MooveAccessControlFactory.deploy(owner.address);
    await accessControl.waitForDeployment();

    // Deploy MooveRentalPass with required parameters
    const MooveRentalPassFactory = await ethers.getContractFactory(
      "MooveRentalPass"
    );
    mooveRentalPass = await MooveRentalPassFactory.deploy(
      await accessControl.getAddress(),
      owner.address // feeRecipient
    );
    await mooveRentalPass.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await mooveRentalPass.getAddress()).to.be.properAddress;
    });

    it("Should set correct access control and fee recipient", async function () {
      expect(await mooveRentalPass.accessControl()).to.equal(
        await accessControl.getAddress()
      );
      expect(await mooveRentalPass.feeRecipient()).to.equal(owner.address);
    });

    it("Should initialize with correct default pricing", async function () {
      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );
      const scooterPricing = await mooveRentalPass.getPassPricing(
        VehicleType.SCOOTER
      );
      const monopatinoPricing = await mooveRentalPass.getPassPricing(
        VehicleType.MONOPATTINO
      );

      expect(bikePricing.price).to.equal(ethers.parseEther("0.025"));
      expect(scooterPricing.price).to.equal(ethers.parseEther("0.035"));
      expect(monopatinoPricing.price).to.equal(ethers.parseEther("0.045"));

      expect(bikePricing.validityDays).to.equal(30);
      expect(scooterPricing.validityDays).to.equal(30);
      expect(monopatinoPricing.validityDays).to.equal(30);

      expect(bikePricing.isActive).to.be.true;
      expect(scooterPricing.isActive).to.be.true;
      expect(monopatinoPricing.isActive).to.be.true;
    });

    it("Should initialize supported cities", async function () {
      expect(await mooveRentalPass.supportedCities("rome")).to.be.true;
      expect(await mooveRentalPass.supportedCities("milan")).to.be.true;
      expect(await mooveRentalPass.supportedCities("paris")).to.be.true;
      expect(await mooveRentalPass.supportedCities("unsupported_city")).to.be
        .false;
    });
  });

  describe("Pass Minting", function () {
    it("Should mint rental pass with correct payment", async function () {
      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );

      // Check initial state
      expect(await mooveRentalPass.balanceOf(user1.address)).to.equal(0);

      // Mint pass
      await mooveRentalPass
        .connect(user1)
        .mintRentalPass(VehicleType.BIKE, "rome", { value: bikePricing.price });

      // Check after minting
      expect(await mooveRentalPass.balanceOf(user1.address)).to.equal(1);
      expect(await mooveRentalPass.totalSupply()).to.equal(1);
    });

    it("Should fail with insufficient payment", async function () {
      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );
      const insufficientAmount = bikePricing.price / 2n;

      await expect(
        mooveRentalPass
          .connect(user1)
          .mintRentalPass(VehicleType.BIKE, "rome", {
            value: insufficientAmount,
          })
      ).to.be.revertedWithCustomError(
        mooveRentalPass,
        "MooveRentalPass__InsufficientPayment"
      );
    });

    it("Should fail for unsupported city", async function () {
      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );

      await expect(
        mooveRentalPass
          .connect(user1)
          .mintRentalPass(VehicleType.BIKE, "unsupported_city", {
            value: bikePricing.price,
          })
      ).to.be.revertedWithCustomError(
        mooveRentalPass,
        "MooveRentalPass__CityNotSupported"
      );
    });

    it("Should respect max passes per user per type per city", async function () {
      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );

      // Mint maximum allowed passes (3)
      for (let i = 0; i < 3; i++) {
        await mooveRentalPass
          .connect(user1)
          .mintRentalPass(VehicleType.BIKE, "rome", {
            value: bikePricing.price,
          });
      }

      // Fourth attempt should fail
      await expect(
        mooveRentalPass
          .connect(user1)
          .mintRentalPass(VehicleType.BIKE, "rome", {
            value: bikePricing.price,
          })
      ).to.be.revertedWithCustomError(
        mooveRentalPass,
        "MooveRentalPass__MaxPassesReached"
      );
    });

    it("Should allow minting different vehicle types", async function () {
      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );
      const scooterPricing = await mooveRentalPass.getPassPricing(
        VehicleType.SCOOTER
      );

      // Mint bike pass
      await mooveRentalPass
        .connect(user1)
        .mintRentalPass(VehicleType.BIKE, "rome", { value: bikePricing.price });

      // Mint scooter pass
      await mooveRentalPass
        .connect(user1)
        .mintRentalPass(VehicleType.SCOOTER, "rome", {
          value: scooterPricing.price,
        });

      expect(await mooveRentalPass.balanceOf(user1.address)).to.equal(2);
    });

    it("Should handle overpayment correctly", async function () {
      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );
      const overpayment = bikePricing.price * 2n;

      await expect(
        mooveRentalPass
          .connect(user1)
          .mintRentalPass(VehicleType.BIKE, "rome", { value: overpayment })
      ).to.not.be.reverted;

      expect(await mooveRentalPass.balanceOf(user1.address)).to.equal(1);
    });
  });

  describe("Pass Management", function () {
    let tokenId;

    beforeEach(async function () {
      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );
      await mooveRentalPass
        .connect(user1)
        .mintRentalPass(VehicleType.BIKE, "rome", { value: bikePricing.price });
      tokenId = 1; // First token ID
    });

    it("Should validate pass correctly", async function () {
      expect(await mooveRentalPass.isPassValid(tokenId)).to.be.true;
      expect(await mooveRentalPass.canGenerateCode(tokenId)).to.be.true;
    });

    it("Should get pass information", async function () {
      const passInfo = await mooveRentalPass.getPassInfo(tokenId);

      expect(passInfo.vehicleType).to.equal(VehicleType.BIKE);
      expect(passInfo.cityId).to.equal("rome");
      expect(passInfo.isActive).to.be.true;
      expect(passInfo.validUntil).to.be.greaterThan(0);
    });

    it("Should get user passes correctly", async function () {
      const userPasses = await mooveRentalPass.getUserPasses(
        user1.address,
        "rome",
        VehicleType.BIKE
      );

      expect(userPasses.length).to.equal(1);
      expect(userPasses[0]).to.equal(tokenId);
    });

    it("Should get all user passes", async function () {
      // Mint another pass
      const scooterPricing = await mooveRentalPass.getPassPricing(
        VehicleType.SCOOTER
      );
      await mooveRentalPass
        .connect(user1)
        .mintRentalPass(VehicleType.SCOOTER, "milan", {
          value: scooterPricing.price,
        });

      const allPasses = await mooveRentalPass.getAllUserPasses(user1.address);
      expect(allPasses.length).to.equal(2);
    });

    it("Should handle expired passes correctly", async function () {
      // Fast forward time by 31 days
      await ethers.provider.send("evm_increaseTime", [31 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");

      expect(await mooveRentalPass.isPassValid(tokenId)).to.be.false;
      expect(await mooveRentalPass.canGenerateCode(tokenId)).to.be.false;
    });
  });

  describe("Admin Functions", function () {
    it("Should allow admin to update pricing", async function () {
      const newPrice = ethers.parseEther("0.05");
      const newValidityDays = 60;

      await mooveRentalPass
        .connect(owner)
        .updatePassPricing(VehicleType.BIKE, newPrice, newValidityDays);

      const updatedPricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );
      expect(updatedPricing.price).to.equal(newPrice);
      expect(updatedPricing.validityDays).to.equal(newValidityDays);
    });

    it("Should allow admin to add/remove cities", async function () {
      const newCity = "london";

      // Initially not supported
      expect(await mooveRentalPass.supportedCities(newCity)).to.be.false;

      // Add city
      await mooveRentalPass.connect(owner).setCitySupport(newCity, true);
      expect(await mooveRentalPass.supportedCities(newCity)).to.be.true;

      // Remove city
      await mooveRentalPass.connect(owner).setCitySupport(newCity, false);
      expect(await mooveRentalPass.supportedCities(newCity)).to.be.false;
    });

    it("Should allow admin to extend pass validity", async function () {
      // Mint a pass first
      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );
      await mooveRentalPass
        .connect(user1)
        .mintRentalPass(VehicleType.BIKE, "rome", { value: bikePricing.price });

      const tokenId = 1;
      const passInfoBefore = await mooveRentalPass.getPassInfo(tokenId);

      // Extend validity by 10 days
      await mooveRentalPass.connect(owner).extendPassValidity(tokenId, 10);

      const passInfoAfter = await mooveRentalPass.getPassInfo(tokenId);
      const expectedNewValidity =
        passInfoBefore.validUntil + 10n * 24n * 60n * 60n;

      expect(passInfoAfter.validUntil).to.equal(expectedNewValidity);
    });

    it("Should allow admin to deactivate pass", async function () {
      // Mint a pass first
      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );
      await mooveRentalPass
        .connect(user1)
        .mintRentalPass(VehicleType.BIKE, "rome", { value: bikePricing.price });

      const tokenId = 1;

      // Initially active
      expect(await mooveRentalPass.isPassValid(tokenId)).to.be.true;

      // Deactivate
      await mooveRentalPass.connect(owner).deactivatePass(tokenId);

      // Should now be inactive
      expect(await mooveRentalPass.isPassValid(tokenId)).to.be.false;
    });

    it("Should allow admin to batch mint passes", async function () {
      const recipients = [user1.address, user2.address];
      const vehicleTypes = [VehicleType.BIKE, VehicleType.SCOOTER];
      const cityIds = ["rome", "milan"];

      await mooveRentalPass
        .connect(owner)
        .batchMintRentalPass(recipients, vehicleTypes, cityIds);

      expect(await mooveRentalPass.balanceOf(user1.address)).to.equal(1);
      expect(await mooveRentalPass.balanceOf(user2.address)).to.equal(1);
      expect(await mooveRentalPass.totalSupply()).to.equal(2);
    });

    it("Should allow admin to pause/unpause", async function () {
      // Pause contract
      await mooveRentalPass.connect(owner).pause();

      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );

      // Should fail to mint when paused
      await expect(
        mooveRentalPass
          .connect(user1)
          .mintRentalPass(VehicleType.BIKE, "rome", {
            value: bikePricing.price,
          })
      ).to.be.revertedWithCustomError(mooveRentalPass, "EnforcedPause");

      // Unpause
      await mooveRentalPass.connect(owner).unpause();

      // Should work again
      await expect(
        mooveRentalPass
          .connect(user1)
          .mintRentalPass(VehicleType.BIKE, "rome", {
            value: bikePricing.price,
          })
      ).to.not.be.reverted;
    });
  });

  describe("Security", function () {
    it("Should reject non-admin pricing updates", async function () {
      await expect(
        mooveRentalPass
          .connect(user1)
          .updatePassPricing(VehicleType.BIKE, ethers.parseEther("0.1"), 30)
      ).to.be.revertedWithCustomError(
        mooveRentalPass,
        "MooveRentalPass__NotAuthorized"
      );
    });

    it("Should reject non-admin city management", async function () {
      await expect(
        mooveRentalPass.connect(user1).setCitySupport("london", true)
      ).to.be.revertedWithCustomError(
        mooveRentalPass,
        "MooveRentalPass__NotAuthorized"
      );
    });

    it("Should reject non-admin pause", async function () {
      await expect(
        mooveRentalPass.connect(user1).pause()
      ).to.be.revertedWithCustomError(
        mooveRentalPass,
        "MooveRentalPass__NotAuthorized"
      );
    });
  });

  describe("Edge Cases", function () {
    it("Should handle max supply correctly", async function () {
      // This test would be impractical with real max supply (50000)
      // Just verify max supply constant is set
      expect(await mooveRentalPass.MAX_SUPPLY()).to.equal(50000);
    });

    it("Should generate correct metadata URI", async function () {
      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );
      await mooveRentalPass
        .connect(user1)
        .mintRentalPass(VehicleType.BIKE, "rome", { value: bikePricing.price });

      const tokenId = 1;
      const tokenURI = await mooveRentalPass.tokenURI(tokenId);

      expect(tokenURI).to.include(
        "https://api.moove.com/metadata/rental-pass/"
      );
      expect(tokenURI).to.include("rome");
      expect(tokenURI).to.include(tokenId.toString());
    });

    it("Should validate pricing update parameters", async function () {
      // Zero price should fail
      await expect(
        mooveRentalPass
          .connect(owner)
          .updatePassPricing(VehicleType.BIKE, 0, 30)
      ).to.be.revertedWith("Price must be greater than 0");

      // Invalid validity days should fail
      await expect(
        mooveRentalPass
          .connect(owner)
          .updatePassPricing(VehicleType.BIKE, ethers.parseEther("0.1"), 0)
      ).to.be.revertedWith("Invalid validity period");

      await expect(
        mooveRentalPass.connect(owner).updatePassPricing(
          VehicleType.BIKE,
          ethers.parseEther("0.1"),
          400 // More than 365 days
        )
      ).to.be.revertedWith("Invalid validity period");
    });
  });
  describe(
    "More",
    function () {
      it("Should respect AccessControl role changes", async function () {
        // Grant MINTER_ROLE to user1
        const MINTER_ROLE = await accessControl.MINTER_ROLE();
        await accessControl
          .connect(owner)
          .grantRole(MINTER_ROLE, user1.address);

        // user1 should now be able to call admin functions
        await expect(
          mooveRentalPass
            .connect(user1)
            .updatePassPricing(VehicleType.BIKE, ethers.parseEther("0.1"), 30)
        ).to.not.be.reverted;
      });
    },

    it("Should handle fee recipient changes correctly", async function () {
      const newFeeRecipient = user2.address;
      const initialBalance = await ethers.provider.getBalance(newFeeRecipient);

      await mooveRentalPass.connect(owner).setFeeRecipient(newFeeRecipient);

      const bikePricing = await mooveRentalPass.getPassPricing(
        VehicleType.BIKE
      );
      await mooveRentalPass
        .connect(user1)
        .mintRentalPass(VehicleType.BIKE, "rome", { value: bikePricing.price });

      const finalBalance = await ethers.provider.getBalance(newFeeRecipient);
      expect(finalBalance).to.equal(initialBalance + bikePricing.price);
    })
  );

  it("Should allow same user to have passes in different cities", async function () {
    const bikePricing = await mooveRentalPass.getPassPricing(VehicleType.BIKE);

    // Mint passes in different cities
    await mooveRentalPass
      .connect(user1)
      .mintRentalPass(VehicleType.BIKE, "rome", { value: bikePricing.price });
    await mooveRentalPass
      .connect(user1)
      .mintRentalPass(VehicleType.BIKE, "milan", { value: bikePricing.price });
    await mooveRentalPass
      .connect(user1)
      .mintRentalPass(VehicleType.BIKE, "paris", { value: bikePricing.price });

    expect(await mooveRentalPass.balanceOf(user1.address)).to.equal(3);
  });

  it("Should allow metadata updates", async function () {
    const bikePricing = await mooveRentalPass.getPassPricing(VehicleType.BIKE);
    await mooveRentalPass
      .connect(user1)
      .mintRentalPass(VehicleType.BIKE, "rome", { value: bikePricing.price });

    const tokenId = 1;
    const originalURI = await mooveRentalPass.tokenURI(tokenId);

    await mooveRentalPass.connect(owner).updateTokenMetadata(tokenId);

    const updatedURI = await mooveRentalPass.tokenURI(tokenId);
    expect(updatedURI).to.equal(originalURI); // Should be same since data hasn't changed
  });

  it("Should handle batch operations efficiently", async function () {
    const recipients = new Array(10)
      .fill(0)
      .map(() => ethers.Wallet.createRandom().address);
    const vehicleTypes = new Array(10).fill(VehicleType.BIKE);
    const cityIds = new Array(10).fill("rome");

    await mooveRentalPass
      .connect(owner)
      .batchMintRentalPass(recipients, vehicleTypes, cityIds);

    expect(await mooveRentalPass.totalSupply()).to.equal(10);
  });
});
