// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MooveAccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MooveTradingManager
 * @dev Estensione per gestire il trading di NFT personalizzabili
 * @notice Gestisce commissioni, lock personalizzazioni e validazioni per il trading
 */

interface IMooveTradingManager {
    function recordAuctionSale(
        address nftContract,
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 price
    ) external;
}

contract MooveTradingManager is ReentrancyGuard, Pausable {
    // ============= STORAGE VARIABLES =============

    /// @dev Reference to the access control contract
    MooveAccessControl public immutable accessControl;

    /// @dev Trading fee percentage (basis points: 100 = 1%)
    uint256 public tradingFeePercentage = 250; // 2.5%

    /// @dev Marketplace commission percentage (basis points)
    uint256 public marketplaceFeePercentage = 100; // 1%

    /// @dev Minimum trading fee in wei
    uint256 public minimumTradingFee = 0.001 ether;

    /// @dev Maximum trading fee percentage (10%)
    uint256 public constant MAX_TRADING_FEE = 1000;

    /// @dev Treasury address for collecting fees
    address public treasury;

    /// @dev Mapping to track NFT customization locks during trades
    mapping(address => mapping(uint256 => bool)) public customizationLocked;

    /// @dev Mapping to track authorized NFT contracts
    mapping(address => bool) public authorizedNFTContracts;

    /// @dev Mapping to track active sales
    mapping(address => mapping(uint256 => SaleInfo)) public activeSales;

    /// @dev Mapping to track trading statistics
    mapping(address => TradingStats) public userTradingStats;

    // ============= STRUCTS =============

    struct SaleInfo {
        address seller;
        uint256 price;
        uint256 listedAt;
        bool isActive;
        bool allowCustomization;
    }

    struct TradingStats {
        uint256 totalSales;
        uint256 totalPurchases;
        uint256 volumeTraded;
        uint256 feesEarned; // For sellers
        uint256 feesPaid; // For buyers
    }

    struct TradeDetails {
        address nftContract;
        uint256 tokenId;
        address seller;
        address buyer;
        uint256 price;
        uint256 tradingFee;
        uint256 marketplaceFee;
        uint256 sellerProceeds;
    }

    // ============= EVENTS =============

    event NFTPreparedForTrade(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        bool allowCustomization
    );

    event NFTTradeCompleted(
        address indexed nftContract,
        uint256 indexed tokenId,
        address indexed buyer,
        address seller,
        uint256 finalPrice,
        uint256 tradingFee,
        uint256 marketplaceFee
    );

    event CustomizationLockChanged(
        address indexed nftContract,
        uint256 indexed tokenId,
        bool locked
    );

    event TradingFeesUpdated(
        uint256 oldTradingFee,
        uint256 newTradingFee,
        uint256 oldMarketplaceFee,
        uint256 newMarketplaceFee
    );

    event NFTContractAuthorized(address indexed nftContract, bool authorized);

    event TreasuryUpdated(
        address indexed oldTreasury,
        address indexed newTreasury
    );

    event FeesWithdrawn(address indexed to, uint256 amount);

    // ============= MODIFIERS =============

    modifier onlyAccessControlRole(bytes32 role) {
        accessControl.validateRole(role, msg.sender);
        _;
    }

    modifier onlyAuthorizedNFT(address nftContract) {
        require(
            authorizedNFTContracts[nftContract],
            "NFT contract not authorized"
        );
        _;
    }

    modifier onlyWhenNotPaused() {
        accessControl.validateNotPaused();
        require(!paused(), "Trading paused");
        _;
    }

    modifier validAddress(address addr) {
        require(addr != address(0), "Invalid address");
        _;
    }

    // ============= CONSTRUCTOR =============

    constructor(
        address _accessControl,
        address _treasury
    ) validAddress(_accessControl) validAddress(_treasury) {
        accessControl = MooveAccessControl(_accessControl);
        treasury = _treasury;
    }

    // ============= TRADING FUNCTIONS =============

    /**
     * @dev Prepare NFT for trading with customization lock options
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to prepare for trading
     * @param salePrice Price at which to list the NFT
     * @param allowCustomization Whether to allow customization during sale period
     */
    function prepareNFTForTrade(
        address nftContract,
        uint256 tokenId,
        uint256 salePrice,
        bool allowCustomization
    ) external onlyAuthorizedNFT(nftContract) onlyWhenNotPaused nonReentrant {
        require(salePrice > 0, "Invalid sale price");

        // Verify caller owns the NFT (this would need to be integrated with your NFT contract)
        // For now, we assume the caller is authorized

        // Lock customization if not allowed during sale
        if (!allowCustomization) {
            customizationLocked[nftContract][tokenId] = true;
            emit CustomizationLockChanged(nftContract, tokenId, true);
        }

        // Create sale info
        activeSales[nftContract][tokenId] = SaleInfo({
            seller: msg.sender,
            price: salePrice,
            listedAt: block.timestamp,
            isActive: true,
            allowCustomization: allowCustomization
        });

        emit NFTPreparedForTrade(
            nftContract,
            tokenId,
            msg.sender,
            salePrice,
            allowCustomization
        );
    }

    /**
     * @dev Execute NFT trade with fee calculation
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to trade
     */
    function executeNFTTrade(
        address nftContract,
        uint256 tokenId
    )
        external
        payable
        onlyAuthorizedNFT(nftContract)
        onlyWhenNotPaused
        nonReentrant
    {
        SaleInfo storage sale = activeSales[nftContract][tokenId];
        require(sale.isActive, "NFT not for sale");
        require(sale.seller != msg.sender, "Cannot buy own NFT");
        require(msg.value >= sale.price, "Insufficient payment");

        // Calculate fees
        TradeDetails memory trade = _calculateTradeDetails(
            nftContract,
            tokenId,
            sale.seller,
            msg.sender,
            msg.value
        );

        // Update trading statistics
        _updateTradingStats(trade);

        // Process payments
        _processTradePayments(trade);

        // Unlock customization for new owner
        customizationLocked[nftContract][tokenId] = false;

        // Deactivate sale
        sale.isActive = false;

        // Refund excess payment
        if (msg.value > sale.price) {
            payable(msg.sender).transfer(msg.value - sale.price);
        }

        emit NFTTradeCompleted(
            nftContract,
            tokenId,
            msg.sender,
            sale.seller,
            sale.price,
            trade.tradingFee,
            trade.marketplaceFee
        );

        emit CustomizationLockChanged(nftContract, tokenId, false);
    }

    /**
     * @dev Cancel NFT sale and unlock customization
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to cancel sale for
     */
    function cancelNFTSale(
        address nftContract,
        uint256 tokenId
    ) external onlyAuthorizedNFT(nftContract) nonReentrant {
        SaleInfo storage sale = activeSales[nftContract][tokenId];
        require(sale.isActive, "NFT not for sale");
        require(sale.seller == msg.sender, "Not the seller");

        // Unlock customization
        customizationLocked[nftContract][tokenId] = false;

        // Deactivate sale
        sale.isActive = false;

        emit CustomizationLockChanged(nftContract, tokenId, false);
    }

    // ============= CUSTOMIZATION MANAGEMENT =============

    /**
     * @dev Lock NFT customization (called by customization contract)
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to lock
     */
    function lockCustomization(
        address nftContract,
        uint256 tokenId
    )
        external
        onlyAccessControlRole(accessControl.CUSTOMIZATION_ADMIN_ROLE())
        onlyAuthorizedNFT(nftContract)
    {
        customizationLocked[nftContract][tokenId] = true;
        emit CustomizationLockChanged(nftContract, tokenId, true);
    }

    /**
     * @dev Unlock NFT customization
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to unlock
     */
    function unlockCustomization(
        address nftContract,
        uint256 tokenId
    )
        external
        onlyAccessControlRole(accessControl.CUSTOMIZATION_ADMIN_ROLE())
        onlyAuthorizedNFT(nftContract)
    {
        customizationLocked[nftContract][tokenId] = false;
        emit CustomizationLockChanged(nftContract, tokenId, false);
    }

    /**
     * @dev Check if NFT customization is locked
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID to check
     * @return locked True if customization is locked
     */
    function isCustomizationLocked(
        address nftContract,
        uint256 tokenId
    ) external view returns (bool locked) {
        return customizationLocked[nftContract][tokenId];
    }

    // ============= ADMIN FUNCTIONS =============

    /**
     * @dev Update trading fees
     * @param newTradingFee New trading fee percentage (basis points)
     * @param newMarketplaceFee New marketplace fee percentage (basis points)
     */
    function updateTradingFees(
        uint256 newTradingFee,
        uint256 newMarketplaceFee
    ) external onlyAccessControlRole(accessControl.PRICE_MANAGER_ROLE()) {
        require(newTradingFee <= MAX_TRADING_FEE, "Trading fee too high");
        require(
            newMarketplaceFee <= MAX_TRADING_FEE,
            "Marketplace fee too high"
        );

        uint256 oldTradingFee = tradingFeePercentage;
        uint256 oldMarketplaceFee = marketplaceFeePercentage;

        tradingFeePercentage = newTradingFee;
        marketplaceFeePercentage = newMarketplaceFee;

        emit TradingFeesUpdated(
            oldTradingFee,
            newTradingFee,
            oldMarketplaceFee,
            newMarketplaceFee
        );
    }

    /**
     * @dev Authorize NFT contract for trading
     * @param nftContract Address of the NFT contract
     */
    function authorizeNFTContract(
        address nftContract
    )
        external
        onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE())
        validAddress(nftContract)
    {
        require(nftContract.code.length > 0, "Not a contract");
        authorizedNFTContracts[nftContract] = true;
        emit NFTContractAuthorized(nftContract, true);
    }

    /**
     * @dev Deauthorize NFT contract for trading
     * @param nftContract Address of the NFT contract
     */
    function deauthorizeNFTContract(
        address nftContract
    ) external onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE()) {
        authorizedNFTContracts[nftContract] = false;
        emit NFTContractAuthorized(nftContract, false);
    }

    /**
     * @dev Update treasury address
     * @param newTreasury New treasury address
     */
    function updateTreasury(
        address newTreasury
    )
        external
        onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE())
        validAddress(newTreasury)
    {
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Emergency pause trading
     */
    function pauseTrading()
        external
        onlyAccessControlRole(accessControl.PAUSER_ROLE())
    {
        _pause();
    }

    /**
     * @dev Unpause trading
     */
    function unpauseTrading()
        external
        onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE())
    {
        _unpause();
    }

    /**
     * @dev Withdraw accumulated fees
     * @param to Address to send fees to
     * @param amount Amount to withdraw
     */
    function withdrawFees(
        address to,
        uint256 amount
    )
        external
        onlyAccessControlRole(accessControl.WITHDRAWER_ROLE())
        validAddress(to)
        nonReentrant
    {
        require(amount <= address(this).balance, "Insufficient balance");

        payable(to).transfer(amount);
        emit FeesWithdrawn(to, amount);
    }

    // ============= VIEW FUNCTIONS =============

    /**
     * @dev Get sale information for an NFT
     * @param nftContract Address of the NFT contract
     * @param tokenId Token ID
     * @return sale Sale information
     */
    function getSaleInfo(
        address nftContract,
        uint256 tokenId
    ) external view returns (SaleInfo memory sale) {
        return activeSales[nftContract][tokenId];
    }

    /**
     * @dev Get trading statistics for a user
     * @param user User address
     * @return stats Trading statistics
     */
    function getTradingStats(
        address user
    ) external view returns (TradingStats memory stats) {
        return userTradingStats[user];
    }

    /**
     * @dev Calculate trade fees for a given price
     * @param price Trade price
     * @return tradingFee Trading fee amount
     * @return marketplaceFee Marketplace fee amount
     * @return sellerProceeds Amount seller receives
     */
    function calculateTradeFees(
        uint256 price
    )
        external
        view
        returns (
            uint256 tradingFee,
            uint256 marketplaceFee,
            uint256 sellerProceeds
        )
    {
        tradingFee = (price * tradingFeePercentage) / 10000;
        if (tradingFee < minimumTradingFee) {
            tradingFee = minimumTradingFee;
        }

        marketplaceFee = (price * marketplaceFeePercentage) / 10000;
        sellerProceeds = price - tradingFee - marketplaceFee;
    }

    // ============= INTERNAL FUNCTIONS =============

    /**
     * @dev Calculate detailed trade information
     */
    function _calculateTradeDetails(
        address nftContract,
        uint256 tokenId,
        address seller,
        address buyer,
        uint256 price
    ) internal view returns (TradeDetails memory) {
        (
            uint256 tradingFee,
            uint256 marketplaceFee,
            uint256 sellerProceeds
        ) = this.calculateTradeFees(price);

        return
            TradeDetails({
                nftContract: nftContract,
                tokenId: tokenId,
                seller: seller,
                buyer: buyer,
                price: price,
                tradingFee: tradingFee,
                marketplaceFee: marketplaceFee,
                sellerProceeds: sellerProceeds
            });
    }

    /**
     * @dev Update trading statistics for buyer and seller
     */
    function _updateTradingStats(TradeDetails memory trade) internal {
        // Update seller stats
        TradingStats storage sellerStats = userTradingStats[trade.seller];
        sellerStats.totalSales++;
        sellerStats.volumeTraded += trade.price;
        sellerStats.feesEarned += trade.sellerProceeds;

        // Update buyer stats
        TradingStats storage buyerStats = userTradingStats[trade.buyer];
        buyerStats.totalPurchases++;
        buyerStats.volumeTraded += trade.price;
        buyerStats.feesPaid += trade.tradingFee + trade.marketplaceFee;
    }

    /**
     * @dev Process payments for a trade
     */
    function _processTradePayments(TradeDetails memory trade) internal {
        // Send proceeds to seller
        payable(trade.seller).transfer(trade.sellerProceeds);

        // Keep fees in contract for later withdrawal to treasury
        // Trading fee and marketplace fee stay in contract balance
    }

    /**
     * @dev Emergency withdrawal function
     */
    function emergencyWithdraw()
        external
        onlyAccessControlRole(accessControl.MASTER_ADMIN_ROLE())
        nonReentrant
    {
        uint256 balance = address(this).balance;
        payable(treasury).transfer(balance);
        emit FeesWithdrawn(treasury, balance);
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}
}
