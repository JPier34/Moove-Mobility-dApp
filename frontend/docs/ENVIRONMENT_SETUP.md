# Moove Mobility dApp - Environment Configuration Guide

## Overview

This guide explains how to configure the environment variables for the Moove Mobility dApp.

## Required Environment Variables

### Smart Contract Addresses (Sepolia Testnet)

```bash
# Access Control Contract
NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS=0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42

# NFT Contract (Vehicle Passes)
NEXT_PUBLIC_MOOVE_NFT_ADDRESS=0x40E455515bf712144C1A5D859F19d64b537754f7

# Auction Contract
NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS=0xE8f6836A0054B83b9a952e8B62D92e62f5c67606

# Rental Pass Contract
NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS=0x52d95a8Fd4D8c0Ad210DCAD3BA8EBd533EB5420a
```

### Network Configuration

```bash
# RPC Endpoint (Sepolia)
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia.publicnode.com

# Chain ID (Sepolia = 11155111)
NEXT_PUBLIC_CHAIN_ID=11155111
```

### Application Settings

```bash
# Application Name
NEXT_PUBLIC_APP_NAME=Moove Mobility dApp

# Application Description
NEXT_PUBLIC_APP_DESCRIPTION=Decentralized mobility platform for vehicle access passes

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development Settings

```bash
# Enable debug mode
NEXT_PUBLIC_DEBUG=false

# Enable development features
NEXT_PUBLIC_DEV_MODE=false
```

### IPFS Configuration

```bash
# IPFS Gateway URLs (comma-separated)
NEXT_PUBLIC_IPFS_GATEWAYS=https://ipfs.io/ipfs/,https://gateway.pinata.cloud/ipfs/,https://cloudflare-ipfs.com/ipfs/
```

### Notification Settings

```bash
# Enable notifications
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Notification refresh interval (ms)
NEXT_PUBLIC_NOTIFICATION_INTERVAL=30000
```

### Auction Settings

```bash
# Default auction duration (seconds)
NEXT_PUBLIC_DEFAULT_AUCTION_DURATION=86400

# Minimum bid increment (ETH)
NEXT_PUBLIC_MIN_BID_INCREMENT=0.001
```

### Vehicle Pricing (ETH)

```bash
# Car price
NEXT_PUBLIC_CAR_PRICE=0.1

# Motorcycle price
NEXT_PUBLIC_MOTORCYCLE_PRICE=0.05

# Scooter price
NEXT_PUBLIC_SCOOTER_PRICE=0.03

# Bicycle price
NEXT_PUBLIC_BICYCLE_PRICE=0.01
```

### Admin Configuration

```bash
# Master Admin Address (for testing)
NEXT_PUBLIC_MASTER_ADMIN_ADDRESS=0x777382955f33Bb8540602E914D9b650C962EF6Cc

# Enable admin features
NEXT_PUBLIC_ENABLE_ADMIN=true
```

## Setup Instructions

1. **Create Environment File**

   ```bash
   cp .env.example .env.local
   ```

2. **Fill Required Values**

   - Update contract addresses if deploying new contracts
   - Set your admin address for testing
   - Configure RPC endpoint for your preferred provider

3. **Verify Configuration**

   ```bash
   npm run dev
   ```

4. **Check Console**
   - Look for "Contract addresses loaded" message
   - Verify all contracts are connected properly

## Contract Verification

To verify contracts on Etherscan:

```bash
# Verify Access Control
npx hardhat verify --network sepolia 0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42

# Verify NFT Contract
npx hardhat verify --network sepolia 0x40E455515bf712144C1A5D859F19d64b537754f7

# Verify Auction Contract
npx hardhat verify --network sepolia 0xE8f6836A0054B83b9a952e8B62D92e62f5c67606

# Verify Rental Pass Contract
npx hardhat verify --network sepolia 0x52d95a8Fd4D8c0Ad210DCAD3BA8EBd533EB5420a
```

## Troubleshooting

### Common Issues

1. **Contract Not Found**

   - Verify contract addresses are correct
   - Ensure contracts are deployed on Sepolia
   - Check RPC endpoint is working

2. **Transaction Failures**

   - Ensure wallet has Sepolia ETH
   - Check gas limits are sufficient
   - Verify wallet is connected to Sepolia network

3. **IPFS Issues**
   - Check IPFS gateway URLs are accessible
   - Verify metadata is properly formatted
   - Test with different gateways

### Debug Mode

Enable debug mode for detailed logging:

```bash
NEXT_PUBLIC_DEBUG=true
```

This will show:

- Contract interaction logs
- Transaction details
- Error messages
- Performance metrics

## Security Notes

- Never commit `.env.local` to version control
- Use testnet addresses for development
- Verify all contract interactions
- Test thoroughly before mainnet deployment

## Overview

This guide explains how to configure the environment variables for the Moove Mobility dApp.

## Required Environment Variables

### Smart Contract Addresses (Sepolia Testnet)

```bash
# Access Control Contract
NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS=0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42

