// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "./MooveAccessControl.sol";

/**
 * @title MooveAuction
 * @dev Advanced auction system with 4 different auction types for Moove Sticker NFTs
 * @notice Supports English, Dutch, Sealed Bid, and Reserve auctions
 */
contract MooveAuction is ReentrancyGuard, Pausable {
    // ============= STATE VARIABLES =============

    /// @dev Reference to access control contract
    MooveAccessControl public immutable accessControl;

    /// @dev Counter for auction IDs
    uint256 private _auctionIdCounter;

    /// @dev Mapping from auction ID to auction details
    mapping(uint256 => Auction) public auctions;

    /// @dev Mapping from auction ID to bids
    mapping(uint256 => Bid[]) public auctionBids;

    /// @dev Mapping from auction ID to sealed bids (for sealed bid auctions)
    mapping(uint256 => mapping(address => bytes32)) public sealedBids;

    /// @dev Mapping from auction ID to bidder reveal status
    mapping(uint256 => mapping(address => bool)) public hasRevealed;

    /// @dev Mapping from user to their active auctions
    mapping(address => uint256[]) public userAuctions;

    /// @dev Mapping from user to their active bids
    mapping(address => uint256[]) public userBids;

    /// @dev Platform fee percentage (250 = 2.5%)
    uint256 public platformFeePercentage = 250;

    /// @dev Minimum bid increment percentage (500 = 5%)
    uint256 public minimumBidIncrement = 500;

    /// @dev Maximum auction duration (30 days)
    uint256 public constant MAX_AUCTION_DURATION = 30 days;

    /// @dev Minimum auction duration (1 hour)
    uint256 public constant MIN_AUCTION_DURATION = 1 hours;

    // ============= STRUCTS =============

    struct Auction {
        uint256 auctionId;
        address nftContract;
        uint256 tokenId;
        address seller;
        AuctionType auctionType;
        uint256 startingPrice;
        uint256 reservePrice;
        uint256 buyNowPrice;
        uint256 currentPrice;
        uint256 startTime;
        uint256 endTime;
        uint256 bidIncrement;
        address highestBidder;
        uint256 highestBid;
        AuctionStatus status;
        bool allowPartialFulfillment;
        uint256 minBidders;
        uint256 totalBidders;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
        bool isWinning;
        bool isRefunded;
    }

    struct SealedBidReveal {
        uint256 amount;
        uint256 nonce;
    }

    enum AuctionType {
        ENGLISH, // Traditional ascending bid auction
        DUTCH, // Descending price auction
        SEALED_BID, // Sealed bid auction with reveal phase
        RESERVE // Reserve auction with hidden minimum
    }

    enum AuctionStatus {
        PENDING, // Created but not started
        ACTIVE, // Currently accepting bids
        REVEAL, // Sealed bid reveal phase
        ENDED, // Finished, awaiting settlement
        SETTLED, // Completed and settled
        CANCELLED // Cancelled by seller or admin
    }

    // ============= EVENTS =============

    event AuctionCreated(
        uint256 indexed auctionId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        AuctionType auctionType,
        uint256 startingPrice,
        uint256 duration
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        bool isHighestBid
    );

    event SealedBidSubmitted(
        uint256 indexed auctionId,
        address indexed bidder,
        bytes32 bidHash
    );

    event SealedBidRevealed(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event AuctionSettled(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 finalPrice,
        uint256 platformFee,
        uint256 royaltyFee
    );

    event AuctionCancelled(uint256 indexed auctionId, string reason);

    event BidRefunded(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event DutchPriceUpdate(uint256 indexed auctionId, uint256 newPrice);

    event ReserveReached(uint256 indexed auctionId, uint256 reservePrice);

    // ============= MODIFIERS =============

    modifier onlyAccessControlRole(bytes32 role) {
        accessControl.validateRole(role, msg.sender);
        _;
    }

    modifier validAuction(uint256 auctionId) {
        require(auctionId < _auctionIdCounter, "Auction does not exist");
        _;
    }

    modifier onlyAuctionSeller(uint256 auctionId) {
        require(auctions[auctionId].seller == msg.sender, "Not auction seller");
        _;
    }

    modifier auctionActive(uint256 auctionId) {
        require(
            auctions[auctionId].status == AuctionStatus.ACTIVE,
            "Auction not active"
        );
        require(
            block.timestamp <= auctions[auctionId].endTime,
            "Auction ended"
        );
        _;
    }

    modifier auctionEnded(uint256 auctionId) {
        require(
            auctions[auctionId].status == AuctionStatus.ENDED ||
                block.timestamp > auctions[auctionId].endTime,
            "Auction still active"
        );
        _;
    }

    // ============= CONSTRUCTOR =============

    address public immutable mooveNFTContract;
    address public immutable rentalPassContract;

    constructor(
        address _accessControl,
        address _mooveNFTContract,
        address _rentalPassContract
    ) {
        require(_accessControl != address(0), "Invalid access control address");
        require(_mooveNFTContract != address(0), "Invalid MooveNFT address");
        require(
            _rentalPassContract != address(0),
            "Invalid RentalPass address"
        );

        accessControl = MooveAccessControl(_accessControl);
        mooveNFTContract = _mooveNFTContract;
        rentalPassContract = _rentalPassContract;
    }

    // ============= AUCTION CREATION =============

    /**
     * @dev Create a new auction
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to auction
     * @param auctionType Type of auction
     * @param startingPrice Starting price for the auction
     * @param reservePrice Reserve price (minimum acceptable price)
     * @param buyNowPrice Buy now price (0 if not applicable)
     * @param duration Duration of the auction in seconds
     * @param bidIncrement Minimum bid increment (0 for default)
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        AuctionType auctionType,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 buyNowPrice,
        uint256 duration,
        uint256 bidIncrement
    ) external nonReentrant whenNotPaused returns (uint256 auctionId) {
        require(nftContract != address(0), "Invalid NFT contract");
        require(
            nftContract == mooveNFTContract,
            "Only MooveNFT can be auctioned"
        );
        require(
            nftContract != rentalPassContract,
            "RentalPasses cannot be auctioned"
        );
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(
            duration >= MIN_AUCTION_DURATION &&
                duration <= MAX_AUCTION_DURATION,
            "Invalid duration"
        );

        // Verify NFT ownership and approval
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
                nft.getApproved(tokenId) == address(this),
            "NFT not approved"
        );

        // Validate auction parameters based on type
        _validateAuctionParameters(
            auctionType,
            startingPrice,
            reservePrice,
            buyNowPrice
        );

        auctionId = _auctionIdCounter++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;

        // Set bid increment
        if (bidIncrement == 0) {
            bidIncrement = (startingPrice * minimumBidIncrement) / 10000;
            if (bidIncrement == 0) bidIncrement = 0.001 ether;
        }

        // Create auction
        auctions[auctionId] = Auction({
            auctionId: auctionId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: msg.sender,
            auctionType: auctionType,
            startingPrice: startingPrice,
            reservePrice: reservePrice,
            buyNowPrice: buyNowPrice,
            currentPrice: auctionType == AuctionType.DUTCH ? startingPrice : 0,
            startTime: startTime,
            endTime: endTime,
            bidIncrement: bidIncrement,
            highestBidder: address(0),
            highestBid: 0,
            status: AuctionStatus.ACTIVE,
            allowPartialFulfillment: false,
            minBidders: auctionType == AuctionType.SEALED_BID ? 2 : 1,
            totalBidders: 0
        });

        // Add to user's auctions
        userAuctions[msg.sender].push(auctionId);

        // Transfer NFT to contract (escrow)
        nft.transferFrom(msg.sender, address(this), tokenId);

        emit AuctionCreated(
            auctionId,
            msg.sender,
            nftContract,
            tokenId,
            auctionType,
            startingPrice,
            duration
        );
    }

    // ============= BIDDING FUNCTIONS =============

    /**
     * @dev Place a bid on an English or Reserve auction
     */
    function placeBid(
        uint256 auctionId
    )
        external
        payable
        validAuction(auctionId)
        auctionActive(auctionId)
        nonReentrant
    {
        Auction storage auction = auctions[auctionId];
        require(
            auction.auctionType == AuctionType.ENGLISH ||
                auction.auctionType == AuctionType.RESERVE,
            "Invalid auction type for this bid method"
        );
        require(msg.sender != auction.seller, "Seller cannot bid");
        require(msg.value > 0, "Bid must be greater than 0");

        // Check minimum bid requirements
        uint256 minimumBid = auction.highestBid == 0
            ? auction.startingPrice
            : auction.highestBid + auction.bidIncrement;

        require(msg.value >= minimumBid, "Bid too low");

        // Handle buy now price
        if (auction.buyNowPrice > 0 && msg.value >= auction.buyNowPrice) {
            _executeBuyNow(auctionId, msg.sender, msg.value);
            return;
        }

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            _refundBid(auctionId, auction.highestBidder, auction.highestBid);
        }

        // Update auction state
        auction.highestBidder = msg.sender;
        auction.highestBid = msg.value;

        // Track unique bidders
        if (!_hasUserBid(auctionId, msg.sender)) {
            auction.totalBidders++;
            userBids[msg.sender].push(auctionId);
        }

        // Add bid to history
        auctionBids[auctionId].push(
            Bid({
                bidder: msg.sender,
                amount: msg.value,
                timestamp: block.timestamp,
                isWinning: true,
                isRefunded: false
            })
        );

        // Mark previous bids as not winning
        if (auctionBids[auctionId].length > 1) {
            for (uint256 i = 0; i < auctionBids[auctionId].length - 1; i++) {
                auctionBids[auctionId][i].isWinning = false;
            }
        }

        // Check if reserve is reached
        if (
            auction.auctionType == AuctionType.RESERVE &&
            auction.reservePrice > 0 &&
            msg.value >= auction.reservePrice
        ) {
            emit ReserveReached(auctionId, auction.reservePrice);
        }

        emit BidPlaced(auctionId, msg.sender, msg.value, true);
    }

    /**
     * @dev Purchase at current price for Dutch auction
     */
    function buyNowDutch(
        uint256 auctionId
    )
        external
        payable
        validAuction(auctionId)
        auctionActive(auctionId)
        nonReentrant
    {
        Auction storage auction = auctions[auctionId];
        require(
            auction.auctionType == AuctionType.DUTCH,
            "Not a Dutch auction"
        );
        require(msg.sender != auction.seller, "Seller cannot buy");

        uint256 currentPrice = _getDutchPrice(auctionId);
        require(msg.value >= currentPrice, "Insufficient payment");

        _executeBuyNow(auctionId, msg.sender, currentPrice);

        // Refund excess payment
        if (msg.value > currentPrice) {
            payable(msg.sender).transfer(msg.value - currentPrice);
        }
    }

    /**
     * @dev Submit sealed bid (commitment phase)
     */
    function submitSealedBid(
        uint256 auctionId,
        bytes32 bidHash
    )
        external
        payable
        validAuction(auctionId)
        auctionActive(auctionId)
        nonReentrant
    {
        Auction storage auction = auctions[auctionId];
        require(
            auction.auctionType == AuctionType.SEALED_BID,
            "Not a sealed bid auction"
        );
        require(msg.sender != auction.seller, "Seller cannot bid");
        require(msg.value >= auction.startingPrice, "Bid below minimum");
        require(
            sealedBids[auctionId][msg.sender] == bytes32(0),
            "Bid already submitted"
        );

        // Store sealed bid hash and escrow payment
        sealedBids[auctionId][msg.sender] = bidHash;

        // Track bidder
        if (!_hasUserBid(auctionId, msg.sender)) {
            auction.totalBidders++;
            userBids[msg.sender].push(auctionId);
        }

        // Add to bid history (amount hidden)
        auctionBids[auctionId].push(
            Bid({
                bidder: msg.sender,
                amount: msg.value, // Escrowed amount, not actual bid
                timestamp: block.timestamp,
                isWinning: false,
                isRefunded: false
            })
        );

        emit SealedBidSubmitted(auctionId, msg.sender, bidHash);
    }

    /**
     * @dev Reveal sealed bid
     */
    function revealSealedBid(
        uint256 auctionId,
        uint256 bidAmount,
        uint256 nonce
    ) external validAuction(auctionId) nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(
            auction.auctionType == AuctionType.SEALED_BID,
            "Not a sealed bid auction"
        );
        require(auction.status == AuctionStatus.REVEAL, "Not in reveal phase");
        require(!hasRevealed[auctionId][msg.sender], "Already revealed");
        require(
            sealedBids[auctionId][msg.sender] != bytes32(0),
            "No sealed bid submitted"
        );

        // Verify bid hash
        bytes32 bidHash = keccak256(
            abi.encodePacked(bidAmount, nonce, msg.sender)
        );
        require(
            sealedBids[auctionId][msg.sender] == bidHash,
            "Invalid bid reveal"
        );

        hasRevealed[auctionId][msg.sender] = true;

        // Find and update the bid in history
        for (uint256 i = 0; i < auctionBids[auctionId].length; i++) {
            if (auctionBids[auctionId][i].bidder == msg.sender) {
                // Check if user escrowed enough
                require(
                    auctionBids[auctionId][i].amount >= bidAmount,
                    "Insufficient escrow"
                );

                // Update with actual bid amount
                auctionBids[auctionId][i].amount = bidAmount;
                break;
            }
        }

        // Check if this is the new highest bid
        if (bidAmount > auction.highestBid) {
            auction.highestBidder = msg.sender;
            auction.highestBid = bidAmount;
        }

        emit SealedBidRevealed(auctionId, msg.sender, bidAmount);
    }

    // ============= AUCTION SETTLEMENT =============

    /**
     * @dev Settle auction and transfer NFT to winner
     */
    function settleAuction(
        uint256 auctionId
    ) external validAuction(auctionId) auctionEnded(auctionId) nonReentrant {
        Auction storage auction = auctions[auctionId];

        if (
            auction.status == AuctionStatus.ACTIVE &&
            block.timestamp > auction.endTime
        ) {
            auction.status = AuctionStatus.ENDED;
        }

        if (auction.auctionType == AuctionType.SEALED_BID) {
            if (
                auction.status == AuctionStatus.ACTIVE &&
                block.timestamp > auction.endTime
            ) {
                // Reveal phase started
                auction.status = AuctionStatus.REVEAL;
                auction.endTime = block.timestamp + 24 hours;
                return;
            } else if (
                auction.status == AuctionStatus.REVEAL &&
                block.timestamp > auction.endTime
            ) {
                auction.status = AuctionStatus.ENDED;
            }
        }
        require(
            auction.status == AuctionStatus.ENDED,
            "Auction not ready for settlement"
        );

        // For sealed bid auctions, check if reveal phase is complete
        if (auction.auctionType == AuctionType.SEALED_BID) {
            require(
                auction.status == AuctionStatus.REVEAL,
                "Reveal phase not started"
            );
            // Transition to ended if reveal phase is over
            if (block.timestamp > auction.endTime + 24 hours) {
                // 24h reveal phase
                auction.status = AuctionStatus.ENDED;
            } else {
                revert("Reveal phase still active");
            }
        }

        // Check if reserve price is met (for reserve auctions)
        if (
            auction.auctionType == AuctionType.RESERVE &&
            auction.reservePrice > 0 &&
            auction.highestBid < auction.reservePrice
        ) {
            _cancelAuctionAndRefund(auctionId, "Reserve price not met");
            return;
        }

        // Check minimum bidders requirement
        if (auction.totalBidders < auction.minBidders) {
            _cancelAuctionAndRefund(auctionId, "Minimum bidders not reached");
            return;
        }

        address winner = auction.highestBidder;
        uint256 winningBid = auction.highestBid;

        require(winner != address(0), "No valid winner");
        require(winningBid > 0, "No valid winning bid");

        // Calculate fees
        (
            uint256 platformFee,
            uint256 royaltyFee,
            address royaltyRecipient
        ) = _calculateFees(auction.nftContract, auction.tokenId, winningBid);

        uint256 sellerProceeds = winningBid - platformFee - royaltyFee;

        // Transfer NFT to winner
        IERC721(auction.nftContract).transferFrom(
            address(this),
            winner,
            auction.tokenId
        );

        // Transfer payments
        if (sellerProceeds > 0) {
            payable(auction.seller).transfer(sellerProceeds);
        }
        if (royaltyFee > 0 && royaltyRecipient != address(0)) {
            payable(royaltyRecipient).transfer(royaltyFee);
        }
        // Platform fee stays in contract

        // Refund losing bidders
        _refundLosingBidders(auctionId);

        // Update auction status
        auction.status = AuctionStatus.SETTLED;

        emit AuctionSettled(
            auctionId,
            winner,
            winningBid,
            platformFee,
            royaltyFee
        );
    }

    /**
     * @dev Start reveal phase for sealed bid auctions
     */
    function startRevealPhase(
        uint256 auctionId
    ) external validAuction(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(
            auction.auctionType == AuctionType.SEALED_BID,
            "Not a sealed bid auction"
        );
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(block.timestamp > auction.endTime, "Auction still active");

        auction.status = AuctionStatus.REVEAL;
        // Reveal phase lasts 24 hours
        auction.endTime = block.timestamp + 24 hours;
    }

    // ============= AUCTION MANAGEMENT =============

    /**
     * @dev Cancel auction (seller or admin only)
     */
    function cancelAuction(
        uint256 auctionId,
        string memory reason
    ) external validAuction(auctionId) nonReentrant {
        Auction storage auction = auctions[auctionId];

        require(
            msg.sender == auction.seller ||
                accessControl.hasRole(
                    accessControl.MASTER_ADMIN_ROLE(),
                    msg.sender
                ),
            "Not authorized to cancel"
        );

        require(
            auction.status == AuctionStatus.PENDING ||
                auction.status == AuctionStatus.ACTIVE,
            "Cannot cancel auction in current state"
        );

        _cancelAuctionAndRefund(auctionId, reason);
    }

    /**
     * @dev Emergency cancel by admin
     */
    function emergencyCancel(
        uint256 auctionId,
        string memory reason
    ) external onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE()) {
        _cancelAuctionAndRefund(auctionId, reason);
    }

    /**
     * @dev Extend auction duration (admin only, emergency situations)
     */
    function extendAuction(
        uint256 auctionId,
        uint256 additionalTime
    )
        external
        validAuction(auctionId)
        onlyAccessControlRole(accessControl.AUCTION_MANAGER_ROLE())
    {
        Auction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(additionalTime <= 24 hours, "Extension too long");

        auction.endTime += additionalTime;
    }

    // ============= VIEW FUNCTIONS =============

    /**
     * @dev Get auction details
     */
    function getAuction(
        uint256 auctionId
    ) external view validAuction(auctionId) returns (Auction memory) {
        return auctions[auctionId];
    }

    /**
     * @dev Get auction bids
     */
    function getAuctionBids(
        uint256 auctionId
    ) external view validAuction(auctionId) returns (Bid[] memory) {
        return auctionBids[auctionId];
    }

    /**
     * @dev Get current price for Dutch auction
     */
    function getDutchPrice(
        uint256 auctionId
    ) external view validAuction(auctionId) returns (uint256) {
        return _getDutchPrice(auctionId);
    }

    /**
     * @dev Get user's auctions
     */
    function getUserAuctions(
        address user
    ) external view returns (uint256[] memory) {
        return userAuctions[user];
    }

    /**
     * @dev Get user's bids
     */
    function getUserBids(
        address user
    ) external view returns (uint256[] memory) {
        return userBids[user];
    }

    /**
     * @dev Get active auctions
     */
    function getActiveAuctions()
        external
        view
        returns (uint256[] memory activeAuctions)
    {
        // Count active auctions
        uint256 count = 0;
        for (uint256 i = 0; i < _auctionIdCounter; i++) {
            if (
                auctions[i].status == AuctionStatus.ACTIVE &&
                block.timestamp <= auctions[i].endTime
            ) {
                count++;
            }
        }

        // Fill array
        activeAuctions = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _auctionIdCounter; i++) {
            if (
                auctions[i].status == AuctionStatus.ACTIVE &&
                block.timestamp <= auctions[i].endTime
            ) {
                activeAuctions[index++] = i;
            }
        }
    }

    /**
     * @dev Get auctions by type
     */
    function getAuctionsByType(
        AuctionType auctionType
    ) external view returns (uint256[] memory matchingAuctions) {
        // Count matching auctions
        uint256 count = 0;
        for (uint256 i = 0; i < _auctionIdCounter; i++) {
            if (auctions[i].auctionType == auctionType) {
                count++;
            }
        }

        // Fill array
        matchingAuctions = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _auctionIdCounter; i++) {
            if (auctions[i].auctionType == auctionType) {
                matchingAuctions[index++] = i;
            }
        }
    }

    /**
     * @dev Get ending soon auctions (within next 24 hours)
     */
    function getEndingSoonAuctions()
        external
        view
        returns (uint256[] memory endingSoon)
    {
        uint256 count = 0;
        uint256 deadline = block.timestamp + 24 hours;

        // Count ending soon auctions
        for (uint256 i = 0; i < _auctionIdCounter; i++) {
            if (
                auctions[i].status == AuctionStatus.ACTIVE &&
                auctions[i].endTime <= deadline &&
                auctions[i].endTime > block.timestamp
            ) {
                count++;
            }
        }

        // Fill array
        endingSoon = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < _auctionIdCounter; i++) {
            if (
                auctions[i].status == AuctionStatus.ACTIVE &&
                auctions[i].endTime <= deadline &&
                auctions[i].endTime > block.timestamp
            ) {
                endingSoon[index++] = i;
            }
        }
    }

    /**
     * @dev Check if user has bid on auction
     */
    function hasUserBid(
        uint256 auctionId,
        address user
    ) external view validAuction(auctionId) returns (bool) {
        return _hasUserBid(auctionId, user);
    }

    /**
     * @dev Get total number of auctions
     */
    function totalAuctions() external view returns (uint256) {
        return _auctionIdCounter;
    }

    // ============= INTERNAL FUNCTIONS =============

    /**
     * @dev Validate auction parameters based on type
     */
    function _validateAuctionParameters(
        AuctionType auctionType,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 buyNowPrice
    ) internal pure {
        if (auctionType == AuctionType.RESERVE) {
            require(
                reservePrice >= startingPrice,
                "Reserve price must be >= starting price"
            );
        }

        if (buyNowPrice > 0) {
            require(
                buyNowPrice > startingPrice,
                "Buy now price must be > starting price"
            );
            if (reservePrice > 0) {
                require(
                    buyNowPrice >= reservePrice,
                    "Buy now price must be >= reserve price"
                );
            }
        }

        if (auctionType == AuctionType.DUTCH) {
            require(
                reservePrice > 0 && reservePrice < startingPrice,
                "Dutch auction needs valid reserve < starting price"
            );
        }
    }

    /**
     * @dev Calculate Dutch auction current price
     */
    function _getDutchPrice(uint256 auctionId) internal view returns (uint256) {
        Auction memory auction = auctions[auctionId];
        require(
            auction.auctionType == AuctionType.DUTCH,
            "Not a Dutch auction"
        );

        if (block.timestamp >= auction.endTime) {
            return auction.reservePrice;
        }

        uint256 timeElapsed = block.timestamp - auction.startTime;
        uint256 totalDuration = auction.endTime - auction.startTime;
        uint256 priceRange = auction.startingPrice - auction.reservePrice;

        uint256 priceDecrease = (priceRange * timeElapsed) / totalDuration;
        return auction.startingPrice - priceDecrease;
    }

    /**
     * @dev Execute buy now purchase
     */
    function _executeBuyNow(
        uint256 auctionId,
        address buyer,
        uint256 price
    ) internal {
        Auction storage auction = auctions[auctionId];

        auction.highestBidder = buyer;
        auction.highestBid = price;
        auction.status = AuctionStatus.ENDED;
        auction.totalBidders = 1;

        // Add to user bids if not already present
        if (!_hasUserBid(auctionId, buyer)) {
            userBids[buyer].push(auctionId);
        }

        // Add bid to history
        auctionBids[auctionId].push(
            Bid({
                bidder: buyer,
                amount: price,
                timestamp: block.timestamp,
                isWinning: true,
                isRefunded: false
            })
        );

        emit BidPlaced(auctionId, buyer, price, true);
    }

    /**
     * @dev Cancel auction and refund all bidders
     */
    function _cancelAuctionAndRefund(
        uint256 auctionId,
        string memory reason
    ) internal {
        Auction storage auction = auctions[auctionId];

        // Return NFT to seller
        IERC721(auction.nftContract).transferFrom(
            address(this),
            auction.seller,
            auction.tokenId
        );

        // Refund all bidders
        _refundAllBidders(auctionId);

        auction.status = AuctionStatus.CANCELLED;

        emit AuctionCancelled(auctionId, reason);
    }

    /**
     * @dev Refund a specific bid
     */
    function _refundBid(
        uint256 auctionId,
        address bidder,
        uint256 amount
    ) internal {
        if (amount > 0) {
            payable(bidder).transfer(amount);
            emit BidRefunded(auctionId, bidder, amount);
        }
    }

    /**
     * @dev Refund all bidders except winner
     */
    function _refundLosingBidders(uint256 auctionId) internal {
        Bid[] storage bids = auctionBids[auctionId];
        address winner = auctions[auctionId].highestBidder;

        for (uint256 i = 0; i < bids.length; i++) {
            if (bids[i].bidder != winner && !bids[i].isRefunded) {
                bids[i].isRefunded = true;
                _refundBid(auctionId, bids[i].bidder, bids[i].amount);
            }
        }
    }

    /**
     * @dev Refund all bidders (for cancelled auctions)
     */
    function _refundAllBidders(uint256 auctionId) internal {
        Bid[] storage bids = auctionBids[auctionId];

        for (uint256 i = 0; i < bids.length; i++) {
            if (!bids[i].isRefunded) {
                bids[i].isRefunded = true;
                _refundBid(auctionId, bids[i].bidder, bids[i].amount);
            }
        }
    }

    /**
     * @dev Check if user has placed a bid on auction
     */
    function _hasUserBid(
        uint256 auctionId,
        address user
    ) internal view returns (bool) {
        uint256[] memory userBidsArray = userBids[user];
        for (uint256 i = 0; i < userBidsArray.length; i++) {
            if (userBidsArray[i] == auctionId) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Calculate platform and royalty fees
     */
    function _calculateFees(
        address nftContract,
        uint256 tokenId,
        uint256 salePrice
    )
        internal
        view
        returns (
            uint256 platformFee,
            uint256 royaltyFee,
            address royaltyRecipient
        )
    {
        // Calculate platform fee
        platformFee = (salePrice * platformFeePercentage) / 10000;

        // Calculate royalty fee if contract supports EIP-2981
        try IERC2981(nftContract).royaltyInfo(tokenId, salePrice) returns (
            address recipient,
            uint256 royaltyAmount
        ) {
            royaltyFee = royaltyAmount;
            royaltyRecipient = recipient;
        } catch {
            royaltyFee = 0;
            royaltyRecipient = address(0);
        }

        // Ensure fees don't exceed sale price
        require(
            platformFee + royaltyFee <= salePrice,
            "Fees exceed sale price"
        );
    }

    // ============= ADMIN FUNCTIONS =============

    /**
     * @dev Update platform fee percentage
     */
    function updatePlatformFee(
        uint256 newFeePercentage
    ) external onlyAccessControlRole(accessControl.PRICE_MANAGER_ROLE()) {
        require(newFeePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = newFeePercentage;
    }

    /**
     * @dev Update minimum bid increment
     */
    function updateMinimumBidIncrement(
        uint256 newIncrement
    ) external onlyAccessControlRole(accessControl.PRICE_MANAGER_ROLE()) {
        require(newIncrement <= 2000, "Increment too high"); // Max 20%
        minimumBidIncrement = newIncrement;
    }

    /**
     * @dev Withdraw platform fees
     */
    function withdrawPlatformFees(
        address to,
        uint256 amount
    )
        external
        onlyAccessControlRole(accessControl.WITHDRAWER_ROLE())
        nonReentrant
    {
        require(to != address(0), "Invalid recipient");
        require(amount <= address(this).balance, "Insufficient balance");

        payable(to).transfer(amount);
    }

    /**
     * @dev Emergency pause
     */
    function pause()
        external
        onlyAccessControlRole(accessControl.PAUSER_ROLE())
    {
        _pause();
    }

    /**
     * @dev Unpause
     */
    function unpause()
        external
        onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE())
    {
        _unpause();
    }

    // ============= STATISTICS FUNCTIONS =============

    /**
     * @dev Get auction statistics
     */
    function getAuctionStats()
        external
        view
        returns (
            uint256 totalAuctionsCount,
            uint256 activeAuctionsCount,
            uint256 settledAuctionsCount,
            uint256 cancelledAuctionsCount,
            uint256 totalVolume
        )
    {
        totalAuctionsCount = _auctionIdCounter;

        for (uint256 i = 0; i < _auctionIdCounter; i++) {
            AuctionStatus status = auctions[i].status;

            if (status == AuctionStatus.ACTIVE) {
                activeAuctionsCount++;
            } else if (status == AuctionStatus.SETTLED) {
                settledAuctionsCount++;
                totalVolume += auctions[i].highestBid;
            } else if (status == AuctionStatus.CANCELLED) {
                cancelledAuctionsCount++;
            }
        }
    }

    /**
     * @dev Get auction type distribution
     */
    function getAuctionTypeDistribution()
        external
        view
        returns (
            uint256 englishCount,
            uint256 dutchCount,
            uint256 sealedBidCount,
            uint256 reserveCount
        )
    {
        for (uint256 i = 0; i < _auctionIdCounter; i++) {
            AuctionType auctionType = auctions[i].auctionType;

            if (auctionType == AuctionType.ENGLISH) {
                englishCount++;
            } else if (auctionType == AuctionType.DUTCH) {
                dutchCount++;
            } else if (auctionType == AuctionType.SEALED_BID) {
                sealedBidCount++;
            } else if (auctionType == AuctionType.RESERVE) {
                reserveCount++;
            }
        }
    }

    // ============= RECEIVE FUNCTION =============

    /**
     * @dev Receive function to handle direct ETH transfers
     */
    receive() external payable {
        // Accept ETH for fee collection
    }

    /**
     * @dev Fallback function
     */
    fallback() external payable {
        revert("Function not found");
    }
}
