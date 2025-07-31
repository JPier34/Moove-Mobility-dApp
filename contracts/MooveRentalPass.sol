// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./MooveAccessControl.sol";

/**
 * @title MooveRentalPass
 * @dev NFT contract for vehicle rental access passes
 * @notice Provides access to Moove vehicle rental network across European cities
 */
contract MooveRentalPass is
    ERC721,
    ERC721URIStorage,
    ReentrancyGuard,
    Pausable
{
    // ============= ENUMS =============

    enum VehicleType {
        BIKE,
        SCOOTER,
        MONOPATTINO
    }

    // ============= STRUCTS =============

    struct RentalPass {
        VehicleType vehicleType;
        string cityId;
        uint256 validUntil;
        uint256 codesGenerated;
        bool isActive;
        uint256 mintedAt;
    }

    struct PassPricing {
        uint256 price;
        uint256 validityDays;
        bool isActive;
    }

    // ============= STATE VARIABLES =============

    MooveAccessControl public accessControl;

    uint256 private _tokenIdCounter = 1;
    uint256 public constant MAX_SUPPLY = 50000;

    // Pass pricing per vehicle type
    mapping(VehicleType => PassPricing) public passPricing;

    // NFT data
    mapping(uint256 => RentalPass) public rentalPasses;

    // Supported cities
    mapping(string => bool) public supportedCities;

    // User limits per city/vehicle type
    mapping(address => mapping(string => mapping(VehicleType => uint256)))
        public userPassCounts;

    // Platform fee recipient
    address public feeRecipient;

    // Maximum passes per user per city per vehicle type
    uint256 public constant MAX_PASSES_PER_USER_PER_TYPE = 3;

    // ============= EVENTS =============

    event RentalPassMinted(
        uint256 indexed tokenId,
        address indexed owner,
        VehicleType vehicleType,
        string cityId,
        uint256 validUntil
    );

    event PassPricingUpdated(
        VehicleType vehicleType,
        uint256 price,
        uint256 validityDays
    );

    event CityStatusUpdated(string cityId, bool supported);

    event CodeGenerated(
        uint256 indexed tokenId,
        address indexed user,
        uint256 timestamp
    );

    event PassExtended(uint256 indexed tokenId, uint256 newValidUntil);

    // ============= ERRORS =============

    error MooveRentalPass__NotAuthorized();
    error MooveRentalPass__CityNotSupported();
    error MooveRentalPass__InsufficientPayment();
    error MooveRentalPass__MaxSupplyReached();
    error MooveRentalPass__PassExpired();
    error MooveRentalPass__PassNotActive();
    error MooveRentalPass__MaxPassesReached();
    error MooveRentalPass__InvalidVehicleType();
    error MooveRentalPass__TokenNotExists();

    // ============= MODIFIERS =============

    modifier onlyAuthorized() {
        if (!accessControl.canMint(msg.sender)) {
            revert MooveRentalPass__NotAuthorized();
        }
        _;
    }

    modifier validCity(string memory cityId) {
        if (!supportedCities[cityId]) {
            revert MooveRentalPass__CityNotSupported();
        }
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        if (_ownerOf(tokenId) == address(0)) {
            revert MooveRentalPass__TokenNotExists();
        }
        _;
    }

    // ============= CONSTRUCTOR =============

    constructor(
        address _accessControl,
        address _feeRecipient
    ) ERC721("Moove Rental Pass", "MVRP") {
        accessControl = MooveAccessControl(_accessControl);
        feeRecipient = _feeRecipient;

        // Initialize default pricing (in wei) - More competitive pricing
        passPricing[VehicleType.BIKE] = PassPricing({
            price: 0.025 ether, // ~€25
            validityDays: 30,
            isActive: true
        });

        passPricing[VehicleType.SCOOTER] = PassPricing({
            price: 0.035 ether, // ~€35
            validityDays: 30,
            isActive: true
        });

        passPricing[VehicleType.MONOPATTINO] = PassPricing({
            price: 0.045 ether, // ~€45
            validityDays: 30,
            isActive: true
        });

        // Initialize supported cities
        _initializeSupportedCities();
    }

    // ============= INITIALIZATION =============

    function _initializeSupportedCities() internal {
        // European cities from config
        string[20] memory cities = [
            "milan",
            "rome",
            "naples",
            "madrid",
            "barcelona",
            "paris",
            "lyon",
            "berlin",
            "munich",
            "amsterdam",
            "rotterdam",
            "brussels",
            "vienna",
            "lisbon",
            "prague",
            "copenhagen",
            "stockholm",
            "zurich",
            "warsaw",
            "budapest"
        ];

        for (uint256 i = 0; i < cities.length; i++) {
            supportedCities[cities[i]] = true;
        }
    }

    // ============= MINTING FUNCTIONS =============

    /**
     * @dev Public mint function for rental passes
     * @param vehicleType Type of vehicle access (bike, scooter, monopattino)
     * @param cityId City identifier where pass is valid
     */
    function mintRentalPass(
        VehicleType vehicleType,
        string memory cityId
    ) external payable nonReentrant whenNotPaused validCity(cityId) {
        PassPricing memory pricing = passPricing[vehicleType];

        if (!pricing.isActive) {
            revert MooveRentalPass__InvalidVehicleType();
        }

        if (msg.value < pricing.price) {
            revert MooveRentalPass__InsufficientPayment();
        }

        if (_tokenIdCounter > MAX_SUPPLY) {
            revert MooveRentalPass__MaxSupplyReached();
        }

        // Check user limits
        if (
            userPassCounts[msg.sender][cityId][vehicleType] >=
            MAX_PASSES_PER_USER_PER_TYPE
        ) {
            revert MooveRentalPass__MaxPassesReached();
        }

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        uint256 validUntil = block.timestamp + (pricing.validityDays * 1 days);

        // Mint NFT
        _safeMint(msg.sender, tokenId);

        // Set pass data
        rentalPasses[tokenId] = RentalPass({
            vehicleType: vehicleType,
            cityId: cityId,
            validUntil: validUntil,
            codesGenerated: 0,
            isActive: true,
            mintedAt: block.timestamp
        });

        // Update user count
        userPassCounts[msg.sender][cityId][vehicleType]++;

        // Set metadata URI
        string memory metadataURI = _generateMetadataURI(
            tokenId,
            vehicleType,
            cityId
        );
        _setTokenURI(tokenId, metadataURI);

        // Transfer payment to fee recipient
        (bool success, ) = payable(feeRecipient).call{value: msg.value}("");
        require(success, "Payment transfer failed");

        emit RentalPassMinted(
            tokenId,
            msg.sender,
            vehicleType,
            cityId,
            validUntil
        );
    }

    /**
     * @dev Admin batch mint for promotional purposes
     */
    function batchMintRentalPass(
        address[] memory recipients,
        VehicleType[] memory vehicleTypes,
        string[] memory cityIds
    ) external onlyAuthorized {
        require(
            recipients.length == vehicleTypes.length &&
                recipients.length == cityIds.length,
            "Array length mismatch"
        );
        require(recipients.length <= 50, "Batch size too large");

        for (uint256 i = 0; i < recipients.length; i++) {
            if (supportedCities[cityIds[i]] && _tokenIdCounter <= MAX_SUPPLY) {
                _mintPassForUser(recipients[i], vehicleTypes[i], cityIds[i]);
            }
        }
    }

    function _mintPassForUser(
        address recipient,
        VehicleType vehicleType,
        string memory cityId
    ) internal {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        PassPricing memory pricing = passPricing[vehicleType];
        uint256 validUntil = block.timestamp + (pricing.validityDays * 1 days);

        _safeMint(recipient, tokenId);

        rentalPasses[tokenId] = RentalPass({
            vehicleType: vehicleType,
            cityId: cityId,
            validUntil: validUntil,
            codesGenerated: 0,
            isActive: true,
            mintedAt: block.timestamp
        });

        string memory metadataURI = _generateMetadataURI(
            tokenId,
            vehicleType,
            cityId
        );
        _setTokenURI(tokenId, metadataURI);

        emit RentalPassMinted(
            tokenId,
            recipient,
            vehicleType,
            cityId,
            validUntil
        );
    }

    // ============= RENTAL FUNCTIONS =============

    /**
     * @dev Check if a pass is valid for rental (no on-chain code tracking)
     * @param tokenId The rental pass token ID
     * @return isValid True if pass can be used for rental
     */
    function canGenerateCode(
        uint256 tokenId
    ) external view returns (bool isValid) {
        if (_ownerOf(tokenId) == address(0)) return false;

        RentalPass memory pass = rentalPasses[tokenId];
        return pass.isActive && block.timestamp <= pass.validUntil;
    }

    /**
     * @dev Extend pass validity (admin function)
     * @param tokenId The rental pass token ID
     * @param additionalDays Days to add to validity
     */
    function extendPassValidity(
        uint256 tokenId,
        uint256 additionalDays
    ) external onlyAuthorized tokenExists(tokenId) {
        RentalPass storage pass = rentalPasses[tokenId];
        pass.validUntil += additionalDays * 1 days;

        emit PassExtended(tokenId, pass.validUntil);
    }

    /**
     * @dev Deactivate a pass (admin function)
     * @param tokenId The rental pass token ID
     */
    function deactivatePass(
        uint256 tokenId
    ) external onlyAuthorized tokenExists(tokenId) {
        rentalPasses[tokenId].isActive = false;
    }

    // ============= VIEW FUNCTIONS =============

    /**
     * @dev Check if a pass is valid for rental
     * @param tokenId The rental pass token ID
     * @return isValid True if pass can be used for rental
     */
    function isPassValid(uint256 tokenId) external view returns (bool isValid) {
        if (_ownerOf(tokenId) == address(0)) return false;

        RentalPass memory pass = rentalPasses[tokenId];
        return pass.isActive && block.timestamp <= pass.validUntil;
    }

    /**
     * @dev Get pass information
     * @param tokenId The rental pass token ID
     * @return pass The rental pass data
     */
    function getPassInfo(
        uint256 tokenId
    ) external view tokenExists(tokenId) returns (RentalPass memory pass) {
        return rentalPasses[tokenId];
    }

    /**
     * @dev Get user's passes for a specific city and vehicle type
     * @param user User address
     * @param cityId City identifier
     * @param vehicleType Vehicle type
     * @return tokenIds Array of token IDs owned by user
     */
    function getUserPasses(
        address user,
        string memory cityId,
        VehicleType vehicleType
    ) external view returns (uint256[] memory tokenIds) {
        uint256 balance = balanceOf(user);
        uint256[] memory tempTokenIds = new uint256[](balance);
        uint256 count = 0;

        for (uint256 i = 1; i < _tokenIdCounter; i++) {
            if (_ownerOf(i) != address(0) && ownerOf(i) == user) {
                RentalPass memory pass = rentalPasses[i];
                if (
                    keccak256(bytes(pass.cityId)) == keccak256(bytes(cityId)) &&
                    pass.vehicleType == vehicleType &&
                    pass.isActive &&
                    block.timestamp <= pass.validUntil
                ) {
                    tempTokenIds[count] = i;
                    count++;
                }
            }
        }

        tokenIds = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            tokenIds[i] = tempTokenIds[i];
        }
    }

    /**
     * @dev Get all passes for a user
     * @param user User address
     * @return tokenIds Array of all token IDs owned by user
     */
    function getAllUserPasses(
        address user
    ) external view returns (uint256[] memory tokenIds) {
        uint256 balance = balanceOf(user);
        tokenIds = new uint256[](balance);
        uint256 count = 0;

        for (uint256 i = 1; i < _tokenIdCounter; i++) {
            if (_ownerOf(i) != address(0) && ownerOf(i) == user) {
                tokenIds[count] = i;
                count++;
            }
        }
    }

    /**
     * @dev Get pricing for vehicle type
     * @param vehicleType Vehicle type to query
     * @return pricing PassPricing struct
     */
    function getPassPricing(
        VehicleType vehicleType
    ) external view returns (PassPricing memory pricing) {
        return passPricing[vehicleType];
    }

    /**
     * @dev Get total supply of minted passes
     * @return supply Current total supply
     */
    function totalSupply() external view returns (uint256 supply) {
        return _tokenIdCounter - 1;
    }

    // ============= ADMIN FUNCTIONS =============

    /**
     * @dev Update pricing for vehicle type
     * @param vehicleType Vehicle type to update
     * @param price New price in wei
     * @param validityDays New validity period in days
     */
    function updatePassPricing(
        VehicleType vehicleType,
        uint256 price,
        uint256 validityDays
    ) external onlyAuthorized {
        require(price > 0, "Price must be greater than 0");
        require(
            validityDays > 0 && validityDays <= 365,
            "Invalid validity period"
        );

        passPricing[vehicleType] = PassPricing({
            price: price,
            validityDays: validityDays,
            isActive: true
        });

        emit PassPricingUpdated(vehicleType, price, validityDays);
    }

    /**
     * @dev Add or remove supported city
     * @param cityId City identifier
     * @param supported Whether city is supported
     */
    function setCitySupport(
        string memory cityId,
        bool supported
    ) external onlyAuthorized {
        supportedCities[cityId] = supported;
        emit CityStatusUpdated(cityId, supported);
    }

    /**
     * @dev Update fee recipient
     * @param newFeeRecipient New fee recipient address
     */
    function setFeeRecipient(address newFeeRecipient) external onlyAuthorized {
        require(newFeeRecipient != address(0), "Invalid address");
        feeRecipient = newFeeRecipient;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyAuthorized {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyAuthorized {
        _unpause();
    }

    // ============= METADATA FUNCTIONS =============

    /**
     * @dev Generate metadata URI for pass
     */
    function _generateMetadataURI(
        uint256 tokenId,
        VehicleType vehicleType,
        string memory cityId
    ) internal pure returns (string memory) {
        return
            string(
                abi.encodePacked(
                    "https://api.moove.com/metadata/rental-pass/",
                    Strings.toString(uint256(vehicleType)), // Convert enum to uint
                    "/",
                    cityId,
                    "/",
                    Strings.toString(tokenId)
                )
            );
    }

    /**
     * @dev Update metadata for a token
     * @param tokenId Token ID to update
     */
    function updateTokenMetadata(
        uint256 tokenId
    ) external onlyAuthorized tokenExists(tokenId) {
        RentalPass memory pass = rentalPasses[tokenId];
        string memory newURI = _generateMetadataURI(
            tokenId,
            pass.vehicleType,
            pass.cityId
        );
        _setTokenURI(tokenId, newURI);
    }

    // ============= OVERRIDES =============

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override whenNotPaused returns (address) {
        return super._update(to, tokenId, auth);
    }
}
