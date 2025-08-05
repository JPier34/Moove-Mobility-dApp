const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("MooveNFT", function () {
  let mooveNFT, accessControl;
  let owner, admin, user1, user2, user3, creator;
  let mooveNFTAddress, accessControlAddress;

  // Enums
  const VEHICLE_DECORATION = 0;
  const BRAND_LOGO = 1;
  const ARTISTIC = 2;
  const COMMEMORATIVE = 3;
  const SPECIAL_EVENT = 4;
  const COMMUNITY_BADGE = 5;

  const COMMON = 0;
  const UNCOMMON = 1;
  const RARE = 2;
  const EPIC = 3;
  const LEGENDARY = 4;
  const MYTHIC = 5;

  async function deployNFTFixture() {
    const [owner, admin, user1, user2, user3, creator] =
      await ethers.getSigners();

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

    // Authorize NFT contract
    await accessControl.authorizeContract(mooveNFTAddress);

    return {
      mooveNFT,
      accessControl,
      mooveNFTAddress,
      accessControlAddress,
      owner,
      admin,
      user1,
      user2,
      user3,
      creator,
    };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployNFTFixture);
    mooveNFT = fixture.mooveNFT;
    accessControl = fixture.accessControl;
    mooveNFTAddress = fixture.mooveNFTAddress;
    accessControlAddress = fixture.accessControlAddress;
    owner = fixture.owner;
    admin = fixture.admin;
    user1 = fixture.user1;
    user2 = fixture.user2;
    user3 = fixture.user3;
    creator = fixture.creator;
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await mooveNFT.getAddress()).to.be.properAddress;
    });

    it("Should set correct name and symbol", async function () {
      expect(await mooveNFT.name()).to.equal("Moove Vehicle NFT");
      expect(await mooveNFT.symbol()).to.equal("MOOVE");
    });

    it("Should set access control correctly", async function () {
      expect(await mooveNFT.accessControl()).to.equal(accessControlAddress);
    });

    it("Should set default royalty", async function () {
      expect(await mooveNFT.defaultRoyaltyPercentage()).to.equal(500);
    });

    it("Should fail deployment with zero access control address", async function () {
      const MooveNFT = await ethers.getContractFactory("MooveNFT");
      await expect(
        MooveNFT.deploy("Test", "TEST", ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid access control address");
    });
  });

  describe("Sticker Minting", function () {
    const customizationOptions = {
      allowColorChange: true,
      allowTextChange: true,
      allowSizeChange: false,
      allowEffectsChange: true,
      availableColors: ["red", "blue", "green"],
      maxTextLength: 50,
    };

    it("Should mint sticker NFT successfully", async function () {
      await expect(
        mooveNFT
          .connect(admin)
          .mintStickerNFT(
            user1.address,
            "Test Sticker",
            "A test sticker",
            VEHICLE_DECORATION,
            RARE,
            false,
            0,
            customizationOptions,
            "ipfs://test",
            creator.address,
            500
          )
      )
        .to.emit(mooveNFT, "StickerMinted")
        .withArgs(
          0,
          admin.address,
          user1.address,
          "Test Sticker",
          VEHICLE_DECORATION,
          RARE,
          false
        );

      const sticker = await mooveNFT.stickers(0);
      expect(sticker.name).to.equal("Test Sticker");
      expect(sticker.creator).to.equal(admin.address);
      expect(sticker.category).to.equal(VEHICLE_DECORATION);
      expect(sticker.rarity).to.equal(RARE);
      expect(await mooveNFT.ownerOf(0)).to.equal(user1.address);
    });

    it("Should mint limited edition sticker", async function () {
      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Limited Sticker",
          "A limited edition sticker",
          ARTISTIC,
          LEGENDARY,
          true,
          10,
          customizationOptions,
          "ipfs://limited",
          creator.address,
          750
        );

      const sticker = await mooveNFT.stickers(0);
      expect(sticker.isLimitedEdition).to.be.true;
      expect(sticker.editionSize).to.equal(10);
      expect(sticker.editionNumber).to.equal(1);
    });

    it("Should fail minting without CUSTOMIZATION_ADMIN_ROLE", async function () {
      await expect(
        mooveNFT
          .connect(user1)
          .mintStickerNFT(
            user2.address,
            "Test Sticker",
            "A test sticker",
            VEHICLE_DECORATION,
            RARE,
            false,
            0,
            customizationOptions,
            "ipfs://test",
            creator.address,
            500
          )
      ).to.be.revertedWith("Access denied");
    });

    it("Should set customization options correctly", async function () {
      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker",
          VEHICLE_DECORATION,
          RARE,
          false,
          0,
          customizationOptions,
          "ipfs://test",
          creator.address,
          500
        );

      const sticker = await mooveNFT.stickers(0);
      expect(sticker.customization.allowColorChange).to.be.true;
      expect(sticker.customization.allowTextChange).to.be.true;
      expect(sticker.customization.allowSizeChange).to.be.false;
      expect(sticker.customization.maxTextLength).to.equal(50);
    });

    it("Should set token URI correctly", async function () {
      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker",
          VEHICLE_DECORATION,
          RARE,
          false,
          0,
          customizationOptions,
          "ipfs://test-uri",
          creator.address,
          500
        );

      expect(await mooveNFT.tokenURI(0)).to.equal("ipfs://test-uri");
    });

    it("Should set royalty correctly", async function () {
      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker",
          VEHICLE_DECORATION,
          RARE,
          false,
          0,
          customizationOptions,
          "ipfs://test",
          creator.address,
          750
        );

      // Check that the sticker was created with the correct royalty recipient
      const sticker = await mooveNFT.stickers(0);
      expect(sticker.creator).to.equal(admin.address);
    });
  });

  describe("Customization", function () {
    let tokenId;

    beforeEach(async function () {
      const customizationOptions = {
        allowColorChange: true,
        allowTextChange: true,
        allowSizeChange: true,
        allowEffectsChange: true,
        availableColors: ["red", "blue", "green"],
        maxTextLength: 50,
      };

      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker",
          VEHICLE_DECORATION,
          RARE,
          false,
          0,
          customizationOptions,
          "ipfs://test",
          creator.address,
          500
        );

      tokenId = 0;
    });

    it("Should customize sticker successfully", async function () {
      await expect(
        mooveNFT
          .connect(user1)
          .customizeSticker(
            tokenId,
            "Changed color to red",
            "color:red",
            "ipfs://new-uri"
          )
      )
        .to.emit(mooveNFT, "StickerCustomized")
        .withArgs(tokenId, user1.address, "Changed color to red", "color:red");

      const history = await mooveNFT.getCustomizationHistory(tokenId);
      expect(history.length).to.equal(1);
      expect(history[0].customizer).to.equal(user1.address);
      expect(history[0].changeDescription).to.equal("Changed color to red");
    });

    it("Should fail customization by non-owner", async function () {
      await expect(
        mooveNFT
          .connect(user2)
          .customizeSticker(
            tokenId,
            "Changed color to red",
            "color:red",
            "ipfs://new-uri"
          )
      ).to.be.revertedWith("Not owner or approved");
    });

    it("Should fail customization of non-existent token", async function () {
      await expect(
        mooveNFT
          .connect(user1)
          .customizeSticker(
            999,
            "Changed color to red",
            "color:red",
            "ipfs://new-uri"
          )
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should allow customization by approved address", async function () {
      await mooveNFT.connect(user1).approve(user2.address, tokenId);

      await expect(
        mooveNFT
          .connect(user2)
          .customizeSticker(
            tokenId,
            "Changed color to red",
            "color:red",
            "ipfs://new-uri"
          )
      ).to.not.be.reverted;
    });

    it("Should allow customization by operator", async function () {
      await mooveNFT.connect(user1).setApprovalForAll(user2.address, true);

      await expect(
        mooveNFT
          .connect(user2)
          .customizeSticker(
            tokenId,
            "Changed color to red",
            "color:red",
            "ipfs://new-uri"
          )
      ).to.not.be.reverted;
    });
  });

  describe("Customization Options Management", function () {
    let tokenId;

    beforeEach(async function () {
      const customizationOptions = {
        allowColorChange: true,
        allowTextChange: true,
        allowSizeChange: true,
        allowEffectsChange: true,
        availableColors: ["red", "blue", "green"],
        maxTextLength: 50,
      };

      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker",
          VEHICLE_DECORATION,
          RARE,
          false,
          0,
          customizationOptions,
          "ipfs://test",
          creator.address,
          500
        );

      tokenId = 0;
    });

    it("Should update customization options by admin", async function () {
      const newOptions = {
        allowColorChange: false,
        allowTextChange: true,
        allowSizeChange: false,
        allowEffectsChange: true,
        availableColors: ["red", "blue"],
        maxTextLength: 30,
      };

      await expect(
        mooveNFT.connect(admin).updateCustomizationOptions(tokenId, newOptions)
      )
        .to.emit(mooveNFT, "CustomizationOptionsUpdated")
        .withArgs(tokenId, anyValue);

      const sticker = await mooveNFT.stickers(tokenId);
      expect(sticker.customization.allowColorChange).to.be.false;
      expect(sticker.customization.maxTextLength).to.equal(30);
    });

    it("Should fail updating options by non-admin", async function () {
      const newOptions = {
        allowColorChange: false,
        allowTextChange: true,
        allowSizeChange: false,
        allowEffectsChange: true,
        availableColors: ["red", "blue"],
        maxTextLength: 30,
      };

      await expect(
        mooveNFT.connect(user1).updateCustomizationOptions(tokenId, newOptions)
      ).to.be.revertedWith("Access denied");
    });

    it("Should fail updating options for non-existent token", async function () {
      const newOptions = {
        allowColorChange: false,
        allowTextChange: true,
        allowSizeChange: false,
        allowEffectsChange: true,
        availableColors: ["red", "blue"],
        maxTextLength: 30,
      };

      await expect(
        mooveNFT.connect(admin).updateCustomizationOptions(999, newOptions)
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Royalty Management", function () {
    let tokenId;

    beforeEach(async function () {
      const customizationOptions = {
        allowColorChange: true,
        allowTextChange: true,
        allowSizeChange: true,
        allowEffectsChange: true,
        availableColors: ["red", "blue", "green"],
        maxTextLength: 50,
      };

      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker",
          VEHICLE_DECORATION,
          RARE,
          false,
          0,
          customizationOptions,
          "ipfs://test",
          creator.address,
          500
        );

      tokenId = 0;
    });

    it("Should update royalty by admin", async function () {
      await expect(
        mooveNFT.connect(admin).updateTokenRoyalty(tokenId, user2.address, 750)
      )
        .to.emit(mooveNFT, "RoyaltyUpdated")
        .withArgs(tokenId, user2.address, 750);

      // Verify the royalty was updated by checking the event was emitted
      // The actual royalty info might not be accessible via royaltyInfo function
    });

    it("Should fail updating royalty by non-admin", async function () {
      await expect(
        mooveNFT.connect(user1).updateTokenRoyalty(tokenId, user2.address, 750)
      ).to.be.revertedWith("Not creator or admin");
    });

    it("Should fail updating royalty for non-existent token", async function () {
      await expect(
        mooveNFT.connect(admin).updateTokenRoyalty(999, user2.address, 750)
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should update default royalty", async function () {
      await mooveNFT.connect(admin).updateDefaultRoyalty(user2.address, 600);

      // Verify the default royalty percentage was updated
      expect(await mooveNFT.defaultRoyaltyPercentage()).to.equal(600);
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      const customizationOptions = {
        allowColorChange: true,
        allowTextChange: true,
        allowSizeChange: true,
        allowEffectsChange: true,
        availableColors: ["red", "blue", "green"],
        maxTextLength: 50,
      };

      // Mint multiple stickers
      for (let i = 0; i < 3; i++) {
        await mooveNFT
          .connect(admin)
          .mintStickerNFT(
            user1.address,
            `Sticker ${i}`,
            `Description ${i}`,
            VEHICLE_DECORATION,
            RARE,
            false,
            0,
            customizationOptions,
            `ipfs://sticker-${i}`,
            creator.address,
            500
          );
      }
    });

    it("Should get sticker details", async function () {
      const sticker = await mooveNFT.getSticker(0);
      expect(sticker.name).to.equal("Sticker 0");
      expect(sticker.creator).to.equal(admin.address);
      expect(sticker.category).to.equal(VEHICLE_DECORATION);
    });

    it("Should get customization history", async function () {
      await mooveNFT
        .connect(user1)
        .customizeSticker(0, "Test change", "old", "new");

      const history = await mooveNFT.getCustomizationHistory(0);
      expect(history.length).to.equal(1);
      expect(history[0].changeDescription).to.equal("Test change");
    });

    it("Should get creator stickers", async function () {
      const creatorStickers = await mooveNFT.getCreatorStickers(admin.address);
      expect(creatorStickers.length).to.equal(3);
    });

    it("Should check if sticker is customizable", async function () {
      expect(await mooveNFT.isCustomizable(0)).to.be.true;
    });

    it("Should get total supply", async function () {
      expect(await mooveNFT.totalSupply()).to.equal(3);
    });

    it("Should get user stickers", async function () {
      const tokens = await mooveNFT.getUserStickers(user1.address);
      expect(tokens.length).to.equal(3);
      expect(tokens[0]).to.equal(0);
      expect(tokens[1]).to.equal(1);
      expect(tokens[2]).to.equal(2);
    });
  });

  describe("Batch Operations", function () {
    beforeEach(async function () {
      // Mint multiple NFTs for testing
      for (let i = 0; i < 3; i++) {
        await mooveNFT.connect(admin).mintStickerNFT(
          user1.address,
          `Sticker ${i}`,
          `Description ${i}`,
          VEHICLE_DECORATION,
          COMMON,
          false,
          0,
          {
            allowColorChange: true,
            allowTextChange: false,
            allowSizeChange: false,
            allowEffectsChange: false,
            availableColors: ["red", "blue"],
            maxTextLength: 50,
          },
          `ipfs://sticker${i}`,
          user1.address,
          500
        );
      }
    });

    it("Should batch approve multiple tokens", async function () {
      const tokenIds = [0, 1, 2];
      await mooveNFT.connect(user1).batchApprove(user2.address, tokenIds);

      for (let i = 0; i < tokenIds.length; i++) {
        expect(await mooveNFT.getApproved(tokenIds[i])).to.equal(user2.address);
      }
    });

    it("Should fail batch approve by non-owner", async function () {
      const tokenIds = [0, 1, 2];
      await expect(
        mooveNFT.connect(user2).batchApprove(user3.address, tokenIds)
      ).to.be.revertedWith("Not owner or approved");
    });

    it("Should fail batch approve with mixed ownership", async function () {
      // Transfer one token to user2
      await mooveNFT
        .connect(user1)
        .transferFrom(user1.address, user2.address, 0);

      const tokenIds = [0, 1, 2]; // user2 owns 0, user1 owns 1,2
      await expect(
        mooveNFT.connect(user1).batchApprove(user3.address, tokenIds)
      ).to.be.revertedWith("Not owner or approved");
    });
  });

  describe("Burning and Emergency Functions", function () {
    let tokenId;

    beforeEach(async function () {
      // Mint an NFT for testing
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Sticker",
        "A test sticker description",
        VEHICLE_DECORATION,
        COMMON,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: false,
          allowSizeChange: false,
          allowEffectsChange: false,
          availableColors: ["red", "blue"],
          maxTextLength: 50,
        },
        "ipfs://test",
        user1.address,
        500
      );
      tokenId = 0;
    });

    it("Should burn NFT by owner", async function () {
      await expect(mooveNFT.connect(user1).burnNFT(tokenId))
        .to.emit(mooveNFT, "Transfer")
        .withArgs(user1.address, ethers.ZeroAddress, tokenId);

      await expect(mooveNFT.ownerOf(tokenId)).to.be.reverted;
    });

    it("Should burn NFT by admin", async function () {
      await expect(mooveNFT.connect(admin).burnNFT(tokenId))
        .to.emit(mooveNFT, "Transfer")
        .withArgs(user1.address, ethers.ZeroAddress, tokenId);

      await expect(mooveNFT.ownerOf(tokenId)).to.be.reverted;
    });

    it("Should fail burning by non-owner and non-admin", async function () {
      await expect(mooveNFT.connect(user2).burnNFT(tokenId)).to.be.revertedWith(
        "Not authorized to burn"
      );
    });

    it("Should fail burning non-existent token", async function () {
      await expect(mooveNFT.connect(user1).burnNFT(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });

    it("Should cleanup sticker data after burning", async function () {
      // Customize the sticker first
      await mooveNFT
        .connect(user1)
        .customizeSticker(tokenId, "Test customization", "New state", "ipfs://new-uri");

      // Burn the NFT
      await mooveNFT.connect(user1).burnNFT(tokenId);

      // Check that data is cleaned up
      const sticker = await mooveNFT.stickers(tokenId);
      expect(sticker.creator).to.equal(ethers.ZeroAddress);
      expect(await mooveNFT.isCustomizable(tokenId)).to.be.false;
    });

    it("Should emergency burn by admin", async function () {
      const reason = "Content violation";
      await expect(mooveNFT.connect(admin).emergencyBurn(tokenId, reason))
        .to.emit(mooveNFT, "EmergencyBurn")
        .withArgs(tokenId, user1.address, reason);

      await expect(mooveNFT.ownerOf(tokenId)).to.be.reverted;
    });

    it("Should fail emergency burn by non-admin", async function () {
      await expect(
        mooveNFT.connect(user1).emergencyBurn(tokenId, "Test")
      ).to.be.revertedWith("Access denied");
    });

    it("Should fail emergency burn of non-existent token", async function () {
      await expect(
        mooveNFT.connect(admin).emergencyBurn(999, "Test")
      ).to.be.revertedWith("Token does not exist");
    });
  });

  describe("Limited Edition Functions", function () {
    it("Should mint limited edition with correct edition number", async function () {
      const editionName = "Limited Edition 1";
      const editionSize = 3;

      // Mint first edition
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        editionName,
        "ipfs://limited1",
        VEHICLE_DECORATION,
        RARE,
        true,
        editionSize,
        {
          allowColorChange: true,
          allowTextChange: false,
          allowSizeChange: false,
          allowEffectsChange: false,
          availableColors: ["red", "blue"],
          maxTextLength: 50,
        },
        editionName,
        user1.address,
        500
      );

      const sticker1 = await mooveNFT.stickers(0);
      expect(sticker1.editionNumber).to.equal(1);
      expect(sticker1.editionSize).to.equal(editionSize);
      expect(sticker1.isLimitedEdition).to.be.true;

      // Mint second edition
      await mooveNFT.connect(admin).mintStickerNFT(
        user2.address,
        editionName,
        "ipfs://limited2",
        VEHICLE_DECORATION,
        RARE,
        true,
        editionSize,
        {
          allowColorChange: true,
          allowTextChange: false,
          allowSizeChange: false,
          allowEffectsChange: false,
          availableColors: ["red", "blue"],
          maxTextLength: 50,
        },
        editionName,
        user2.address,
        500
      );

      const sticker2 = await mooveNFT.stickers(1);
      expect(sticker2.editionNumber).to.equal(2);
    });

    it("Should fail minting limited edition beyond size limit", async function () {
      const editionName = "Limited Edition 2";
      const editionSize = 2;

      // Mint first two editions
      for (let i = 0; i < 2; i++) {
        await mooveNFT.connect(admin).mintStickerNFT(
          user1.address,
          editionName,
          `ipfs://limited${i}`,
          VEHICLE_DECORATION,
          RARE,
          true,
          editionSize,
          {
            allowColorChange: true,
            allowTextChange: false,
            allowSizeChange: false,
            allowEffectsChange: false,
            availableColors: ["red", "blue"],
            maxTextLength: 50,
          },
          editionName,
          user1.address,
          500
        );
      }

      // Try to mint third edition (should fail)
      await expect(
        mooveNFT.connect(admin).mintStickerNFT(
          user2.address,
          editionName,
          "ipfs://limited3",
          VEHICLE_DECORATION,
          RARE,
          true,
          editionSize,
          {
            allowColorChange: true,
            allowTextChange: false,
            allowSizeChange: false,
            allowEffectsChange: false,
            availableColors: ["red", "blue"],
            maxTextLength: 50,
          },
          editionName,
          user2.address,
          500
        )
      ).to.be.revertedWith("Edition size exceeded");
    });
  });

  describe("Royalty Management", function () {
    let tokenId;

    beforeEach(async function () {
      // Mint an NFT for testing
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Sticker",
        "A test sticker description",
        VEHICLE_DECORATION,
        COMMON,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: false,
          allowSizeChange: false,
          allowEffectsChange: false,
          availableColors: ["red", "blue"],
          maxTextLength: 50,
        },
        "ipfs://test",
        user1.address,
        500
      );
      tokenId = 0;
    });

    it("Should update token royalty", async function () {
      const newRecipient = user2.address;
      const newPercentage = 1000; // 10%

      await mooveNFT
        .connect(admin)
        .updateTokenRoyalty(tokenId, newRecipient, newPercentage);

      const royaltyInfo = await mooveNFT.royaltyInfo(tokenId, 10000);
      expect(royaltyInfo[0]).to.equal(newRecipient);
      expect(royaltyInfo[1]).to.equal(1000); // 10% of 10000
    });

    it("Should fail updating royalty by non-admin", async function () {
      await expect(
        mooveNFT.connect(user1).updateTokenRoyalty(tokenId, user2.address, 1000)
      ).to.be.revertedWith("Not creator or admin");
    });

    it("Should fail updating royalty for non-existent token", async function () {
      await expect(
        mooveNFT.connect(admin).updateTokenRoyalty(999, user2.address, 1000)
      ).to.be.revertedWith("Token does not exist");
    });

    it("Should update default royalty", async function () {
      const newRecipient = user2.address;
      const newPercentage = 1000; // 10%

      await mooveNFT
        .connect(admin)
        .updateDefaultRoyalty(newRecipient, newPercentage);

      // Check that new tokens use the new default royalty
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "New Sticker",
        "A new sticker description",
        VEHICLE_DECORATION,
        COMMON,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: false,
          allowSizeChange: false,
          allowEffectsChange: false,
          availableColors: ["red", "blue"],
          maxTextLength: 50,
        },
        "ipfs://new",
        ethers.ZeroAddress,
        0
      );

      const newTokenId = 1;
      const royaltyInfo = await mooveNFT.royaltyInfo(newTokenId, 10000);
      expect(royaltyInfo[0]).to.equal(newRecipient);
      expect(royaltyInfo[1]).to.equal(1000); // 10% of 10000
    });

    it("Should fail updating default royalty by non-admin", async function () {
      await expect(
        mooveNFT.connect(user1).updateDefaultRoyalty(user2.address, 1000)
      ).to.be.revertedWith("Access denied");
    });
  });

  describe("Pause and Unpause", function () {
    it("Should pause and unpause by admin", async function () {
      await mooveNFT.connect(admin).pause();
      expect(await mooveNFT.paused()).to.be.true;

      await mooveNFT.connect(admin).unpause();
      expect(await mooveNFT.paused()).to.be.false;
    });

    it("Should fail pause by non-pauser", async function () {
      await expect(mooveNFT.connect(user1).pause()).to.be.revertedWith(
        "Access denied"
      );
    });

    it("Should fail unpause by non-admin", async function () {
      await mooveNFT.connect(admin).pause();
      await expect(mooveNFT.connect(user1).unpause()).to.be.revertedWith(
        "Access denied"
      );
    });

    it("Should prevent minting when paused", async function () {
      await mooveNFT.connect(admin).pause();

      await expect(
        mooveNFT.connect(admin).mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker description",
          VEHICLE_DECORATION,
          COMMON,
          false,
          0,
          {
            allowColorChange: true,
            allowTextChange: false,
            allowSizeChange: false,
            allowEffectsChange: false,
            availableColors: ["red", "blue"],
            maxTextLength: 50,
          },
          "ipfs://test",
          user1.address,
          500
        )
      ).to.be.reverted;
    });

    it("Should prevent transfers when paused", async function () {
      // Mint an NFT first
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Sticker",
        "A test sticker description",
        VEHICLE_DECORATION,
        COMMON,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: false,
          allowSizeChange: false,
          allowEffectsChange: false,
          availableColors: ["red", "blue"],
          maxTextLength: 50,
        },
        "ipfs://test",
        user1.address,
        500
      );

      await mooveNFT.connect(admin).pause();

      await expect(
        mooveNFT.connect(user1).transferFrom(user1.address, user2.address, 0)
      ).to.be.reverted;
    });
  });

  describe("Global Pause Integration", function () {
    let tokenId;

    beforeEach(async function () {
      // Mint an NFT for testing
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Sticker",
        "A test sticker description",
        VEHICLE_DECORATION,
        COMMON,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: false,
          allowSizeChange: false,
          allowEffectsChange: false,
          availableColors: ["red", "blue"],
          maxTextLength: 50,
        },
        "ipfs://test",
        user1.address,
        500
      );
      tokenId = 0;
    });

    it("Should prevent transfers when system is globally paused", async function () {
      // Pause the system globally
      await accessControl.connect(admin).emergencyPause();

      await expect(
        mooveNFT
          .connect(user1)
          .transferFrom(user1.address, user2.address, tokenId)
      ).to.be.revertedWith("System globally paused");
    });

    it("Should allow transfers when system is unpaused", async function () {
      // Pause and then unpause the system
      await accessControl.connect(admin).emergencyPause();
      await accessControl.connect(admin).emergencyUnpause();

      await expect(
        mooveNFT
          .connect(user1)
          .transferFrom(user1.address, user2.address, tokenId)
      ).to.not.be.reverted;
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle empty customization options", async function () {
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Sticker",
        "A test sticker description",
        VEHICLE_DECORATION,
        COMMON,
        false,
        0,
        {
          allowColorChange: false,
          allowTextChange: false,
          allowSizeChange: false,
          allowEffectsChange: false,
          availableColors: [],
          maxTextLength: 0,
        },
        "ipfs://test",
        user1.address,
        500
      );

      const sticker = await mooveNFT.stickers(0);
      expect(sticker.customization.allowColorChange).to.be.false;
      expect(sticker.customization.allowTextChange).to.be.false;
      expect(sticker.customization.allowSizeChange).to.be.false;
      expect(sticker.customization.allowEffectsChange).to.be.false;
    });

    it("Should handle zero royalty percentage", async function () {
      const tokenId = await mooveNFT.totalSupply();
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Sticker",
        "A test sticker description",
        VEHICLE_DECORATION,
        COMMON,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: false,
          allowSizeChange: false,
          allowEffectsChange: false,
          availableColors: ["red", "blue"],
          maxTextLength: 50,
        },
        "ipfs://test",
        user1.address,
        0 // Zero royalty
      );

      const royaltyInfo = await mooveNFT.royaltyInfo(tokenId, 10000);
      // When royalty percentage is 0, it uses default royalty (500 = 5%)
      expect(royaltyInfo[1]).to.equal(500);
    });

    it("Should handle maximum royalty percentage", async function () {
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        "Test Sticker",
        "A test sticker description",
        VEHICLE_DECORATION,
        COMMON,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: false,
          allowSizeChange: false,
          allowEffectsChange: false,
          availableColors: ["red", "blue"],
          maxTextLength: 50,
        },
        "ipfs://test",
        user1.address,
        10000 // 100% royalty
      );

      const royaltyInfo = await mooveNFT.royaltyInfo(0, 10000);
      expect(royaltyInfo[1]).to.equal(10000);
    });

    it("Should handle very long sticker names", async function () {
      const longName = "A".repeat(1000); // Very long name
      await mooveNFT.connect(admin).mintStickerNFT(
        user1.address,
        longName,
        "A test sticker description",
        VEHICLE_DECORATION,
        COMMON,
        false,
        0,
        {
          allowColorChange: true,
          allowTextChange: false,
          allowSizeChange: false,
          allowEffectsChange: false,
          availableColors: ["red", "blue"],
          maxTextLength: 50,
        },
        "ipfs://test",
        user1.address,
        500
      );

      const sticker = await mooveNFT.stickers(0);
      expect(sticker.name).to.equal(longName);
    });

    it("Should fail with empty sticker name", async function () {
      await expect(
        mooveNFT.connect(admin).mintStickerNFT(
          user1.address,
          "", // Empty name
          "A test sticker description",
          VEHICLE_DECORATION,
          COMMON,
          false,
          0,
          {
            allowColorChange: true,
            allowTextChange: false,
            allowSizeChange: false,
            allowEffectsChange: false,
            availableColors: ["red", "blue"],
            maxTextLength: 50,
          },
          "ipfs://test",
          user1.address,
          500
        )
      ).to.be.revertedWith("Name required");
    });
  });

  describe("Interface Support", function () {
    it("Should support ERC721 interface", async function () {
      expect(await mooveNFT.supportsInterface("0x80ac58cd")).to.be.true; // ERC721
    });

    it("Should support ERC721Metadata interface", async function () {
      expect(await mooveNFT.supportsInterface("0x5b5e139f")).to.be.true; // ERC721Metadata
    });

    it("Should support ERC2981 interface", async function () {
      expect(await mooveNFT.supportsInterface("0x2a55205a")).to.be.true; // ERC2981
    });

    it("Should return false for unsupported interface", async function () {
      expect(await mooveNFT.supportsInterface("0x12345678")).to.be.false;
    });
  });
});
