# Moove Mobility dApp - Technical Documentation

## Architecture Overview

The Moove Mobility dApp is built using a modern Web3 stack with React/Next.js frontend and Solidity smart contracts.

### Technology Stack

#### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Wagmi** - Ethereum React hooks
- **Ethers.js** - Ethereum library
- **React Query** - Data fetching and caching

#### Smart Contracts

- **Solidity ^0.8.20** - Smart contract language
- **OpenZeppelin** - Security libraries
- **Hardhat** - Development environment
- **Sepolia Testnet** - Ethereum test network

## Smart Contract Architecture

### Contract Hierarchy

```
MooveAccessControl (Base)
├── MooveNFT (ERC-721)
├── MooveAuction (Auction Logic)
└── MooveRentalPass (Rental Management)
```

### Key Features

#### 1. Access Control System

- Role-based permissions
- Master Admin and User roles
- Permission validation for all operations

#### 2. NFT Implementation

- ERC-721 standard compliance
- IPFS metadata integration
- Transfer and ownership tracking

#### 3. Auction System

- Multiple auction types (English, Dutch, Sealed Bid, Reserve)
- Bid management and settlement
- Automatic monitoring and settlement

#### 4. Rental Pass Management

- Time-based access control
- Rental period tracking
- Vehicle type management

#### 5. Refund System

- **Fully Automatic Refunds**: All auction types (English, Dutch, Sealed Bid, Reserve)
- **Smart Contract Settlement**: `settleAuction()` + `refundRemainingBidders()` called automatically
- **No Manual Intervention**: Users don't need to request refunds
- **Event Tracking**: Real-time settlement and refund notifications

## Frontend Architecture

### Component Structure

```
components/
├── auctions/           # Auction-specific components
│   ├── AuctionCard.tsx
│   ├── AuctionModal.tsx
│   ├── AuctionGrid.tsx
│   └── AuctionForm.tsx
├── collection/         # NFT collection components
│   ├── NFTGrid.tsx
│   ├── NFTCard.tsx
│   └── CollectionStats.tsx
├── admin/              # Admin interface components
│   ├── AdminPanel.tsx
│   ├── NFTCreator.tsx
│   └── AdminStats.tsx
└── layout/             # Layout components
    ├── Header.tsx
    ├── Footer.tsx
    └── Navigation.tsx
```

### Custom Hooks

#### Core Hooks

```typescript
// Main auction data management
useAuctionsEnhanced() - Fetches and manages auction data
useAuctionRefresh() - Global refresh system
useSmartLazyCollection() - NFT collection management
useContract() - Contract interactions
```

#### Specialized Hooks

```typescript
// Auction-specific hooks
useEnglishAuction() - English auction logic
useDutchAuction() - Dutch auction logic
useSealedBidAuction() - Sealed bid auction logic
useReserveAuction() - Reserve auction logic

// Utility hooks
useSmartRefresh() - Intelligent refresh management
useModalLock() - Modal state management
useTransaction() - Transaction tracking
useNotification() - Notification system
```

## Data Flow Architecture

### Smart Refresh System

The application uses a sophisticated refresh system to keep data synchronized:

1. **Primary Data Source**: `useAuctionsEnhanced()`
2. **Global Refresh**: `useAuctionRefresh()`
3. **Smart Refresh**: `useSmartRefresh()` (intelligent pausing)
4. **Event-driven Updates**: Custom event listeners

### State Management

```typescript
// Global state flow
useAuctionsEnhanced()
├── fetchCorrectedAuctions() [refetch]
├── useSmartRefresh() [every 5 minutes]
└── auctions[] [global state]

useAuctionRefresh()
├── triggerRefresh() [manual + events]
├── Event listeners: bidPlaced, auctionSettled
└── NO automatic refresh [prevents conflicts]

Components
├── useAuctionRefresh() [global data]
├── localAuction [local state]
└── triggerRefresh() [when needed]
```

## API Routes

### IPFS Proxy

