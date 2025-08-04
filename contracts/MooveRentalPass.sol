// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./MooveAccessControl.sol";

/**
 * @title MooveRentalPass
 * @dev NFT contract for 30-day vehicle access passes - NON-TRANSFERABLE
 * @notice These NFTs provide access codes for vehicles and cannot be traded
 */
contract MooveRentalPass is
    ERC721,
    ERC721URIStorage,
    ReentrancyGuard,
    Pausable
{
    // ============= STATE VARIABLES =============

    /// @dev Reference to access control contract
    MooveAccessControl public immutable accessControl;

    /// @dev Counter for token IDs
    uint256 private _tokenIdCounter = 1;

    /// @dev Mapping from token ID to rental pass details
    mapping(uint256 => RentalPass) public rentalPasses;

    /// @dev Mapping from access code to token ID (for validation)
    mapping(string => uint256) public accessCodeToToken;

    /// @dev Mapping from user to active passes (for UI display)
    mapping(address => uint256[]) public userActivePasses;

    /// @dev Mapping to track if pass is active
    mapping(uint256 => bool) public isPassActive;

    // ============= STRUCTS =============

    struct RentalPass {
        VehicleType vehicleType;
        string accessCode;
        uint256 expirationDate;
        uint256 purchasePrice;
        string location;
        bool isActive;
        address originalOwner;
    }

    enum VehicleType {
        BIKE,
        SCOOTER,
        MONOPATTINO
    }

    // ============= EVENTS =============

    event RentalPassMinted(
        uint256 indexed tokenId,
        address indexed to,
        VehicleType vehicleType,
        string accessCode,
        string location, // Fixed: string instead of uint256
        uint256 price
    );

    event AccessCodeUsed(
        uint256 indexed tokenId,
        string accessCode,
        address indexed user
    );

    event PassExpired(uint256 indexed tokenId, string accessCode);

    event PassDeactivated(
        uint256 indexed tokenId,
        string accessCode,
        string reason
    );

    // ============= MODIFIERS =============

    modifier onlyAccessControlRole(bytes32 role) {
        accessControl.validateRole(role, msg.sender);
        _;
    }

    modifier onlyValidToken(uint256 tokenId) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _;
    }

    modifier onlyNonExpired(uint256 tokenId) {
        require(
            block.timestamp < rentalPasses[tokenId].expirationDate,
            "Pass expired"
        );
        _;
    }

    // ============= CONSTRUCTOR =============

    constructor(address _accessControl) ERC721("Moove Rental Pass", "MRP") {
        require(_accessControl != address(0), "Invalid access control address");
        accessControl = MooveAccessControl(_accessControl);
    }

    // ============= MINTING FUNCTIONS =============

    /**
     * @dev Internal function to mint a new rental pass NFT
     */
    function _mintRentalPass(
        address to,
        VehicleType vehicleType,
        string memory accessCode,
        string memory location,
        uint256 price,
        string memory _tokenURI
    ) internal {
        require(to != address(0), "Invalid recipient address");
        require(bytes(accessCode).length > 0, "Access code required");
        require(
            accessCodeToToken[accessCode] == 0,
            "Access code already exists"
        );
        require(bytes(location).length > 0, "Location required");

        uint256 tokenId = _tokenIdCounter++;
        uint256 expirationDate = block.timestamp + 30 days;

        // Create rental pass struct
        rentalPasses[tokenId] = RentalPass({
            vehicleType: vehicleType,
            accessCode: accessCode,
            expirationDate: expirationDate,
            purchasePrice: price,
            location: location,
            isActive: true,
            originalOwner: to
        });

        // Map access code to token ID
        accessCodeToToken[accessCode] = tokenId;
        isPassActive[tokenId] = true;

        // Add to user's active passes
        userActivePasses[to].push(tokenId);

        // Mint the NFT
        _mint(to, tokenId);

        // Set token URI
        _setTokenURI(tokenId, _tokenURI);

        // Emit event
        emit RentalPassMinted(
            tokenId,
            to,
            vehicleType,
            accessCode,
            location,
            price
        );
    }

    /**
     * @dev Public function for single minting
     */
    function mintRentalPass(
        address to,
        VehicleType vehicleType,
        string memory accessCode,
        string memory location,
        uint256 price,
        string memory _tokenURI
    ) external onlyAccessControlRole(accessControl.MINTER_ROLE()) nonReentrant {
        _mintRentalPass(
            to,
            vehicleType,
            accessCode,
            location,
            price,
            _tokenURI
        );
    }

    /**
     * @dev Batch mint rental passes for efficiency
     */
    function batchMintRentalPasses(
        address[] calldata recipients,
        VehicleType[] calldata vehicleTypes,
        string[] calldata accessCodes,
        string[] calldata locations,
        uint256[] calldata prices,
        string[] calldata tokenURIs
    ) external onlyAccessControlRole(accessControl.MINTER_ROLE()) nonReentrant {
        require(
            recipients.length == vehicleTypes.length,
            "Array length mismatch"
        );
        require(
            recipients.length == accessCodes.length,
            "Array length mismatch"
        );
        require(recipients.length == locations.length, "Array length mismatch");
        require(recipients.length == prices.length, "Array length mismatch");
        require(recipients.length == tokenURIs.length, "Array length mismatch");
        require(recipients.length <= 50, "Batch size too large");

        for (uint256 i = 0; i < recipients.length; i++) {
            _mintRentalPass(
                recipients[i],
                vehicleTypes[i],
                accessCodes[i],
                locations[i],
                prices[i],
                tokenURIs[i]
            );
        }
    }

    // ============= ACCESS VALIDATION =============

    /**
     * @dev Validate access code and mark as used
     */
    function validateAndUseAccessCode(
        string memory accessCode
    )
        external
        onlyAccessControlRole(accessControl.MINTER_ROLE())
        returns (uint256 tokenId, address owner, VehicleType vehicleType)
    {
        tokenId = accessCodeToToken[accessCode];
        require(tokenId != 0, "Invalid access code");

        RentalPass storage pass = rentalPasses[tokenId];
        require(pass.isActive, "Pass is not active");
        require(block.timestamp < pass.expirationDate, "Pass expired");

        owner = _ownerOf(tokenId);
        vehicleType = pass.vehicleType;

        emit AccessCodeUsed(tokenId, accessCode, owner);
    }

    /**
     * @dev Check if access code is valid without using it
     */
    function isAccessCodeValid(
        string memory accessCode
    )
        external
        view
        returns (bool valid, uint256 tokenId, uint256 expirationDate)
    {
        tokenId = accessCodeToToken[accessCode];
        if (tokenId == 0) return (false, 0, 0);

        RentalPass memory pass = rentalPasses[tokenId];
        valid = pass.isActive && block.timestamp < pass.expirationDate;
        expirationDate = pass.expirationDate;
    }

    // ============= PASS MANAGEMENT =============

    /**
     * @dev Deactivate a rental pass (admin function)
     */
    function deactivatePass(
        uint256 tokenId,
        string memory reason
    )
        external
        onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE())
        onlyValidToken(tokenId)
    {
        RentalPass storage pass = rentalPasses[tokenId];
        require(pass.isActive, "Pass already inactive");

        pass.isActive = false;
        isPassActive[tokenId] = false;

        // Remove from user's active passes
        _removeFromActivePasses(_ownerOf(tokenId), tokenId);

        emit PassDeactivated(tokenId, pass.accessCode, reason);
    }

    /**
     * @dev Cleanup expired passes (can be called by anyone to maintain state)
     */
    function cleanupExpiredPasses(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (_ownerOf(tokenId) != address(0)) {
                RentalPass storage pass = rentalPasses[tokenId];
                if (pass.isActive && block.timestamp >= pass.expirationDate) {
                    pass.isActive = false;
                    isPassActive[tokenId] = false;

                    // Remove from user's active passes
                    _removeFromActivePasses(_ownerOf(tokenId), tokenId);

                    emit PassExpired(tokenId, pass.accessCode);
                }
            }
        }
    }

    // ============= VIEW FUNCTIONS =============

    /**
     * @dev Get rental pass details
     */
    function getRentalPass(
        uint256 tokenId
    ) external view onlyValidToken(tokenId) returns (RentalPass memory) {
        return rentalPasses[tokenId];
    }

    /**
     * @dev Get user's active passes
     */
    function getUserActivePasses(
        address user
    ) external view returns (uint256[] memory) {
        return userActivePasses[user];
    }

    /**
     * @dev Get user's active passes with details
     */
    function getUserActivePassesWithDetails(
        address user
    ) external view returns (RentalPass[] memory activePasses) {
        uint256[] memory tokenIds = userActivePasses[user];
        activePasses = new RentalPass[](tokenIds.length);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            activePasses[i] = rentalPasses[tokenIds[i]];
        }
    }

    /**
     * @dev Get total supply of rental passes
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1; // Subtract 1 because counter starts at 1
    }

    /**
     * @dev Check if pass is expired
     */
    function isPassExpired(
        uint256 tokenId
    ) external view onlyValidToken(tokenId) returns (bool) {
        return block.timestamp >= rentalPasses[tokenId].expirationDate;
    }

    /**
     * @dev Get token ID by access code
     */
    function getTokenByAccessCode(
        string memory accessCode
    ) external view returns (uint256) {
        uint256 tokenId = accessCodeToToken[accessCode];
        require(tokenId != 0, "Access code not found");
        return tokenId;
    }

    /**
     * @dev Get passes expiring soon (within next 24 hours)
     */
    function getPassesExpiringSoon(
        address user
    ) external view returns (uint256[] memory expiringPasses) {
        uint256[] memory userPasses = userActivePasses[user];
        uint256 count = 0;

        // Count expiring passes
        for (uint256 i = 0; i < userPasses.length; i++) {
            if (
                rentalPasses[userPasses[i]].expirationDate <=
                block.timestamp + 24 hours
            ) {
                count++;
            }
        }

        // Fill array
        expiringPasses = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < userPasses.length; i++) {
            if (
                rentalPasses[userPasses[i]].expirationDate <=
                block.timestamp + 24 hours
            ) {
                expiringPasses[index++] = userPasses[i];
            }
        }
    }

    // ============= INTERNAL FUNCTIONS =============

    /**
     * @dev Remove token from user's active passes array
     */
    function _removeFromActivePasses(address user, uint256 tokenId) internal {
        uint256[] storage passes = userActivePasses[user];
        for (uint256 i = 0; i < passes.length; i++) {
            if (passes[i] == tokenId) {
                // Move last element to current position and remove last element
                passes[i] = passes[passes.length - 1];
                passes.pop();
                break;
            }
        }
    }

    // ============= OVERRIDE FUNCTIONS =============

    /**
     * @dev Override _update to prevent transfers but allow minting (OpenZeppelin v5.x)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);

        // Allow minting (from == address(0)) but block all transfers
        if (from != address(0)) {
            revert("Rental passes are non-transferable");
        }

        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Override tokenURI
     */
    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Override supportsInterface
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ============= BURN FUNCTIONALITY =============

    /**
     * @dev Burn a rental pass and cleanup associated data
     * @param tokenId Token ID to burn
     */
    function burnRentalPass(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(
            ownerOf(tokenId) == msg.sender ||
                accessControl.hasRole(
                    accessControl.MASTER_ADMIN_ROLE(),
                    msg.sender
                ),
            "Not authorized to burn"
        );

        // Get pass data before burning (needed for cleanup)
        RentalPass storage pass = rentalPasses[tokenId];
        address owner = ownerOf(tokenId);

        // Remove from user's active passes
        _removeFromActivePasses(owner, tokenId);

        // Cleanup mapping data
        delete accessCodeToToken[pass.accessCode];
        delete rentalPasses[tokenId];
        delete isPassActive[tokenId];

        // Call parent _burn function (this will work in v5)
        _burn(tokenId);
    }

    // ============= EMERGENCY FUNCTIONS =============

    /**
     * @dev Emergency pause contract
     */
    function pause()
        external
        onlyAccessControlRole(accessControl.PAUSER_ROLE())
    {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause()
        external
        onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE())
    {
        _unpause();
    }
}
