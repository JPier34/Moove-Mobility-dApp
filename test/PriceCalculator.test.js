const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");

describe("PriceCalculator", function () {
  let priceCalculator;
  let owner;

  async function deployPriceCalculatorFixture() {
    const [owner] = await ethers.getSigners();

    // Deploy a test contract that uses the PriceCalculator library
    const TestPriceCalculator = await ethers.getContractFactory(
      "TestPriceCalculator"
    );
    const priceCalculator = await TestPriceCalculator.deploy();
    await priceCalculator.waitForDeployment();

    return { priceCalculator, owner };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployPriceCalculatorFixture);
    priceCalculator = fixture.priceCalculator;
    owner = fixture.owner;
  });

  describe("Dutch Price Calculation", function () {
    it("Should calculate correct price at start time", async function () {
      const startPrice = ethers.parseEther("10");
      const endPrice = ethers.parseEther("5");
      const startTime = await time.latest();
      const endTime = startTime + 3600; // 1 hour later

      const price = await priceCalculator.calculateDutchPrice(
        startPrice,
        endPrice,
        startTime,
        endTime
      );

      expect(price).to.equal(startPrice);
    });

    it("Should calculate correct price at end time", async function () {
      const startPrice = ethers.parseEther("10");
      const endPrice = ethers.parseEther("5");
      const startTime = await time.latest();
      const endTime = startTime + 3600; // 1 hour later

      // Fast forward to end time
      await time.increaseTo(endTime);

      const price = await priceCalculator.calculateDutchPrice(
        startPrice,
        endPrice,
        startTime,
        endTime
      );

      expect(price).to.equal(endPrice);
    });

    it("Should calculate correct price after end time", async function () {
      const startPrice = ethers.parseEther("10");
      const endPrice = ethers.parseEther("5");
      const startTime = await time.latest();
      const endTime = startTime + 3600; // 1 hour later

      // Fast forward past end time
      await time.increaseTo(endTime + 1800); // 30 minutes after end

      const price = await priceCalculator.calculateDutchPrice(
        startPrice,
        endPrice,
        startTime,
        endTime
      );

      expect(price).to.equal(endPrice);
    });

    it("Should calculate correct price at middle time", async function () {
      const startPrice = ethers.parseEther("10");
      const endPrice = ethers.parseEther("5");
      const startTime = await time.latest();
      const endTime = startTime + 3600; // 1 hour later

      // Fast forward to middle time
      await time.increaseTo(startTime + 1800); // 30 minutes after start

      const price = await priceCalculator.calculateDutchPrice(
        startPrice,
        endPrice,
        startTime,
        endTime
      );

      // Should be halfway between start and end price
      const expectedPrice =
        startPrice - ((startPrice - endPrice) * 1800n) / 3600n;
      expect(price).to.equal(expectedPrice);
    });

    it("Should calculate correct price at 25% of duration", async function () {
      const startPrice = ethers.parseEther("10");
      const endPrice = ethers.parseEther("5");
      const startTime = await time.latest();
      const endTime = startTime + 3600; // 1 hour later

      // Fast forward to 25% of duration
      await time.increaseTo(startTime + 900); // 15 minutes after start

      const price = await priceCalculator.calculateDutchPrice(
        startPrice,
        endPrice,
        startTime,
        endTime
      );

      // Should be 25% of the way from start to end price
      const expectedPrice =
        startPrice - ((startPrice - endPrice) * 900n) / 3600n;
      expect(price).to.equal(expectedPrice);
    });

    it("Should calculate correct price at 75% of duration", async function () {
      const startPrice = ethers.parseEther("10");
      const endPrice = ethers.parseEther("5");
      const startTime = await time.latest();
      const endTime = startTime + 3600; // 1 hour later

      // Fast forward to 75% of duration
      await time.increaseTo(startTime + 2700); // 45 minutes after start

      const price = await priceCalculator.calculateDutchPrice(
        startPrice,
        endPrice,
        startTime,
        endTime
      );

      // Should be 75% of the way from start to end price
      const expectedPrice =
        startPrice - ((startPrice - endPrice) * 2700n) / 3600n;
      expect(price).to.equal(expectedPrice);
    });

    it("Should handle equal start and end prices", async function () {
      const startPrice = ethers.parseEther("10");
      const endPrice = ethers.parseEther("10");
      const startTime = await time.latest();
      const endTime = startTime + 3600; // 1 hour later

      // Fast forward to middle time
      await time.increaseTo(startTime + 1800); // 30 minutes after start

      const price = await priceCalculator.calculateDutchPrice(
        startPrice,
        endPrice,
        startTime,
        endTime
      );

      expect(price).to.equal(startPrice);
    });

    it("Should handle very short duration", async function () {
      const startPrice = ethers.parseEther("10");
      const endPrice = ethers.parseEther("5");
      const startTime = await time.latest();
      const endTime = startTime + 60; // 1 minute later

      // Fast forward to 30 seconds after start
      await time.increaseTo(startTime + 30);

      const price = await priceCalculator.calculateDutchPrice(
        startPrice,
        endPrice,
        startTime,
        endTime
      );

      // Should be halfway between start and end price
      const expectedPrice = startPrice - ((startPrice - endPrice) * 30n) / 60n;
      expect(price).to.equal(expectedPrice);
    });

    it("Should handle very long duration", async function () {
      const startPrice = ethers.parseEther("10");
      const endPrice = ethers.parseEther("5");
      const startTime = await time.latest();
      const endTime = startTime + 86400; // 24 hours later

      // Fast forward to 12 hours after start
      await time.increaseTo(startTime + 43200);

      const price = await priceCalculator.calculateDutchPrice(
        startPrice,
        endPrice,
        startTime,
        endTime
      );

      // Should be halfway between start and end price
      const expectedPrice =
        startPrice - ((startPrice - endPrice) * 43200n) / 86400n;
      expect(price).to.equal(expectedPrice);
    });

    it("Should handle edge case with very small price difference", async function () {
      const startPrice = ethers.parseEther("10");
      const endPrice = ethers.parseEther("9.99");
      const startTime = await time.latest();
      const endTime = startTime + 3600; // 1 hour later

      // Fast forward to middle time
      await time.increaseTo(startTime + 1800); // 30 minutes after start

      const price = await priceCalculator.calculateDutchPrice(
        startPrice,
        endPrice,
        startTime,
        endTime
      );

      // Should be halfway between start and end price
      const expectedPrice =
        startPrice - ((startPrice - endPrice) * 1800n) / 3600n;
      expect(price).to.equal(expectedPrice);
    });
  });
});
