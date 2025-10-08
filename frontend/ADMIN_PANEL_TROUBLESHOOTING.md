# Admin Panel Access Troubleshooting Guide

## 🚨 Problem: Cannot Access Admin Panel

If you're unable to access the admin panel at `http://localhost:3000/admin` even with the correct admin account, follow this troubleshooting guide.

## 🔍 Diagnostic Steps

### 1. **Check Wallet Connection**

- Ensure your wallet is connected to the Sepolia testnet
- Verify you're using the correct wallet address
- Check that the wallet is properly connected in the browser

### 2. **Verify Admin Address Configuration**

The admin panel checks three conditions for access:

- **Is Master Wallet**: Direct address match
- **Has Master Admin Role**: Smart contract role check
- **Can Mint**: Smart contract permission check

### 3. **Use the Admin Debug Panel**

The admin panel now includes a debug panel that shows:

- Your wallet address
- Master wallet address
- Contract address
- Role check results
- Permission status

## 🛠️ Common Issues and Solutions

### Issue 1: Wallet Not Connected

**Symptoms**: "Wallet Not Connected" message
**Solution**:

1. Connect your wallet using the connect button
2. Ensure you're on the Sepolia testnet
3. Refresh the page

### Issue 2: Access Denied

**Symptoms**: "Access Denied" message
**Possible Causes**:

1. **Wrong wallet address**: You're not using the admin wallet
2. **Contract not deployed**: Access Control Contract not properly deployed
3. **Role not granted**: Admin role not granted to your address
4. **RPC issues**: Provider errors preventing contract calls

### Issue 3: RPC Provider Errors

**Symptoms**: Loading state never resolves, errors in console
**Solution**:

1. Check the RPC provider configuration in `.env.local`
2. Use a reliable provider like `https://1rpc.io/sepolia`
3. Check the RPC Provider Guide for alternatives

## 🔧 Configuration Check

### Environment Variables

Ensure your `.env.local` file contains:

```bash
# Smart Contract Addresses
NEXT_PUBLIC_MOOVE_ACCESS_CONTROL_ADDRESS=0x005672EcC14b09A958742B960Ebb76eBE52Be44A
NEXT_PUBLIC_MOOVE_NFT_ADDRESS=0x40E455515bf712144C1A5D859F19d64b537754f7
NEXT_PUBLIC_MOOVE_AUCTION_ADDRESS=0xE8f6836A0054B83b9a952e8B62D92e62f5c67606
NEXT_PUBLIC_MOOVE_RENTAL_PASS_ADDRESS=0x74aAb47A0439B728A5956A1d7faAc6716F1F18Df

# Network Configuration
NEXT_PUBLIC_RPC_URL=https://1rpc.io/sepolia
NEXT_PUBLIC_CHAIN_ID=11155111

# Master Admin Address (if different from default)
NEXT_PUBLIC_MASTER_WALLET_ADDRESS=0x777382955f33Bb8540602E914D9b650C962EF6Cc
```

### Admin Address Configuration

The master admin address is configured in `config/admin.ts`:

```typescript
export const ADMIN_CONFIG = {
  MASTER_ADMIN_ADDRESS: "0x777382955f33Bb8540602E914D9b650C962EF6Cc",
  // ...
};
```

## 🔍 Debug Information

### Admin Debug Panel

The admin panel now includes a debug panel that shows:

- **Wallet Address**: Your connected wallet
- **Master Wallet**: The configured admin address
- **Contract Address**: Access Control Contract address
- **Is Master Wallet**: Direct address comparison
- **Has Master Admin Role**: Smart contract role check
- **Can Mint**: Smart contract permission check

### Console Logs

Check browser console for:

- RPC provider errors
- Contract call failures
- Role check results
- Permission verification

## 🚀 Quick Fixes

### Fix 1: Update Admin Address

If you're using a different admin wallet:

1. Update `NEXT_PUBLIC_MASTER_WALLET_ADDRESS` in `.env.local`
2. Or update `MASTER_ADMIN_ADDRESS` in `config/admin.ts`
3. Restart the development server

### Fix 2: Grant Admin Role

If the role isn't granted on the smart contract:

1. Use the contract's `grantMasterAdmin` function
2. Or use `grantRole` with the `MASTER_ADMIN_ROLE` hash
3. Verify the transaction on Etherscan

### Fix 3: Check Contract Deployment

Verify the Access Control Contract is deployed:

1. Check the contract address on Etherscan
2. Verify the ABI matches the deployed contract
3. Ensure the contract is properly initialized

## 📋 Access Logic

The admin panel grants access if ANY of these conditions are met:

1. **Is Master Wallet**: `address.toLowerCase() === MASTER_WALLET.toLowerCase()`
2. **Has Master Admin Role**: `hasRole(MASTER_ADMIN_ROLE, address) === true`
3. **Can Mint**: `canMint(address) === true`

## 🔄 Testing Steps

1. **Connect Wallet**: Ensure wallet is connected to Sepolia
2. **Check Debug Panel**: Review all status indicators
3. **Verify Addresses**: Confirm wallet and master addresses match
4. **Check Roles**: Verify role and permission checks pass
5. **Test Access**: Try accessing the admin panel

## 📞 Support

If you continue to have issues:

1. Check the browser console for errors
2. Verify all environment variables are set
3. Ensure the smart contract is properly deployed
4. Check that your wallet has the necessary permissions

## 🎯 Expected Behavior

When everything is working correctly:

- Wallet connects successfully
- Debug panel shows all green checkmarks
- Admin panel loads with full functionality
- All admin tools are accessible

The debug panel will clearly show which condition grants you access and help identify any issues with the configuration.
