// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

library VehicleMetadata {
    struct CustomizationData {
        string[] stickers;
        string colorScheme;
        string[] achievements;
        uint256 lastUpdated;
    }

    function addSticker(
        CustomizationData storage data,
        string memory sticker
    ) internal {
        data.stickers.push(sticker);
        data.lastUpdated = block.timestamp;
    }
}
