#!/usr/bin/env node

/**
 * Script per sincronizzare gli ABI dai file JSON al file contracts.ts
 */

const fs = require("fs");
const path = require("path");

// Contratti da sincronizzare
const CONTRACTS = [
  "MooveAccessControl",
  "MooveNFT",
  "MooveAuction",
  "MooveRentalPass",
];

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

// Converte ABI in formato TypeScript
function abiToTypeScript(abi, contractName) {
  const lines = [`export const ${contractName}ABI = [`];

  abi.forEach((item, index) => {
    const itemStr = JSON.stringify(item, null, 2);
    const indentedItem = itemStr
      .split("\n")
      .map((line) => `  ${line}`)
      .join("\n");
    lines.push(indentedItem);

    if (index < abi.length - 1) {
      lines[lines.length - 1] += ",";
    }
  });

  lines.push("] as const;");
  return lines.join("\n");
}

// Funzione principale
async function main() {
  console.log("🔄 Sincronizzazione ABI da JSON a contracts.ts\n");

  const contractsPath = path.join(__dirname, "..", "utils", "contracts.ts");
  let contractsContent = fs.readFileSync(contractsPath, "utf8");

  let updatedContracts = 0;

  for (const contractName of CONTRACTS) {
    console.log(`📋 Sincronizzando ${contractName}...`);

    const abi = loadABIFromJSON(contractName);

    if (!abi) {
      console.log(`❌ ABI non trovato per ${contractName}`);
      continue;
    }

    console.log(`📄 Trovate ${abi.length} funzioni/eventi`);

    // Genera ABI in formato TypeScript
    const abiTypeScript = abiToTypeScript(abi, contractName);

    // Rimuovi ABI esistente se presente
    const abiRegex = new RegExp(
      `export const ${contractName}ABI = \\[[\\s\\S]*?\\] as const;`
    );
    if (contractsContent.match(abiRegex)) {
      contractsContent = contractsContent.replace(abiRegex, abiTypeScript);
      console.log(`✅ ABI aggiornato per ${contractName}`);
    } else {
      // Aggiungi ABI alla fine del file
      contractsContent += `\n\n${abiTypeScript}`;
      console.log(`➕ ABI aggiunto per ${contractName}`);
    }

    updatedContracts++;
  }

  // Salva il file aggiornato
  fs.writeFileSync(contractsPath, contractsContent);

  console.log(`\n📈 RIEPILOGO:`);
  console.log(`=============`);
  console.log(
    `✅ ${updatedContracts}/${CONTRACTS.length} contratti sincronizzati`
  );
  console.log(`📁 File aggiornato: ${contractsPath}`);

  if (updatedContracts === CONTRACTS.length) {
    console.log(`\n🎉 Tutti gli ABI sono stati sincronizzati con successo!`);
  } else {
    console.log(`\n⚠️ Alcuni contratti non sono stati sincronizzati`);
  }
}

// Esegui lo script
if (require.main === module) {
  main().catch(console.error);
}



