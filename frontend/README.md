# 🚗 Moove Mobility - NFT Vehicle Rental Platform

A revolutionary decentralized mobility platform built on Ethereum that enables users to auction, trade, and manage NFT-based vehicle access passes. This dApp combines smart contract technology with a modern React frontend to create a seamless mobility ecosystem for the future of transportation.

## 📌 Features

### 🎯 Core Functionality

- ✅ **NFT Vehicle Passes** - Create and manage unique vehicle access tokens
- ✅ **Multi-Type Auctions** - English, Dutch, Sealed Bid, and Reserve auctions
- ✅ **Smart Collection Management** - Dynamic NFT loading with infinite scroll
- ✅ **Real-time Bidding** - Live auction updates with automatic refresh
- ✅ **Access Control System** - Role-based permissions for admins and users
- ✅ **IPFS Integration** - Decentralized metadata storage
- ✅ **Multi-language Support** - English and Italian localization
- ✅ **Advanced Notification System** - Real-time auction and claim notifications
- ✅ **Sealed Bid Auctions** - Private bidding with automatic winner detection
- ✅ **Automatic Refund System** - Smart refunds for losing bidders

### 🔧 Technical Features

- ✅ **Smart Refresh System** - Intelligent data synchronization
- ✅ **Transaction Monitoring** - Real-time blockchain event tracking
- ✅ **Gas Optimization** - Efficient contract interactions
- ✅ **Error Handling** - Comprehensive error boundaries and fallbacks
- ✅ **Responsive Design** - Mobile-first UI with dark/light mode
- ✅ **TypeScript** - Full type safety across the application

## 🔍 Repository Structure

```
Moove-Mobility-dApp/
├── frontend/                 # Next.js React application
│   ├── app/                 # App Router pages
│   │   ├── auctions/        # Auction marketplace
│   │   ├── my-collection/   # User NFT collection
│   │   ├── admin/           # Admin panel
│   │   └── marketplace/     # General marketplace
│   ├── components/          # Reusable React components
│   │   ├── auctions/        # Auction-specific components
│   │   ├── collection/     # NFT collection components
│   │   ├── admin/          # Admin interface components
│   │   └── layout/        # Layout components
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuctionsEnhanced.ts    # Main auction logic
│   │   ├── useAuctionRefresh.ts     # Global refresh system
│   │   ├── useSmartLazyCollection.ts # NFT collection management
│   │   └── useContract.ts            # Contract interactions
│   ├── utils/              # Utility functions and configurations
│   └── types/              # TypeScript type definitions
├── contracts/               # Solidity smart contracts
└── docs/                   # Technical documentation
```

## ⚙️ Smart Contracts

### 🏗️ Contract Architecture

The dApp is built on **4 main smart contracts** deployed on **Sepolia Testnet**:

#### 1. **MooveAccessControl**

**Address:** `0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42`

- Role-based access control system
- Master Admin and User role management
- Permission validation for all operations

#### 2. **MooveNFT**

**Address:** `0x40E455515bf712144C1A5D859F19d64b537754f7`

- ERC-721 NFT implementation for vehicle passes
- Metadata management with IPFS integration
- Transfer and ownership tracking

#### 3. **MooveAuction**

**Address:** `0xE8f6836A0054B83b9a952e8B62D92e62f5c67606`

- Multi-type auction system (English, Dutch, Sealed Bid, Reserve)
- Bid management and settlement
- Automatic auction monitoring and settlement

#### 4. **MooveRentalPass**

**Address:** `0x52d95a8Fd4D8c0Ad210DCAD3BA8EBd533EB5420a`

- Vehicle rental pass management
- Time-based access control
- Rental period tracking

### 🎯 Auction Types

