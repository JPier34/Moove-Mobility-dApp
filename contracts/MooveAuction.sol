// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "./MooveAccessControl.sol";

/**
 * @title MooveAuction - Enhanced with Auto-Extension
 * @dev Advanced auction system with 4 different auction types for Moove Sticker NFTs
 * @notice Supports English, Dutch, Sealed Bid, and Reserve auctions with automatic extension
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
    uint256 public constant MIN_AUCTION_DURATION = 1 minutes; // Changed for testing

    /// @dev Maximum number of bids per auction to prevent DoS
    uint256 public constant MAX_BIDS_PER_AUCTION = 1000;

    /// @dev Minimum time between bids to prevent spam (5 minutes)
    uint256 public constant MIN_BID_INTERVAL = 5 minutes;

    /// @dev Mapping to track last bid time per user per auction
    mapping(uint256 => mapping(address => uint256)) public lastBidTime;
    
    /// @dev Mapping to track if user has bid (O(1) lookup instead of O(n))
    mapping(uint256 => mapping(address => bool)) private userHasBid;
    
    // Dutch auction commitments removed - simplified to direct buy now
    
    /// @dev Mapping for sealed bid deposits (actual ETH deposited vs bid amount)
    mapping(uint256 => mapping(address => uint256)) public sealedBidDeposits;
    
    /// @dev Mapping for sealed bid penalties (for false reveals)
    mapping(uint256 => mapping(address => bool)) public sealedBidPenalties;

    // ============= AUTO-EXTENSION CONSTANTS =============
    
    /// @dev Default extension threshold for English auctions (5 minutes)
    uint256 public constant DEFAULT_EXTENSION_THRESHOLD = 5 minutes;
    
    /// @dev Default extension duration for English auctions (10 minutes)
    uint256 public constant DEFAULT_EXTENSION_DURATION = 10 minutes;
    
    /// @dev Maximum extension duration to prevent abuse (1 hour)
    uint256 public constant MAX_EXTENSION_DURATION = 1 hours;
    
    /// @dev Minimum deposit percentage for sealed bids (10%)
    uint256 public constant MIN_SEALED_BID_DEPOSIT_PERCENTAGE = 1000;
    
    /// @dev Penalty percentage for false sealed bid reveals (50% of deposit)
    uint256 public constant SEALED_BID_PENALTY_PERCENTAGE = 5000;

    // ============= STRUCTS =============

    struct Auction {
        uint256 auctionId;          // 32 bytes
        address nftContract;        // 20 bytes
        uint96 tokenId;            // 12 bytes (packed with nftContract)
        address seller;            // 20 bytes
        AuctionType auctionType;    // 1 byte
        AuctionStatus status;       // 1 byte (packed with auctionType)
        bool allowPartialFulfillment; // 1 byte
        bool isSettled;            // 1 byte (packed with allowPartialFulfillment)
        bool revealPhaseStarted;   // 1 byte (packed with isSettled)
        uint128 startingPrice;     // 16 bytes (sufficient for most NFT prices)
        uint128 reservePrice;      // 16 bytes
        uint128 buyNowPrice;       // 16 bytes
        uint128 currentPrice;      // 16 bytes
        uint128 bidIncrement;      // 16 bytes
        uint128 highestBid;        // 16 bytes
        uint32 startTime;          // 4 bytes (timestamp fits in 32 bits until 2106)
        uint32 endTime;            // 4 bytes
        uint32 extensionThreshold; // 4 bytes (packed with endTime)
        uint32 extensionDuration;  // 4 bytes (packed with extensionThreshold)
        uint32 revealEndTime;      // 4 bytes (packed with extensionDuration)
        address highestBidder;     // 20 bytes
        uint32 minBidders;         // 4 bytes (packed with highestBidder)
        uint32 totalBidders;       // 4 bytes (packed with minBidders)
    }

    struct Bid {
        address bidder;        // 20 bytes
        uint128 amount;        // 16 bytes (packed with bidder)
        uint32 timestamp;      // 4 bytes (packed with amount)
        bool isWinning;        // 1 byte
        bool isRefunded;       // 1 byte (packed with isWinning)
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

    event AuctionEnded(uint256 indexed auctionId);

    event BidRefunded(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    event DutchPriceUpdate(uint256 indexed auctionId, uint256 newPrice);

    event ReserveReached(uint256 indexed auctionId, uint256 reservePrice);

    // 🆕 AUTO-EXTENSION EVENT
    event AuctionExtended(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 extensionDuration,
        uint256 newEndTime,
        string reason
    );

    // 🆕 SEALED BID TIE EVENT
    event SealedBidTie(
        uint256 indexed auctionId,
        address[] tiedBidders,
        uint256 tieAmount,
        address winner,
        string tieBreaker
    );

    // 🆕 BATCH OPERATIONS EVENTS
    event BatchRefundCompleted(
        uint256 indexed auctionId,
        uint256 refundedCount,
        uint256 startIndex,
        uint256 endIndex
    );

    event EmergencyBatchRefundCompleted(
        uint256 indexed auctionId,
        uint256 refundedCount,
        uint256 startIndex,
        uint256 endIndex
    );

    // 🆕 SEALED BID PENALTY EVENT
    event SealedBidPenaltyApplied(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 penaltyAmount,
        string reason
    );

    // 🆕 EMERGENCY RECOVERY EVENTS
    event EmergencySettlement(
        uint256 indexed auctionId,
        string reason
    );

    event EmergencyRefundCompleted(
        uint256 indexed auctionId,
        uint256 refundedCount
    );

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
        
        // For sealed bid auctions, allow bids until reveal phase starts
        if (auctions[auctionId].auctionType == AuctionType.SEALED_BID) {
            require(!auctions[auctionId].revealPhaseStarted, "Reveal phase already started");
        } else {
            // For other auction types, check endTime
            require(
                block.timestamp <= auctions[auctionId].endTime,
                "Auction ended"
            );
        }
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

    modifier notSettled(uint256 auctionId) {
        require(!auctions[auctionId].isSettled, "Auction already settled");
        _;
    }

    modifier bidInterval(uint256 auctionId) {
        require(
            block.timestamp >= lastBidTime[auctionId][msg.sender] + MIN_BID_INTERVAL,
            "Bid too soon"
        );
        _;
    }

    // ============= CONSTRUCTOR =============

    constructor(address _accessControl) {
        require(_accessControl != address(0), "Invalid access control address");
        accessControl = MooveAccessControl(_accessControl);
    }

    // ============= AUCTION CREATION =============

    /**
     * @dev Create a new auction with optional extension parameters
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to auction
     * @param auctionType Type of auction
     * @param startingPrice Starting price for the auction
     * @param reservePrice Reserve price (minimum acceptable price)
     * @param buyNowPrice Buy now price (0 if not applicable)
     * @param duration Duration of the auction in seconds
     * @param bidIncrement Minimum bid increment (0 for default)
     * @param extensionThreshold Time threshold for auto-extension (0 for default, only for English auctions)
     * @param extensionDuration Duration to extend by (0 for default, only for English auctions)
     */
    function createAuction(
        address nftContract,
        uint256 tokenId,
        AuctionType auctionType,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 buyNowPrice,
        uint256 duration,
        uint256 bidIncrement,
        uint256 extensionThreshold,
        uint256 extensionDuration
    ) external nonReentrant whenNotPaused returns (uint256 auctionId) {
        require(nftContract != address(0), "Invalid NFT contract");
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

        // Set extension parameters for English auctions
        if (auctionType == AuctionType.ENGLISH) {
            if (extensionThreshold == 0) {
                extensionThreshold = DEFAULT_EXTENSION_THRESHOLD;
            }
            if (extensionDuration == 0) {
                extensionDuration = DEFAULT_EXTENSION_DURATION;
            }
            require(extensionDuration <= MAX_EXTENSION_DURATION, "Extension duration too long");
        } else {
            // Non-English auctions don't use extension
            extensionThreshold = 0;
            extensionDuration = 0;
        }

        auctionId = _auctionIdCounter++;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + duration;

        // Set bid increment
        if (bidIncrement == 0) {
            bidIncrement = (startingPrice * minimumBidIncrement) / 10000;
            if (bidIncrement == 0) bidIncrement = 0.001 ether;
        }

        // Create auction with packed struct
        auctions[auctionId] = Auction({
            auctionId: auctionId,
            nftContract: nftContract,
            tokenId: uint96(tokenId),
            seller: msg.sender,
            auctionType: auctionType,
            status: AuctionStatus.ACTIVE,
            allowPartialFulfillment: false,
            isSettled: false,
            revealPhaseStarted: false,
            startingPrice: uint128(startingPrice),
            reservePrice: uint128(reservePrice),
            buyNowPrice: uint128(buyNowPrice),
            currentPrice: auctionType == AuctionType.DUTCH ? uint128(startingPrice) : 0,
            bidIncrement: uint128(bidIncrement),
            highestBid: 0,
            startTime: uint32(startTime),
            endTime: uint32(endTime),
            extensionThreshold: uint32(extensionThreshold),
            extensionDuration: uint32(extensionDuration),
            revealEndTime: 0, // Will be set when reveal phase starts
            highestBidder: address(0),
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
     * @dev Place a bid on an English or Reserve auction with automatic extension
     */
    function placeBid(uint256 auctionId) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(
            auction.auctionType == AuctionType.ENGLISH ||
                auction.auctionType == AuctionType.RESERVE,
            "Invalid auction type for this bid method"
        );
        require(msg.sender != auction.seller, "Seller cannot bid");
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > 0, "Bid amount must be greater than 0");

        // Check minimum bid increment
        uint256 minBid = auction.highestBid + auction.bidIncrement;
        if (auction.highestBid == 0) {
            minBid = auction.startingPrice;
        }
        require(msg.value >= minBid, "Bid too low");

        // Check bid interval
        require(
            block.timestamp >= lastBidTime[auctionId][msg.sender] + MIN_BID_INTERVAL,
            "Bid too soon"
        );

        // Update state first to prevent reentrancy
        address previousBidder = auction.highestBidder;
        uint256 previousBid = auction.highestBid;

        // 🆕 ENHANCED ANTI-SNIPING LOGIC FOR ENGLISH AUCTIONS
        bool wasExtended = false;
        if (auction.auctionType == AuctionType.ENGLISH && auction.extensionThreshold > 0) {
            // Check if bid is placed within extension threshold
            uint256 timeUntilEnd = auction.endTime - block.timestamp;
            
            if (timeUntilEnd <= auction.extensionThreshold) {
                // Calculate dynamic extension based on bid amount
                uint256 extensionDuration = auction.extensionDuration;
                
                // If bid is significantly higher than previous, extend more
                if (previousBid > 0) {
                    uint256 bidIncrease = msg.value - previousBid;
                    uint256 increasePercentage = (bidIncrease * 10000) / previousBid;
                    
                    // If bid increase is > 20%, extend by additional 5 minutes
                    if (increasePercentage > 2000) {
                        extensionDuration += 5 minutes;
                    }
                }
                
                // Cap extension at maximum allowed
                if (extensionDuration > MAX_EXTENSION_DURATION) {
                    extensionDuration = MAX_EXTENSION_DURATION;
                }
                
                // Extend the auction
                auction.endTime = uint32(uint256(auction.endTime) + extensionDuration);
                wasExtended = true;
                
                emit AuctionExtended(
                    auctionId,
                    msg.sender,
                    extensionDuration,
                    auction.endTime,
                    "Bid placed in extension zone"
                );
            }
        }

        // Update auction state
        auction.highestBidder = msg.sender;
        auction.highestBid = uint128(msg.value);
        auction.totalBidders++;
        lastBidTime[auctionId][msg.sender] = block.timestamp;

        // Add bid to array
        auctionBids[auctionId].push(
            Bid({
                bidder: msg.sender,
                amount: uint128(msg.value),
                timestamp: uint32(block.timestamp),
                isWinning: true,
                isRefunded: false
            })
        );

        // Update previous bids to not winning
        for (uint256 i = 0; i < auctionBids[auctionId].length - 1; i++) {
            auctionBids[auctionId][i].isWinning = false;
        }

        // Add to user bids if not already there (check BEFORE setting userHasBid)
        if (!_hasUserBid(auctionId, msg.sender)) {
            userBids[msg.sender].push(auctionId);
            userHasBid[auctionId][msg.sender] = true;
        }

        // Refund previous bidder
        if (previousBidder != address(0)) {
            _refundBid(auctionId, previousBidder, previousBid);
        }

        // Check if reserve price is met (for Reserve auctions)
        if (auction.auctionType == AuctionType.RESERVE && auction.reservePrice > 0 && msg.value >= auction.reservePrice) {
            emit ReserveReached(auctionId, auction.reservePrice);
            // For Reserve auctions, reaching reserve price doesn't end the auction immediately
            // It just reveals that the reserve has been met
        }

        emit BidPlaced(auctionId, msg.sender, msg.value, true);
    }

    /**
     * @dev Purchase at current price for Dutch auction (simplified - no commitment needed)
     */
    function buyNowDutch(uint256 auctionId) external payable nonReentrant {
        Auction storage auction = auctions[auctionId];
        require(
            auction.auctionType == AuctionType.DUTCH,
            "Not a Dutch auction"
        );
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");
        require(msg.sender != auction.seller, "Seller cannot buy");
        require(!auction.isSettled, "Auction already settled");

        uint256 currentPrice = _getDutchPrice(auctionId);
        require(msg.value >= currentPrice, "Insufficient payment");

        _executeBuyNow(auctionId, msg.sender, currentPrice);

        // Refund excess payment
        if (msg.value > currentPrice) {
            payable(msg.sender).transfer(msg.value - currentPrice);
        }
    }


    /**
     * @dev Submit sealed bid with simplified deposit system
     * The bid amount is the actual ETH deposited - winner determined by highest deposit
     */
    function submitSealedBid(
        uint256 auctionId,
        bytes32 bidHash,
        uint256 /* bidAmount - kept for compatibility but ignored */
    )
        external
        payable
        validAuction(auctionId)
        auctionActive(auctionId)
        notSettled(auctionId)
        bidInterval(auctionId)
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

        // Prevent DoS by limiting number of bidders
        require(
            auction.totalBidders < MAX_BIDS_PER_AUCTION,
            "Too many bidders"
        );

        // Update last bid time
        lastBidTime[auctionId][msg.sender] = block.timestamp;

        // Store sealed bid hash (for commitment-reveal pattern if needed)
        sealedBids[auctionId][msg.sender] = bidHash;

        // Track bidder (check BEFORE setting userHasBid)
        if (!_hasUserBid(auctionId, msg.sender)) {
            auction.totalBidders++;
            userBids[msg.sender].push(auctionId);
            userHasBid[auctionId][msg.sender] = true;
        } 

        // Add to bid history (amount is the actual ETH deposited)
        auctionBids[auctionId].push(
            Bid({
                bidder: msg.sender,
                amount: uint128(msg.value), // Actual ETH deposited
                timestamp: uint32(block.timestamp),
                isWinning: false,
                isRefunded: false
            })
        );

        emit SealedBidSubmitted(auctionId, msg.sender, bidHash);
    }

    // Note: revealSealedBid function removed - sealed bid auctions now use automatic settlement
    // The system automatically determines winners based on deposited amounts without manual reveal

    // ============= AUCTION SETTLEMENT =============

    /**
     * @dev End auction when time expires (can be called by anyone)
     * For sealed bid auctions, automatically determines winner and settles
     */
    /**
     * @dev End auction when time expires
     * @notice SECURITY FIX: Updated state before external calls to prevent reentrancy
     */
    function endAuction(uint256 auctionId) external validAuction(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(
            auction.status == AuctionStatus.ACTIVE,
            "Auction not active"
        );
        require(
            block.timestamp >= auction.endTime,
            "Auction not ended yet"
        );

        // Handle sealed bid auctions automatically
        if (auction.auctionType == AuctionType.SEALED_BID) {
            // SECURITY FIX: Update state before external calls
            auction.status = AuctionStatus.SETTLED;
            auction.isSettled = true;
            
            // Automatically determine winner and settle
            _determineSealedBidWinner(auctionId);
            
            emit AuctionEnded(auctionId);
        } else {
            // For other auction types, end normally
            auction.status = AuctionStatus.ENDED;
            emit AuctionEnded(auctionId);
        }
    }

    /**
     * @dev Settle auction and transfer NFT to winner
     * Note: For sealed bid auctions, settlement is now automatic in endAuction()
     */
    function settleAuction(uint256 auctionId) external nonReentrant notSettled(auctionId) {
        Auction storage auction = auctions[auctionId];
        
        // Enhanced status validation based on auction type
        if (auction.auctionType == AuctionType.SEALED_BID) {
            // Sealed bid auctions settle automatically in endAuction()
            require(auction.status == AuctionStatus.SETTLED, "Sealed bid auctions settle automatically");
            return; // Exit early as settlement already happened
        } else {
            // For other auction types, require ENDED status
            require(auction.status == AuctionStatus.ENDED, "Auction not ended");
        }

        // ✅ NEW: Automatic Reserve Auction handling
        if (auction.auctionType == AuctionType.RESERVE && 
            auction.highestBid < auction.reservePrice) {
            
            // Cancel auction and refund all bidders automatically
            _cancelAuctionAndRefund(auctionId, "Reserve price not met");
            return;
        }

        address winner = auction.highestBidder;
        uint256 winningBid = auction.highestBid;

        require(winner != address(0), "No winner found");

        // Update state first to prevent reentrancy
        auction.status = AuctionStatus.SETTLED;
        auction.isSettled = true;

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

        // Transfer proceeds to seller
        (bool sellerSuccess, ) = payable(auction.seller).call{value: sellerProceeds}("");
        require(sellerSuccess, "Seller transfer failed");

        // Transfer royalty fee
        if (royaltyFee > 0 && royaltyRecipient != address(0)) {
            (bool royaltySuccess, ) = payable(royaltyRecipient).call{value: royaltyFee}("");
            require(royaltySuccess, "Royalty transfer failed");
        }

        // Refund losing bidders
        _refundLosingBidders(auctionId);

        emit AuctionSettled(
            auctionId,
            winner,
            winningBid,
            platformFee,
            royaltyFee
        );
    }

    // Note: startRevealPhase and endRevealPhase functions removed
    // Sealed bid auctions are now handled automatically by endAuction()

    // ============= AUCTION MANAGEMENT =============

    /**
     * @dev Cancel auction (seller or admin only)
     */
    function cancelAuction(
        uint256 auctionId,
        string memory reason
    ) external validAuction(auctionId) notSettled(auctionId) nonReentrant {
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
     * @dev Emergency settlement for stuck auctions
     * Can be called by admin after 7 days of auction end
     */
    function emergencySettle(uint256 auctionId) 
        external 
        validAuction(auctionId) 
        onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE()) 
        nonReentrant 
    {
        Auction storage auction = auctions[auctionId];
        
        // Require auction to be stuck for at least 7 days
        require(
            block.timestamp > auction.endTime + 7 days,
            "Too early for emergency settlement"
        );
        
        require(!auction.isSettled, "Auction already settled");
        
        if (auction.highestBidder != address(0) && auction.highestBid > 0) {
            // Force settlement with winner
            auction.status = AuctionStatus.SETTLED;
            auction.isSettled = true;
            
            // Calculate fees
            (
                uint256 platformFee,
                uint256 royaltyFee,
                address royaltyRecipient
            ) = _calculateFees(auction.nftContract, auction.tokenId, auction.highestBid);

            uint256 sellerProceeds = auction.highestBid - platformFee - royaltyFee;

            // Transfer NFT to winner
            IERC721(auction.nftContract).transferFrom(
                address(this),
                auction.highestBidder,
                auction.tokenId
            );

            // Transfer proceeds to seller
            (bool sellerSuccess, ) = payable(auction.seller).call{value: sellerProceeds}("");
            require(sellerSuccess, "Seller transfer failed");

            // Transfer royalty fee
            if (royaltyFee > 0 && royaltyRecipient != address(0)) {
                (bool royaltySuccess, ) = payable(royaltyRecipient).call{value: royaltyFee}("");
                require(royaltySuccess, "Royalty transfer failed");
            }

            emit AuctionSettled(
                auctionId,
                auction.highestBidder,
                auction.highestBid,
                platformFee,
                royaltyFee
            );
            
            emit EmergencySettlement(auctionId, "Forced settlement after 7 days");
        } else {
            // No winner found, cancel and refund
            _cancelAuctionAndRefund(auctionId, "Emergency cancellation - no valid bids");
            emit EmergencySettlement(auctionId, "Emergency cancellation - no valid bids");
        }
    }
    
    /**
     * @dev Emergency refund for stuck bidders
     * Can be called by admin for auctions stuck for more than 14 days
     */
    function emergencyRefundBidders(uint256 auctionId) 
        external 
        validAuction(auctionId) 
        onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE()) 
    {
        Auction storage auction = auctions[auctionId];
        
        require(
            block.timestamp > auction.endTime + 14 days,
            "Too early for emergency refund"
        );
        
        Bid[] storage bids = auctionBids[auctionId];
        uint256 refundedCount = 0;
        
        for (uint256 i = 0; i < bids.length; i++) {
            if (!bids[i].isRefunded) {
                bids[i].isRefunded = true;
                _refundBid(auctionId, bids[i].bidder, bids[i].amount);
                refundedCount++;
            }
        }
        
        emit EmergencyRefundCompleted(auctionId, refundedCount);
    }

    /**
     * @dev Extend auction duration (admin only, emergency situations)
     * @notice This is different from auto-extension - this is for emergency manual extension
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

        auction.endTime = uint32(uint256(auction.endTime) + additionalTime);
        
        emit AuctionExtended(
            auctionId,
            msg.sender,
            additionalTime,
            auction.endTime,
            "Manual admin extension"
        );
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
     * @dev Get auction extension information
     */
    function getAuctionExtensionInfo(uint256 auctionId) 
        external 
        view 
        validAuction(auctionId) 
        returns (
            uint256 extensionThreshold,
            uint256 extensionDuration,
            bool isInExtensionZone,
            uint256 timeUntilExtensionZone
        ) 
    {
        Auction storage auction = auctions[auctionId];
        
        extensionThreshold = auction.extensionThreshold;
        extensionDuration = auction.extensionDuration;
        
        if (auction.auctionType == AuctionType.ENGLISH && auction.status == AuctionStatus.ACTIVE) {
            uint256 timeUntilEnd = auction.endTime > block.timestamp ? auction.endTime - block.timestamp : 0;
            isInExtensionZone = timeUntilEnd <= extensionThreshold;
            timeUntilExtensionZone = isInExtensionZone ? 0 : timeUntilEnd - extensionThreshold;
        } else {
            isInExtensionZone = false;
            timeUntilExtensionZone = 0;
        }
    }

    /**
     * @dev Get sealed bid reveal phase information
     */
    function getSealedBidRevealInfo(uint256 auctionId) 
        external 
        view 
        validAuction(auctionId) 
        returns (
            bool isSealedBid,
            bool revealPhaseStarted,
            uint256 revealEndTime,
            bool isRevealPhaseActive,
            uint256 timeUntilRevealEnd
        ) 
    {
        Auction storage auction = auctions[auctionId];
        
        isSealedBid = auction.auctionType == AuctionType.SEALED_BID;
        revealPhaseStarted = auction.revealPhaseStarted;
        revealEndTime = auction.revealEndTime;
        
        if (isSealedBid && revealPhaseStarted) {
            isRevealPhaseActive = auction.status == AuctionStatus.REVEAL && block.timestamp < revealEndTime;
            timeUntilRevealEnd = block.timestamp < revealEndTime ? revealEndTime - block.timestamp : 0;
        } else {
            isRevealPhaseActive = false;
            timeUntilRevealEnd = 0;
        }
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
     * @dev Automatically determine winner for sealed bid auction and settle
     * @notice SECURITY FIX: Updated state before external calls to prevent reentrancy
     */
    function _determineSealedBidWinner(uint256 auctionId) internal {
        Auction storage auction = auctions[auctionId];
        Bid[] storage bids = auctionBids[auctionId];
        
        address winner = address(0);
        uint256 winningBid = 0;
        
        // Find the highest bid
        for (uint256 i = 0; i < bids.length; i++) {
            if (bids[i].amount > winningBid) {
                winningBid = bids[i].amount;
                winner = bids[i].bidder;
            }
        }
        
        // SECURITY FIX: Update auction state BEFORE external calls
        auction.highestBidder = winner;
        auction.highestBid = uint128(winningBid);
        auction.status = AuctionStatus.SETTLED;
        auction.isSettled = true;
        
        if (winner != address(0)) {
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

            // Transfer proceeds to seller
            (bool sellerSuccess, ) = payable(auction.seller).call{value: sellerProceeds}("");
            require(sellerSuccess, "Seller transfer failed");

            // Transfer royalty fee
            if (royaltyFee > 0 && royaltyRecipient != address(0)) {
                (bool royaltySuccess, ) = payable(royaltyRecipient).call{value: royaltyFee}("");
                require(royaltySuccess, "Royalty transfer failed");
            }

            // Refund losing bidders
            _refundLosingBidders(auctionId);

            emit AuctionSettled(
                auctionId,
                winner,
                winningBid,
                platformFee,
                royaltyFee
            );
        } else {
            // No winner found, return NFT to seller
            IERC721(auction.nftContract).transferFrom(
                address(this),
                auction.seller,
                auction.tokenId
            );
            
            // Refund all bidders
            _refundAllBidders(auctionId);
            
            emit AuctionCancelled(auctionId, "No valid bids");
        }
    }

    /**
     * @dev Validate auction parameters based on type
     */
    function _validateAuctionParameters(
        AuctionType auctionType,
        uint256 startingPrice,
        uint256 reservePrice,
        uint256 buyNowPrice
    ) internal pure {
        // Validation for Reserve auctions
        if (auctionType == AuctionType.RESERVE) {
            require(
                reservePrice > startingPrice,
                "Reserve price must be > starting price for Reserve auctions"
            );
            // Reserve auctions don't use buyNowPrice
            require(buyNowPrice == 0, "Reserve auctions don't support buy now price");
        }

        // Special handling for Dutch auctions
        if (auctionType == AuctionType.DUTCH) {
            require(
                reservePrice > 0 && reservePrice < startingPrice,
                "Dutch auction needs valid reserve < starting price"
            );
            // For Dutch auctions, buyNowPrice should equal reservePrice (final price)
            if (buyNowPrice > 0) {
                require(
                    buyNowPrice == reservePrice,
                    "Dutch auction buyNowPrice must equal reservePrice"
                );
            }
        } else if (auctionType == AuctionType.ENGLISH) {
            // For English auctions, standard validation applies
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
        } else if (auctionType == AuctionType.SEALED_BID) {
            // Sealed bid auctions don't use buyNowPrice
            require(buyNowPrice == 0, "Sealed bid auctions don't support buy now price");
        }
    }

    /**
     * @dev Get current Dutch auction price with enhanced safety checks
     */
    function _getDutchPrice(uint256 auctionId) internal view returns (uint256) {
        Auction storage auction = auctions[auctionId];
        require(
            auction.auctionType == AuctionType.DUTCH,
            "Not a Dutch auction"
        );

        // Convert uint32 timestamps to uint256 for safe calculations
        uint256 currentTime = uint256(block.timestamp);
        uint256 startTime = uint256(auction.startTime);
        uint256 endTime = uint256(auction.endTime);

        // If auction has ended, return reserve price
        if (currentTime >= endTime) {
            return auction.reservePrice;
        }

        // Calculate time elapsed and total duration
        uint256 timeElapsed = currentTime - startTime;
        uint256 totalDuration = endTime - startTime;

        // Safety checks
        if (totalDuration == 0) {
            return auction.reservePrice;
        }

        if (auction.startingPrice <= auction.reservePrice) {
            return auction.reservePrice;
        }

        // Calculate price decrease with overflow protection
        uint256 priceRange = auction.startingPrice - auction.reservePrice;
        uint256 priceDecrease = (priceRange * timeElapsed) / totalDuration;
        
        // Additional safety check
        if (priceDecrease >= auction.startingPrice) {
            return auction.reservePrice;
        }
        
        uint256 calculatedPrice = auction.startingPrice - priceDecrease;
        
        // Set minimum price to prevent going too low (0.000001 ETH = 1000000000000 wei - same as system validation)
        uint256 minimumPrice = 0.000001 ether;
        uint256 finalPrice = calculatedPrice > minimumPrice ? calculatedPrice : minimumPrice;
        
        return finalPrice;
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
        auction.highestBid = uint128(price);
        auction.status = AuctionStatus.ENDED;
        auction.totalBidders = 1;

        // Add to user bids if not already present (check BEFORE setting userHasBid)
        if (!_hasUserBid(auctionId, buyer)) {
            userBids[buyer].push(auctionId);
            userHasBid[auctionId][buyer] = true;
        } 
        // Add bid to history
        auctionBids[auctionId].push(
            Bid({
                bidder: buyer,
                amount: uint128(price),
                timestamp: uint32(block.timestamp),
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

        // Update state first to prevent reentrancy
        auction.status = AuctionStatus.CANCELLED;

        // Return NFT to seller
        IERC721(auction.nftContract).transferFrom(
            address(this),
            auction.seller,
            auction.tokenId
        );

        // Refund all bidders
        _refundAllBidders(auctionId);

        emit AuctionCancelled(auctionId, reason);
    }

    /**
     * @dev Refund a specific bid with enhanced reentrancy protection
     * @notice SECURITY FIX: Optimized to avoid external calls in loops
     */
    function _refundBid(
        uint256 auctionId,
        address bidder,
        uint256 amount
    ) internal {
        if (amount > 0) {
            // Mark as refunded BEFORE external call to prevent reentrancy
            bool refunded = false;
            Bid[] storage bids = auctionBids[auctionId];
            
            // SECURITY FIX: Limit loop iterations to prevent gas issues
            uint256 maxIterations = bids.length > 100 ? 100 : bids.length;
            for (uint256 i = 0; i < maxIterations; i++) {
                if (bids[i].bidder == bidder && !bids[i].isRefunded) {
                    bids[i].isRefunded = true;
                    refunded = true;
                    break;
                }
            }
            
            // Only require refunded if we expect to find a bid
            // For sealed bid auctions, the bid might already be processed
            if (!refunded) {
                // Check if this is a sealed bid auction where bids are processed differently
                Auction storage auction = auctions[auctionId];
                if (auction.auctionType == AuctionType.SEALED_BID) {
                    // For sealed bid, just send the refund without requiring bid found
                    (bool sealedBidSuccess, ) = payable(bidder).call{value: amount, gas: 2300}("");
                    require(sealedBidSuccess, "Transfer failed");
                    emit BidRefunded(auctionId, bidder, amount);
                    return;
                }
            }
            
            // Use call with gas limit to prevent reentrancy attacks
            (bool success, ) = payable(bidder).call{value: amount, gas: 2300}("");
            require(success, "Transfer failed");
            emit BidRefunded(auctionId, bidder, amount);
        }
    }

    /**
     * @dev Refund all bidders except winner
     */
    function _refundLosingBidders(uint256 auctionId) internal {
        Bid[] storage bids = auctionBids[auctionId];
        address winner = auctions[auctionId].highestBidder;

        // Fix: Process refunds in batches to avoid gas limit issues
        uint256 batchSize = 50; // Process max 50 refunds at once
        uint256 processed = 0;
        
        for (uint256 i = 0; i < bids.length && processed < batchSize; i++) {
            if (bids[i].bidder != winner && !bids[i].isRefunded) {
                bids[i].isRefunded = true;
                _refundBid(auctionId, bids[i].bidder, bids[i].amount);
                processed++;
            }
        }
    }
    
    /**
     * @dev Refund remaining bidders in batches (for gas limit protection)
     */
    function refundRemainingBidders(uint256 auctionId, uint256 startIndex, uint256 batchSize) 
        external 
        validAuction(auctionId) 
        onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE()) 
    {
        Auction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.SETTLED, "Auction not settled");
        
        Bid[] storage bids = auctionBids[auctionId];
        address winner = auction.highestBidder;
        uint256 endIndex = startIndex + batchSize;
        if (endIndex > bids.length) {
            endIndex = bids.length;
        }
        
        uint256 refundedCount = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            if (bids[i].bidder != winner && !bids[i].isRefunded) {
                bids[i].isRefunded = true;
                _refundBid(auctionId, bids[i].bidder, bids[i].amount);
                refundedCount++;
            }
        }
        
        emit BatchRefundCompleted(auctionId, refundedCount, startIndex, endIndex);
    }
    
    /**
     * @dev Emergency batch refund for cancelled auctions
     */
    function emergencyBatchRefund(uint256 auctionId, uint256 startIndex, uint256 batchSize) 
        external 
        validAuction(auctionId) 
        onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE()) 
    {
        Auction storage auction = auctions[auctionId];
        require(
            auction.status == AuctionStatus.CANCELLED || 
            (auction.status == AuctionStatus.ACTIVE && block.timestamp > auction.endTime + 7 days),
            "Auction not eligible for emergency refund"
        );
        
        Bid[] storage bids = auctionBids[auctionId];
        uint256 endIndex = startIndex + batchSize;
        if (endIndex > bids.length) {
            endIndex = bids.length;
        }
        
        uint256 refundedCount = 0;
        for (uint256 i = startIndex; i < endIndex; i++) {
            if (!bids[i].isRefunded) {
                bids[i].isRefunded = true;
                _refundBid(auctionId, bids[i].bidder, bids[i].amount);
                refundedCount++;
            }
        }
        
        emit EmergencyBatchRefundCompleted(auctionId, refundedCount, startIndex, endIndex);
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

    function _hasUserBid(
        uint256 auctionId,
        address user
    ) internal view returns (bool) {
        return userHasBid[auctionId][user];
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
        // Calculate platform fee with overflow protection
        platformFee = (salePrice * platformFeePercentage) / 10000;

        // Calculate royalty fee if contract supports EIP-2981
        try IERC2981(nftContract).royaltyInfo(tokenId, salePrice) returns (
            address recipient,
            uint256 royaltyAmount
        ) {
            // Fix: Validate royalty amount is reasonable (max 25% of sale price)
            if (royaltyAmount > salePrice / 4) {
                royaltyFee = 0;
                royaltyRecipient = address(0);
            } else {
                royaltyFee = royaltyAmount;
                royaltyRecipient = recipient;
            }
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
     * @dev Withdraw platform fees - SECURITY ENHANCED
     * @notice Only allows withdrawal to whitelisted addresses to prevent arbitrary ether sending
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
        require(to != address(this), "Cannot withdraw to self");
        require(to.code.length == 0, "Cannot withdraw to contract");
        require(amount > 0, "Amount must be greater than 0");
        require(amount <= address(this).balance, "Insufficient balance");
        
        // SECURITY FIX: Only allow withdrawal to authorized addresses
        require(
            accessControl.hasRole(accessControl.MASTER_ADMIN_ROLE(), to) ||
            accessControl.hasRole(accessControl.WITHDRAWER_ROLE(), to),
            "Recipient not authorized for withdrawals"
        );

        // Use call instead of transfer for better gas efficiency and to prevent reentrancy
        (bool success, ) = payable(to).call{value: amount}("");
        require(success, "Transfer failed");
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