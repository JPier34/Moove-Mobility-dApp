/**
 * Centralized contract addresses configuration
 * All addresses should come from environment variables
 * NO HARDCODED ADDRESSES ALLOWED
 */

require("dotenv").config();

function getAddress(envVar, network = null) {
  const networkSuffix = network ? `_${network.toUpperCase()}` : "";
  const envKey = `${envVar}${networkSuffix}`;
  
  const value = process.env[envKey] || process.env[envVar];
  
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${envKey} or ${envVar}. ` +
      `Please set it in your .env file.`
    );
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    throw new Error(
      `Invalid address format for ${envKey}: ${value}. ` +
      `Address must be a valid Ethereum address (42 characters, 0x prefix).`
    );
  }
  
  return value;
}

/**
 * Get contract addresses for a specific network
 * @param {string} network - Network name (e.g., 'sepolia', 'mainnet')
 * @returns {Object} Contract addresses object
 */
function getContractAddresses(network = null) {
  return {
    ACCESS_CONTROL: getAddress("ACCESS_CONTROL_ADDRESS", network),
    MOOVE_NFT: getAddress("MOOVE_NFT_ADDRESS", network),
    MOOVE_AUCTION: getAddress("MOOVE_AUCTION_ADDRESS", network),
    MOOVE_RENTAL_PASS: getAddress("MOOVE_RENTAL_PASS_ADDRESS", network),
  };
}

/**
 * Get deployer/admin address
 */
function getDeployerAddress() {
  return getAddress("DEPLOYER_ADDRESS");
}

/**
 * Get master admin address
 */
function getMasterAdminAddress() {
  return getAddress("MASTER_ADMIN_ADDRESS");
}

module.exports = {
  getContractAddresses,
  getDeployerAddress,
  getMasterAdminAddress,
  getAddress,
};

