// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import "../libraries/VehicleMetadata.sol";

contract TestVehicleMetadata {
    using VehicleMetadata for VehicleMetadata.CustomizationData;

    VehicleMetadata.CustomizationData public customizationData;

    function addSticker(string memory sticker) external {
        VehicleMetadata.addSticker(customizationData, sticker);
    }

    function getStickers() external view returns (string[] memory) {
        return customizationData.stickers;
    }

    function getColorScheme() external view returns (string memory) {
        return customizationData.colorScheme;
    }

    function getAchievements() external view returns (string[] memory) {
        return customizationData.achievements;
    }

    function getLastUpdated() external view returns (uint256) {
        return customizationData.lastUpdated;
    }

    function setColorScheme(string memory colorScheme) external {
        customizationData.colorScheme = colorScheme;
        customizationData.lastUpdated = block.timestamp;
    }

    function addAchievement(string memory achievement) external {
        customizationData.achievements.push(achievement);
        customizationData.lastUpdated = block.timestamp;
    }
} 