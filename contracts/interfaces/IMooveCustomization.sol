// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

// ============= ENUMS & STRUCTS =============

enum CustomizationType {
    AESTHETIC,
    PERFORMANCE,
    SPECIAL,
    LIMITED_EDITION
}

struct Customization {
    uint256 id;
    string name;
    string description;
    CustomizationType custType;
    uint256 price;
    string imageURI;
    bool isActive;
    uint32 maxSupply; // Optimized: reduced from uint256
    uint32 currentSupply; // Optimized: reduced from uint256
}

struct PerformanceUpgrade {
    uint8 speedBonus;
    uint8 accelerationBonus;
    uint8 handlingBonus;
    uint8 durabilityBonus;
}

struct AestheticCustomization {
    string colorCode;
    uint256 skinId;
    uint256[] decalIds;
    string customURI;
}

/**
 * @title IMooveCustomization
 * @dev Interface for virtual vehicle NFT customizations
 * @notice All customizations are purely virtual and affect only NFT metadata and visual representation
 */
interface IMooveCustomization {
    // ============= EVENTS =============

    event CustomizationCreated(
        uint256 indexed customizationId,
        string name,
        CustomizationType custType,
        uint256 price
    );

    event CustomizationApplied(
        uint256 indexed tokenId,
        uint256 indexed customizationId,
        address indexed owner,
        uint256 price
    );

    event CustomizationRemoved(
        uint256 indexed tokenId,
        uint256 indexed customizationId,
        address indexed owner
    );

    event CustomizationPriceUpdated(
        uint256 indexed customizationId,
        uint256 oldPrice,
        uint256 newPrice
    );

    // ============= CUSTOMIZATION MANAGEMENT =============

    /**
     * @dev Create a new customization option
     * @param name Name of the customization
     * @param description Description of the customization
     * @param custType Type of customization
     * @param price Price in ETH
     * @param imageURI URI for the customization image
     * @param maxSupply Maximum supply of this customization
     * @return customizationId The ID of the newly created customization
     */
    function createCustomization(
        string calldata name, // Optimized: changed from memory to calldata
        string calldata description, // Optimized: changed from memory to calldata
        CustomizationType custType,
        uint256 price,
        string calldata imageURI, // Optimized: changed from memory to calldata
        uint256 maxSupply
    ) external returns (uint256 customizationId);

    /**
     * @dev Apply customization to NFT
     * @param tokenId Token ID to customize
     * @param customizationId Customization ID to apply
     */
    function applyCustomization(
        uint256 tokenId,
        uint256 customizationId
    ) external payable;

    /**
     * @dev Remove a customization from a vehicle NFT
     * @param tokenId Token ID of the vehicle
     * @param customizationId Customization ID to remove
     * @return success Whether the removal was successful
     */
    function removeCustomization(
        uint256 tokenId,
        uint256 customizationId
    ) external returns (bool success);

    /**
     * @dev Apply performance upgrade to a vehicle NFT
     * @param tokenId Token ID of the vehicle
     * @param upgrade Performance upgrade to apply
     * @return success Whether the upgrade was successful
     */
    function applyPerformanceUpgrade(
        uint256 tokenId,
        PerformanceUpgrade calldata upgrade // Optimized: changed from memory to calldata
    ) external payable returns (bool success);

    /**
     * @dev Apply aesthetic customization to a vehicle NFT
     * @param tokenId Token ID of the vehicle
     * @param aesthetic Aesthetic customization to apply
     * @return success Whether the customization was successful
     */
    function applyAestheticCustomization(
        uint256 tokenId,
        AestheticCustomization calldata aesthetic // Optimized: changed from memory to calldata
    ) external payable returns (bool success);

    // ============= QUERY FUNCTIONS =============

    /**
     * @dev Get customization details by ID
     * @param customizationId ID of the customization
     * @return customization Customization details
     */
    function getCustomization(
        uint256 customizationId
    ) external view returns (Customization memory customization);

    /**
     * @dev Get all active customizations
     * @return customizations Array of active customizations
     */
    function getActiveCustomizations()
        external
        view
        returns (Customization[] memory customizations);

    /**
     * @dev Get customizations by type
     * @param custType Type of customization to filter by
     * @return customizations Array of customizations of the specified type
     */
    function getCustomizationsByType(
        CustomizationType custType
    ) external view returns (Customization[] memory customizations);

    /**
     * @dev Get all customizations applied to a vehicle
     * @param tokenId Token ID of the vehicle
     * @return customizationIds Array of applied customization IDs
     */
    function getVehicleCustomizations(
        uint256 tokenId
    ) external view returns (uint256[] memory customizationIds);

    /**
     * @dev Check if a customization is applied to a vehicle
     * @param tokenId Token ID of the vehicle
     * @param customizationId Customization ID to check
     * @return isApplied Whether the customization is applied
     */
    function isCustomizationApplied(
        uint256 tokenId,
        uint256 customizationId
    ) external view returns (bool isApplied);

    /**
     * @dev Calculate total cost for multiple customizations
     * @param customizationIds Array of customization IDs
     * @return totalCost Total cost in ETH
     */
    function calculateTotalCost(
        uint256[] memory customizationIds
    ) external view returns (uint256 totalCost);

    /**
     * @dev Get vehicle performance stats
     * @param tokenId Token ID of the vehicle
     * @return upgrade Current performance upgrade stats
     */
    function getVehiclePerformance(
        uint256 tokenId
    ) external view returns (PerformanceUpgrade memory upgrade);

    /**
     * @dev Get vehicle aesthetic customizations
     * @param tokenId Token ID of the vehicle
     * @return aesthetic Current aesthetic customization
     */
    function getVehicleAesthetics(
        uint256 tokenId
    ) external view returns (AestheticCustomization memory aesthetic);

    // ============= ADMIN FUNCTIONS =============

    /**
     * @dev Update customization price
     * @param customizationId ID of the customization
     * @param newPrice New price in ETH
     */
    function updateCustomizationPrice(
        uint256 customizationId,
        uint256 newPrice
    ) external;

    /**
     * @dev Set customization active status
     * @param customizationId ID of the customization
     * @param isActive Whether the customization should be active
     */
    function setCustomizationActive(
        uint256 customizationId,
        bool isActive
    ) external;

    /**
     * @dev Update customization image URI
     * @param customizationId ID of the customization
     * @param newImageURI New image URI
     */
    function updateCustomizationImage(
        uint256 customizationId,
        string calldata newImageURI // Optimized: changed from memory to calldata
    ) external;

    /**
     * @dev Withdraw contract balance
     * @param to Recipient address
     * @param amount Amount to withdraw
     */
    function withdraw(
        address payable to,
        uint256 amount
    ) external;

    /**
     * @dev Emergency pause function
     */
    function pause() external;

    /**
     * @dev Unpause function
     */
    function unpause() external;
}
