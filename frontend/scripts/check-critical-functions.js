#!/usr/bin/env node

/**
 * Script per verificare le funzioni critiche tra ABI JSON e contracts.ts
 */

const fs = require("fs");
const path = require("path");

// Funzioni critiche da verificare per ogni contratto
const CRITICAL_FUNCTIONS = {
  MooveAccessControl: [
    "hasRole",
    "grantRole",
    "revokeRole",
    "DEFAULT_ADMIN_ROLE",
    "MASTER_ADMIN_ROLE",
    "MINTER_ROLE",
    "AUCTION_MANAGER_ROLE",
  ],
  MooveNFT: [
    "mintNFT",
    "transferFrom",
    "approve",
    "getApproved",
    "isApprovedForAll",
    "setApprovalForAll",
    "ownerOf",
    "tokenURI",
  ],
  MooveAuction: [
    "createAuction",
    "placeBid",
    "endAuction",
    "settleAuction",
    "getAuction",
    "totalAuctions",
    "submitSealedBid",
    "revealSealedBid",
  ],
  MooveRentalPass: ["mint", "transferFrom", "approve"],
};

// Carica ABI dai file JSON
function loadABIFromJSON(contractName) {
  const abiPath = path.join(
    __dirname,
    "..",
    "src",
    "abis",
    `${contractName}.json`
  );
  if (fs.existsSync(abiPath)) {
    try {
      const content = fs.readFileSync(abiPath, "utf8");

      // Se il file inizia con [, è direttamente l'ABI
      if (content.trim().startsWith("[")) {
        return JSON.parse(content);
      }

      // Altrimenti è un artifact Hardhat
      const artifact = JSON.parse(content);
      return artifact.abi;
    } catch (error) {
      console.warn(
        `⚠️ Errore nel parsing ABI JSON per ${contractName}:`,
        error.message
      );
      return null;
    }
  }
  return null;
}

// Estrai funzioni da contracts.ts usando regex più robuste
function extractFunctionsFromContractsTS(contractName) {
  const contractsPath = path.join(__dirname, "..", "utils", "contracts.ts");
  const content = fs.readFileSync(contractsPath, "utf8");

  // Cerca la sezione ABI per il contratto specifico
  const abiSectionRegex = new RegExp(
    `export const ${contractName}ABI = \\[([\\s\\S]*?)\\] as const;`
  );
  const match = content.match(abiSectionRegex);

  if (!match) {
    return null;
  }

  const abiSection = match[1];
  const functions = [];

  // Estrai tutte le funzioni usando regex per "name"
  const functionRegex = /{\s*[^}]*"name":\s*"([^"]+)"[^}]*}/g;
  let functionMatch;

  while ((functionMatch = functionRegex.exec(abiSection)) !== null) {
    functions.push(functionMatch[1]);
  }

  return functions;
}

// Verifica se una funzione esiste nell'ABI
function functionExistsInABI(abi, functionName) {
  if (!abi) return false;

  return abi.some(
    (item) => item.type === "function" && item.name === functionName
  );
}

// Funzione principale
async function main() {
  console.log("🔍 Verifica funzioni critiche - Moove dApp\n");

  const contracts = Object.keys(CRITICAL_FUNCTIONS);
  let totalIssues = 0;

  for (const contractName of contracts) {
    console.log(`\n📋 Analizzando ${contractName}...`);

    // Carica ABI da diverse fonti
    const abiFromJSON = loadABIFromJSON(contractName);
    const functionsFromContractsTS =
      extractFunctionsFromContractsTS(contractName);

    console.log(
      `📄 ABI da JSON: ${
        abiFromJSON ? `${abiFromJSON.length} funzioni` : "Non trovato"
      }`
    );
    console.log(
      `📄 Funzioni da contracts.ts: ${
        functionsFromContractsTS
          ? `${functionsFromContractsTS.length} funzioni`
          : "Non trovato"
      }`
    );

    if (!abiFromJSON || !functionsFromContractsTS) {
      console.log(`❌ Non è possibile verificare - dati mancanti`);
      totalIssues++;
      continue;
    }

    const criticalFunctions = CRITICAL_FUNCTIONS[contractName];
    console.log(
      `\n🎯 Verifica funzioni critiche (${criticalFunctions.length}):`
    );

    let contractIssues = 0;

    for (const functionName of criticalFunctions) {
      const existsInJSON = functionExistsInABI(abiFromJSON, functionName);
      const existsInTS = functionsFromContractsTS.includes(functionName);

      if (existsInJSON && existsInTS) {
        console.log(`   ✅ ${functionName}: Presente in entrambi`);
      } else if (existsInJSON && !existsInTS) {
        console.log(
          `   ❌ ${functionName}: Presente in JSON, MANCANTE in contracts.ts`
        );
        contractIssues++;
      } else if (!existsInJSON && existsInTS) {
        console.log(
          `   ⚠️ ${functionName}: MANCANTE in JSON, presente in contracts.ts`
        );
        contractIssues++;
      } else {
        console.log(`   ❌ ${functionName}: MANCANTE in entrambi`);
        contractIssues++;
      }
    }

    if (contractIssues === 0) {
      console.log(
        `\n✅ ${contractName}: Tutte le funzioni critiche sono concordanti`
      );
    } else {
      console.log(`\n❌ ${contractName}: ${contractIssues} problemi trovati`);
      totalIssues++;
    }
  }

  // Riepilogo finale
  console.log(`\n📈 RIEPILOGO FINALE:`);
  console.log(`==================`);

  if (totalIssues === 0) {
    console.log(`🎉 Tutte le funzioni critiche sono concordanti!`);
  } else {
    console.log(
      `❌ ${totalIssues}/${contracts.length} contratti hanno problemi`
    );
    console.log(`\n💡 Raccomandazioni:`);
    console.log(
      `   - Aggiorna l'ABI in contracts.ts per includere le funzioni mancanti`
    );
    console.log(
      `   - Verifica che i contratti siano deployati con le funzioni corrette`
    );
  }
}

// Esegui lo script
if (require.main === module) {
  main().catch(console.error);
}

