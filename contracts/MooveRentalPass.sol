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
    uint256 private _tokenIdCounter;

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
        address indexed owner,
        VehicleType vehicleType,
        string accessCode,
        uint256 expirationDate,
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
     * @dev Mint a new rental pass NFT
     * @param to Address to mint the NFT to
     * @param vehicleType Type of vehicle (BIKE, SCOOTER, MONOPATTINO)
     * @param accessCode Unique access code for the vehicle
     * @param location Location where the vehicle can be used
     * @param price Price paid for the rental pass
     * @param tokenURI Metadata URI for the NFT
     */
    function mintRentalPass(
        address to,
        VehicleType vehicleType,
        string memory accessCode,
        string memory location,
        uint256 price,
        string memory tokenURI
    ) external onlyAccessControlRole(accessControl.MINTER_ROLE()) nonReentrant {
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

        // Map access code to token
        accessCodeToToken[accessCode] = tokenId;

        // Add to user's active passes
        userActivePasses[to].push(tokenId);
        isPassActive[tokenId] = true;

        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        emit RentalPassMinted(
            tokenId,
            to,
            vehicleType,
            accessCode,
            expirationDate,
            price
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

        for (uint256 i = 0; i < recipients.length; i++) {
            mintRentalPass(
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
     * @param accessCode The access code to validate
     * @return tokenId The token ID associated with the code
     * @return owner The owner of the pass
     * @return vehicleType The type of vehicle
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
     * @param tokenId Token ID to deactivate
     * @param reason Reason for deactivation
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
        return _tokenIdCounter;
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

    // ============= OVERRIDE FUNCTIONS =============

    /**
     * @dev Override transfer functions to make NFTs non-transferable
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);

        // Allow minting (from == address(0)) but block all transfers
        require(from == address(0), "Rental passes are non-transferable");
    }

    /**
     * @dev Override approve to prevent approvals
     */
    function approve(address, uint256) public pure override {
        revert("Rental passes cannot be approved for transfer");
    }

    /**
     * @dev Override setApprovalForAll to prevent batch approvals
     */
    function setApprovalForAll(address, bool) public pure override {
        revert("Rental passes cannot be approved for transfer");
    }

    /**
     * @dev Override transferFrom to prevent transfers
     */
    function transferFrom(address, address, uint256) public pure override {
        revert("Rental passes are non-transferable");
    }

    /**
     * @dev Override safeTransferFrom to prevent safe transfers
     */
    function safeTransferFrom(
        address,
        address,
        uint256,
        bytes memory
    ) public pure override {
        revert("Rental passes are non-transferable");
    }

    /**
     * @dev Override safeTransferFrom to prevent safe transfers
     */
    function safeTransferFrom(address, address, uint256) public pure override {
        revert("Rental passes are non-transferable");
    }

    /**
     * @dev Override tokenURI to handle both storage patterns
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

    // ============= INTERNAL FUNCTIONS =============

    /**
     * @dev Remove token from user's active passes array
     */
    function _removeFromActivePasses(address user, uint256 tokenId) internal {
        uint256[] storage passes = userActivePasses[user];
        for (uint256 i = 0; i < passes.length; i++) {
            if (passes[i] == tokenId) {
                passes[i] = passes[passes.length - 1];
                passes.pop();
                break;
            }
        }
    }

    /**
     * @dev Override _burn to handle cleanup
     */
    function _burn(
        uint256 tokenId
    ) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);

        // Cleanup pass data
        RentalPass storage pass = rentalPasses[tokenId];
        delete accessCodeToToken[pass.accessCode];
        delete rentalPasses[tokenId];
        delete isPassActive[tokenId];
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

    /**
     * @dev Emergency function to update access control (for upgrades)
     */
    function updateAccessControl(
        address newAccessControl
    ) external onlyAccessControlRole(accessControl.UPGRADER_ROLE()) {
        require(
            newAccessControl != address(0),
            "Invalid access control address"
        );
        // This would require more complex upgrade logic in practice
        // For now, just emit an event
        emit AccessControlUpdated(address(accessControl), newAccessControl);
    }

    event AccessControlUpdated(
        address indexed oldAccessControl,
        address indexed newAccessControl
    );
}
