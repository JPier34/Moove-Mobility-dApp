// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MooveAuction
 * @dev Auction contract supporting 4 auction types:
 * - Traditional (Public Bid)
 * - English Auction
 * - Dutch Auction
 * - Sealed Bid Auction
 * @notice Compatible with OpenZeppelin 5.x
 */
contract MooveAuction is AccessControl, ReentrancyGuard, Pausable {
    // ============ ROLES ============
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AUCTIONEER_ROLE = keccak256("AUCTIONEER_ROLE");

    // ============ ENUMS ============
    enum AuctionType {
        TRADITIONAL, // Public bid, fixed duration
        ENGLISH, // Ascending price, auto-extend
        DUTCH, // Descending price
        SEALED_BID // Hidden bids, reveal phase
    }

    enum AuctionStatus {
        ACTIVE,
        ENDED,
        CANCELLED,
        REVEALING // Only for sealed bid auctions
    }

    // ============ STRUCTS ============
    struct Auction {
        uint256 auctionId;
        uint256 nftId;
        address nftContract;
        address seller;
        AuctionType auctionType;
        AuctionStatus status;
        uint256 startPrice;
        uint256 reservePrice;
        uint256 buyNowPrice; // For immediate purchase
        uint256 startTime;
        uint256 endTime;
        uint256 extensionTime; // For English auctions
        address highestBidder;
        uint256 highestBid;
        uint256 bidIncrement; // Minimum bid increase
        bool nftClaimed;
        bool sellerPaid;
    }

    struct Bid {
        address bidder;
        uint256 amount;
        uint256 timestamp;
        bool isRevealed; // For sealed bid auctions
        bytes32 bidHash; // For sealed bid auctions
    }

    struct SealedBidReveal {
        uint256 amount;
        uint256 nonce;
    }

    // ============ STATE VARIABLES ============

    /// @dev Counter for auction IDs (replaces Counters.Counter)
    uint256 private _auctionIdCounter;

    // Mappings
    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(uint256 => mapping(address => uint256)) public bidderDeposits;
    mapping(uint256 => mapping(address => bytes32)) public sealedBids;
    mapping(uint256 => mapping(address => bool)) public hasRevealed;

    // Platform settings
    address public platformOwner;
    uint256 public platformFeePercentage = 250; // 2.5%
    uint256 public constant MIN_AUCTION_DURATION = 1 minutes;
    uint256 public constant MAX_AUCTION_DURATION = 30 days;
    uint256 public constant ENGLISH_EXTENSION_TIME = 10 minutes;
    uint256 public constant REVEAL_PHASE_DURATION = 24 hours;

    // ============ EVENTS ============
    event AuctionCreated(
        uint256 indexed auctionId,
        uint256 indexed nftId,
        address indexed seller,
        AuctionType auctionType,
        uint256 startPrice,
        uint256 endTime
    );

    event BidPlaced(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount,
        uint256 timestamp
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

    event AuctionEnded(
        uint256 indexed auctionId,
        address indexed winner,
        uint256 winningBid
    );

    event AuctionCancelled(uint256 indexed auctionId);
    event NFTClaimed(uint256 indexed auctionId, address indexed winner);
    event PaymentClaimed(
        uint256 indexed auctionId,
        address indexed seller,
        uint256 amount
    );
    event BidRefunded(
        uint256 indexed auctionId,
        address indexed bidder,
        uint256 amount
    );

    // ============ ERRORS ============
    error MooveAuction__NotAuthorized();
    error MooveAuction__AuctionNotFound();
    error MooveAuction__AuctionNotActive();
    error MooveAuction__AuctionEnded();
    error MooveAuction__BidTooLow();
    error MooveAuction__InvalidDuration();
    error MooveAuction__AlreadyClaimed();
    error MooveAuction__NoValidBids();
    error MooveAuction__RevealPhaseActive();
    error MooveAuction__InvalidReveal();

    // ============ MODIFIERS ============
    modifier onlyAuctionSeller(uint256 auctionId) {
        if (auctions[auctionId].seller != msg.sender) {
            revert MooveAuction__NotAuthorized();
        }
        _;
    }

    modifier auctionExists(uint256 auctionId) {
        if (auctions[auctionId].auctionId == 0) {
            revert MooveAuction__AuctionNotFound();
        }
        _;
    }

    modifier auctionActive(uint256 auctionId) {
        if (auctions[auctionId].status != AuctionStatus.ACTIVE) {
            revert MooveAuction__AuctionNotActive();
        }
        _;
    }

    modifier auctionEnded(uint256 auctionId) {
        if (auctions[auctionId].status != AuctionStatus.ENDED) {
            revert MooveAuction__AuctionEnded();
        }
        _;
    }

    modifier auctionInRevealPhase(uint256 auctionId) {
        if (
            auctions[auctionId].status != AuctionStatus.REVEALING &&
            auctions[auctionId].auctionType == AuctionType.SEALED_BID
        ) {
            revert MooveAuction__RevealPhaseActive();
        }
        _;
    }

    modifier onlyRoleOrAuctioneer(bytes32 role) {
        require(
            hasRole(role, msg.sender) || hasRole(AUCTIONEER_ROLE, msg.sender),
            "Not authorized"
        );
        _;
    }

    modifier noValidBids(uint256 auctionId) {
        Auction storage auction = auctions[auctionId];
        if (auction.highestBidder != address(0) || auction.highestBid > 0) {
            revert MooveAuction__NoValidBids();
        }
        _;
    }

    modifier alreadyClaimed(uint256 auctionId) {
        Auction storage auction = auctions[auctionId];
        if (auction.nftClaimed || auction.sellerPaid) {
            revert MooveAuction__AlreadyClaimed();
        }
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(address _platformOwner) {
        require(_platformOwner != address(0), "Invalid platform owner");
        platformOwner = _platformOwner;

        _grantRole(DEFAULT_ADMIN_ROLE, _platformOwner);
        _grantRole(ADMIN_ROLE, _platformOwner);
        _grantRole(AUCTIONEER_ROLE, _platformOwner);

        // Start auction counter from 1 (0 reserved for "not exists")
        _auctionIdCounter = 1;
    }

    // ============ AUCTION CREATION ============
    /**
     * @dev Create a new auction
     */
    function createAuction(
        uint256 nftId,
        address nftContract,
        AuctionType auctionType,
        uint256 startPrice,
        uint256 reservePrice,
        uint256 buyNowPrice,
        uint256 duration,
        uint256 bidIncrement
    ) external nonReentrant whenNotPaused returns (uint256) {
        // Validate inputs
        if (
            duration < MIN_AUCTION_DURATION || duration > MAX_AUCTION_DURATION
        ) {
            revert MooveAuction__InvalidDuration();
        }

        require(nftContract != address(0), "Invalid NFT contract");
        require(startPrice > 0, "Start price must be positive");
        require(reservePrice >= startPrice, "Reserve price too low");
        require(bidIncrement > 0, "Bid increment must be positive");

        // Verify NFT ownership
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(nftId) == msg.sender, "Not NFT owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
                nft.getApproved(nftId) == address(this),
            "Contract not approved"
        );

        // Generate new auction ID
        uint256 auctionId = _auctionIdCounter++;

        uint256 endTime = block.timestamp + duration;

        // For sealed bid auctions, add reveal phase
        if (auctionType == AuctionType.SEALED_BID) {
            endTime = block.timestamp + duration + REVEAL_PHASE_DURATION;
        }

        auctions[auctionId] = Auction({
            auctionId: auctionId,
            nftId: nftId,
            nftContract: nftContract,
            seller: msg.sender,
            auctionType: auctionType,
            status: AuctionStatus.ACTIVE,
            startPrice: startPrice,
            reservePrice: reservePrice,
            buyNowPrice: buyNowPrice,
            startTime: block.timestamp,
            endTime: endTime,
            extensionTime: auctionType == AuctionType.ENGLISH
                ? ENGLISH_EXTENSION_TIME
                : 0,
            highestBidder: address(0),
            highestBid: 0,
            bidIncrement: bidIncrement,
            nftClaimed: false,
            sellerPaid: false
        });

        // Transfer NFT to contract
        nft.transferFrom(msg.sender, address(this), nftId);

        emit AuctionCreated(
            auctionId,
            nftId,
            msg.sender,
            auctionType,
            startPrice,
            endTime
        );

        return auctionId;
    }

    // ============ BIDDING FUNCTIONS ============
    /**
     * @dev Place a bid on traditional, English, or Dutch auction
     */
    function placeBid(
        uint256 auctionId
    )
        external
        payable
        nonReentrant
        auctionExists(auctionId)
        auctionActive(auctionId)
        whenNotPaused
    {
        Auction storage auction = auctions[auctionId];

        require(block.timestamp <= auction.endTime, "Auction ended");
        if (msg.sender == auction.seller) {
            revert MooveAuction__NotAuthorized();
        }
        require(
            auction.auctionType != AuctionType.SEALED_BID,
            "Use submitSealedBid for sealed auctions"
        );

        uint256 bidAmount = msg.value;
        uint256 minBid = _calculateMinBid(auctionId);

        if (bidAmount < minBid) {
            revert MooveAuction__BidTooLow();
        }

        // Handle buy now price
        if (auction.buyNowPrice > 0 && bidAmount >= auction.buyNowPrice) {
            _executeBuyNow(auctionId, msg.sender, bidAmount);
            return;
        }

        // Refund previous highest bidder
        if (auction.highestBidder != address(0)) {
            bidderDeposits[auctionId][auction.highestBidder] += auction
                .highestBid;
        }

        // Update auction state
        auction.highestBidder = msg.sender;
        auction.highestBid = bidAmount;

        // Store bid
        auctionBids[auctionId].push(
            Bid({
                bidder: msg.sender,
                amount: bidAmount,
                timestamp: block.timestamp,
                isRevealed: true,
                bidHash: bytes32(0)
            })
        );

        // English auction auto-extension
        if (auction.auctionType == AuctionType.ENGLISH) {
            if (block.timestamp > auction.endTime - auction.extensionTime) {
                auction.endTime = block.timestamp + auction.extensionTime;
            }
        }

        emit BidPlaced(auctionId, msg.sender, bidAmount, block.timestamp);
    }

    /**
     * @dev Submit sealed bid (hash of amount + nonce)
     */
    function submitSealedBid(
        uint256 auctionId,
        bytes32 bidHash
    )
        external
        payable
        nonReentrant
        auctionExists(auctionId)
        auctionActive(auctionId)
        whenNotPaused
    {
        Auction storage auction = auctions[auctionId];

        require(
            auction.auctionType == AuctionType.SEALED_BID,
            "Not a sealed bid auction"
        );
        require(
            block.timestamp <= auction.endTime - REVEAL_PHASE_DURATION,
            "Bidding phase ended"
        );
        require(msg.value >= auction.startPrice, "Deposit too low");
        require(
            sealedBids[auctionId][msg.sender] == bytes32(0),
            "Already submitted bid"
        );

        // Store sealed bid and deposit
        sealedBids[auctionId][msg.sender] = bidHash;
        bidderDeposits[auctionId][msg.sender] = msg.value;

        emit SealedBidSubmitted(auctionId, msg.sender, bidHash);
    }

    /**
     * @dev Reveal sealed bid
     */
    function revealSealedBid(
        uint256 auctionId,
        uint256 amount,
        uint256 nonce
    ) external nonReentrant auctionExists(auctionId) whenNotPaused {
        Auction storage auction = auctions[auctionId];

        require(
            auction.auctionType == AuctionType.SEALED_BID,
            "Not a sealed bid auction"
        );
        require(
            block.timestamp > auction.endTime - REVEAL_PHASE_DURATION,
            "Reveal phase not started"
        );
        require(block.timestamp <= auction.endTime, "Reveal phase ended");
        require(!hasRevealed[auctionId][msg.sender], "Already revealed");

        bytes32 hash = keccak256(abi.encodePacked(amount, nonce, msg.sender));
        if (hash != sealedBids[auctionId][msg.sender]) {
            revert MooveAuction__InvalidReveal();
        }

        hasRevealed[auctionId][msg.sender] = true;

        // Check if this is a valid bid
        if (
            amount >= auction.startPrice &&
            bidderDeposits[auctionId][msg.sender] >= amount
        ) {
            // Update highest bid if this is better
            if (amount > auction.highestBid) {
                auction.highestBidder = msg.sender;
                auction.highestBid = amount;
            }

            // Store the revealed bid
            auctionBids[auctionId].push(
                Bid({
                    bidder: msg.sender,
                    amount: amount,
                    timestamp: block.timestamp,
                    isRevealed: true,
                    bidHash: hash
                })
            );

            emit SealedBidRevealed(auctionId, msg.sender, amount);
        }
    }

    // ============ AUCTION ENDING ============
    /**
     * @dev End an auction
     */
    function endAuction(
        uint256 auctionId
    ) external nonReentrant auctionExists(auctionId) whenNotPaused {
        Auction storage auction = auctions[auctionId];

        require(block.timestamp >= auction.endTime, "Auction still active");
        require(
            auction.status == AuctionStatus.ACTIVE,
            "Auction already ended"
        );

        auction.status = AuctionStatus.ENDED;

        // Check if reserve price met
        if (
            auction.highestBid >= auction.reservePrice &&
            auction.highestBidder != address(0)
        ) {
            emit AuctionEnded(
                auctionId,
                auction.highestBidder,
                auction.highestBid
            );
        } else {
            // Reserve not met, return NFT to seller
            IERC721(auction.nftContract).transferFrom(
                address(this),
                auction.seller,
                auction.nftId
            );
            emit AuctionEnded(auctionId, address(0), 0);
        }
    }

    /**
     * @dev Execute buy now purchase
     */
    function _executeBuyNow(
        uint256 auctionId,
        address buyer,
        uint256 amount
    ) internal {
        Auction storage auction = auctions[auctionId];

        auction.status = AuctionStatus.ENDED;
        auction.highestBidder = buyer;
        auction.highestBid = amount;

        emit AuctionEnded(auctionId, buyer, amount);
    }

    // ============ CLAIM FUNCTIONS ============
    /**
     * @dev Claim NFT (winner only)
     */
    function claimNFT(
        uint256 auctionId
    ) external nonReentrant auctionExists(auctionId) {
        Auction storage auction = auctions[auctionId];

        require(auction.status == AuctionStatus.ENDED, "Auction not ended");
        require(msg.sender == auction.highestBidder, "Not the winner");
        if (auction.nftClaimed) {
            revert MooveAuction__AlreadyClaimed();
        }
        require(auction.highestBid >= auction.reservePrice, "Reserve not met");

        auction.nftClaimed = true;

        // Transfer NFT to winner
        IERC721(auction.nftContract).transferFrom(
            address(this),
            msg.sender,
            auction.nftId
        );

        emit NFTClaimed(auctionId, msg.sender);
    }

    /**
     * @dev Claim payment (seller only)
     */
    function claimPayment(
        uint256 auctionId
    )
        external
        nonReentrant
        auctionExists(auctionId)
        onlyAuctionSeller(auctionId)
    {
        Auction storage auction = auctions[auctionId];

        require(auction.status == AuctionStatus.ENDED, "Auction not ended");
        require(!auction.sellerPaid, "Payment already claimed");
        require(auction.highestBid >= auction.reservePrice, "Reserve not met");

        auction.sellerPaid = true;

        // Calculate fees
        uint256 platformFee = (auction.highestBid * platformFeePercentage) /
            10000;
        uint256 sellerAmount = auction.highestBid - platformFee;

        // Transfer payments
        (bool success1, ) = payable(auction.seller).call{value: sellerAmount}(
            ""
        );
        (bool success2, ) = payable(platformOwner).call{value: platformFee}("");

        require(success1 && success2, "Payment transfer failed");

        emit PaymentClaimed(auctionId, auction.seller, sellerAmount);
    }

    /**
     * @dev Claim refund for non-winning bidders
     */
    function claimRefund(
        uint256 auctionId
    ) external nonReentrant auctionExists(auctionId) {
        Auction storage auction = auctions[auctionId];

        require(auction.status == AuctionStatus.ENDED, "Auction not ended");

        uint256 refundAmount = bidderDeposits[auctionId][msg.sender];
        require(refundAmount > 0, "No refund available");

        // Winner doesn't get refund (they won the auction)
        if (
            msg.sender == auction.highestBidder &&
            auction.highestBid >= auction.reservePrice
        ) {
            revert MooveAuction__NotAuthorized();
        }

        bidderDeposits[auctionId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
        require(success, "Refund transfer failed");

        emit BidRefunded(auctionId, msg.sender, refundAmount);
    }

    // ============ PRICE CALCULATION ============
    /**
     * @dev Calculate current Dutch auction price
     */
    function getCurrentDutchPrice(
        uint256 auctionId
    ) public view auctionExists(auctionId) returns (uint256) {
        Auction storage auction = auctions[auctionId];
        require(
            auction.auctionType == AuctionType.DUTCH,
            "Not a Dutch auction"
        );

        if (block.timestamp >= auction.endTime) {
            return auction.reservePrice;
        }

        uint256 elapsed = block.timestamp - auction.startTime;
        uint256 duration = auction.endTime - auction.startTime;
        uint256 priceReduction = ((auction.startPrice - auction.reservePrice) *
            elapsed) / duration;

        return auction.startPrice - priceReduction;
    }

    /**
     * @dev Calculate minimum bid for auction
     */
    function _calculateMinBid(
        uint256 auctionId
    ) internal view returns (uint256) {
        Auction storage auction = auctions[auctionId];

        if (auction.auctionType == AuctionType.DUTCH) {
            return getCurrentDutchPrice(auctionId);
        }

        if (auction.highestBid == 0) {
            return auction.startPrice;
        }

        return auction.highestBid + auction.bidIncrement;
    }

    // ============ ADMIN FUNCTIONS ============
    /**
     * @dev Cancel auction (emergency only)
     */
    function cancelAuction(
        uint256 auctionId
    ) external onlyRole(ADMIN_ROLE) auctionExists(auctionId) {
        Auction storage auction = auctions[auctionId];
        require(auction.status == AuctionStatus.ACTIVE, "Auction not active");

        auction.status = AuctionStatus.CANCELLED;

        // Return NFT to seller
        IERC721(auction.nftContract).transferFrom(
            address(this),
            auction.seller,
            auction.nftId
        );

        emit AuctionCancelled(auctionId);
    }

    /**
     * @dev Update platform fee
     */
    function setPlatformFee(
        uint256 newFeePercentage
    ) external onlyRole(ADMIN_ROLE) {
        require(newFeePercentage <= 1000, "Fee too high"); // Max 10%
        platformFeePercentage = newFeePercentage;
    }

    /**
     * @dev Update platform owner
     */
    function setPlatformOwner(address newOwner) external onlyRole(ADMIN_ROLE) {
        require(newOwner != address(0), "Invalid address");
        platformOwner = newOwner;
    }

    // ============ VIEW FUNCTIONS ============
    /**
     * @dev Get auction details
     */
    function getAuction(
        uint256 auctionId
    ) external view auctionExists(auctionId) returns (Auction memory) {
        return auctions[auctionId];
    }

    /**
     * @dev Get auction bids
     */
    function getAuctionBids(
        uint256 auctionId
    ) external view auctionExists(auctionId) returns (Bid[] memory) {
        return auctionBids[auctionId];
    }

    /**
     * @dev Get active auctions
     */
    function getActiveAuctions() external view returns (uint256[] memory) {
        uint256[] memory activeAuctions = new uint256[](_auctionIdCounter);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i < _auctionIdCounter; i++) {
            if (auctions[i].status == AuctionStatus.ACTIVE) {
                activeAuctions[currentIndex] = i;
                currentIndex++;
            }
        }

        // Resize array
        uint256[] memory result = new uint256[](currentIndex);
        for (uint256 i = 0; i < currentIndex; i++) {
            result[i] = activeAuctions[i];
        }

        return result;
    }

    /**
     * @dev Get auctions by seller
     */
    function getAuctionsBySeller(
        address seller
    ) external view returns (uint256[] memory) {
        uint256[] memory sellerAuctions = new uint256[](_auctionIdCounter);
        uint256 currentIndex = 0;

        for (uint256 i = 1; i < _auctionIdCounter; i++) {
            if (auctions[i].seller == seller) {
                sellerAuctions[currentIndex] = i;
                currentIndex++;
            }
        }

        // Resize array
        uint256[] memory result = new uint256[](currentIndex);
        for (uint256 i = 0; i < currentIndex; i++) {
            result[i] = sellerAuctions[i];
        }

        return result;
    }

    /**
     * @dev Check if user has participated in auction
     */
    function hasUserBid(
        uint256 auctionId,
        address user
    ) external view returns (bool) {
        return
            bidderDeposits[auctionId][user] > 0 ||
            sealedBids[auctionId][user] != bytes32(0) ||
            auctions[auctionId].highestBidder == user;
    }

    /**
     * @dev Get current auction counter
     */
    function getCurrentAuctionId() external view returns (uint256) {
        return _auctionIdCounter;
    }

    /**
     * @dev Get total number of auctions created
     */
    function getTotalAuctions() external view returns (uint256) {
        return _auctionIdCounter - 1; // Subtract 1 because counter starts at 1
    }

    // ============ PAUSE FUNCTIONS ============
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // ============ UTILITY FUNCTIONS ============
    /**
     * @dev Generate sealed bid hash
     */
    function generateBidHash(
        uint256 amount,
        uint256 nonce,
        address bidder
    ) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(amount, nonce, bidder));
    }

    /**
     * @dev Emergency withdraw (admin only)
     */
    function emergencyWithdraw() external onlyRole(ADMIN_ROLE) {
        (bool success, ) = payable(platformOwner).call{
            value: address(this).balance
        }("");
        require(success, "Emergency withdraw failed");
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {
        // Contract can receive ETH for bids
    }
}