- **Route**: `/api/ipfs-proxy`
- **Purpose**: Proxy IPFS requests with fallback gateways
- **Features**: Caching, error handling, multiple gateways

### Contract Calls

- **Route**: `/api/contract-call`
- **Purpose**: Server-side contract interactions
- **Features**: Gas estimation, transaction simulation

### NFT Management

- **Route**: `/api/add-nft`
- **Purpose**: NFT creation and metadata management
- **Features**: IPFS upload, metadata validation

## Error Handling

### Frontend Error Boundaries

- **ErrorBoundary.tsx** - Catches React errors
- **TransactionErrorHandler** - Handles contract errors
- **NetworkErrorHandler** - Handles network issues

### Smart Contract Error Handling

- **ReentrancyGuard** - Prevents reentrancy attacks
- **Access Control** - Role-based permissions
- **Input Validation** - Parameter validation
- **Gas Optimization** - Efficient operations

## Performance Optimization

### Frontend Optimizations

- **Code Splitting** - Dynamic imports
- **Image Optimization** - Next.js Image component
- **Caching** - React Query caching
- **Lazy Loading** - Infinite scroll for NFTs

### Smart Contract Optimizations

- **Gas Efficiency** - Optimized operations
- **Batch Operations** - Multiple operations in one transaction
- **Event Filtering** - Efficient event queries
- **Storage Optimization** - Minimal storage usage

## Security Considerations

### Frontend Security

- **Type Safety** - Full TypeScript coverage
- **Input Sanitization** - XSS protection
- **Secure Storage** - No sensitive data in localStorage
- **Error Boundaries** - Graceful error handling

### Smart Contract Security

- **Access Control** - Role-based permissions
- **Reentrancy Protection** - OpenZeppelin guards
- **Input Validation** - Comprehensive parameter checking
- **Gas Optimization** - Efficient contract operations

## Testing Strategy

### Frontend Testing

- **Unit Tests** - Component testing
- **Integration Tests** - Hook testing
- **E2E Tests** - Full user flow testing
- **Performance Tests** - Load testing

### Smart Contract Testing

- **Unit Tests** - Function testing
- **Integration Tests** - Contract interaction testing
- **Security Tests** - Vulnerability testing
- **Gas Tests** - Gas optimization testing

## Deployment

