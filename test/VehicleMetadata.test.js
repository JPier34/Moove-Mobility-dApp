const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("VehicleMetadata", function () {
  let vehicleMetadata;
  let owner;

  async function deployVehicleMetadataFixture() {
    const [owner] = await ethers.getSigners();

    // Deploy a test contract that uses the VehicleMetadata library
    const TestVehicleMetadata = await ethers.getContractFactory(
      "TestVehicleMetadata"
    );
    const vehicleMetadata = await TestVehicleMetadata.deploy();
    await vehicleMetadata.waitForDeployment();

    return { vehicleMetadata, owner };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployVehicleMetadataFixture);
    vehicleMetadata = fixture.vehicleMetadata;
    owner = fixture.owner;
  });

  describe("Sticker Management", function () {
    it("Should add sticker successfully", async function () {
      const sticker = "test-sticker-1";

      await vehicleMetadata.connect(owner).addSticker(sticker);

      const stickers = await vehicleMetadata.getStickers();
      expect(stickers.length).to.equal(1);
      expect(stickers[0]).to.equal(sticker);
    });

    it("Should add multiple stickers", async function () {
      const stickers = ["sticker-1", "sticker-2", "sticker-3"];

      for (const sticker of stickers) {
        await vehicleMetadata.connect(owner).addSticker(sticker);
      }

      const result = await vehicleMetadata.getStickers();
      expect(result.length).to.equal(3);
      expect(result[0]).to.equal("sticker-1");
      expect(result[1]).to.equal("sticker-2");
      expect(result[2]).to.equal("sticker-3");
    });

    it("Should update lastUpdated timestamp when adding sticker", async function () {
      const initialTime = await time.latest();

      await vehicleMetadata.connect(owner).addSticker("test-sticker");

      const lastUpdated = await vehicleMetadata.getLastUpdated();
      expect(lastUpdated).to.be.gt(initialTime);
    });

    it("Should handle empty sticker", async function () {
      await vehicleMetadata.connect(owner).addSticker("");

      const stickers = await vehicleMetadata.getStickers();
      expect(stickers.length).to.equal(1);
      expect(stickers[0]).to.equal("");
    });

    it("Should handle long sticker names", async function () {
      const longSticker = "a".repeat(1000); // Very long sticker name

      await vehicleMetadata.connect(owner).addSticker(longSticker);

      const stickers = await vehicleMetadata.getStickers();
      expect(stickers.length).to.equal(1);
      expect(stickers[0]).to.equal(longSticker);
    });
  });

  describe("Color Scheme Management", function () {
    it("Should set color scheme successfully", async function () {
      const colorScheme = "red-blue-gradient";

      await vehicleMetadata.connect(owner).setColorScheme(colorScheme);

      const result = await vehicleMetadata.getColorScheme();
      expect(result).to.equal(colorScheme);
    });

    it("Should update lastUpdated timestamp when setting color scheme", async function () {
      const initialTime = await time.latest();

      await vehicleMetadata.connect(owner).setColorScheme("test-colors");

      const lastUpdated = await vehicleMetadata.getLastUpdated();
      expect(lastUpdated).to.be.gt(initialTime);
    });

    it("Should handle empty color scheme", async function () {
      await vehicleMetadata.connect(owner).setColorScheme("");

      const result = await vehicleMetadata.getColorScheme();
      expect(result).to.equal("");
    });

    it("Should overwrite existing color scheme", async function () {
      await vehicleMetadata.connect(owner).setColorScheme("old-colors");
      await vehicleMetadata.connect(owner).setColorScheme("new-colors");

      const result = await vehicleMetadata.getColorScheme();
      expect(result).to.equal("new-colors");
    });
  });

  describe("Achievement Management", function () {
    it("Should add achievement successfully", async function () {
      const achievement = "first-ride";

      await vehicleMetadata.connect(owner).addAchievement(achievement);

      const achievements = await vehicleMetadata.getAchievements();
      expect(achievements.length).to.equal(1);
      expect(achievements[0]).to.equal(achievement);
    });

    it("Should add multiple achievements", async function () {
      const achievements = ["first-ride", "speed-demon", "eco-friendly"];

      for (const achievement of achievements) {
        await vehicleMetadata.connect(owner).addAchievement(achievement);
      }

      const result = await vehicleMetadata.getAchievements();
      expect(result.length).to.equal(3);
      expect(result[0]).to.equal("first-ride");
      expect(result[1]).to.equal("speed-demon");
      expect(result[2]).to.equal("eco-friendly");
    });

    it("Should update lastUpdated timestamp when adding achievement", async function () {
      const initialTime = await time.latest();

      await vehicleMetadata.connect(owner).addAchievement("test-achievement");

      const lastUpdated = await vehicleMetadata.getLastUpdated();
      expect(lastUpdated).to.be.gt(initialTime);
    });

    it("Should handle empty achievement", async function () {
      await vehicleMetadata.connect(owner).addAchievement("");

      const achievements = await vehicleMetadata.getAchievements();
      expect(achievements.length).to.equal(1);
      expect(achievements[0]).to.equal("");
    });
  });

  describe("Data Structure", function () {
    it("Should maintain separate arrays for stickers and achievements", async function () {
      await vehicleMetadata.connect(owner).addSticker("sticker-1");
      await vehicleMetadata.connect(owner).addAchievement("achievement-1");
      await vehicleMetadata.connect(owner).addSticker("sticker-2");
      await vehicleMetadata.connect(owner).addAchievement("achievement-2");

      const stickers = await vehicleMetadata.getStickers();
      const achievements = await vehicleMetadata.getAchievements();

      expect(stickers.length).to.equal(2);
      expect(achievements.length).to.equal(2);
      expect(stickers[0]).to.equal("sticker-1");
      expect(stickers[1]).to.equal("sticker-2");
      expect(achievements[0]).to.equal("achievement-1");
      expect(achievements[1]).to.equal("achievement-2");
    });

    it("Should maintain lastUpdated across all operations", async function () {
      const initialTime = await time.latest();

      await vehicleMetadata.connect(owner).addSticker("sticker");
      let lastUpdated = await vehicleMetadata.getLastUpdated();
      expect(lastUpdated).to.be.gt(initialTime);

      await time.increase(60); // 1 minute later

      await vehicleMetadata.connect(owner).setColorScheme("colors");
      lastUpdated = await vehicleMetadata.getLastUpdated();
      expect(lastUpdated).to.be.gt(initialTime + 60);

      await time.increase(60); // 1 minute later

      await vehicleMetadata.connect(owner).addAchievement("achievement");
      lastUpdated = await vehicleMetadata.getLastUpdated();
      expect(lastUpdated).to.be.gt(initialTime + 120);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle very large number of stickers", async function () {
      const numStickers = 100;

      for (let i = 0; i < numStickers; i++) {
        await vehicleMetadata.connect(owner).addSticker(`sticker-${i}`);
      }

      const stickers = await vehicleMetadata.getStickers();
      expect(stickers.length).to.equal(numStickers);
      expect(stickers[99]).to.equal("sticker-99");
    });

    it("Should handle very large number of achievements", async function () {
      const numAchievements = 100;

      for (let i = 0; i < numAchievements; i++) {
        await vehicleMetadata.connect(owner).addAchievement(`achievement-${i}`);
      }

      const achievements = await vehicleMetadata.getAchievements();
      expect(achievements.length).to.equal(numAchievements);
      expect(achievements[99]).to.equal("achievement-99");
    });

    it("Should handle special characters in strings", async function () {
      const specialSticker = "sticker-🚗-emoji";
      const specialColor = "color-🎨-scheme";
      const specialAchievement = "achievement-🏆-special";

      await vehicleMetadata.connect(owner).addSticker(specialSticker);
      await vehicleMetadata.connect(owner).setColorScheme(specialColor);
      await vehicleMetadata.connect(owner).addAchievement(specialAchievement);

      const stickers = await vehicleMetadata.getStickers();
      const colorScheme = await vehicleMetadata.getColorScheme();
      const achievements = await vehicleMetadata.getAchievements();

      expect(stickers[0]).to.equal(specialSticker);
      expect(colorScheme).to.equal(specialColor);
      expect(achievements[0]).to.equal(specialAchievement);
    });
  });
});