# NFT Contract (Vehicle Passes)
NEXT_PUBLIC_MOOVE_NFT_ADDRESS=0x40E455515bf712144C1A5D859F19d64b537754f7

# Auction Contract
NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS=0xE8f6836A0054B83b9a952e8B62D92e62f5c67606

# Rental Pass Contract
NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS=0x52d95a8Fd4D8c0Ad210DCAD3BA8EBd533EB5420a
```

### Network Configuration

```bash
# RPC Endpoint (Sepolia)
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia.publicnode.com

# Chain ID (Sepolia = 11155111)
NEXT_PUBLIC_CHAIN_ID=11155111
```

### Application Settings

```bash
# Application Name
NEXT_PUBLIC_APP_NAME=Moove Mobility dApp

# Application Description
NEXT_PUBLIC_APP_DESCRIPTION=Decentralized mobility platform for vehicle access passes

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Development Settings

```bash
# Enable debug mode
NEXT_PUBLIC_DEBUG=false

# Enable development features
NEXT_PUBLIC_DEV_MODE=false
```

### IPFS Configuration

```bash
# IPFS Gateway URLs (comma-separated)
NEXT_PUBLIC_IPFS_GATEWAYS=https://ipfs.io/ipfs/,https://gateway.pinata.cloud/ipfs/,https://cloudflare-ipfs.com/ipfs/
```

### Notification Settings

```bash
# Enable notifications
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true

# Notification refresh interval (ms)
NEXT_PUBLIC_NOTIFICATION_INTERVAL=30000
```

### Auction Settings

```bash
# Default auction duration (seconds)
NEXT_PUBLIC_DEFAULT_AUCTION_DURATION=86400

# Minimum bid increment (ETH)
NEXT_PUBLIC_MIN_BID_INCREMENT=0.001
```

### Vehicle Pricing (ETH)

```bash
# Car price
NEXT_PUBLIC_CAR_PRICE=0.1

# Motorcycle price
NEXT_PUBLIC_MOTORCYCLE_PRICE=0.05

# Scooter price
NEXT_PUBLIC_SCOOTER_PRICE=0.03

# Bicycle price
NEXT_PUBLIC_BICYCLE_PRICE=0.01
```

### Admin Configuration

```bash
# Master Admin Address (for testing)
NEXT_PUBLIC_MASTER_ADMIN_ADDRESS=0x777382955f33Bb8540602E914D9b650C962EF6Cc

# Enable admin features
NEXT_PUBLIC_ENABLE_ADMIN=true
```

## Setup Instructions

1. **Create Environment File**

   ```bash
   cp .env.example .env.local
   ```

2. **Fill Required Values**

   - Update contract addresses if deploying new contracts
   - Set your admin address for testing
   - Configure RPC endpoint for your preferred provider

3. **Verify Configuration**

   ```bash
   npm run dev
   ```

4. **Check Console**
   - Look for "Contract addresses loaded" message
   - Verify all contracts are connected properly

## Contract Verification

To verify contracts on Etherscan:

```bash
# Verify Access Control
npx hardhat verify --network sepolia 0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42

# Verify NFT Contract
npx hardhat verify --network sepolia 0x40E455515bf712144C1A5D859F19d64b537754f7

# Verify Auction Contract
npx hardhat verify --network sepolia 0xE8f6836A0054B83b9a952e8B62D92e62f5c67606

# Verify Rental Pass Contract
npx hardhat verify --network sepolia 0x52d95a8Fd4D8c0Ad210DCAD3BA8EBd533EB5420a
```

## Troubleshooting

### Common Issues

1. **Contract Not Found**

   - Verify contract addresses are correct
   - Ensure contracts are deployed on Sepolia
   - Check RPC endpoint is working

2. **Transaction Failures**

   - Ensure wallet has Sepolia ETH
   - Check gas limits are sufficient
   - Verify wallet is connected to Sepolia network

3. **IPFS Issues**
   - Check IPFS gateway URLs are accessible
   - Verify metadata is properly formatted
   - Test with different gateways

### Debug Mode

Enable debug mode for detailed logging:

```bash
NEXT_PUBLIC_DEBUG=true
```

This will show:

- Contract interaction logs
- Transaction details
- Error messages
- Performance metrics

## Security Notes

- Never commit `.env.local` to version control
- Use testnet addresses for development
- Verify all contract interactions
- Test thoroughly before mainnet deployment
