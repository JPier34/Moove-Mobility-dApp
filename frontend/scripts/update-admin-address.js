const fs = require('fs');
const path = require('path');

/**
 * Script per aggiornare tutti gli indirizzi admin hardcodati
 * Usage: node scripts/update-admin-address.js [new-address]
 */

const OLD_ADMIN_ADDRESS = "0x777382955f33Bb8540602E914D9b650C962EF6Cc";
const NEW_ADMIN_ADDRESS = process.argv[2] || OLD_ADMIN_ADDRESS;

// File da aggiornare
const FILES_TO_UPDATE = [
  'components/debug/AdminAccessDebugger.tsx',
  'components/debug/RoleDebugger.tsx',
  'components/admin/AdminNFTCreatorUltraSimple.tsx',
  'components/admin/AdminNFTCreator.tsx',
  'app/success/[transactionId]/page.tsx',
];

console.log(`🔄 Updating admin address from ${OLD_ADMIN_ADDRESS} to ${NEW_ADMIN_ADDRESS}`);

// Aggiorna il file di configurazione principale
const configPath = 'config/admin.ts';
if (fs.existsSync(configPath)) {
  let configContent = fs.readFileSync(configPath, 'utf8');
  configContent = configContent.replace(
    `MASTER_ADMIN_ADDRESS: "${OLD_ADMIN_ADDRESS}"`,
    `MASTER_ADMIN_ADDRESS: "${NEW_ADMIN_ADDRESS}"`
  );
  fs.writeFileSync(configPath, configContent);
  console.log(`✅ Updated ${configPath}`);
}

// Aggiorna i file rimanenti
FILES_TO_UPDATE.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Sostituisci l'indirizzo hardcodato
    content = content.replace(
      new RegExp(OLD_ADMIN_ADDRESS.replace('0x', '0x'), 'g'),
      NEW_ADMIN_ADDRESS
    );
    
    // Sostituisci anche la versione lowercase
    content = content.replace(
      new RegExp(OLD_ADMIN_ADDRESS.toLowerCase().replace('0x', '0x'), 'g'),
      NEW_ADMIN_ADDRESS.toLowerCase()
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filePath}`);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n🎉 Admin address update completed!');
console.log('\n📝 Next steps:');
console.log('1. Update the admin address in the smart contract (if needed)');
console.log('2. Update environment variables (if using .env files)');
console.log('3. Test admin access with the new address');
console.log('4. Update documentation if needed');

if (NEW_ADMIN_ADDRESS === OLD_ADMIN_ADDRESS) {
  console.log('\n💡 To change the admin address, run:');
  console.log(`   node scripts/update-admin-address.js 0x[new-address]`);
}
const path = require('path');

/**
 * Script per aggiornare tutti gli indirizzi admin hardcodati
 * Usage: node scripts/update-admin-address.js [new-address]
 */

const OLD_ADMIN_ADDRESS = "0x777382955f33Bb8540602E914D9b650C962EF6Cc";
const NEW_ADMIN_ADDRESS = process.argv[2] || OLD_ADMIN_ADDRESS;

// File da aggiornare
const FILES_TO_UPDATE = [
  'components/debug/AdminAccessDebugger.tsx',
  'components/debug/RoleDebugger.tsx',
  'components/admin/AdminNFTCreatorUltraSimple.tsx',
  'components/admin/AdminNFTCreator.tsx',
  'app/success/[transactionId]/page.tsx',
];

console.log(`🔄 Updating admin address from ${OLD_ADMIN_ADDRESS} to ${NEW_ADMIN_ADDRESS}`);

// Aggiorna il file di configurazione principale
const configPath = 'config/admin.ts';
if (fs.existsSync(configPath)) {
  let configContent = fs.readFileSync(configPath, 'utf8');
  configContent = configContent.replace(
    `MASTER_ADMIN_ADDRESS: "${OLD_ADMIN_ADDRESS}"`,
    `MASTER_ADMIN_ADDRESS: "${NEW_ADMIN_ADDRESS}"`
  );
  fs.writeFileSync(configPath, configContent);
  console.log(`✅ Updated ${configPath}`);
}

// Aggiorna i file rimanenti
FILES_TO_UPDATE.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Sostituisci l'indirizzo hardcodato
    content = content.replace(
      new RegExp(OLD_ADMIN_ADDRESS.replace('0x', '0x'), 'g'),
      NEW_ADMIN_ADDRESS
    );
    
    // Sostituisci anche la versione lowercase
    content = content.replace(
      new RegExp(OLD_ADMIN_ADDRESS.toLowerCase().replace('0x', '0x'), 'g'),
      NEW_ADMIN_ADDRESS.toLowerCase()
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Updated ${filePath}`);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n🎉 Admin address update completed!');
console.log('\n📝 Next steps:');
console.log('1. Update the admin address in the smart contract (if needed)');
console.log('2. Update environment variables (if using .env files)');
console.log('3. Test admin access with the new address');
console.log('4. Update documentation if needed');

if (NEW_ADMIN_ADDRESS === OLD_ADMIN_ADDRESS) {
  console.log('\n💡 To change the admin address, run:');
  console.log(`   node scripts/update-admin-address.js 0x[new-address]`);
}