### Frontend Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel --prod
```

### Smart Contract Deployment

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify contracts
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Monitoring and Analytics

### Frontend Monitoring

- **Performance Metrics** - Core Web Vitals
- **Error Tracking** - Sentry integration
- **User Analytics** - Google Analytics
- **Transaction Monitoring** - Real-time tracking

### Smart Contract Monitoring

- **Event Monitoring** - Real-time event tracking
- **Transaction Monitoring** - Success/failure rates
- **Gas Monitoring** - Gas usage optimization
- **Security Monitoring** - Vulnerability detection

## Future Enhancements

### Planned Features

- **Governance System** - DAO voting
- **Cross-chain Support** - Multi-chain compatibility
- **Mobile App** - React Native implementation
- **Advanced Analytics** - Detailed metrics dashboard

### Technical Improvements

- **Layer 2 Integration** - Polygon, Arbitrum support
- **IPFS Optimization** - Better caching strategies
- **Performance Improvements** - Further optimization
- **Security Enhancements** - Additional security measures

## Contributing

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commits
- Ensure responsive design

### Code Review Process

1. **Automated Checks** - Linting, testing, type checking
2. **Manual Review** - Code quality, security, performance
3. **Testing** - Unit, integration, and E2E tests
4. **Documentation** - Update relevant documentation

## Support

### Documentation

- **Technical Docs** - This documentation
- **API Reference** - Hook and component documentation
- **Smart Contract Docs** - Contract documentation
- **Deployment Guide** - Deployment instructions

### Community

- **GitHub Issues** - Bug reports and feature requests
- **Discord** - Community discussions
- **Twitter** - Updates and announcements
- **Email** - Direct support contact

## Architecture Overview

The Moove Mobility dApp is built using a modern Web3 stack with React/Next.js frontend and Solidity smart contracts.

### Technology Stack

#### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Wagmi** - Ethereum React hooks
- **Ethers.js** - Ethereum library
- **React Query** - Data fetching and caching

#### Smart Contracts

- **Solidity ^0.8.20** - Smart contract language
- **OpenZeppelin** - Security libraries
- **Hardhat** - Development environment
- **Sepolia Testnet** - Ethereum test network

## Smart Contract Architecture

### Contract Hierarchy

```
MooveAccessControl (Base)
├── MooveNFT (ERC-721)
├── MooveAuction (Auction Logic)
└── MooveRentalPass (Rental Management)
```

### Key Features

#### 1. Access Control System

- Role-based permissions
- Master Admin and User roles
- Permission validation for all operations

#### 2. NFT Implementation

- ERC-721 standard compliance
- IPFS metadata integration
- Transfer and ownership tracking

#### 3. Auction System

- Multiple auction types (English, Dutch, Sealed Bid, Reserve)
- Bid management and settlement
- Automatic monitoring and settlement

#### 4. Rental Pass Management

- Time-based access control
- Rental period tracking
- Vehicle type management

#### 5. Refund System

- **Fully Automatic Refunds**: All auction types (English, Dutch, Sealed Bid, Reserve)
- **Smart Contract Settlement**: `settleAuction()` + `refundRemainingBidders()` called automatically
- **No Manual Intervention**: Users don't need to request refunds
- **Event Tracking**: Real-time settlement and refund notifications

## Frontend Architecture

### Component Structure

```
components/
├── auctions/           # Auction-specific components
│   ├── AuctionCard.tsx
│   ├── AuctionModal.tsx
│   ├── AuctionGrid.tsx
│   └── AuctionForm.tsx
├── collection/         # NFT collection components
│   ├── NFTGrid.tsx
│   ├── NFTCard.tsx
│   └── CollectionStats.tsx
├── admin/              # Admin interface components
│   ├── AdminPanel.tsx
│   ├── NFTCreator.tsx
│   └── AdminStats.tsx
└── layout/             # Layout components
    ├── Header.tsx
    ├── Footer.tsx
    └── Navigation.tsx
```

### Custom Hooks

#### Core Hooks

```typescript
// Main auction data management
useAuctionsEnhanced() - Fetches and manages auction data
useAuctionRefresh() - Global refresh system
useSmartLazyCollection() - NFT collection management
useContract() - Contract interactions
```

#### Specialized Hooks

```typescript
// Auction-specific hooks
useEnglishAuction() - English auction logic
useDutchAuction() - Dutch auction logic
useSealedBidAuction() - Sealed bid auction logic
useReserveAuction() - Reserve auction logic

// Utility hooks
useSmartRefresh() - Intelligent refresh management
useModalLock() - Modal state management
useTransaction() - Transaction tracking
useNotification() - Notification system
```

## Data Flow Architecture

### Smart Refresh System

The application uses a sophisticated refresh system to keep data synchronized:

1. **Primary Data Source**: `useAuctionsEnhanced()`
2. **Global Refresh**: `useAuctionRefresh()`
3. **Smart Refresh**: `useSmartRefresh()` (intelligent pausing)
4. **Event-driven Updates**: Custom event listeners

### State Management

```typescript
// Global state flow
useAuctionsEnhanced()
├── fetchCorrectedAuctions() [refetch]
├── useSmartRefresh() [every 5 minutes]
└── auctions[] [global state]

useAuctionRefresh()
├── triggerRefresh() [manual + events]
├── Event listeners: bidPlaced, auctionSettled
└── NO automatic refresh [prevents conflicts]

