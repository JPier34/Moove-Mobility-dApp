# RPC Provider Configuration Guide

## 🚨 Current Issue: RPC Quota Exceeded

You're experiencing "quota exceeded" errors because the current RPC provider (`ethereum-sepolia.publicnode.com`) has reached its usage limit.

## 🔧 Quick Fix

Create a `.env.local` file in your project root with the following content:

```bash
# Use a different RPC provider
NEXT_PUBLIC_RPC_URL=https://1rpc.io/sepolia
```

## 📋 Recommended RPC Providers

### 1. **1RPC (Recommended - No API Key Required)**

```bash
NEXT_PUBLIC_RPC_URL=https://1rpc.io/sepolia
```

- ✅ Reliable
- ✅ No API key required
- ✅ Good rate limits
- ✅ Free

### 2. **DRPC (Alternative - No API Key Required)**

```bash
NEXT_PUBLIC_RPC_URL=https://sepolia.drpc.org
```

- ✅ Reliable
- ✅ No API key required
- ✅ Good rate limits
- ✅ Free

### 3. **Sepolia.org (Official - No API Key Required)**

```bash
NEXT_PUBLIC_RPC_URL=https://rpc.sepolia.org
```

- ✅ Official Sepolia RPC
- ✅ No API key required
- ⚠️ May have rate limits
- ✅ Free

### 4. **Alchemy (Most Reliable - Requires Free API Key)**

```bash
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

- ✅ Most reliable
- ✅ Highest rate limits
- ✅ Professional support
- 🔑 Requires free API key from [alchemy.com](https://www.alchemy.com/)

### 5. **Infura (Very Reliable - Requires Free API Key)**

```bash
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
```

- ✅ Very reliable
- ✅ High rate limits
- ✅ Professional support
- 🔑 Requires free API key from [infura.io](https://infura.io/)

## 🛠️ How to Fix

1. **Create `.env.local` file** in your project root
2. **Add the RPC URL** of your choice:
   ```bash
   NEXT_PUBLIC_RPC_URL=https://1rpc.io/sepolia
   ```
3. **Restart your development server**:
   ```bash
   npm run dev
   ```

## 🔄 Fallback System

The application is configured with multiple fallback RPC providers in `lib/wagmi.ts`:

```typescript
const customSepolia = {
  ...sepolia,
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_RPC_URL || "https://1rpc.io/sepolia",
        "https://sepolia.drpc.org",
        "https://rpc.sepolia.org",
      ],
    },
  },
};
```

This means if your primary RPC fails, it will automatically try the fallback providers.

## 📊 Provider Comparison

| Provider    | Reliability | Rate Limits | API Key Required | Cost                |
| ----------- | ----------- | ----------- | ---------------- | ------------------- |
| Alchemy     | ⭐⭐⭐⭐⭐  | Very High   | Yes (Free)       | Free Tier Available |
| Infura      | ⭐⭐⭐⭐⭐  | High        | Yes (Free)       | Free Tier Available |
| 1RPC        | ⭐⭐⭐⭐    | Medium      | No               | Free                |
| DRPC        | ⭐⭐⭐⭐    | Medium      | No               | Free                |
| Sepolia.org | ⭐⭐⭐      | Low-Medium  | No               | Free                |
| PublicNode  | ⭐⭐        | Low         | No               | Free                |

## 🚀 For Production

For production deployment, always use a paid RPC provider:

- **Alchemy** - Best overall
- **Infura** - Very reliable
- **Ankr** - Good alternative

## 🔍 Troubleshooting

### Error: "Exceeded the quota usage"

- Switch to a different RPC provider
- Get a free API key from Alchemy or Infura

### Error: "Rate limited"

- Switch to a provider with higher rate limits
- Consider getting a paid plan

### Error: "Network not detected"

- Check your RPC URL is correct
- Ensure the provider is online
- Try a different provider

## 📝 Complete .env.local Template

```bash
# Smart Contract Addresses
NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS=0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42
NEXT_PUBLIC_MOOVE_NFT_ADDRESS=0x40E455515bf712144C1A5D859F19d64b537754f7
NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS=0x463a4fff0796AF7C69788463629AeF046A2fc211
NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS=0x52d95a8Fd4D8c0Ad210DCAD3BA8EBd533EB5420a

# Network Configuration
NEXT_PUBLIC_RPC_URL=https://1rpc.io/sepolia
NEXT_PUBLIC_CHAIN_ID=11155111

# Application Settings
NEXT_PUBLIC_APP_NAME=Moove Mobility dApp
NEXT_PUBLIC_APP_DESCRIPTION=Decentralized mobility platform for vehicle access passes
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Development Settings
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_DEV_MODE=false

# IPFS Configuration
NEXT_PUBLIC_IPFS_GATEWAYS=https://ipfs.io/ipfs/,https://gateway.pinata.cloud/ipfs/,https://cloudflare-ipfs.com/ipfs/

# Notification Settings
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
NEXT_PUBLIC_NOTIFICATION_INTERVAL=30000

# Auction Settings
NEXT_PUBLIC_DEFAULT_AUCTION_DURATION=86400
NEXT_PUBLIC_MIN_BID_INCREMENT=0.001

# Vehicle Pricing (ETH)
NEXT_PUBLIC_CAR_PRICE=0.1
NEXT_PUBLIC_MOTORCYCLE_PRICE=0.05
NEXT_PUBLIC_SCOOTER_PRICE=0.03
NEXT_PUBLIC_BICYCLE_PRICE=0.01
```
