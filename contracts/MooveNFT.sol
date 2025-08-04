// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./MooveAccessControl.sol";

/**
 * @title MooveNFT
 * @dev NFT contract for customizable stickers - TRANSFERABLE and TRADEABLE for auctions
 * @notice These NFTs represent customizable stickers created by admins for auction system
 */
contract MooveNFT is
    ERC721,
    ERC721URIStorage,
    ERC721Royalty,
    ReentrancyGuard,
    Pausable
{
    // ============= STATE VARIABLES =============

    /// @dev Reference to access control contract
    MooveAccessControl public immutable accessControl;

    /// @dev Counter for token IDs
    uint256 private _tokenIdCounter;

    /// @dev Mapping from token ID to sticker details
    mapping(uint256 => StickerNFT) public stickers;

    /// @dev Mapping from token ID to customization history
    mapping(uint256 => CustomizationHistory[]) public customizationHistory;

    /// @dev Mapping to track if sticker is customizable
    mapping(uint256 => bool) public isCustomizable;

    /// @dev Mapping from creator to their created stickers
    mapping(address => uint256[]) public creatorStickers;

    /// @dev Default royalty percentage (500 = 5%)
    uint256 public defaultRoyaltyPercentage = 500;

    // ============= STRUCTS =============

    struct StickerNFT {
        string name;
        string description;
        StickerCategory category;
        StickerRarity rarity;
        address creator;
        uint256 creationDate;
        bool isLimitedEdition;
        uint256 editionSize;
        uint256 editionNumber;
        CustomizationOptions customization;
    }

    struct CustomizationOptions {
        bool allowColorChange;
        bool allowTextChange;
        bool allowSizeChange;
        bool allowEffectsChange;
        string[] availableColors;
        uint256 maxTextLength;
    }

    struct CustomizationHistory {
        address customizer;
        uint256 timestamp;
        string changeDescription;
        string previousState;
        string newState;
    }

    enum StickerCategory {
        VEHICLE_DECORATION,
        BRAND_LOGO,
        ARTISTIC,
        COMMEMORATIVE,
        SPECIAL_EVENT,
        COMMUNITY_BADGE
    }

    enum StickerRarity {
        COMMON,
        UNCOMMON,
        RARE,
        EPIC,
        LEGENDARY,
        MYTHIC
    }

    // ============= EVENTS =============

    event StickerMinted(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed owner,
        string name,
        StickerCategory category,
        StickerRarity rarity,
        bool isLimitedEdition
    );

    event StickerCustomized(
        uint256 indexed tokenId,
        address indexed customizer,
        string changeDescription,
        string newState
    );

    event CustomizationOptionsUpdated(
        uint256 indexed tokenId,
        CustomizationOptions newOptions
    );

    event RoyaltyUpdated(
        uint256 indexed tokenId,
        address indexed recipient,
        uint96 feeNumerator
    );

    // ============= MODIFIERS =============

    modifier onlyAccessControlRole(bytes32 role) {
        require(accessControl.hasRole(role, msg.sender), "Access denied");
        _;
    }

    modifier onlyValidToken(uint256 tokenId) {
        require(_exists(tokenId), "Token does not exist");
        _;
    }

    /**
     * @dev Check if token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }

    modifier onlyOwnerOrApproved(uint256 tokenId) {
        require(
            ownerOf(tokenId) == msg.sender ||
                getApproved(tokenId) == msg.sender ||
                isApprovedForAll(ownerOf(tokenId), msg.sender),
            "Not owner or approved"
        );
        _;
    }

    modifier onlyCustomizable(uint256 tokenId) {
        require(isCustomizable[tokenId], "Sticker not customizable");
        _;
    }

    // ============= CONSTRUCTOR =============

    constructor(
        string memory name,
        string memory symbol,
        address _accessControl
    ) ERC721(name, symbol) {
        require(_accessControl != address(0), "Invalid access control address");
        accessControl = MooveAccessControl(_accessControl);

        // Set default royalty to contract creator initially
        _setDefaultRoyalty(msg.sender, uint96(defaultRoyaltyPercentage));
    }

    // ============= MINTING FUNCTIONS =============

    /**
     * @dev Mint a new sticker NFT (only admins can create stickers)
     */
    function mintStickerNFT(
        address to,
        string memory stickerName,
        string memory stickerDescription,
        StickerCategory category,
        StickerRarity rarity,
        bool isLimitedEdition,
        uint256 editionSize,
        CustomizationOptions memory customizationOptions,
        string memory _tokenURI,
        address royaltyRecipient,
        uint96 royaltyPercentage
    )
        public
        onlyAccessControlRole(keccak256("CUSTOMIZATION_ADMIN_ROLE"))
        nonReentrant
    {
        // Modify the mintStickerNFT to use internal function
        _mintStickerInternal(
            to,
            stickerName,
            stickerDescription,
            category,
            rarity,
            isLimitedEdition,
            editionSize,
            customizationOptions,
            _tokenURI,
            royaltyRecipient,
            royaltyPercentage
        );
    }

    /**
     * @dev Simplified mint function for basic stickers
     */
    function mintNFT(
        address to,
        string memory _tokenURI
    ) external onlyAccessControlRole(keccak256("MINTER_ROLE")) {
        // Create basic sticker with default options
        CustomizationOptions memory defaultOptions = CustomizationOptions({
            allowColorChange: true,
            allowTextChange: true,
            allowSizeChange: false,
            allowEffectsChange: false,
            availableColors: new string[](0),
            maxTextLength: 50
        });

        // Use internal mint function with basic parameters
        uint256 tokenId = _tokenIdCounter;
        string memory stickerName = string(
            abi.encodePacked("Moove Sticker #", _toString(tokenId))
        );

        _mintStickerInternal(
            to,
            stickerName,
            "Customizable Moove sticker",
            StickerCategory.VEHICLE_DECORATION,
            StickerRarity.COMMON,
            false,
            0,
            defaultOptions,
            _tokenURI,
            address(0),
            0
        );
    }

    /**
     * @dev Batch mint stickers for limited editions
     */
    function batchMintLimitedEdition(
        address[] calldata recipients,
        string memory editionName,
        string memory editionDescription,
        StickerCategory category,
        StickerRarity rarity,
        uint256 editionSize,
        CustomizationOptions memory customizationOptions,
        string[] calldata tokenURIs,
        address royaltyRecipient,
        uint96 royaltyPercentage
    )
        external
        onlyAccessControlRole(keccak256("CUSTOMIZATION_ADMIN_ROLE"))
        nonReentrant
    {
        require(recipients.length == tokenURIs.length, "Array length mismatch");
        require(recipients.length <= editionSize, "Exceeds edition size");

        for (uint256 i = 0; i < recipients.length; i++) {
            // Call internal mint to avoid external modifier issues
            _mintStickerInternal(
                recipients[i],
                editionName,
                editionDescription,
                category,
                rarity,
                true,
                editionSize,
                customizationOptions,
                tokenURIs[i],
                royaltyRecipient,
                royaltyPercentage
            );
        }
    }

    /**
     * @dev Internal mint function to avoid external call issues
     */
    function _mintStickerInternal(
        address to,
        string memory stickerName,
        string memory stickerDescription,
        StickerCategory category,
        StickerRarity rarity,
        bool isLimitedEdition,
        uint256 editionSize,
        CustomizationOptions memory customizationOptions,
        string memory _tokenURI,
        address royaltyRecipient,
        uint96 royaltyPercentage
    ) internal {
        require(to != address(0), "Invalid recipient address");
        require(bytes(stickerName).length > 0, "Name required");
        require(bytes(_tokenURI).length > 0, "Token URI required");

        if (isLimitedEdition) {
            require(editionSize > 0, "Edition size must be greater than 0");
        }

        uint256 tokenId = _tokenIdCounter++;
        uint256 editionNumber = isLimitedEdition
            ? _getNextEditionNumber(msg.sender, stickerName, editionSize)
            : 0;

        // Create sticker struct
        stickers[tokenId] = StickerNFT({
            name: stickerName,
            description: stickerDescription,
            category: category,
            rarity: rarity,
            creator: msg.sender,
            creationDate: block.timestamp,
            isLimitedEdition: isLimitedEdition,
            editionSize: editionSize,
            editionNumber: editionNumber,
            customization: customizationOptions
        });

        // Set customizable status
        isCustomizable[tokenId] = _hasCustomizationOptions(
            customizationOptions
        );

        // Add to creator's stickers
        creatorStickers[msg.sender].push(tokenId);

        // Set token-specific royalty
        if (royaltyRecipient != address(0) && royaltyPercentage > 0) {
            _setTokenRoyalty(tokenId, royaltyRecipient, royaltyPercentage);
        }

        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit StickerMinted(
            tokenId,
            msg.sender,
            to,
            stickerName,
            category,
            rarity,
            isLimitedEdition
        );
    }

    // ============= CUSTOMIZATION FUNCTIONS =============

    /**
     * @dev Customize a sticker (owner or approved only)
     * @param tokenId Token ID to customize
     * @param changeDescription Description of the changes made
     * @param newState New state after customization
     * @param newTokenURI New metadata URI reflecting changes
     */
    function customizeSticker(
        uint256 tokenId,
        string memory changeDescription,
        string memory newState,
        string memory newTokenURI
    )
        external
        onlyValidToken(tokenId)
        onlyOwnerOrApproved(tokenId)
        onlyCustomizable(tokenId)
        nonReentrant
    {
        require(
            bytes(changeDescription).length > 0,
            "Change description required"
        );
        require(bytes(newState).length > 0, "New state required");
        require(bytes(newTokenURI).length > 0, "New token URI required");

        // Store previous state safely
        string memory previousState = "";
        if (_exists(tokenId)) {
            // Get current tokenURI using the public function
            previousState = tokenURI(tokenId);
        }

        // Add to customization history
        customizationHistory[tokenId].push(
            CustomizationHistory({
                customizer: msg.sender,
                timestamp: block.timestamp,
                changeDescription: changeDescription,
                previousState: previousState,
                newState: newState
            })
        );

        // Update token URI
        _setTokenURI(tokenId, newTokenURI);

        emit StickerCustomized(
            tokenId,
            msg.sender,
            changeDescription,
            newState
        );
    }

    /**
     * @dev Update customization options for a sticker (creator only)
     */
    function updateCustomizationOptions(
        uint256 tokenId,
        CustomizationOptions memory newOptions
    )
        external
        onlyValidToken(tokenId)
        onlyAccessControlRole(keccak256("CUSTOMIZATION_ADMIN_ROLE"))
    {
        stickers[tokenId].customization = newOptions;
        isCustomizable[tokenId] = _hasCustomizationOptions(newOptions);

        emit CustomizationOptionsUpdated(tokenId, newOptions);
    }

    // ============= ROYALTY MANAGEMENT =============

    /**
     * @dev Update royalty for a specific token (creator or admin only)
     */
    function updateTokenRoyalty(
        uint256 tokenId,
        address recipient,
        uint96 feeNumerator
    ) external onlyValidToken(tokenId) {
        require(
            msg.sender == stickers[tokenId].creator ||
                accessControl.hasRole(
                    accessControl.MASTER_ADMIN_ROLE(),
                    msg.sender
                ),
            "Not creator or admin"
        );
        require(recipient != address(0), "Invalid recipient");
        require(feeNumerator <= 1000, "Royalty too high"); // Max 10%

        _setTokenRoyalty(tokenId, recipient, feeNumerator);
        emit RoyaltyUpdated(tokenId, recipient, feeNumerator);
    }

    /**
     * @dev Update default royalty (admin only)
     */
    function updateDefaultRoyalty(
        address recipient,
        uint96 feeNumerator
    ) external onlyAccessControlRole(keccak256("MASTER_ADMIN_ROLE")) {
        require(recipient != address(0), "Invalid recipient");
        require(feeNumerator <= 1000, "Royalty too high"); // Max 10%

        defaultRoyaltyPercentage = feeNumerator;
        _setDefaultRoyalty(recipient, feeNumerator);
    }

    // ============= VIEW FUNCTIONS =============

    /**
     * @dev Get sticker details
     */
    function getSticker(
        uint256 tokenId
    ) external view onlyValidToken(tokenId) returns (StickerNFT memory) {
        return stickers[tokenId];
    }

    /**
     * @dev Get customization history for a sticker
     */
    function getCustomizationHistory(
        uint256 tokenId
    )
        external
        view
        onlyValidToken(tokenId)
        returns (CustomizationHistory[] memory)
    {
        return customizationHistory[tokenId];
    }

    /**
     * @dev Get stickers created by a specific creator
     */
    function getCreatorStickers(
        address creator
    ) external view returns (uint256[] memory) {
        return creatorStickers[creator];
    }

    /**
     * @dev Get user's stickers
     */
    function getUserStickers(
        address user
    ) external view returns (uint256[] memory userStickers) {
        uint256 balance = balanceOf(user);
        userStickers = new uint256[](balance);

        uint256 index = 0;
        for (uint256 i = 0; i < _tokenIdCounter; i++) {
            if (_ownerOf(i) == user) {
                userStickers[index++] = i;
                if (index >= balance) break;
            }
        }
    }

    /**
     * @dev Get total supply of stickers
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Check if sticker has been customized
     */
    function hasBeenCustomized(
        uint256 tokenId
    ) external view onlyValidToken(tokenId) returns (bool) {
        return customizationHistory[tokenId].length > 0;
    }

    /**
     * @dev Get customization count for a sticker
     */
    function getCustomizationCount(
        uint256 tokenId
    ) external view onlyValidToken(tokenId) returns (uint256) {
        return customizationHistory[tokenId].length;
    }

    // ============= MARKETPLACE INTEGRATION =============

    /**
     * @dev Check if token is approved for marketplace trading
     * @param tokenId Token ID to check
     * @param marketplace Marketplace contract address
     */
    function isApprovedForMarketplace(
        uint256 tokenId,
        address marketplace
    ) external view onlyValidToken(tokenId) returns (bool) {
        return
            getApproved(tokenId) == marketplace ||
            isApprovedForAll(_ownerOf(tokenId), marketplace);
    }

    /**
     * @dev Batch approve multiple tokens for marketplace
     */
    function batchApprove(address to, uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(
                ownerOf(tokenIds[i]) == msg.sender ||
                    isApprovedForAll(ownerOf(tokenIds[i]), msg.sender),
                "Not owner or approved"
            );
            approve(to, tokenIds[i]);
        }
    }

    // ============= OVERRIDE FUNCTIONS =============

    /**
     * @dev Override tokenURI - same pattern as MooveRentalPass
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override supportsInterface to include royalty
     */
    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Override _update instead of _beforeTokenTransfer for OpenZeppelin v5
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override whenNotPaused returns (address) {
        address from = _ownerOf(tokenId);

        // Additional checks - validate system is not paused
        if (from != address(0) && to != address(0)) {
            require(
                !accessControl.isGloballyPaused(),
                "System globally paused"
            );
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override _burn - OpenZeppelin v5 pattern
     */
    /**
     * @dev Burn an NFT and cleanup associated data
     */
    function burnNFT(uint256 tokenId) external {
        require(_exists(tokenId), "Token does not exist");
        require(
            ownerOf(tokenId) == msg.sender ||
                accessControl.hasRole(
                    keccak256("MASTER_ADMIN_ROLE"),
                    msg.sender
                ),
            "Not authorized to burn"
        );

        address creator = stickers[tokenId].creator;

        // Cleanup sticker data BEFORE burning
        delete stickers[tokenId];
        delete customizationHistory[tokenId];
        delete isCustomizable[tokenId];

        // Remove from creator's stickers
        _removeFromCreatorStickers(creator, tokenId);

        // Call parent _burn function
        _burn(tokenId);
    }

    // ============= INTERNAL FUNCTIONS =============

    /**
     * @dev Get next edition number for limited edition
     */
    function _getNextEditionNumber(
        address creator,
        string memory editionName,
        uint256 editionSize
    ) internal view returns (uint256) {
        uint256[] memory creatorTokens = creatorStickers[creator];
        uint256 editionCount = 0;

        for (uint256 i = 0; i < creatorTokens.length; i++) {
            StickerNFT memory sticker = stickers[creatorTokens[i]];
            if (
                sticker.isLimitedEdition &&
                sticker.editionSize == editionSize &&
                keccak256(bytes(sticker.name)) == keccak256(bytes(editionName))
            ) {
                editionCount++;
            }
        }

        require(editionCount < editionSize, "Edition size exceeded");
        return editionCount + 1;
    }

    /**
     * @dev Check if customization options are available
     */
    function _hasCustomizationOptions(
        CustomizationOptions memory options
    ) internal pure returns (bool) {
        return
            options.allowColorChange ||
            options.allowTextChange ||
            options.allowSizeChange ||
            options.allowEffectsChange;
    }

    /**
     * @dev Remove token from creator's stickers array
     */
    function _removeFromCreatorStickers(
        address creator,
        uint256 tokenId
    ) internal {
        uint256[] storage creatorTokens = creatorStickers[creator];
        for (uint256 i = 0; i < creatorTokens.length; i++) {
            if (creatorTokens[i] == tokenId) {
                creatorTokens[i] = creatorTokens[creatorTokens.length - 1];
                creatorTokens.pop();
                break;
            }
        }
    }

    /**
     * @dev Convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // ============= EMERGENCY FUNCTIONS =============

    /**
     * @dev Emergency pause contract
     */
    function pause() external onlyAccessControlRole(keccak256("PAUSER_ROLE")) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause()
        external
        onlyAccessControlRole(keccak256("MASTER_ADMIN_ROLE"))
    {
        _unpause();
    }

    /**
     * @dev Emergency burn function (admin only, for content violations)
     */
    function emergencyBurn(
        uint256 tokenId,
        string memory reason
    )
        external
        onlyAccessControlRole(keccak256("MASTER_ADMIN_ROLE"))
        onlyValidToken(tokenId)
    {
        address tokenOwner = _ownerOf(tokenId);
        _burn(tokenId);

        emit EmergencyBurn(tokenId, tokenOwner, reason);
    }

    // ============= EVENTS =============

    event EmergencyBurn(
        uint256 indexed tokenId,
        address indexed owner,
        string reason
    );
}
