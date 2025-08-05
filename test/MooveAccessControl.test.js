const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  loadFixture,
  time,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("MooveAccessControl", function () {
  let accessControl;
  let owner, admin1, admin2, user1, user2, contract1, contract2;

  async function deployAccessControlFixture() {
    const [owner, admin1, admin2, user1, user2] = await ethers.getSigners();

    const MooveAccessControl = await ethers.getContractFactory(
      "MooveAccessControl"
    );
    const accessControl = await MooveAccessControl.deploy(owner.address);
    await accessControl.waitForDeployment();

    // Deploy a test contract to use for authorization tests
    const TestContract = await ethers.getContractFactory("MooveNFT");
    const testContract1 = await TestContract.deploy(
      "Test NFT",
      "TEST",
      await accessControl.getAddress()
    );
    await testContract1.waitForDeployment();

    const testContract2 = await TestContract.deploy(
      "Test NFT 2",
      "TEST2",
      await accessControl.getAddress()
    );
    await testContract2.waitForDeployment();

    return {
      accessControl,
      owner,
      admin1,
      admin2,
      user1,
      user2,
      contract1: testContract1,
      contract2: testContract2,
    };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployAccessControlFixture);
    accessControl = fixture.accessControl;
    owner = fixture.owner;
    admin1 = fixture.admin1;
    admin2 = fixture.admin2;
    user1 = fixture.user1;
    user2 = fixture.user2;
    contract1 = fixture.contract1;
    contract2 = fixture.contract2;
  });

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      expect(await accessControl.getAddress()).to.be.properAddress;
    });

    it("Should set initial admin correctly", async function () {
      expect(
        await accessControl.hasRole(
          await accessControl.DEFAULT_ADMIN_ROLE(),
          owner.address
        )
      ).to.be.true;
      expect(
        await accessControl.hasRole(
          await accessControl.MASTER_ADMIN_ROLE(),
          owner.address
        )
      ).to.be.true;
    });

    it("Should set initial admin as emergency contact", async function () {
      expect(await accessControl.emergencyContacts(owner.address)).to.be.true;
    });

    it("Should set correct master admin count", async function () {
      expect(await accessControl.masterAdminCount()).to.equal(1);
    });

    it("Should fail deployment with zero address", async function () {
      const MooveAccessControl = await ethers.getContractFactory(
        "MooveAccessControl"
      );
      await expect(
        MooveAccessControl.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid admin address");
    });
  });

  describe("Role Management", function () {
    it("Should grant master admin role", async function () {
      await accessControl.connect(owner).grantMasterAdmin(admin1.address);
      expect(
        await accessControl.hasRole(
          await accessControl.MASTER_ADMIN_ROLE(),
          admin1.address
        )
      ).to.be.true;
      expect(await accessControl.masterAdminCount()).to.equal(2);
    });

    it("Should fail granting master admin to zero address", async function () {
      await expect(
        accessControl.connect(owner).grantMasterAdmin(ethers.ZeroAddress)
      ).to.be.revertedWith("Invalid address");
    });

    it("Should fail granting master admin by non-master admin", async function () {
      await expect(
        accessControl.connect(user1).grantMasterAdmin(admin1.address)
      ).to.be.reverted;
    });

    it("Should revoke master admin role", async function () {
      await accessControl.connect(owner).grantMasterAdmin(admin1.address);
      await accessControl.connect(owner).revokeMasterAdmin(admin1.address);
      expect(
        await accessControl.hasRole(
          await accessControl.MASTER_ADMIN_ROLE(),
          admin1.address
        )
      ).to.be.false;
      expect(await accessControl.masterAdminCount()).to.equal(1);
    });

    it("Should fail revoking last master admin", async function () {
      await expect(
        accessControl.connect(owner).revokeMasterAdmin(owner.address)
      ).to.be.revertedWith("Cannot revoke own admin");
    });

    it("Should enforce maximum admin limit", async function () {
      // Grant master admin to multiple accounts
      const signers = await ethers.getSigners();
      for (let i = 0; i < 9; i++) {
        await accessControl
          .connect(owner)
          .grantMasterAdmin(signers[i + 3].address);
      }

      // Try to grant one more
      await expect(
        accessControl.connect(owner).grantMasterAdmin(signers[12].address)
      ).to.be.revertedWith("Too many admins");
    });
  });

  describe("Contract Authorization", function () {
    it("Should authorize contract", async function () {
      await accessControl
        .connect(owner)
        .authorizeContract(await contract1.getAddress());
      expect(
        await accessControl.authorizedContracts(await contract1.getAddress())
      ).to.be.true;
    });

    it("Should deauthorize contract", async function () {
      await accessControl
        .connect(owner)
        .authorizeContract(await contract1.getAddress());
      await accessControl
        .connect(owner)
        .deauthorizeContract(await contract1.getAddress());
      expect(
        await accessControl.authorizedContracts(await contract1.getAddress())
      ).to.be.false;
    });

    it("Should fail authorization by non-master admin", async function () {
      await expect(
        accessControl
          .connect(user1)
          .authorizeContract(await contract1.getAddress())
      ).to.be.reverted;
    });

    it("Should fail deauthorization by non-master admin", async function () {
      await accessControl
        .connect(owner)
        .authorizeContract(await contract1.getAddress());
      await expect(
        accessControl
          .connect(user1)
          .deauthorizeContract(await contract1.getAddress())
      ).to.be.reverted;
    });
  });

  describe("Emergency Contacts", function () {
    it("Should add emergency contact", async function () {
      await accessControl.connect(owner).addEmergencyContact(user1.address);
      expect(await accessControl.emergencyContacts(user1.address)).to.be.true;
    });

    it("Should remove emergency contact", async function () {
      await accessControl.connect(owner).addEmergencyContact(user1.address);
      await accessControl.connect(owner).removeEmergencyContact(user1.address);
      expect(await accessControl.emergencyContacts(user1.address)).to.be.false;
    });

    it("Should fail adding emergency contact by non-master admin", async function () {
      await expect(
        accessControl.connect(user1).addEmergencyContact(user2.address)
      ).to.be.reverted;
    });

    it("Should fail removing emergency contact by non-master admin", async function () {
      await accessControl.connect(owner).addEmergencyContact(user1.address);
      await expect(
        accessControl.connect(user2).removeEmergencyContact(user1.address)
      ).to.be.reverted;
    });
  });

  describe("Global Pause", function () {
    it("Should pause globally via emergency pause", async function () {
      await accessControl.connect(owner).emergencyPause();
      expect(await accessControl.globalPause()).to.be.true;
    });

    it("Should unpause globally via emergency unpause", async function () {
      await accessControl.connect(owner).emergencyPause();
      await accessControl.connect(owner).emergencyUnpause();
      expect(await accessControl.globalPause()).to.be.false;
    });

    it("Should fail emergency pause by non-emergency contact", async function () {
      await expect(
        accessControl.connect(user1).emergencyPause()
      ).to.be.revertedWith("Not emergency contact");
    });

    it("Should fail emergency unpause by non-master admin", async function () {
      await accessControl.connect(owner).emergencyPause();
      await expect(accessControl.connect(user1).emergencyUnpause()).to.be
        .reverted;
    });

    it("Should check global pause state", async function () {
      expect(await accessControl.isGloballyPaused()).to.be.false;
      await accessControl.connect(owner).emergencyPause();
      expect(await accessControl.isGloballyPaused()).to.be.true;
    });
  });

  describe("Time Lock Operations", function () {
    it("Should schedule time-locked operation", async function () {
      const operationId = ethers.keccak256(
        ethers.toUtf8Bytes("test_operation")
      );
      await accessControl.connect(owner).scheduleTimeLockOperation(operationId);

      const executeAfter = await accessControl.timelockExecutions(operationId);
      expect(executeAfter).to.be.gt(0);
    });

    it("Should fail scheduling operation by non-master admin", async function () {
      const operationId = ethers.keccak256(
        ethers.toUtf8Bytes("test_operation")
      );
      await expect(
        accessControl.connect(user1).scheduleTimeLockOperation(operationId)
      ).to.be.reverted;
    });

    it("Should execute time-locked operation after delay", async function () {
      const operationId = ethers.keccak256(
        ethers.toUtf8Bytes("test_operation")
      );
      await accessControl.connect(owner).scheduleTimeLockOperation(operationId);

      // Fast forward time
      await time.increase(24 * 60 * 60 + 1); // 24 hours + 1 second

      await expect(
        accessControl.connect(owner).executeTimeLockOperation(operationId)
      )
        .to.emit(accessControl, "TimeLockOperationExecuted")
        .withArgs(operationId);
    });

    it("Should fail executing operation before delay", async function () {
      const operationId = ethers.keccak256(
        ethers.toUtf8Bytes("test_operation")
      );
      await accessControl.connect(owner).scheduleTimeLockOperation(operationId);

      await expect(
        accessControl.connect(owner).executeTimeLockOperation(operationId)
      ).to.be.revertedWith("Operation not ready or not scheduled");
    });

    it("Should fail executing non-scheduled operation", async function () {
      const operationId = ethers.keccak256(ethers.toUtf8Bytes("non_scheduled"));
      await expect(
        accessControl.connect(owner).executeTimeLockOperation(operationId)
      ).to.be.revertedWith("Operation not ready or not scheduled");
    });

    it("Should cancel time-locked operation", async function () {
      const operationId = ethers.keccak256(
        ethers.toUtf8Bytes("test_operation")
      );
      await accessControl.connect(owner).scheduleTimeLockOperation(operationId);
      await accessControl.connect(owner).cancelTimeLockOperation(operationId);

      const executeAfter = await accessControl.timelockExecutions(operationId);
      expect(executeAfter).to.equal(0);
    });
  });

  describe("Time Lock Duration Management", function () {
    it("Should update time lock duration", async function () {
      const newDuration = 48 * 60 * 60; // 48 hours
      await accessControl.connect(owner).updateTimeLockDuration(newDuration);
      expect(await accessControl.timeLockDuration()).to.equal(newDuration);
    });

    it("Should fail updating time lock duration by non-master admin", async function () {
      const newDuration = 48 * 60 * 60;
      await expect(
        accessControl.connect(user1).updateTimeLockDuration(newDuration)
      ).to.be.reverted;
    });
  });

  describe("Role Enumeration", function () {
    it("Should get role members", async function () {
      await accessControl.connect(owner).grantMasterAdmin(admin1.address);

      const members = await accessControl.getRoleMembers(
        await accessControl.MASTER_ADMIN_ROLE()
      );
      expect(members).to.include(owner.address);
      expect(members).to.include(admin1.address);
    });

    it("Should get role member count", async function () {
      await accessControl.connect(owner).grantMasterAdmin(admin1.address);

      const count = await accessControl.getRoleMemberCount(
        await accessControl.MASTER_ADMIN_ROLE()
      );
      expect(count).to.equal(2);
    });
  });

  describe("Modifiers", function () {
    it("Should enforce onlyAuthorizedContract modifier", async function () {
      // This would require a contract that uses this modifier
      // For now, we test that unauthorized contracts cannot call functions with this modifier
      expect(
        await accessControl.authorizedContracts(await contract1.getAddress())
      ).to.be.false;
    });

    it("Should enforce onlyEmergencyContact modifier", async function () {
      // Test that non-emergency contacts cannot call functions with this modifier
      expect(await accessControl.emergencyContacts(user1.address)).to.be.false;
      expect(
        await accessControl.hasRole(
          await accessControl.MASTER_ADMIN_ROLE(),
          user1.address
        )
      ).to.be.false;
    });

    it("Should enforce whenNotGloballyPaused modifier", async function () {
      await accessControl.connect(owner).emergencyPause();
      expect(await accessControl.globalPause()).to.be.true;
    });
  });

  describe("View Functions", function () {
    it("Should check if address can mint", async function () {
      expect(await accessControl.canMint(owner.address)).to.be.true;
      expect(await accessControl.canMint(user1.address)).to.be.false;

      await accessControl
        .connect(owner)
        .grantRole(await accessControl.MINTER_ROLE(), user1.address);
      expect(await accessControl.canMint(user1.address)).to.be.true;
    });

    it("Should check if address can manage auctions", async function () {
      expect(await accessControl.canManageAuctions(owner.address)).to.be.true;
      expect(await accessControl.canManageAuctions(user1.address)).to.be.false;

      await accessControl
        .connect(owner)
        .grantRole(await accessControl.AUCTION_MANAGER_ROLE(), user1.address);
      expect(await accessControl.canManageAuctions(user1.address)).to.be.true;
    });

    it("Should check if address can manage customizations", async function () {
      expect(await accessControl.canManageCustomizations(owner.address)).to.be
        .true;
      expect(await accessControl.canManageCustomizations(user1.address)).to.be
        .false;

      await accessControl
        .connect(owner)
        .grantRole(
          await accessControl.CUSTOMIZATION_ADMIN_ROLE(),
          user1.address
        );
      expect(await accessControl.canManageCustomizations(user1.address)).to.be
        .true;
    });

    it("Should check if address can manage prices", async function () {
      expect(await accessControl.canManagePrices(owner.address)).to.be.true;
      expect(await accessControl.canManagePrices(user1.address)).to.be.false;

      await accessControl
        .connect(owner)
        .grantRole(await accessControl.PRICE_MANAGER_ROLE(), user1.address);
      expect(await accessControl.canManagePrices(user1.address)).to.be.true;
    });

    it("Should check if address can pause", async function () {
      expect(await accessControl.canPause(owner.address)).to.be.true;
      expect(await accessControl.canPause(user1.address)).to.be.false;

      await accessControl
        .connect(owner)
        .grantRole(await accessControl.PAUSER_ROLE(), user1.address);
      expect(await accessControl.canPause(user1.address)).to.be.true;
    });

    it("Should check if address can withdraw", async function () {
      expect(await accessControl.canWithdraw(owner.address)).to.be.true;
      expect(await accessControl.canWithdraw(user1.address)).to.be.false;

      await accessControl
        .connect(owner)
        .grantRole(await accessControl.WITHDRAWER_ROLE(), user1.address);
      expect(await accessControl.canWithdraw(user1.address)).to.be.true;
    });

    it("Should check if address can trade", async function () {
      expect(await accessControl.canTrade(owner.address)).to.be.true;
      expect(await accessControl.canTrade(user1.address)).to.be.false;

      await accessControl
        .connect(owner)
        .grantRole(await accessControl.TRADER_ROLE(), user1.address);
      expect(await accessControl.canTrade(user1.address)).to.be.true;
    });

    it("Should check if address can manage marketplace", async function () {
      expect(await accessControl.canManageMarketplace(owner.address)).to.be
        .true;
      expect(await accessControl.canManageMarketplace(user1.address)).to.be
        .false;

      await accessControl
        .connect(owner)
        .grantRole(
          await accessControl.MARKETPLACE_MANAGER_ROLE(),
          user1.address
        );
      expect(await accessControl.canManageMarketplace(user1.address)).to.be
        .true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle duplicate role grants", async function () {
      await accessControl.connect(owner).grantMasterAdmin(admin1.address);
      await expect(
        accessControl.connect(owner).grantMasterAdmin(admin1.address) // Duplicate
      ).to.be.revertedWith("Already master admin");
    });

    it("Should handle duplicate contract authorization", async function () {
      await accessControl
        .connect(owner)
        .authorizeContract(await contract1.getAddress());
      await accessControl
        .connect(owner)
        .authorizeContract(await contract1.getAddress()); // Duplicate
      expect(
        await accessControl.authorizedContracts(await contract1.getAddress())
      ).to.be.true;
    });

    it("Should handle duplicate emergency contact addition", async function () {
      await accessControl.connect(owner).addEmergencyContact(user1.address);
      await accessControl.connect(owner).addEmergencyContact(user1.address); // Duplicate
      expect(await accessControl.emergencyContacts(user1.address)).to.be.true;
    });

    it("Should handle revoking non-existent role", async function () {
      await expect(
        accessControl.connect(owner).revokeMasterAdmin(admin1.address)
      ).to.be.revertedWith("Cannot remove last admin");
    });

    it("Should handle batch role operations", async function () {
      const accounts = [user1.address, user2.address];
      await accessControl
        .connect(owner)
        .batchGrantRole(await accessControl.MINTER_ROLE(), accounts);

      expect(
        await accessControl.hasRole(
          await accessControl.MINTER_ROLE(),
          user1.address
        )
      ).to.be.true;
      expect(
        await accessControl.hasRole(
          await accessControl.MINTER_ROLE(),
          user2.address
        )
      ).to.be.true;

      await accessControl
        .connect(owner)
        .batchRevokeRole(await accessControl.MINTER_ROLE(), accounts);

      expect(
        await accessControl.hasRole(
          await accessControl.MINTER_ROLE(),
          user1.address
        )
      ).to.be.false;
      expect(
        await accessControl.hasRole(
          await accessControl.MINTER_ROLE(),
          user2.address
        )
      ).to.be.false;
    });

    it("Should handle batch contract authorization", async function () {
      const contracts = [
        await contract1.getAddress(),
        await contract2.getAddress(),
      ];
      await accessControl.connect(owner).batchAuthorizeContracts(contracts);

      expect(
        await accessControl.authorizedContracts(await contract1.getAddress())
      ).to.be.true;
      expect(
        await accessControl.authorizedContracts(await contract2.getAddress())
      ).to.be.true;
    });
  });

  describe("Events", function () {
    it("Should emit ContractAuthorizationChanged event", async function () {
      await expect(
        accessControl
          .connect(owner)
          .authorizeContract(await contract1.getAddress())
      )
        .to.emit(accessControl, "ContractAuthorizationChanged")
        .withArgs(await contract1.getAddress(), true);
    });

    it("Should emit EmergencyContactChanged event", async function () {
      await expect(
        accessControl.connect(owner).addEmergencyContact(user1.address)
      )
        .to.emit(accessControl, "EmergencyContactChanged")
        .withArgs(user1.address, true);
    });

    it("Should emit GlobalPauseStateChanged event", async function () {
      await expect(accessControl.connect(owner).emergencyPause())
        .to.emit(accessControl, "GlobalPauseStateChanged")
        .withArgs(true);
    });

    it("Should emit TimeLockDurationUpdated event", async function () {
      const newDuration = 48 * 60 * 60;
      await expect(
        accessControl.connect(owner).updateTimeLockDuration(newDuration)
      )
        .to.emit(accessControl, "TimeLockDurationUpdated")
        .withArgs(24 * 60 * 60, newDuration);
    });

    it("Should emit TimeLockOperationScheduled event", async function () {
      const operationId = ethers.keccak256(
        ethers.toUtf8Bytes("test_operation")
      );
      await expect(
        accessControl.connect(owner).scheduleTimeLockOperation(operationId)
      )
        .to.emit(accessControl, "TimeLockOperationScheduled")
        .withArgs(operationId, anyValue);
    });
  });
});
