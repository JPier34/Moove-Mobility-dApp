// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IMooveVehicleNFT {
    struct VehicleInfo {
        uint256 tokenId;
        VehicleType vehicleType;
        string name;
        string description;
        uint256 dailyRate;
        bool isActive;
        address currentOwner;
    }

    enum VehicleType {
        BIKE,
        SCOOTER,
        MONOPATTINO
    }

    function mint(
        address to,
        uint256 tokenId,
        VehicleType vehicleType
    ) external;

    function setDailyRate(uint256 tokenId, uint256 rate) external;

    function getVehicleInfo(
        uint256 tokenId
    ) external view returns (VehicleInfo memory);
}
