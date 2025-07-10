// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMooveAuction {
    struct Auction {
        uint256 nftId;
        address nftContract;
        AuctionType auctionType;
        uint256 startPrice;
        uint256 reservePrice;
        uint256 startTime;
        uint256 endTime;
        address highestBidder;
        uint256 highestBid;
        bool ended;
        mapping(address => uint256) bids;
    }

    enum AuctionType {
        ENGLISH,
        DUTCH,
        SEALED_BID
    }

    function createAuction(
        uint256 nftId,
        address nftContract,
        AuctionType auctionType,
        uint256 startPrice,
        uint256 reservePrice,
        uint256 duration
    ) external;

    function placeBid(uint256 auctionId) external payable;

    function endAuction(uint256 auctionId) external;
}
