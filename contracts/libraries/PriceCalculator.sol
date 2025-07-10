// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library PriceCalculator {
    function calculateDutchPrice(
        uint256 startPrice,
        uint256 endPrice,
        uint256 startTime,
        uint256 endTime
    ) internal view returns (uint256) {
        if (block.timestamp >= endTime) return endPrice;
        if (block.timestamp <= startTime) return startPrice;

        uint256 elapsed = block.timestamp - startTime;
        uint256 duration = endTime - startTime;
        uint256 priceReduction = ((startPrice - endPrice) * elapsed) / duration;

        return startPrice - priceReduction;
    }
}
