// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "../libraries/PriceCalculator.sol";

contract TestPriceCalculator {
    using PriceCalculator for uint256;

    function calculateDutchPrice(
        uint256 startPrice,
        uint256 endPrice,
        uint256 startTime,
        uint256 endTime
    ) external view returns (uint256) {
        return PriceCalculator.calculateDutchPrice(
            startPrice,
            endPrice,
            startTime,
            endTime
        );
    }
} 