| Type           | ID  | Description                                  | Refunds   |
| -------------- | --- | -------------------------------------------- | --------- |
| **English**    | 0   | Traditional ascending price auction          | Automatic |
| **Dutch**      | 1   | Descending price auction with buy-now option | Automatic |
| **Sealed Bid** | 2   | Private bidding with reveal phase            | Automatic |
| **Reserve**    | 3   | Auction with minimum price protection        | Automatic |

### 🚗 Vehicle Types

| Type           | ID  | Price (ETH) | Description             |
| -------------- | --- | ----------- | ----------------------- |
| **Car**        | 0   | 0.1         | Full vehicle access     |
| **Motorcycle** | 1   | 0.05        | Two-wheeled vehicle     |
| **Scooter**    | 2   | 0.03        | Electric scooter access |
| **Bicycle**    | 3   | 0.01        | Bike sharing access     |

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **MetaMask** wallet
- **Sepolia ETH** for testing

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/your-username/Moove-Mobility-dApp.git
cd Moove-Mobility-dApp/frontend
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment**

```bash
# Copy environment template
cp .env.example .env.local

# Add your configuration
NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS=0x93b6F6F4b28cd61F68c16A85c9FC107Bf8f47e42
NEXT_PUBLIC_MOOVE_NFT_ADDRESS=0x40E455515bf712144C1A5D859F19d64b537754f7
NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS=0xE8f6836A0054B83b9a952e8B62D92e62f5c67606
NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS=0x52d95a8Fd4D8c0Ad210DCAD3BA8EBd533EB5420a
```

4. **Start development server**

```bash
npm run dev
```

5. **Open in browser**

```
http://localhost:3000
```

## 🎮 How to Use

### 👤 For Users

#### **Creating NFTs (Admin Only)**

1. Connect wallet with admin privileges
2. Navigate to `/admin`
3. Use the NFT Creator to mint vehicle passes
4. Set metadata (name, description, image)
5. Deploy to IPFS automatically

#### **Participating in Auctions**

1. Browse auctions at `/auctions`
2. Select an auction type:
   - **English**: Bid incrementally
   - **Dutch**: Buy at current price or wait for decrease
   - **Sealed Bid**: Submit private bid
   - **Reserve**: Bid above minimum price
3. Confirm transaction in MetaMask
4. Monitor auction status in real-time

#### **Managing Collection**

1. View owned NFTs at `/my-collection`
2. Track total portfolio value
3. Transfer NFTs to other users
4. View auction history and final prices

### 🛠️ For Developers

#### **Smart Contract Integration**

```typescript
import { useContract } from "@/hooks/useContract";

// Access auction contract
const { writeMooveAuction } = useWriteMooveAuction();

// Place a bid
await writeMooveAuction.placeBid({
  args: [auctionId],
  value: ethers.parseEther(bidAmount),
});
```

#### **Custom Hooks Usage**

```typescript
import { useAuctionsEnhanced } from "@/hooks/enhanced-auction-utils";
import { useAuctionRefresh } from "@/hooks/useAuctionRefresh";

// Get auction data with smart refresh
const { auctions, isLoading, refetch } = useAuctionsEnhanced();

// Global refresh system
const { triggerRefresh } = useAuctionRefresh();
```

#### **Event Listening**

```typescript
// Listen to auction events
useEffect(() => {
  const handleBidPlaced = (event) => {
    console.log("New bid placed:", event.detail);
    triggerRefresh(); // Update UI
  };

  window.addEventListener("bidPlaced", handleBidPlaced);
  return () => window.removeEventListener("bidPlaced", handleBidPlaced);
}, []);
```

## 🔧 Technical Architecture

### **Frontend Stack**

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Wagmi** - Ethereum React hooks
- **React Query** - Data fetching and caching
- **Ethers.js** - Ethereum library

### **Smart Contract Stack**

- **Solidity ^0.8.20** - Smart contract language
- **OpenZeppelin** - Security libraries
- **Hardhat** - Development environment
- **Sepolia Testnet** - Ethereum test network

