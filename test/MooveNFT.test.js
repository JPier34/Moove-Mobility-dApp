const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MooveNFT - Optimized", function () {
  let mooveNFT, accessControl, admin, user1, user2, creator;

  // Enum values
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
    const [deployer, adminUser, user1Account, user2Account, creatorAccount] =
      await ethers.getSigners();

    // Deploy AccessControl first
    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );
    const accessControlContract = await MooveAccessControl.deploy(
      deployer.address
    );

    // Deploy MooveNFT
    const MooveNFT = await ethers.getContractFactory("MooveNFT");
    const nftContract = await MooveNFT.deploy(
      "Moove Stickers",
      "MOOVE",
      accessControlContract.target
    );

    // Grant roles
    await accessControlContract.grantRole(
      ethers.keccak256(ethers.toUtf8Bytes("CUSTOMIZATION_ADMIN_ROLE")),
      adminUser.address
    );
    await accessControlContract.grantRole(
      ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE")),
      adminUser.address
    );
    await accessControlContract.grantRole(
      ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE")),
      adminUser.address
    );

    return {
      mooveNFT: nftContract,
      accessControl: accessControlContract,
      admin: adminUser,
      user1: user1Account,
      user2: user2Account,
      creator: creatorAccount,
    };
  }

  beforeEach(async function () {
    const fixture = await deployNFTFixture();
    mooveNFT = fixture.mooveNFT;
    accessControl = fixture.accessControl;
    admin = fixture.admin;
    user1 = fixture.user1;
    user2 = fixture.user2;
    creator = fixture.creator;
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await mooveNFT.name()).to.equal("Moove Stickers");
      expect(await mooveNFT.symbol()).to.equal("MOOVE");
    });

    it("Should set access control correctly", async function () {
      expect(await mooveNFT.accessControl()).to.equal(accessControl.target);
    });

    it("Should set default royalty", async function () {
      // Test that default royalty is set correctly (now using constant)
      const [recipient, feeNumerator] = await mooveNFT.royaltyInfo(
        0,
        ethers.parseEther("1")
      );
      expect(feeNumerator).to.equal(ethers.parseEther("0.05")); // 5% = 500 basis points
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
            "A test sticker description",
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
          "A limited edition sticker description",
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
            "A test sticker description",
            VEHICLE_DECORATION,
            RARE,
            false,
            0,
            customizationOptions,
            "ipfs://test",
            creator.address,
            500
          )
      ).to.be.reverted;
    });

    it("Should set customization options correctly", async function () {
      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker description",
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
      expect(sticker.customization.allowEffectsChange).to.be.true;
      expect(sticker.customization.maxTextLength).to.equal(50);
    });

    it("Should set token URI correctly", async function () {
      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker description",
          VEHICLE_DECORATION,
          RARE,
          false,
          0,
          customizationOptions,
          "ipfs://test-metadata",
          creator.address,
          500
        );

      expect(await mooveNFT.tokenURI(0)).to.equal("ipfs://test-metadata");
    });

    it("Should set royalty correctly", async function () {
      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker description",
          VEHICLE_DECORATION,
          RARE,
          false,
          0,
          customizationOptions,
          "ipfs://test",
          creator.address,
          750
        );

      const [recipient, feeNumerator] = await mooveNFT.royaltyInfo(
        0,
        ethers.parseEther("1")
      );
      expect(recipient).to.equal(creator.address);
      expect(feeNumerator).to.equal(ethers.parseEther("0.075")); // 7.5%
    });
  });

  describe("Customization", function () {
    const customizationOptions = {
      allowColorChange: true,
      allowTextChange: true,
      allowSizeChange: false,
      allowEffectsChange: true,
      availableColors: ["red", "blue", "green"],
      maxTextLength: 50,
    };

    beforeEach(async function () {
      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker description",
          VEHICLE_DECORATION,
          RARE,
          false,
          0,
          customizationOptions,
          "ipfs://test",
          creator.address,
          500
        );
    });

    it("Should customize sticker successfully", async function () {
      await expect(
        mooveNFT
          .connect(user1)
          .customizeSticker(
            0,
            "Changed color to red",
            "Red version",
            "ipfs://customized"
          )
      )
        .to.emit(mooveNFT, "StickerCustomized")
        .withArgs(0, user1.address, "Changed color to red", "Red version");

      const history = await mooveNFT.getCustomizationHistory(0);
      expect(history.length).to.equal(1);
      expect(history[0].customizer).to.equal(user1.address);
      expect(history[0].changeDescription).to.equal("Changed color to red");
      expect(history[0].newState).to.equal("Red version");
    });

    it("Should fail customization by non-owner", async function () {
      await expect(
        mooveNFT
          .connect(user2)
          .customizeSticker(
            0,
            "Changed color to red",
            "Red version",
            "ipfs://customized"
          )
      ).to.be.reverted;
    });

    it("Should fail customization of non-existent token", async function () {
      await expect(
        mooveNFT
          .connect(user1)
          .customizeSticker(
            999,
            "Changed color to red",
            "Red version",
            "ipfs://customized"
          )
      ).to.be.reverted;
    });

    it("Should allow customization by approved address", async function () {
      await mooveNFT.connect(user1).approve(user2.address, 0);

      await expect(
        mooveNFT
          .connect(user2)
          .customizeSticker(
            0,
            "Changed color to red",
            "Red version",
            "ipfs://customized"
          )
      ).to.not.be.reverted;
    });

    it("Should allow customization by operator", async function () {
      await mooveNFT.connect(user1).setApprovalForAll(user2.address, true);

      await expect(
        mooveNFT
          .connect(user2)
          .customizeSticker(
            0,
            "Changed color to red",
            "Red version",
            "ipfs://customized"
          )
      ).to.not.be.reverted;
    });
  });

  describe("Customization Options Management", function () {
    const customizationOptions = {
      allowColorChange: true,
      allowTextChange: true,
      allowSizeChange: false,
      allowEffectsChange: true,
      availableColors: ["red", "blue", "green"],
      maxTextLength: 50,
    };

    beforeEach(async function () {
      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker description",
          VEHICLE_DECORATION,
          RARE,
          false,
          0,
          customizationOptions,
          "ipfs://test",
          creator.address,
          500
        );
    });

    it("Should update customization options by admin", async function () {
      const newOptions = {
        allowColorChange: false,
        allowTextChange: true,
        allowSizeChange: true,
        allowEffectsChange: false,
        availableColors: ["purple", "orange"],
        maxTextLength: 100,
      };

      await expect(
        mooveNFT.connect(admin).updateCustomizationOptions(0, newOptions)
      ).to.emit(mooveNFT, "CustomizationOptionsUpdated");

      const sticker = await mooveNFT.stickers(0);
      expect(sticker.customization.allowColorChange).to.be.false;
      expect(sticker.customization.allowSizeChange).to.be.true;
      expect(sticker.customization.maxTextLength).to.equal(100);
    });

    it("Should fail updating options by non-admin", async function () {
      const newOptions = {
        allowColorChange: false,
        allowTextChange: true,
        allowSizeChange: true,
        allowEffectsChange: false,
        availableColors: ["purple", "orange"],
        maxTextLength: 100,
      };

      await expect(
        mooveNFT.connect(user1).updateCustomizationOptions(0, newOptions)
      ).to.be.reverted;
    });

    it("Should fail updating options for non-existent token", async function () {
      const newOptions = {
        allowColorChange: false,
        allowTextChange: true,
        allowSizeChange: true,
        allowEffectsChange: false,
        availableColors: ["purple", "orange"],
        maxTextLength: 100,
      };

      await expect(
        mooveNFT.connect(admin).updateCustomizationOptions(999, newOptions)
      ).to.be.reverted;
    });
  });

  describe("Royalty Management", function () {
    const customizationOptions = {
      allowColorChange: true,
      allowTextChange: true,
      allowSizeChange: false,
      allowEffectsChange: true,
      availableColors: ["red", "blue", "green"],
      maxTextLength: 50,
    };

    beforeEach(async function () {
      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker description",
          VEHICLE_DECORATION,
          RARE,
          false,
          0,
          customizationOptions,
          "ipfs://test",
          creator.address,
          500
        );
    });

    it("Should update token royalty", async function () {
      await expect(
        mooveNFT.connect(admin).updateTokenRoyalty(0, user2.address, 1000)
      )
        .to.emit(mooveNFT, "RoyaltyUpdated")
        .withArgs(0, user2.address, 1000);

      const [recipient, feeNumerator] = await mooveNFT.royaltyInfo(
        0,
        ethers.parseEther("1")
      );
      expect(recipient).to.equal(user2.address);
      expect(feeNumerator).to.equal(ethers.parseEther("0.1")); // 10%
    });

    it("Should fail updating royalty by non-admin", async function () {
      await expect(
        mooveNFT.connect(user1).updateTokenRoyalty(0, user2.address, 1000)
      ).to.be.reverted;
    });

    it("Should fail updating royalty for non-existent token", async function () {
      await expect(
        mooveNFT.connect(admin).updateTokenRoyalty(999, user2.address, 1000)
      ).to.be.reverted;
    });
  });

  describe("View Functions", function () {
    const customizationOptions = {
      allowColorChange: true,
      allowTextChange: true,
      allowSizeChange: false,
      allowEffectsChange: true,
      availableColors: ["red", "blue", "green"],
      maxTextLength: 50,
    };

    beforeEach(async function () {
      await mooveNFT
        .connect(admin)
        .mintStickerNFT(
          user1.address,
          "Test Sticker",
          "A test sticker description",
          VEHICLE_DECORATION,
          RARE,
          false,
          0,
          customizationOptions,
          "ipfs://test",
          creator.address,
          500
        );
    });

    it("Should get sticker details", async function () {
      const sticker = await mooveNFT.getSticker(0);
      expect(sticker.name).to.equal("Test Sticker");
      expect(sticker.creator).to.equal(admin.address);
      expect(sticker.category).to.equal(VEHICLE_DECORATION);
      expect(sticker.rarity).to.equal(RARE);
    });

    it("Should get customization history", async function () {
      await mooveNFT
        .connect(user1)
        .customizeSticker(
          0,
          "Changed color to red",
          "Red version",
          "ipfs://customized"
        );

      const history = await mooveNFT.getCustomizationHistory(0);
      expect(history.length).to.equal(1);
      expect(history[0].customizer).to.equal(user1.address);
      expect(history[0].changeDescription).to.equal("Changed color to red");
    });

    it("Should get creator stickers", async function () {
      const creatorStickers = await mooveNFT.getCreatorStickers(admin.address);
      expect(creatorStickers.length).to.equal(1);
      expect(creatorStickers[0]).to.equal(0);
    });

    it("Should check if sticker is customizable", async function () {
      const isCustomizable = await mooveNFT.isStickerCustomizable(0);
      expect(isCustomizable).to.be.true;
    });
  });

  describe("Pause and Unpause", function () {
    it("Should pause and unpause by admin", async function () {
      await expect(mooveNFT.connect(admin).pause()).to.not.be.reverted;
      expect(await mooveNFT.paused()).to.be.true;

      await expect(mooveNFT.connect(admin).unpause()).to.not.be.reverted;
      expect(await mooveNFT.paused()).to.be.false;
    });

    it("Should fail pause by non-pauser", async function () {
      await expect(mooveNFT.connect(user1).pause()).to.be.reverted;
    });

    it("Should fail unpause by non-admin", async function () {
      await mooveNFT.connect(admin).pause();
      await expect(mooveNFT.connect(user1).unpause()).to.be.reverted;
    });
  });

  describe("Interface Support", function () {
    it("Should support ERC721 interface", async function () {
      const erc721InterfaceId = "0x80ac58cd";
      expect(await mooveNFT.supportsInterface(erc721InterfaceId)).to.be.true;
    });

    it("Should support ERC721Metadata interface", async function () {
      const erc721MetadataInterfaceId = "0x5b5e139f";
      expect(await mooveNFT.supportsInterface(erc721MetadataInterfaceId)).to.be
        .true;
    });

    it("Should support ERC2981 interface", async function () {
      const erc2981InterfaceId = "0x2a55205a";
      expect(await mooveNFT.supportsInterface(erc2981InterfaceId)).to.be.true;
    });

    it("Should return false for unsupported interface", async function () {
      const unsupportedInterfaceId = "0x12345678";
      expect(await mooveNFT.supportsInterface(unsupportedInterfaceId)).to.be
        .false;
    });
  });
});
