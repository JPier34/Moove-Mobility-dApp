# Server-Side Auction Management Configuration

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Admin Private Key (for server-side transactions)
PRIVATE_KEY=your_admin_private_key_here

# RPC URL (already configured)
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

## How to Get Private Key

1. **From MetaMask:**

   - Open MetaMask
   - Click on account details
   - Click "Export Private Key"
   - Copy the private key (starts with 0x)

2. **Security Note:**
   - ⚠️ **NEVER commit private keys to git**
   - ⚠️ **Keep private keys secure**
   - ⚠️ **Use a dedicated admin account**

## Features

### ✅ Server-Side Auction Management

- **No MetaMask Required:** Transactions signed on server
- **Automatic Monitoring:** Checks expired auctions every 2 minutes
- **Smart Logic:** Handles different auction types correctly
- **Safe Processing:** Only processes truly expired auctions

### ✅ Admin Panel Integration

- **Real-time Status:** See auction status without MetaMask
- **Manual Control:** Process specific auctions manually
- **Monitoring Controls:** Start/stop automatic monitoring
- **Detailed Logs:** Full transaction details

### ✅ Auction Type Support

- **English Auctions:** Calls endAuction → settleAuction
- **Dutch Auctions:** Calls endAuction → settleAuction
- **Sealed Bid Auctions:** Skips endAuction, goes to settleAuction
- **Reserve Auctions:** Calls endAuction → settleAuction

## Usage

1. **Set up environment variables**
2. **Go to `/admin` page**
3. **Use "Server-Side Auction Manager" component**
4. **Start automatic monitoring**
5. **Monitor expired auctions**

## Security

- Private key is only used server-side
- No private key exposure to frontend
- All transactions logged with details
- Safe error handling and validation