### **Data Flow Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    MOOVE DAPP ARCHITECTURE                 │
└─────────────────────────────────────────────────────────────┘

1. SMART CONTRACTS (Sepolia)
   ├── MooveAccessControl (Roles & Permissions)
   ├── MooveNFT (Vehicle Pass Tokens)
   ├── MooveAuction (Multi-type Auctions)
   └── MooveRentalPass (Rental Management)

2. FRONTEND LAYER (Next.js)
   ├── useAuctionsEnhanced() [Main data source]
   ├── useAuctionRefresh() [Global refresh system]
   ├── useSmartLazyCollection() [NFT collection]
   └── useContract() [Contract interactions]

3. DATA SYNCHRONIZATION
   ├── Smart Refresh (every 5 minutes)
   ├── Event-driven Updates (bidPlaced, auctionSettled)
   ├── Real-time Monitoring (useAutomaticAuctionMonitor)
   └── Local State Management (React hooks)

4. USER INTERFACE
   ├── Auction Marketplace (/auctions)
   ├── NFT Collection (/my-collection)
   ├── Admin Panel (/admin)
   └── Marketplace (/marketplace)
```

## 📊 Key Features Deep Dive

### **🎯 Smart Refresh System**

- **Intelligent Pausing**: Stops refresh during modals or hidden tabs
- **Event-driven Updates**: Responds to blockchain events instantly
- **Conflict Prevention**: Single refresh system prevents data conflicts
- **Performance Optimized**: Minimal blockchain calls, maximum efficiency

### **🔄 Auction Management**

- **Real-time Bidding**: Live updates without page refresh
- **Multi-type Support**: All auction types in one interface
- **Automatic Settlement**: Expired auctions settle automatically
- **Bid History**: Complete transaction history tracking
- **Smart Refunds**: Intelligent refund system for losing bidders

### **📱 Responsive Design**

- **Mobile-first**: Optimized for all device sizes
- **Dark/Light Mode**: Automatic theme switching
- **Accessibility**: WCAG compliant interface
- **Progressive Enhancement**: Works without JavaScript

## 🔐 Security Features

### **Smart Contract Security**

- **Reentrancy Protection**: OpenZeppelin ReentrancyGuard
- **Access Control**: Role-based permission system
- **Input Validation**: Comprehensive parameter checking
- **Gas Optimization**: Efficient contract operations

### **Frontend Security**

- **Type Safety**: Full TypeScript coverage
- **Error Boundaries**: Graceful error handling
- **Input Sanitization**: XSS protection
- **Secure Storage**: No sensitive data in localStorage

## 🚀 Deployment

### **Frontend Deployment**

```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel --prod
```

### **Smart Contract Deployment**

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify contracts
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## 📈 Performance Metrics

- **First Load JS**: ~1.67 MB
- **Page Load Time**: <2 seconds
- **Auction Refresh**: <1 second
- **Transaction Confirmation**: <30 seconds
- **NFT Loading**: Dynamic with infinite scroll

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### **Development Guidelines**

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commits
- Ensure responsive design

## 📄 License

**MIT License** - Free to use, modify, and distribute.

See [LICENSE](LICENSE) file for details.

## 🧠 Author Notes

This project demonstrates advanced Web3 development patterns including:

- **Complex State Management**: Multi-layer data synchronization
- **Real-time Updates**: Blockchain event integration
- **Performance Optimization**: Smart caching and refresh strategies
- **User Experience**: Seamless Web3 interactions

Feel free to fork and expand the functionality (e.g., add more auction types, implement governance, integrate with other DeFi protocols).

## 🔗 Links

- **Live Demo**: [Coming Soon]
- **Documentation**: [docs/](docs/)
- **Smart Contracts**: [contracts/](contracts/)
- **Issues**: [GitHub Issues](https://github.com/your-username/Moove-Mobility-dApp/issues)

---

**Built with ❤️ for the decentralized mobility future** 🚗✨
