// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IMooveCustomization.sol";

// ============= INTERFACES =============

interface IMooveNFT {
    function ownerOf(uint256 tokenId) external view returns (address);

    function updateTokenMetadata(uint256 tokenId) external;
}

/**
 * @title MooveCustomization
 * @dev Implementation contract for virtual vehicle NFT customizations
 * @notice All customizations are purely virtual and affect only NFT metadata and visual representation
 */
contract MooveCustomization is IMooveCustomization, AccessControl, ReentrancyGuard, Pausable {
    // ============= CONSTANTS =============

    bytes32 public constant CUSTOMIZATION_ADMIN_ROLE =
        keccak256("CUSTOMIZATION_ADMIN_ROLE");
    bytes32 public constant PRICE_MANAGER_ROLE =
        keccak256("PRICE_MANAGER_ROLE");

    uint256 public constant MAX_PERFORMANCE_BONUS = 100;
    uint256 public constant MAX_CUSTOMIZATIONS_PER_VEHICLE = 50;

    // ============= STATE VARIABLES =============

    /// @dev Reference to the MooveNFT contract
    IMooveNFT public immutable mooveNFT;

    /// @dev Counter for customization IDs
    uint256 private _customizationIdCounter;

    /// @dev Mapping from customization ID to Customization struct
    mapping(uint256 => Customization) private _customizations;

    /// @dev Mapping from token ID to array of applied customization IDs
    mapping(uint256 => uint256[]) private _vehicleCustomizations;

    /// @dev Mapping from token ID to customization ID to check if applied
    mapping(uint256 => mapping(uint256 => bool))
        private _isCustomizationApplied;

    /// @dev Mapping from token ID to performance upgrades
    mapping(uint256 => PerformanceUpgrade) private _vehiclePerformance;

    /// @dev Mapping from token ID to aesthetic customizations
    mapping(uint256 => AestheticCustomization) private _vehicleAesthetics;

    /// @dev Arrays to track customizations by type for efficient querying
    mapping(CustomizationType => uint256[]) private _customizationsByType;

    /// @dev Mapping to track active customizations
    mapping(uint256 => bool) private _activeCustomizations;

    // ============= MODIFIERS =============

    /**
     * @dev Modifier to check if the caller owns the vehicle token
     */
    modifier onlyVehicleOwner(uint256 tokenId) {
        require(mooveNFT.ownerOf(tokenId) == msg.sender, "Not vehicle owner");
        _;
    }

    /**
     * @dev Modifier to check if customization exists and is active
     */
    modifier customizationExists(uint256 customizationId) {
        require(
            _customizations[customizationId].id != 0,
            "Customization does not exist"
        );
        require(
            _activeCustomizations[customizationId],
            "Customization not active"
        );
        _;
    }

    /**
     * @dev Modifier to check if vehicle exists
     */
    modifier vehicleExists(uint256 tokenId) {
        require(
            mooveNFT.ownerOf(tokenId) != address(0),
            "Vehicle does not exist"
        );
        _;
    }

    // ============= CONSTRUCTOR =============

    /**
     * @dev Constructor sets the MooveNFT contract address and initial roles
     * @param _mooveNFT Address of the MooveNFT contract
     * @param _admin Address to be granted admin roles
     */
    constructor(address _mooveNFT, address _admin) {
        require(_mooveNFT != address(0), "Invalid MooveNFT address");
        require(_admin != address(0), "Invalid admin address");

        // Initialize immutable variable
        mooveNFT = IMooveNFT(_mooveNFT);

        // Set up roles
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(CUSTOMIZATION_ADMIN_ROLE, _admin);
        _grantRole(PRICE_MANAGER_ROLE, _admin);

        _customizationIdCounter = 1; // Start from 1, 0 is reserved for "not exists"
    }

    // ============= CUSTOMIZATION MANAGEMENT =============

    /**
     * @dev Create a new customization option
     */
    function createCustomization(
        string calldata name, // Optimized: changed from memory to calldata
        string calldata description, // Optimized: changed from memory to calldata
        CustomizationType custType,
        uint256 price,
        string calldata imageURI, // Optimized: changed from memory to calldata
        uint256 maxSupply
    )
        external
        override
        onlyRole(CUSTOMIZATION_ADMIN_ROLE)
        returns (uint256 customizationId)
    {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(bytes(imageURI).length > 0, "Image URI cannot be empty");

        customizationId = _customizationIdCounter++;

        _customizations[customizationId] = Customization({
            id: customizationId,
            name: name,
            description: description,
            custType: custType,
            price: price,
            imageURI: imageURI,
            isActive: true,
            maxSupply: uint32(maxSupply), // Optimized: packed
            currentSupply: 0
        });

        _customizationsByType[custType].push(customizationId);
        _activeCustomizations[customizationId] = true;

        emit CustomizationCreated(customizationId, name, custType, price);
    }

    /**
     * @dev Apply customization to NFT
     * @param tokenId Token ID to customize
     * @param customizationId Customization ID to apply
     */
    function applyCustomization(
        uint256 tokenId,
        uint256 customizationId
    ) external payable override nonReentrant {
        require(
            mooveNFT.ownerOf(tokenId) == msg.sender,
            "Not token owner"
        );
        require(
            _customizations[customizationId].id != 0,
            "Customization does not exist"
        );

        Customization storage customization = _customizations[customizationId];
        require(
            customization.isActive,
            "Customization not active"
        );
        require(
            msg.value >= customization.price,
            "Insufficient payment"
        );

        // Update state first to prevent reentrancy
        _vehicleCustomizations[tokenId].push(customizationId);
        _isCustomizationApplied[tokenId][customizationId] = true;
        unchecked {
            customization.currentSupply++; // Optimized: unchecked increment
        }

        // Handle specific customization types
        if (customization.custType == CustomizationType.PERFORMANCE) {
            _applyPerformanceBonus(tokenId, customizationId);
        } else if (customization.custType == CustomizationType.AESTHETIC) {
            _applyAestheticChange(tokenId, customizationId);
        }

        // Refund excess payment
        if (msg.value > customization.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - customization.price}("");
            require(refundSuccess, "Refund failed");
        }

        emit CustomizationApplied(
            tokenId,
            customizationId,
            msg.sender,
            customization.price
        );
    }

    /**
     * @dev Remove a customization from a vehicle NFT
     */
    function removeCustomization(
        uint256 tokenId,
        uint256 customizationId
    ) external override onlyVehicleOwner(tokenId) returns (bool success) {
        require(
            _isCustomizationApplied[tokenId][customizationId],
            "Customization not applied"
        );

        // Remove from applied customizations
        _isCustomizationApplied[tokenId][customizationId] = false;

        // Remove from vehicle customizations array
        uint256[] storage vehicleCustoms = _vehicleCustomizations[tokenId];
        uint256 length = vehicleCustoms.length;
        for (uint256 i = 0; i < length;) { // Optimized: use unchecked increment
            if (vehicleCustoms[i] == customizationId) {
                vehicleCustoms[i] = vehicleCustoms[length - 1];
                vehicleCustoms.pop();
                break;
            }
            unchecked { i++; } // Optimized: unchecked increment
        }

        // Decrease supply
        _customizations[customizationId].currentSupply--;

        // Handle specific customization types
        CustomizationType custType = _customizations[customizationId].custType;
        if (custType == CustomizationType.PERFORMANCE) {
            _removePerformanceBonus(tokenId, customizationId);
        } else if (custType == CustomizationType.AESTHETIC) {
            _removeAestheticChange(tokenId, customizationId);
        }

        emit CustomizationRemoved(tokenId, customizationId, msg.sender);

        return true;
    }

    /**
     * @dev Apply performance upgrade to a vehicle NFT
     */
    function applyPerformanceUpgrade(
        uint256 tokenId,
        PerformanceUpgrade calldata upgrade // Optimized: changed from memory to calldata
    )
        external
        override
        payable
        onlyVehicleOwner(tokenId)
        whenNotPaused
        returns (bool success)
    {
        require(
            _isValidPerformanceUpgrade(upgrade),
            "Invalid performance upgrade"
        );

        // Calculate cost based on bonus amounts
        uint256 cost = _calculatePerformanceCost(upgrade);
        require(msg.value >= cost, "Insufficient payment");

        // Apply the upgrade
        PerformanceUpgrade storage current = _vehiclePerformance[tokenId];
        current.speedBonus = _addBonusCapped(
            current.speedBonus,
            upgrade.speedBonus
        );
        current.accelerationBonus = _addBonusCapped(
            current.accelerationBonus,
            upgrade.accelerationBonus
        );
        current.handlingBonus = _addBonusCapped(
            current.handlingBonus,
            upgrade.handlingBonus
        );
        current.durabilityBonus = _addBonusCapped(
            current.durabilityBonus,
            upgrade.durabilityBonus
        );

        // Refund excess payment
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        return true;
    }

    /**
     * @dev Apply aesthetic customization to a vehicle NFT
     */
    function applyAestheticCustomization(
        uint256 tokenId,
        AestheticCustomization calldata aesthetic // Optimized: changed from memory to calldata
    )
        external
        override
        payable
        onlyVehicleOwner(tokenId)
        whenNotPaused
        returns (bool success)
    {
        require(
            _isValidAestheticCustomization(aesthetic),
            "Invalid aesthetic customization"
        );

        // Calculate cost
        uint256 cost = _calculateAestheticCost(aesthetic);
        require(msg.value >= cost, "Insufficient payment");

        // Apply the aesthetic changes
        _vehicleAesthetics[tokenId] = aesthetic;

        // Refund excess payment
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        return true;
    }

    // ============= QUERY FUNCTIONS =============

    /**
     * @dev Get customization details by ID
     */
    function getCustomization(
        uint256 customizationId
    ) external view override returns (Customization memory customization) {
        require(
            _customizations[customizationId].id != 0,
            "Customization does not exist"
        );
        return _customizations[customizationId];
    }

    /**
     * @dev Get all active customizations
     */
    function getActiveCustomizations()
        external
        view
        override
        returns (Customization[] memory customizations)
    {
        // Count active customizations
        uint256 activeCount = 0;
        for (uint256 i = 1; i < _customizationIdCounter; i++) {
            if (_activeCustomizations[i]) {
                activeCount++;
            }
        }

        // Create array and populate
        customizations = new Customization[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i < _customizationIdCounter; i++) {
            if (_activeCustomizations[i]) {
                customizations[index] = _customizations[i];
                index++;
            }
        }
    }

    /**
     * @dev Get customizations by type
     */
    function getCustomizationsByType(
        CustomizationType custType
    ) external view override returns (Customization[] memory customizations) {
        uint256[] storage ids = _customizationsByType[custType];
        uint256 activeCount = 0;

        // Count active customizations of this type
        for (uint256 i = 0; i < ids.length; i++) {
            if (_activeCustomizations[ids[i]]) {
                activeCount++;
            }
        }

        // Create array and populate
        customizations = new Customization[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (_activeCustomizations[ids[i]]) {
                customizations[index] = _customizations[ids[i]];
                index++;
            }
        }
    }

    /**
     * @dev Get all customizations applied to a vehicle
     */
    function getVehicleCustomizations(
        uint256 tokenId
    )
        external
        view
        override
        vehicleExists(tokenId)
        returns (uint256[] memory customizationIds)
    {
        return _vehicleCustomizations[tokenId];
    }

    /**
     * @dev Check if a customization is applied to a vehicle
     */
    function isCustomizationApplied(
        uint256 tokenId,
        uint256 customizationId
    ) external view override returns (bool isApplied) {
        return _isCustomizationApplied[tokenId][customizationId];
    }

    /**
     * @dev Calculate total cost for multiple customizations
     */
    function calculateTotalCost(
        uint256[] memory customizationIds
    ) external view override returns (uint256 totalCost) {
        for (uint256 i = 0; i < customizationIds.length; i++) {
            require(
                _customizations[customizationIds[i]].id != 0,
                "Invalid customization ID"
            );
            totalCost += _customizations[customizationIds[i]].price;
        }
    }

    /**
     * @dev Get vehicle performance stats
     */
    function getVehiclePerformance(
        uint256 tokenId
    )
        external
        view
        override
        vehicleExists(tokenId)
        returns (PerformanceUpgrade memory upgrade)
    {
        return _vehiclePerformance[tokenId];
    }

    /**
     * @dev Get vehicle aesthetic customizations
     */
    function getVehicleAesthetics(
        uint256 tokenId
    )
        external
        view
        override
        vehicleExists(tokenId)
        returns (AestheticCustomization memory aesthetic)
    {
        return _vehicleAesthetics[tokenId];
    }

    // ============= ADMIN FUNCTIONS =============

    /**
     * @dev Update customization price
     */
    function updateCustomizationPrice(
        uint256 customizationId,
        uint256 newPrice
    ) external override onlyRole(PRICE_MANAGER_ROLE) {
        require(
            _customizations[customizationId].id != 0,
            "Customization does not exist"
        );

        uint256 oldPrice = _customizations[customizationId].price;
        _customizations[customizationId].price = newPrice;

        emit CustomizationPriceUpdated(customizationId, oldPrice, newPrice);
    }

    /**
     * @dev Set customization active status
     */
    function setCustomizationActive(
        uint256 customizationId,
        bool isActive
    ) external override onlyRole(CUSTOMIZATION_ADMIN_ROLE) {
        require(
            _customizations[customizationId].id != 0,
            "Customization does not exist"
        );

        _customizations[customizationId].isActive = isActive;
        _activeCustomizations[customizationId] = isActive;
    }

    /**
     * @dev Update customization image URI
     */
    function updateCustomizationImage(
        uint256 customizationId,
        string calldata newImageURI // Optimized: changed from memory to calldata
    ) external override onlyRole(CUSTOMIZATION_ADMIN_ROLE) {
        require(
            _customizations[customizationId].id != 0,
            "Customization does not exist"
        );
        require(bytes(newImageURI).length > 0, "Image URI cannot be empty");

        _customizations[customizationId].imageURI = newImageURI;
    }

    /**
     * @dev Withdraw contract balance
     */
    function withdraw(
        address payable to,
        uint256 amount
    ) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        require(to != address(0), "Invalid recipient address");
        require(to != address(this), "Cannot withdraw to self");
        require(to.code.length == 0, "Cannot withdraw to contract");
        require(amount > 0, "Amount must be greater than 0");
        require(
            amount <= address(this).balance,
            "Insufficient contract balance"
        );

        // Use call instead of transfer for better gas efficiency and to prevent reentrancy
        (bool success, ) = to.call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Emergency pause function
     */
    function pause() external override onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause function
     */
    function unpause() external override onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // ============= INTERNAL FUNCTIONS =============

    /**
     * @dev Apply virtual performance bonus from a specific customization
     */
    function _applyPerformanceBonus(
        uint256 tokenId,
        uint256 /* customizationId */
    ) internal {
        PerformanceUpgrade storage performance = _vehiclePerformance[tokenId];

        // Each performance customization gives +5 to virtual stats
        performance.speedBonus = _addBonusCapped(performance.speedBonus, 5);
        performance.accelerationBonus = _addBonusCapped(
            performance.accelerationBonus,
            5
        );
        performance.handlingBonus = _addBonusCapped(
            performance.handlingBonus,
            5
        );
        performance.durabilityBonus = _addBonusCapped(
            performance.durabilityBonus,
            5
        );

        _updateNFTMetadata(tokenId);
    }

    /**
     * @dev Remove performance bonus from a specific customization
     */
    function _removePerformanceBonus(
        uint256 tokenId,
        uint256 /* customizationId */
    ) internal {
        PerformanceUpgrade storage performance = _vehiclePerformance[tokenId];

        performance.speedBonus = performance.speedBonus >= 5
            ? performance.speedBonus - 5
            : 0;
        performance.accelerationBonus = performance.accelerationBonus >= 5
            ? performance.accelerationBonus - 5
            : 0;
        performance.handlingBonus = performance.handlingBonus >= 5
            ? performance.handlingBonus - 5
            : 0;
        performance.durabilityBonus = performance.durabilityBonus >= 5
            ? performance.durabilityBonus - 5
            : 0;
    }

    /**
     * @dev Apply virtual aesthetic changes
     */
    function _applyAestheticChange(
        uint256 tokenId,
        uint256 /* customizationId */
    ) internal {
        _updateNFTMetadata(tokenId);
    }

    /**
     * @dev Remove virtual aesthetic changes
     */
    function _removeAestheticChange(
        uint256 tokenId,
        uint256 /* customizationId */
    ) internal {
        _updateNFTMetadata(tokenId);
    }

    /**
     * @dev Update NFT metadata to reflect applied customizations
     */
    function _updateNFTMetadata(uint256 tokenId) internal {
        try mooveNFT.updateTokenMetadata(tokenId) {
            // Metadata updated successfully
        } catch {
            // Handle update failure gracefully
        }
    }

    /**
     * @dev Add bonus with cap at MAX_PERFORMANCE_BONUS
     */
    function _addBonusCapped(
        uint8 current,
        uint8 addition
    ) internal pure returns (uint8) {
        uint256 sum = uint256(current) + uint256(addition);
        return
            sum > MAX_PERFORMANCE_BONUS
                ? uint8(MAX_PERFORMANCE_BONUS)
                : uint8(sum);
    }

    /**
     * @dev Validate performance upgrade parameters
     */
    function _isValidPerformanceUpgrade(
        PerformanceUpgrade memory upgrade
    ) internal pure returns (bool) {
        return
            upgrade.speedBonus <= MAX_PERFORMANCE_BONUS &&
            upgrade.accelerationBonus <= MAX_PERFORMANCE_BONUS &&
            upgrade.handlingBonus <= MAX_PERFORMANCE_BONUS &&
            upgrade.durabilityBonus <= MAX_PERFORMANCE_BONUS;
    }

    /**
     * @dev Validate aesthetic customization parameters
     */
    function _isValidAestheticCustomization(
        AestheticCustomization memory aesthetic
    ) internal pure returns (bool) {
        return
            bytes(aesthetic.colorCode).length > 0 ||
            aesthetic.skinId > 0 ||
            aesthetic.decalIds.length > 0 ||
            bytes(aesthetic.customURI).length > 0;
    }

    /**
     * @dev Calculate cost for performance upgrade
     */
    function _calculatePerformanceCost(
        PerformanceUpgrade memory upgrade
    ) internal pure returns (uint256) {
        uint256 totalBonus = uint256(upgrade.speedBonus) +
            uint256(upgrade.accelerationBonus) +
            uint256(upgrade.handlingBonus) +
            uint256(upgrade.durabilityBonus);
        return totalBonus * 0.001 ether;
    }

    /**
     * @dev Calculate cost for aesthetic customization
     */
    function _calculateAestheticCost(
        AestheticCustomization memory aesthetic
    ) internal pure returns (uint256) {
        uint256 cost = 0;

        if (bytes(aesthetic.colorCode).length > 0) cost += 0.01 ether;
        if (aesthetic.skinId > 0) cost += 0.02 ether;
        if (aesthetic.decalIds.length > 0)
            cost += aesthetic.decalIds.length * 0.005 ether;
        if (bytes(aesthetic.customURI).length > 0) cost += 0.05 ether;

        return cost;
    }

    /**
     * @dev Receive function to accept ETH payments
     */
    receive() external payable {
        // Contract can receive ETH
    }
} 