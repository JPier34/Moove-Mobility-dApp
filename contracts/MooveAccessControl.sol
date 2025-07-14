// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MooveAccessControl
 * @dev Centralized access control system for the Moove ecosystem
 * @notice Manages roles, permissions, and security features across all Moove contracts
 */
contract MooveAccessControl is AccessControl, Pausable, ReentrancyGuard {
    // ============= ROLE DEFINITIONS =============

    /// @dev Master admin role - can grant/revoke all other roles
    bytes32 public constant MASTER_ADMIN_ROLE = keccak256("MASTER_ADMIN_ROLE");

    /// @dev NFT minting permissions
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Auction and marketplace management
    bytes32 public constant AUCTION_MANAGER_ROLE =
        keccak256("AUCTION_MANAGER_ROLE");

    /// @dev Vehicle customization management
    bytes32 public constant CUSTOMIZATION_ADMIN_ROLE =
        keccak256("CUSTOMIZATION_ADMIN_ROLE");

    /// @dev Price and fee management
    bytes32 public constant PRICE_MANAGER_ROLE =
        keccak256("PRICE_MANAGER_ROLE");

    /// @dev Emergency pause permissions
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    /// @dev Fund withdrawal permissions
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");

    /// @dev Contract upgrade permissions
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    /// @dev Metadata management permissions
    bytes32 public constant METADATA_MANAGER_ROLE =
        keccak256("METADATA_MANAGER_ROLE");

    // ============= STATE VARIABLES =============

    /// @dev Mapping to track authorized contract addresses
    mapping(address => bool) public authorizedContracts;

    /// @dev Mapping to track emergency contacts
    mapping(address => bool) public emergencyContacts;

    /// @dev Time lock duration for critical operations (in seconds)
    uint256 public timeLockDuration = 24 hours;

    /// @dev Mapping to track time-locked operations
    mapping(bytes32 => uint256) public timelockExecutions;

    /// @dev Mapping to track role members for enumeration (if needed)
    mapping(bytes32 => address[]) private _roleMembers;
    mapping(bytes32 => mapping(address => uint256)) private _roleMemberIndex;

    /// @dev Global pause state that affects all contracts
    bool public globalPause = false;

    /// @dev Maximum number of admins allowed
    uint256 public constant MAX_ADMINS = 10;

    /// @dev Current number of master admins
    uint256 public masterAdminCount = 0;

    // ============= EVENTS =============

    /**
     * @dev Emitted when a contract is authorized or deauthorized
     */
    event ContractAuthorizationChanged(
        address indexed contractAddress,
        bool authorized
    );

    /**
     * @dev Emitted when an emergency contact is added or removed
     */
    event EmergencyContactChanged(address indexed contact, bool added);

    /**
     * @dev Emitted when timelock duration is updated
     */
    event TimeLockDurationUpdated(uint256 oldDuration, uint256 newDuration);

    /**
     * @dev Emitted when a time-locked operation is scheduled
     */
    event TimeLockOperationScheduled(
        bytes32 indexed operationId,
        uint256 executeAfter
    );

    /**
     * @dev Emitted when a time-locked operation is executed
     */
    event TimeLockOperationExecuted(bytes32 indexed operationId);

    /**
     * @dev Emitted when global pause state changes
     */
    event GlobalPauseStateChanged(bool paused);

    // ============= MODIFIERS =============

    /**
     * @dev Modifier to check if caller is an authorized contract
     */
    modifier onlyAuthorizedContract() {
        require(authorizedContracts[msg.sender], "Not authorized contract");
        _;
    }

    /**
     * @dev Modifier to check if caller is emergency contact
     */
    modifier onlyEmergencyContact() {
        require(
            emergencyContacts[msg.sender] ||
                hasRole(MASTER_ADMIN_ROLE, msg.sender),
            "Not emergency contact"
        );
        _;
    }

    /**
     * @dev Modifier to ensure global pause is not active
     */
    modifier whenNotGloballyPaused() {
        require(!globalPause, "Globally paused");
        _;
    }

    /**
     * @dev Modifier for time-locked operations
     */
    modifier onlyAfterTimelock(bytes32 operationId) {
        require(
            timelockExecutions[operationId] != 0 &&
                block.timestamp >= timelockExecutions[operationId],
            "Operation not ready or not scheduled"
        );
        _;
        delete timelockExecutions[operationId];
    }

    // ============= CONSTRUCTOR =============

    /**
     * @dev Constructor sets up initial roles and admin
     * @param initialAdmin Address to be granted master admin role
     */
    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "Invalid admin address");

        // Grant master admin role to initial admin
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MASTER_ADMIN_ROLE, initialAdmin);

        // Set master admin as role admin for all roles
        _setRoleAdmin(MINTER_ROLE, MASTER_ADMIN_ROLE);
        _setRoleAdmin(AUCTION_MANAGER_ROLE, MASTER_ADMIN_ROLE);
        _setRoleAdmin(CUSTOMIZATION_ADMIN_ROLE, MASTER_ADMIN_ROLE);
        _setRoleAdmin(PRICE_MANAGER_ROLE, MASTER_ADMIN_ROLE);
        _setRoleAdmin(PAUSER_ROLE, MASTER_ADMIN_ROLE);
        _setRoleAdmin(WITHDRAWER_ROLE, MASTER_ADMIN_ROLE);
        _setRoleAdmin(UPGRADER_ROLE, MASTER_ADMIN_ROLE);
        _setRoleAdmin(METADATA_MANAGER_ROLE, MASTER_ADMIN_ROLE);

        // Add initial admin as emergency contact
        emergencyContacts[initialAdmin] = true;
        masterAdminCount = 1;

        emit EmergencyContactChanged(initialAdmin, true);
    }

    // ============= ROLE MANAGEMENT =============

    /**
     * @dev Grant master admin role with safety checks
     * @param account Address to grant master admin role
     */
    function grantMasterAdmin(
        address account
    ) external onlyRole(MASTER_ADMIN_ROLE) {
        require(account != address(0), "Invalid address");
        require(masterAdminCount < MAX_ADMINS, "Too many admins");
        require(!hasRole(MASTER_ADMIN_ROLE, account), "Already master admin");

        _grantRole(MASTER_ADMIN_ROLE, account);
        emergencyContacts[account] = true;
        masterAdminCount++;

        emit EmergencyContactChanged(account, true);
    }

    /**
     * @dev Revoke master admin role with safety checks
     * @param account Address to revoke master admin role from
     */
    function revokeMasterAdmin(
        address account
    ) external onlyRole(MASTER_ADMIN_ROLE) {
        require(account != msg.sender, "Cannot revoke own admin");
        require(masterAdminCount > 1, "Cannot remove last admin");
        require(hasRole(MASTER_ADMIN_ROLE, account), "Not master admin");

        _revokeRole(MASTER_ADMIN_ROLE, account);
        emergencyContacts[account] = false;
        masterAdminCount--;

        emit EmergencyContactChanged(account, false);
    }

    /**
     * @dev Batch grant roles to multiple addresses
     * @param role The role to grant
     * @param accounts Array of addresses to grant the role to
     */
    function batchGrantRole(
        bytes32 role,
        address[] calldata accounts
    ) external onlyRole(MASTER_ADMIN_ROLE) {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (!hasRole(role, accounts[i])) {
                _grantRole(role, accounts[i]);
            }
        }
    }

    /**
     * @dev Batch revoke roles from multiple addresses
     * @param role The role to revoke
     * @param accounts Array of addresses to revoke the role from
     */
    function batchRevokeRole(
        bytes32 role,
        address[] calldata accounts
    ) external onlyRole(MASTER_ADMIN_ROLE) {
        for (uint256 i = 0; i < accounts.length; i++) {
            if (hasRole(role, accounts[i])) {
                _revokeRole(role, accounts[i]);
            }
        }
    }

    // ============= CONTRACT AUTHORIZATION =============

    /**
     * @dev Authorize a contract to interact with the system
     * @param contractAddress Address of the contract to authorize
     */
    function authorizeContract(
        address contractAddress
    ) external onlyRole(MASTER_ADMIN_ROLE) {
        require(contractAddress != address(0), "Invalid contract address");
        require(contractAddress.code.length > 0, "Not a contract");

        authorizedContracts[contractAddress] = true;
        emit ContractAuthorizationChanged(contractAddress, true);
    }

    /**
     * @dev Deauthorize a contract
     * @param contractAddress Address of the contract to deauthorize
     */
    function deauthorizeContract(
        address contractAddress
    ) external onlyRole(MASTER_ADMIN_ROLE) {
        authorizedContracts[contractAddress] = false;
        emit ContractAuthorizationChanged(contractAddress, false);
    }

    /**
     * @dev Batch authorize multiple contracts
     * @param contractAddresses Array of contract addresses to authorize
     */
    function batchAuthorizeContracts(
        address[] calldata contractAddresses
    ) external onlyRole(MASTER_ADMIN_ROLE) {
        for (uint256 i = 0; i < contractAddresses.length; i++) {
            if (
                contractAddresses[i] != address(0) &&
                contractAddresses[i].code.length > 0
            ) {
                authorizedContracts[contractAddresses[i]] = true;
                emit ContractAuthorizationChanged(contractAddresses[i], true);
            }
        }
    }

    // ============= EMERGENCY MANAGEMENT =============

    /**
     * @dev Add emergency contact
     * @param contact Address to add as emergency contact
     */
    function addEmergencyContact(
        address contact
    ) external onlyRole(MASTER_ADMIN_ROLE) {
        require(contact != address(0), "Invalid contact address");

        emergencyContacts[contact] = true;
        emit EmergencyContactChanged(contact, true);
    }

    /**
     * @dev Remove emergency contact
     * @param contact Address to remove as emergency contact
     */
    function removeEmergencyContact(
        address contact
    ) external onlyRole(MASTER_ADMIN_ROLE) {
        emergencyContacts[contact] = false;
        emit EmergencyContactChanged(contact, false);
    }

    /**
     * @dev Emergency pause - can be called by emergency contacts
     */
    function emergencyPause() external onlyEmergencyContact {
        globalPause = true;
        _pause();
        emit GlobalPauseStateChanged(true);
    }

    /**
     * @dev Emergency unpause - requires master admin
     */
    function emergencyUnpause() external onlyRole(MASTER_ADMIN_ROLE) {
        globalPause = false;
        _unpause();
        emit GlobalPauseStateChanged(false);
    }

    // ============= TIME LOCK OPERATIONS =============

    /**
     * @dev Schedule a time-locked operation
     * @param operationId Unique identifier for the operation
     */
    function scheduleTimeLockOperation(
        bytes32 operationId
    ) external onlyRole(MASTER_ADMIN_ROLE) {
        require(
            timelockExecutions[operationId] == 0,
            "Operation already scheduled"
        );

        uint256 executeAfter = block.timestamp + timeLockDuration;
        timelockExecutions[operationId] = executeAfter;

        emit TimeLockOperationScheduled(operationId, executeAfter);
    }

    /**
     * @dev Cancel a time-locked operation
     * @param operationId Unique identifier for the operation
     */
    function cancelTimeLockOperation(
        bytes32 operationId
    ) external onlyRole(MASTER_ADMIN_ROLE) {
        require(
            timelockExecutions[operationId] != 0,
            "Operation not scheduled"
        );

        delete timelockExecutions[operationId];
    }

    /**
     * @dev Update timelock duration
     * @param newDuration New duration in seconds
     */
    function updateTimeLockDuration(
        uint256 newDuration
    ) external onlyRole(MASTER_ADMIN_ROLE) {
        require(
            newDuration >= 1 hours && newDuration <= 7 days,
            "Invalid duration"
        );

        uint256 oldDuration = timeLockDuration;
        timeLockDuration = newDuration;

        emit TimeLockDurationUpdated(oldDuration, newDuration);
    }

    // ============= QUERY FUNCTIONS =============

    /**
     * @dev Check if an address has minting permissions
     * @param account Address to check
     * @return hasMinterRole True if address can mint
     */
    function canMint(
        address account
    ) external view returns (bool hasMinterRole) {
        return
            hasRole(MINTER_ROLE, account) ||
            hasRole(MASTER_ADMIN_ROLE, account);
    }

    /**
     * @dev Check if an address can manage auctions
     * @param account Address to check
     * @return hasAuctionRole True if address can manage auctions
     */
    function canManageAuctions(
        address account
    ) external view returns (bool hasAuctionRole) {
        return
            hasRole(AUCTION_MANAGER_ROLE, account) ||
            hasRole(MASTER_ADMIN_ROLE, account);
    }

    /**
     * @dev Check if an address can manage customizations
     * @param account Address to check
     * @return hasCustomizationRole True if address can manage customizations
     */
    function canManageCustomizations(
        address account
    ) external view returns (bool hasCustomizationRole) {
        return
            hasRole(CUSTOMIZATION_ADMIN_ROLE, account) ||
            hasRole(MASTER_ADMIN_ROLE, account);
    }

    /**
     * @dev Check if an address can manage prices
     * @param account Address to check
     * @return hasPriceRole True if address can manage prices
     */
    function canManagePrices(
        address account
    ) external view returns (bool hasPriceRole) {
        return
            hasRole(PRICE_MANAGER_ROLE, account) ||
            hasRole(MASTER_ADMIN_ROLE, account);
    }

    /**
     * @dev Check if an address can pause contracts
     * @param account Address to check
     * @return hasPauserRole True if address can pause
     */
    function canPause(
        address account
    ) external view returns (bool hasPauserRole) {
        return
            hasRole(PAUSER_ROLE, account) ||
            hasRole(MASTER_ADMIN_ROLE, account) ||
            emergencyContacts[account];
    }

    /**
     * @dev Check if an address can withdraw funds
     * @param account Address to check
     * @return hasWithdrawRole True if address can withdraw
     */
    function canWithdraw(
        address account
    ) external view returns (bool hasWithdrawRole) {
        return
            hasRole(WITHDRAWER_ROLE, account) ||
            hasRole(MASTER_ADMIN_ROLE, account);
    }

    /**
     * @dev Get all role members for a specific role
     * @param role The role to query
     * @return members Array of addresses with the role
     */
    function getRoleMembers(
        bytes32 role
    ) external view returns (address[] memory members) {
        return _roleMembers[role];
    }

    /**
     * @dev Get number of members for a specific role
     * @param role The role to query
     * @return count Number of addresses with the role
     */
    function getRoleMemberCount(
        bytes32 role
    ) external view returns (uint256 count) {
        return _roleMembers[role].length;
    }

    /**
     * @dev Execute time-locked operation validation
     * @param operationId The operation ID to validate
     */
    function executeTimeLockOperation(
        bytes32 operationId
    ) external onlyRole(MASTER_ADMIN_ROLE) onlyAfterTimelock(operationId) {
        emit TimeLockOperationExecuted(operationId);
    }

    /**
     * @dev Check if the system is in global pause state
     * @return isPaused True if globally paused
     */
    function isGloballyPaused() external view returns (bool isPaused) {
        return globalPause;
    }

    // ============= EXTERNAL VALIDATION FUNCTIONS =============

    /**
     * @dev Validate that caller has required role (called by other contracts)
     * @param role The role to check
     * @param account The account to validate
     */
    function validateRole(
        bytes32 role,
        address account
    ) external view onlyAuthorizedContract {
        require(
            hasRole(role, account) || hasRole(MASTER_ADMIN_ROLE, account),
            "Access denied"
        );
    }

    /**
     * @dev Validate that system is not paused (called by other contracts)
     */
    function validateNotPaused() external view onlyAuthorizedContract {
        require(!globalPause && !paused(), "System paused");
    }

    /**
     * @dev Override _grantRole to track role members
     */
    function _grantRole(
        bytes32 role,
        address account
    ) internal override returns (bool) {
        super._grantRole(role, account);

        // Track role member for enumeration
        if (_roleMemberIndex[role][account] == 0) {
            _roleMembers[role].push(account);
            _roleMemberIndex[role][account] = _roleMembers[role].length;
        }
        return true;
    }

    /**
     * @dev Override _revokeRole to untrack role members
     */
    function _revokeRole(
        bytes32 role,
        address account
    ) internal override returns (bool) {
        super._revokeRole(role, account);

        // Remove from role member tracking
        uint256 index = _roleMemberIndex[role][account];
        if (index > 0) {
            uint256 lastIndex = _roleMembers[role].length;
            address lastMember = _roleMembers[role][lastIndex - 1];

            // Move last member to the position of the removed member
            _roleMembers[role][index - 1] = lastMember;
            _roleMemberIndex[role][lastMember] = index;

            // Remove last element
            _roleMembers[role].pop();
            delete _roleMemberIndex[role][account];
        }
        return true;
    }
}