Components
├── useAuctionRefresh() [global data]
├── localAuction [local state]
└── triggerRefresh() [when needed]
```

## API Routes

### IPFS Proxy

- **Route**: `/api/ipfs-proxy`
- **Purpose**: Proxy IPFS requests with fallback gateways
- **Features**: Caching, error handling, multiple gateways

### Contract Calls

- **Route**: `/api/contract-call`
- **Purpose**: Server-side contract interactions
- **Features**: Gas estimation, transaction simulation

### NFT Management

- **Route**: `/api/add-nft`
- **Purpose**: NFT creation and metadata management
- **Features**: IPFS upload, metadata validation

## Error Handling

### Frontend Error Boundaries

- **ErrorBoundary.tsx** - Catches React errors
- **TransactionErrorHandler** - Handles contract errors
- **NetworkErrorHandler** - Handles network issues

### Smart Contract Error Handling

- **ReentrancyGuard** - Prevents reentrancy attacks
- **Access Control** - Role-based permissions
- **Input Validation** - Parameter validation
- **Gas Optimization** - Efficient operations

## Performance Optimization

### Frontend Optimizations

- **Code Splitting** - Dynamic imports
- **Image Optimization** - Next.js Image component
- **Caching** - React Query caching
- **Lazy Loading** - Infinite scroll for NFTs

### Smart Contract Optimizations

- **Gas Efficiency** - Optimized operations
- **Batch Operations** - Multiple operations in one transaction
- **Event Filtering** - Efficient event queries
- **Storage Optimization** - Minimal storage usage

## Security Considerations

### Frontend Security

- **Type Safety** - Full TypeScript coverage
- **Input Sanitization** - XSS protection
- **Secure Storage** - No sensitive data in localStorage
- **Error Boundaries** - Graceful error handling

### Smart Contract Security

- **Access Control** - Role-based permissions
- **Reentrancy Protection** - OpenZeppelin guards
- **Input Validation** - Comprehensive parameter checking
- **Gas Optimization** - Efficient contract operations

## Testing Strategy

### Frontend Testing

- **Unit Tests** - Component testing
- **Integration Tests** - Hook testing
- **E2E Tests** - Full user flow testing
- **Performance Tests** - Load testing

### Smart Contract Testing

- **Unit Tests** - Function testing
- **Integration Tests** - Contract interaction testing
- **Security Tests** - Vulnerability testing
- **Gas Tests** - Gas optimization testing

## Deployment

### Frontend Deployment

```bash
# Build for production
npm run build

# Start production server
npm start

# Deploy to Vercel
vercel --prod
```

### Smart Contract Deployment

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify contracts
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Monitoring and Analytics

### Frontend Monitoring

- **Performance Metrics** - Core Web Vitals
- **Error Tracking** - Sentry integration
- **User Analytics** - Google Analytics
- **Transaction Monitoring** - Real-time tracking

### Smart Contract Monitoring

- **Event Monitoring** - Real-time event tracking
- **Transaction Monitoring** - Success/failure rates
- **Gas Monitoring** - Gas usage optimization
- **Security Monitoring** - Vulnerability detection

## Future Enhancements

### Planned Features

- **Governance System** - DAO voting
- **Cross-chain Support** - Multi-chain compatibility
- **Mobile App** - React Native implementation
- **Advanced Analytics** - Detailed metrics dashboard

### Technical Improvements

- **Layer 2 Integration** - Polygon, Arbitrum support
- **IPFS Optimization** - Better caching strategies
- **Performance Improvements** - Further optimization
- **Security Enhancements** - Additional security measures

## Contributing

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Update documentation
- Follow conventional commits
- Ensure responsive design

### Code Review Process

1. **Automated Checks** - Linting, testing, type checking
2. **Manual Review** - Code quality, security, performance
3. **Testing** - Unit, integration, and E2E tests
4. **Documentation** - Update relevant documentation

## Support

### Documentation

- **Technical Docs** - This documentation
- **API Reference** - Hook and component documentation
- **Smart Contract Docs** - Contract documentation
- **Deployment Guide** - Deployment instructions

### Community

- **GitHub Issues** - Bug reports and feature requests
- **Discord** - Community discussions
- **Twitter** - Updates and announcements
- **Email** - Direct support contact
