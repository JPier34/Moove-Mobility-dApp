// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./MooveAccessControl.sol";

/**
 * @title MooveNFT
 * @dev NFT contract for customizable stickers - OPTIMIZED for size reduction
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

    /// @dev Default royalty percentage (500 = 5%) - OPTIMIZED: removed separate variable
    uint256 private constant DEFAULT_ROYALTY = 500;

    // ============= STRUCTS =============

    struct StickerNFT {
        string name;
        string description;
        StickerCategory category;
        StickerRarity rarity;
        address creator;
        uint32 creationDate; // Packed: reduced from uint256
        bool isLimitedEdition;
        uint32 editionSize; // Packed: reduced from uint256
        uint32 editionNumber; // Packed: reduced from uint256
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
        uint32 timestamp; // Packed: reduced from uint256
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

    event NFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        address indexed owner
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
        string memory tokenName,
        string memory tokenSymbol,
        address _accessControl
    ) ERC721(tokenName, tokenSymbol) {
        require(_accessControl != address(0), "Invalid access control address");
        accessControl = MooveAccessControl(_accessControl);

        // Set default royalty to contract creator initially
        _setDefaultRoyalty(msg.sender, uint96(DEFAULT_ROYALTY));
    }

    // ============= MINTING FUNCTIONS =============

    /**
     * @dev Mint a new sticker NFT - OPTIMIZED for size
     */
    function mintStickerNFT(
        address to,
        string calldata stickerName,
        string calldata metadataURI,
        StickerCategory category,
        StickerRarity rarity,
        bool isLimitedEdition,
        uint256 editionSize,
        CustomizationOptions calldata customizationOptions,
        string calldata editionName,
        address royaltyRecipient,
        uint96 royaltyPercentage
    ) external onlyAccessControlRole(keccak256("CUSTOMIZATION_ADMIN_ROLE")) {
        _mintStickerInternal(
            to,
            stickerName,
            metadataURI,
            category,
            rarity,
            isLimitedEdition,
            editionSize,
            customizationOptions,
            editionName,
            royaltyRecipient,
            royaltyPercentage
        );
    }

    /**
     * @dev Mint a basic NFT - OPTIMIZED: simplified
     */
    function mintNFT(
        address to,
        string calldata metadataURI // OPTIMIZED: changed to calldata
    ) external onlyAccessControlRole(keccak256("MINTER_ROLE")) returns (uint256 tokenId) {
        tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);
        emit NFTMinted(tokenId, msg.sender, to);
        return tokenId;
    }

    /**
     * @dev Batch mint stickers for limited editions - OPTIMIZED
     */
    function batchMintLimitedEdition(
        address[] calldata recipients,
        string calldata editionName,
        string calldata editionDescription,
        StickerCategory category,
        StickerRarity rarity,
        uint256 editionSize,
        CustomizationOptions calldata customizationOptions,
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

        uint256 length = recipients.length;
        for (uint256 i = 0; i < length;) {
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
            unchecked { i++; }
        }
    }

    /**
     * @dev Internal mint function - OPTIMIZED for size reduction
     */
    function _mintStickerInternal(
        address to,
        string calldata stickerName,
        string calldata stickerDescription,
        StickerCategory category,
        StickerRarity rarity,
        bool isLimitedEdition,
        uint256 editionSize,
        CustomizationOptions calldata customizationOptions,
        string calldata _tokenURI,
        address royaltyRecipient,
        uint96 royaltyPercentage
    ) internal {
        require(to != address(0), "Invalid recipient address");
        require(bytes(stickerName).length > 0, "Name required");
        require(bytes(_tokenURI).length > 0, "Token URI required");

        uint256 tokenId = _tokenIdCounter++;

        // OPTIMIZED: Batch storage operations
        stickers[tokenId] = StickerNFT({
            name: stickerName,
            description: stickerDescription,
            category: category,
            rarity: rarity,
            creator: msg.sender,
            creationDate: uint32(block.timestamp),
            isLimitedEdition: isLimitedEdition,
            editionSize: uint32(editionSize),
            editionNumber: uint32(isLimitedEdition ? _getNextEditionNumber(msg.sender, stickerName, editionSize) : 0),
            customization: customizationOptions
        });

        // OPTIMIZED: Batch boolean and array operations
        isCustomizable[tokenId] = _hasCustomizationOptions(customizationOptions);
        creatorStickers[msg.sender].push(tokenId);

        // OPTIMIZED: Conditional royalty setting
        if (royaltyRecipient != address(0) && royaltyPercentage > 0) {
            _setTokenRoyalty(tokenId, royaltyRecipient, royaltyPercentage);
        }

        // OPTIMIZED: Batch mint operations
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit StickerMinted(tokenId, msg.sender, to, stickerName, category, rarity, isLimitedEdition);
    }

    // ============= CUSTOMIZATION FUNCTIONS =============

    /**
     * @dev Customize a sticker - OPTIMIZED
     */
    function customizeSticker(
        uint256 tokenId,
        string calldata changeDescription,
        string calldata newState,
        string calldata newTokenURI
    ) external onlyValidToken(tokenId) onlyOwnerOrApproved(tokenId) onlyCustomizable(tokenId) nonReentrant {
        // OPTIMIZED: Batch storage operations
        customizationHistory[tokenId].push(CustomizationHistory({
            customizer: msg.sender,
            timestamp: uint32(block.timestamp),
            changeDescription: changeDescription,
            previousState: "",
            newState: newState
        }));

        _setTokenURI(tokenId, newTokenURI);

        emit StickerCustomized(tokenId, msg.sender, changeDescription, newState);
    }

    /**
     * @dev Update customization options - OPTIMIZED
     */
    function updateCustomizationOptions(
        uint256 tokenId,
        CustomizationOptions calldata newOptions
    ) external onlyValidToken(tokenId) onlyAccessControlRole(keccak256("CUSTOMIZATION_ADMIN_ROLE")) {
        stickers[tokenId].customization = newOptions;
        isCustomizable[tokenId] = _hasCustomizationOptions(newOptions);
        emit CustomizationOptionsUpdated(tokenId, newOptions);
    }

    // ============= ROYALTY FUNCTIONS =============

    /**
     * @dev Update token royalty - OPTIMIZED
     */
    function updateTokenRoyalty(
        uint256 tokenId,
        address recipient,
        uint96 feeNumerator
    ) external onlyValidToken(tokenId) {
        require(
            msg.sender == stickers[tokenId].creator || accessControl.hasRole(keccak256("CUSTOMIZATION_ADMIN_ROLE"), msg.sender),
            "Not creator or admin"
        );
        _setTokenRoyalty(tokenId, recipient, feeNumerator);
        emit RoyaltyUpdated(tokenId, recipient, feeNumerator);
    }

    /**
     * @dev Get royalty info - OPTIMIZED: simplified
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice) public view override returns (address, uint256) {
        (address recipient, uint256 royaltyAmount) = super.royaltyInfo(tokenId, salePrice);
        
        // OPTIMIZED: Use default royalty if no specific royalty set
        if (recipient == address(0)) {
            return (msg.sender, (salePrice * DEFAULT_ROYALTY) / 10000);
        }
        
        return (recipient, royaltyAmount);
    }

    // ============= ADMIN FUNCTIONS =============

    /**
     * @dev Pause contract - OPTIMIZED
     */
    function pause() external onlyAccessControlRole(keccak256("PAUSER_ROLE")) {
        _pause();
    }

    /**
     * @dev Unpause contract - OPTIMIZED
     */
    function unpause() external onlyAccessControlRole(keccak256("PAUSER_ROLE")) {
        _unpause();
    }

    /**
     * @dev Burn token - OPTIMIZED
     */
    function burn(uint256 tokenId) external onlyValidToken(tokenId) onlyOwnerOrApproved(tokenId) {
        _burn(tokenId);
    }

    // ============= QUERY FUNCTIONS =============

    /**
     * @dev Get sticker details - OPTIMIZED
     */
    function getSticker(uint256 tokenId) external view onlyValidToken(tokenId) returns (StickerNFT memory) {
        return stickers[tokenId];
    }

    /**
     * @dev Get customization history - OPTIMIZED
     */
    function getCustomizationHistory(uint256 tokenId) external view onlyValidToken(tokenId) returns (CustomizationHistory[] memory) {
        return customizationHistory[tokenId];
    }

    /**
     * @dev Get creator stickers - OPTIMIZED
     */
    function getCreatorStickers(address creator) external view returns (uint256[] memory) {
        return creatorStickers[creator];
    }

    /**
     * @dev Check if sticker is customizable - OPTIMIZED
     */
    function isStickerCustomizable(uint256 tokenId) external view onlyValidToken(tokenId) returns (bool) {
        return isCustomizable[tokenId];
    }

    // ============= INTERNAL FUNCTIONS =============

    /**
     * @dev Check if customization options exist - OPTIMIZED
     */
    function _hasCustomizationOptions(CustomizationOptions memory options) internal pure returns (bool) {
        return options.allowColorChange || options.allowTextChange || options.allowSizeChange || options.allowEffectsChange;
    }

    /**
     * @dev Get next edition number - OPTIMIZED
     */
    function _getNextEditionNumber(address creator, string memory stickerName, uint256 editionSize) internal view returns (uint256) {
        uint256 count = 0;
        uint256[] storage creatorTokens = creatorStickers[creator];
        
        for (uint256 i = 0; i < creatorTokens.length;) {
            StickerNFT storage sticker = stickers[creatorTokens[i]];
            if (sticker.isLimitedEdition && 
                keccak256(bytes(sticker.name)) == keccak256(bytes(stickerName)) &&
                sticker.editionSize == editionSize) {
                count++;
            }
            unchecked { i++; }
        }
        
        return count + 1;
    }

    // ============= OVERRIDE FUNCTIONS =============

    /**
     * @dev Required override for ERC721URIStorage
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Required override for ERC721Royalty
     */
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage, ERC721Royalty) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
