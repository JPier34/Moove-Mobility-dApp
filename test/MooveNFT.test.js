const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("MooveNFT", function () {
  // ============= ENUMS =============
  const StickerCategory = {
    VEHICLE_DECORATION: 0,
    BRAND_LOGO: 1,
    ARTISTIC: 2,
    COMMEMORATIVE: 3,
    SPECIAL_EVENT: 4,
    COMMUNITY_BADGE: 5,
  };

  const StickerRarity = {
    COMMON: 0,
    UNCOMMON: 1,
    RARE: 2,
    EPIC: 3,
    LEGENDARY: 4,
    MYTHIC: 5,
  };

  // ============= FIXTURES =============
  async function deployMooveNFTFixture() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy MooveAccessControl first
    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );
    const accessControl = await MooveAccessControl.deploy(owner.address);
    await accessControl.waitForDeployment();

    // Deploy MooveNFT
    const MooveNFT = await ethers.getContractFactory("MooveNFT");
    const mooveNFT = await MooveNFT.deploy(
      "Moove Sticker NFT",
      "MST",
      await accessControl.getAddress()
    );
    await mooveNFT.waitForDeployment();

    // Authorize contract and grant roles
    await accessControl.authorizeContract(await mooveNFT.getAddress());

    const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
    await accessControl.grantRole(MINTER_ROLE, owner.address);

    return {
      mooveNFT,
      accessControl,
      owner,
      addr1,
      addr2,
      addr3,
      MINTER_ROLE,
    };
  }

  async function deployWithMintedNFT() {
    const fixture = await loadFixture(deployMooveNFTFixture);
    const { mooveNFT, owner, addr1 } = fixture;

    // Mint a simple NFT for testing
    await mooveNFT
      .connect(owner)
      .mintNFT(addr1.address, "ipfs://QmTestSticker123");

    return { ...fixture, tokenId: 1 };
  }

  // ============= DEPLOYMENT TESTS =============
  describe("Deployment", function () {
    it("Should set correct name and symbol", async function () {
      const { mooveNFT } = await loadFixture(deployMooveNFTFixture);

      expect(await mooveNFT.name()).to.equal("Moove Sticker NFT");
      expect(await mooveNFT.symbol()).to.equal("MST");
    });

    it("Should initialize with zero total supply", async function () {
      const { mooveNFT } = await loadFixture(deployMooveNFTFixture);
      expect(await mooveNFT.totalSupply()).to.equal(1); // Counter starts at 1
    });

    it("Should set correct access control", async function () {
      const { mooveNFT, accessControl } = await loadFixture(
        deployMooveNFTFixture
      );
      expect(await mooveNFT.accessControl()).to.equal(
        await accessControl.getAddress()
      );
    });
  });

  // ============= MINTING TESTS =============
  describe("Minting", function () {
    it("Should mint simple NFT successfully", async function () {
      const { mooveNFT, owner, addr1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await expect(
        mooveNFT
          .connect(owner)
          .mintNFT(addr1.address, "ipfs://QmTestSticker123")
      ).to.emit(mooveNFT, "StickerMinted");

      expect(await mooveNFT.balanceOf(addr1.address)).to.equal(1);
      expect(await mooveNFT.ownerOf(1)).to.equal(addr1.address);
    });

    it("Should fail minting without MINTER_ROLE", async function () {
      const { mooveNFT, addr1 } = await loadFixture(deployMooveNFTFixture);

      await expect(
        mooveNFT.connect(addr1).mintNFT(addr1.address, "ipfs://test")
      ).to.be.revertedWith("Access denied");
    });

    it("Should mint advanced sticker NFT successfully", async function () {
      const { mooveNFT, owner, addr1 } = await loadFixture(
        deployMooveNFTFixture
      );

      const customizationOptions = {
        allowColorChange: true,
        allowTextChange: true,
        allowSizeChange: false,
        allowEffectsChange: false,
        availableColors: ["#FF0000", "#00FF00", "#0000FF"],
        maxTextLength: 50,
      };

      await expect(
        mooveNFT.connect(owner).mintStickerNFT(
          addr1.address,
          "Epic Dragon",
          "Limited edition dragon sticker",
          StickerCategory.ARTISTIC,
          StickerRarity.EPIC,
          true, // isLimitedEdition
          100, // editionSize
          customizationOptions,
          "ipfs://QmEpicDragon123",
          addr1.address, // royalty recipient
          500 // 5% royalty
        )
      ).to.emit(mooveNFT, "StickerMinted");

      expect(await mooveNFT.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should batch mint limited edition", async function () {
      const { mooveNFT, owner, addr1, addr2 } = await loadFixture(
        deployMooveNFTFixture
      );

      const recipients = [addr1.address, addr2.address];
      const tokenURIs = ["ipfs://QmTest1", "ipfs://QmTest2"];

      const customizationOptions = {
        allowColorChange: true,
        allowTextChange: false,
        allowSizeChange: false,
        allowEffectsChange: false,
        availableColors: ["#FF0000"],
        maxTextLength: 0,
      };

      await mooveNFT.connect(owner).batchMintLimitedEdition(
        recipients,
        "Limited Series",
        "Special limited series",
        StickerCategory.COMMEMORATIVE,
        StickerRarity.RARE,
        2, // editionSize
        customizationOptions,
        tokenURIs,
        owner.address,
        250 // 2.5% royalty
      );

      expect(await mooveNFT.balanceOf(addr1.address)).to.equal(1);
      expect(await mooveNFT.balanceOf(addr2.address)).to.equal(1);
    });

    it("Should require valid parameters", async function () {
      const { mooveNFT, owner } = await loadFixture(deployMooveNFTFixture);

      // Invalid recipient
      await expect(
        mooveNFT.connect(owner).mintNFT(ethers.ZeroAddress, "ipfs://test")
      ).to.be.revertedWith("Invalid recipient address");

      // Empty token URI
      await expect(
        mooveNFT.connect(owner).mintNFT(owner.address, "")
      ).to.be.revertedWith("Token URI required");
    });
  });

  // ============= STICKER MANAGEMENT =============
  describe("Sticker Management", function () {
    it("Should get sticker details", async function () {
      const { mooveNFT, owner, addr1 } = await loadFixture(
        deployMooveNFTFixture
      );

      const customizationOptions = {
        allowColorChange: true,
        allowTextChange: true,
        allowSizeChange: false,
        allowEffectsChange: false,
        availableColors: ["#FF0000"],
        maxTextLength: 50,
      };

      await mooveNFT
        .connect(owner)
        .mintStickerNFT(
          addr1.address,
          "Test Sticker",
          "A test sticker",
          StickerCategory.VEHICLE_DECORATION,
          StickerRarity.COMMON,
          false,
          0,
          customizationOptions,
          "ipfs://QmTestSticker",
          ethers.ZeroAddress,
          0
        );

      const sticker = await mooveNFT.getSticker(1);
      expect(sticker.name).to.equal("Test Sticker");
      expect(sticker.category).to.equal(StickerCategory.VEHICLE_DECORATION);
      expect(sticker.rarity).to.equal(StickerRarity.COMMON);
      expect(sticker.creator).to.equal(owner.address);
    });

    it("Should check customizable status", async function () {
      const { mooveNFT, tokenId } = await loadFixture(deployWithMintedNFT);

      // Simple NFT should not be customizable by default
      expect(await mooveNFT.isCustomizable(tokenId)).to.be.true; // mintNFT creates customizable stickers
    });

    it("Should get customization history", async function () {
      const { mooveNFT, tokenId } = await loadFixture(deployWithMintedNFT);

      const history = await mooveNFT.getCustomizationHistory(tokenId);
      expect(history.length).to.equal(0); // No customizations yet
    });

    it("Should check if sticker has been customized", async function () {
      const { mooveNFT, tokenId } = await loadFixture(deployWithMintedNFT);

      expect(await mooveNFT.hasBeenCustomized(tokenId)).to.be.false;
    });
  });

  // ============= CUSTOMIZATION TESTS =============
  describe("Customization", function () {
    it("Should customize sticker successfully", async function () {
      const { mooveNFT, addr1, tokenId } = await loadFixture(
        deployWithMintedNFT
      );

      await expect(
        mooveNFT
          .connect(addr1)
          .customizeSticker(
            tokenId,
            "Changed color to red",
            "Color updated",
            "ipfs://QmNewCustomizedSticker"
          )
      ).to.emit(mooveNFT, "StickerCustomized");

      expect(await mooveNFT.hasBeenCustomized(tokenId)).to.be.true;

      const history = await mooveNFT.getCustomizationHistory(tokenId);
      expect(history.length).to.equal(1);
      expect(history[0].customizer).to.equal(addr1.address);
    });

    it("Should fail customization if not owner", async function () {
      const { mooveNFT, addr2, tokenId } = await loadFixture(
        deployWithMintedNFT
      );

      await expect(
        mooveNFT
          .connect(addr2)
          .customizeSticker(
            tokenId,
            "Unauthorized change",
            "Hacked",
            "ipfs://QmHacked"
          )
      ).to.be.revertedWith("Access denied");
    });

    it("Should update customization options (admin only)", async function () {
      const { mooveNFT, owner, tokenId } = await loadFixture(
        deployWithMintedNFT
      );

      const newOptions = {
        allowColorChange: false,
        allowTextChange: true,
        allowSizeChange: true,
        allowEffectsChange: true,
        availableColors: ["#00FF00", "#0000FF"],
        maxTextLength: 100,
      };

      await expect(
        mooveNFT.connect(owner).updateCustomizationOptions(tokenId, newOptions)
      ).to.emit(mooveNFT, "CustomizationOptionsUpdated");
    });
  });

  // ============= ROYALTY MANAGEMENT =============
  describe("Royalty Management", function () {
    it("Should update token royalty", async function () {
      const { mooveNFT, owner, addr1, tokenId } = await loadFixture(
        deployWithMintedNFT
      );

      await expect(
        mooveNFT.connect(owner).updateTokenRoyalty(tokenId, addr1.address, 750) // 7.5%
      ).to.emit(mooveNFT, "RoyaltyUpdated");
    });

    it("Should update default royalty", async function () {
      const { mooveNFT, owner, addr1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT.connect(owner).updateDefaultRoyalty(addr1.address, 500); // 5%
    });

    it("Should fail royalty update with high percentage", async function () {
      const { mooveNFT, owner, addr1, tokenId } = await loadFixture(
        deployWithMintedNFT
      );

      await expect(
        mooveNFT.connect(owner).updateTokenRoyalty(tokenId, addr1.address, 1500) // 15% - too high
      ).to.be.revertedWith("Royalty too high");
    });

    it("Should fail royalty update without permission", async function () {
      const { mooveNFT, addr2, tokenId } = await loadFixture(
        deployWithMintedNFT
      );

      await expect(
        mooveNFT.connect(addr2).updateTokenRoyalty(tokenId, addr2.address, 500)
      ).to.be.revertedWith("Not creator or admin");
    });
  });

  // ============= VIEW FUNCTIONS =============
  describe("View Functions", function () {
    it("Should get user stickers", async function () {
      const { mooveNFT, owner, addr1 } = await loadFixture(
        deployMooveNFTFixture
      );

      // Mint multiple stickers
      await mooveNFT.connect(owner).mintNFT(addr1.address, "ipfs://test1");
      await mooveNFT.connect(owner).mintNFT(addr1.address, "ipfs://test2");

      const userStickers = await mooveNFT.getUserStickers(addr1.address);
      expect(userStickers.length).to.equal(2);
      expect(userStickers).to.include(1n);
      expect(userStickers).to.include(2n);
    });

    it("Should get creator stickers", async function () {
      const { mooveNFT, owner, addr1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT.connect(owner).mintNFT(addr1.address, "ipfs://test1");
      await mooveNFT.connect(owner).mintNFT(addr1.address, "ipfs://test2");

      const creatorStickers = await mooveNFT.getCreatorStickers(owner.address);
      expect(creatorStickers.length).to.equal(2);
    });

    it("Should get total supply", async function () {
      const { mooveNFT, owner, addr1 } = await loadFixture(
        deployMooveNFTFixture
      );

      await mooveNFT.connect(owner).mintNFT(addr1.address, "ipfs://test1");
      await mooveNFT.connect(owner).mintNFT(addr1.address, "ipfs://test2");

      expect(await mooveNFT.totalSupply()).to.equal(2);
    });

    it("Should get customization count", async function () {
      const { mooveNFT, addr1, tokenId } = await loadFixture(
        deployWithMintedNFT
      );

      expect(await mooveNFT.getCustomizationCount(tokenId)).to.equal(0);

      // Add a customization
      await mooveNFT
        .connect(addr1)
        .customizeSticker(
          tokenId,
          "Test change",
          "Updated",
          "ipfs://QmUpdated"
        );

      expect(await mooveNFT.getCustomizationCount(tokenId)).to.equal(1);
    });

    it("Should check marketplace approval", async function () {
      const { mooveNFT, addr1, addr2, tokenId } = await loadFixture(
        deployWithMintedNFT
      );

      // Initially not approved
      expect(await mooveNFT.isApprovedForMarketplace(tokenId, addr2.address)).to
        .be.false;

      // Approve for marketplace
      await mooveNFT.connect(addr1).approve(addr2.address, tokenId);

      expect(await mooveNFT.isApprovedForMarketplace(tokenId, addr2.address)).to
        .be.true;
    });

    it("Should batch approve tokens", async function () {
      const { mooveNFT, owner, addr1, addr2 } = await loadFixture(
        deployMooveNFTFixture
      );

      // Mint multiple tokens
      await mooveNFT.connect(owner).mintNFT(addr1.address, "ipfs://test1");
      await mooveNFT.connect(owner).mintNFT(addr1.address, "ipfs://test2");

      await mooveNFT.connect(addr1).batchApprove(addr2.address, [1, 2]);

      expect(await mooveNFT.getApproved(1)).to.equal(addr2.address);
      expect(await mooveNFT.getApproved(2)).to.equal(addr2.address);
    });
  });

  // ============= BURNING TESTS =============
  describe("Burning", function () {
    it("Should burn NFT successfully", async function () {
      const { mooveNFT, owner, addr1, tokenId } = await loadFixture(
        deployWithMintedNFT
      );

      await mooveNFT.connect(owner).burnNFT(tokenId);

      await expect(mooveNFT.ownerOf(tokenId)).to.be.revertedWith(
        "ERC721NonexistentToken"
      );
    });

    it("Should emergency burn with reason", async function () {
      const { mooveNFT, owner, tokenId } = await loadFixture(
        deployWithMintedNFT
      );

      await expect(
        mooveNFT.connect(owner).emergencyBurn(tokenId, "Content violation")
      ).to.emit(mooveNFT, "EmergencyBurn");
    });

    it("Should fail burn without permission", async function () {
      const { mooveNFT, addr2, tokenId } = await loadFixture(
        deployWithMintedNFT
      );

      await expect(mooveNFT.connect(addr2).burnNFT(tokenId)).to.be.revertedWith(
        "Not authorized to burn"
      );
    });
  });

  // ============= PAUSE FUNCTIONALITY =============
  describe("Pause Functionality", function () {
    it("Should pause and unpause contract", async function () {
      const { mooveNFT, owner, addr1 } = await loadFixture(
        deployMooveNFTFixture
      );

      // Grant PAUSER_ROLE to owner
      const PAUSER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("PAUSER_ROLE"));
      await mooveNFT.accessControl().grantRole(PAUSER_ROLE, owner.address);

      // Pause
      await mooveNFT.connect(owner).pause();
      expect(await mooveNFT.paused()).to.be.true;

      // Should fail to mint when paused
      await expect(
        mooveNFT.connect(owner).mintNFT(addr1.address, "ipfs://test")
      ).to.be.revertedWithCustomError(mooveNFT, "EnforcedPause");

      // Unpause
      await mooveNFT.connect(owner).unpause();
      expect(await mooveNFT.paused()).to.be.false;
    });
  });

  // ============= EDGE CASES =============
  describe("Edge Cases", function () {
    it("Should handle non-existent token queries", async function () {
      const { mooveNFT } = await loadFixture(deployMooveNFTFixture);

      await expect(mooveNFT.getSticker(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });

    it("Should handle empty user queries", async function () {
      const { mooveNFT, addr1 } = await loadFixture(deployMooveNFTFixture);

      const userStickers = await mooveNFT.getUserStickers(addr1.address);
      expect(userStickers.length).to.equal(0);
    });

    it("Should handle batch operations with empty arrays", async function () {
      const { mooveNFT, owner } = await loadFixture(deployMooveNFTFixture);

      const customizationOptions = {
        allowColorChange: false,
        allowTextChange: false,
        allowSizeChange: false,
        allowEffectsChange: false,
        availableColors: [],
        maxTextLength: 0,
      };

      // Empty batch should not revert
      await expect(
        mooveNFT.connect(owner).batchMintLimitedEdition(
          [], // empty recipients
          "Empty Edition",
          "Test empty",
          StickerCategory.ARTISTIC,
          StickerRarity.COMMON,
          0, // editionSize 0
          customizationOptions,
          [], // empty URIs
          owner.address,
          0
        )
      ).to.not.be.reverted;
    });
  });

  // ============= INTERFACE SUPPORT =============
  describe("Interface Support", function () {
    it("Should support required interfaces", async function () {
      const { mooveNFT } = await loadFixture(deployMooveNFTFixture);

      // ERC721
      expect(await mooveNFT.supportsInterface("0x80ac58cd")).to.be.true;
      // ERC721Metadata
      expect(await mooveNFT.supportsInterface("0x5b5e139f")).to.be.true;
      // ERC721Royalty (EIP-2981)
      expect(await mooveNFT.supportsInterface("0x2a55205a")).to.be.true;
    });

    it("Should have correct token URI", async function () {
      const { mooveNFT, tokenId } = await loadFixture(deployWithMintedNFT);

      const tokenURI = await mooveNFT.tokenURI(tokenId);
      expect(tokenURI).to.equal("ipfs://QmTestSticker123");
    });
  });
});
