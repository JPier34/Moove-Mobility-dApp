#!/usr/bin/env node

/**
 * Script per verificare la concordanza tra ABI presentato e ABI atteso
 * Versione offline - senza connessione blockchain
 */

const fs = require("fs");
const path = require("path");

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

// Carica ABI dal file contracts.ts
function loadABIFromContractsTS(contractName) {
  const contractsPath = path.join(__dirname, "..", "utils", "contracts.ts");
  const content = fs.readFileSync(contractsPath, "utf8");

  // Estrai ABI usando regex (approccio semplificato)
  const abiRegex = new RegExp(
    `export const ${contractName}ABI = \\[([\\s\\S]*?)\\] as const;`
  );
  const match = content.match(abiRegex);

  if (match) {
    try {
      // Converti il formato TypeScript in JSON valido
      let abiString = match[1];
      // Rimuovi commenti e converte in JSON valido
      abiString = abiString.replace(/\/\*[\s\S]*?\*\//g, ""); // Rimuovi commenti /* */
      abiString = abiString.replace(/\/\/.*$/gm, ""); // Rimuovi commenti //
      abiString = abiString.replace(/\s+/g, " "); // Normalizza spazi

      // Aggiungi parentesi quadre per renderlo un array JSON valido
      const jsonString = `[${abiString}]`;

      // Prova a parsare come JSON
      return JSON.parse(jsonString);
    } catch (error) {
      console.warn(
        `⚠️ Errore nel parsing ABI da contracts.ts per ${contractName}:`,
        error.message
      );
      return null;
    }
  }

  return null;
}

// Confronta due ABI
function compareABIs(abi1, abi2, name1, name2) {
  const results = {
    contract: name1,
    totalFunctions: 0,
    matchingFunctions: 0,
    missingFunctions: [],
    extraFunctions: [],
    signatureMismatches: [],
    details: [],
  };

  if (!abi1 || !abi2) {
    results.error = `ABI mancante: ${name1} o ${name2}`;
    return results;
  }

  // Crea mappe delle funzioni per confronto
  const functions1 = new Map();
  const functions2 = new Map();

  abi1.forEach((item) => {
    if (item.type === "function") {
      const signature = `${item.name}(${item.inputs
        .map((i) => i.type)
        .join(",")})`;
      functions1.set(item.name, { signature, item });
    }
  });

  abi2.forEach((item) => {
    if (item.type === "function") {
      const signature = `${item.name}(${item.inputs
        .map((i) => i.type)
        .join(",")})`;
      functions2.set(item.name, { signature, item });
    }
  });

  results.totalFunctions = Math.max(functions1.size, functions2.size);

  // Trova funzioni mancanti e extra
  for (const [name, func1] of functions1) {
    if (functions2.has(name)) {
      const func2 = functions2.get(name);
      if (func1.signature === func2.signature) {
        results.matchingFunctions++;
        results.details.push({
          function: name,
          status: "✅ MATCH",
          signature: func1.signature,
        });
      } else {
        results.signatureMismatches.push({
          function: name,
          signature1: func1.signature,
          signature2: func2.signature,
        });
        results.details.push({
          function: name,
          status: "⚠️ SIGNATURE MISMATCH",
          signature1: func1.signature,
          signature2: func2.signature,
        });
      }
    } else {
      results.missingFunctions.push(name);
      results.details.push({
        function: name,
        status: "❌ MISSING",
        signature: func1.signature,
      });
    }
  }

  // Trova funzioni extra
  for (const [name, func2] of functions2) {
    if (!functions1.has(name)) {
      results.extraFunctions.push(name);
      results.details.push({
        function: name,
        status: "➕ EXTRA",
        signature: func2.signature,
      });
    }
  }

  return results;
}

// Funzione principale
async function main() {
  console.log("🔍 Verifica concordanza ABI - Moove dApp (Offline)\n");

  const contracts = [
    "MooveAccessControl",
    "MooveNFT",
    "MooveAuction",
    "MooveRentalPass",
  ];

  const allResults = [];

  for (const contractName of contracts) {
    console.log(`\n📋 Analizzando ${contractName}...`);

    // Carica ABI da diverse fonti
    const abiFromJSON = loadABIFromJSON(contractName);
    const abiFromContractsTS = loadABIFromContractsTS(contractName);

    console.log(
      `📄 ABI da JSON: ${
        abiFromJSON ? `${abiFromJSON.length} funzioni` : "Non trovato"
      }`
    );
    console.log(
      `📄 ABI da contracts.ts: ${
        abiFromContractsTS
          ? `${abiFromContractsTS.length} funzioni`
          : "Non trovato"
      }`
    );

    // Confronta ABI se disponibili
    if (abiFromJSON && abiFromContractsTS) {
      const comparison = compareABIs(
        abiFromJSON,
        abiFromContractsTS,
        "JSON",
        "contracts.ts"
      );
      allResults.push(comparison);

      console.log(`\n📊 Risultati confronto:`);
      console.log(
        `   ✅ Funzioni corrispondenti: ${comparison.matchingFunctions}`
      );
      console.log(
        `   ❌ Funzioni mancanti: ${comparison.missingFunctions.length}`
      );
      console.log(`   ➕ Funzioni extra: ${comparison.extraFunctions.length}`);
      console.log(
        `   ⚠️ Signature mismatch: ${comparison.signatureMismatches.length}`
      );

      if (comparison.missingFunctions.length > 0) {
        console.log(`\n❌ Funzioni mancanti in contracts.ts:`);
        comparison.missingFunctions.forEach((func) =>
          console.log(`   - ${func}`)
        );
      }

      if (comparison.extraFunctions.length > 0) {
        console.log(`\n➕ Funzioni extra in contracts.ts:`);
        comparison.extraFunctions.forEach((func) =>
          console.log(`   - ${func}`)
        );
      }

      if (comparison.signatureMismatches.length > 0) {
        console.log(`\n⚠️ Signature mismatch:`);
        comparison.signatureMismatches.forEach((mismatch) => {
          console.log(`   - ${mismatch.function}:`);
          console.log(`     JSON: ${mismatch.signature1}`);
          console.log(`     TS:  ${mismatch.signature2}`);
        });
      }

      // Mostra dettagli delle prime 10 funzioni per debug
      console.log(`\n🔍 Prime 10 funzioni:`);
      comparison.details.slice(0, 10).forEach((detail) => {
        console.log(`   ${detail.status} ${detail.function}`);
      });
    } else {
      console.log(`❌ Non è possibile confrontare - ABI mancanti`);
    }
  }

  // Riepilogo finale
  console.log(`\n📈 RIEPILOGO FINALE:`);
  console.log(`==================`);

  let totalContracts = 0;
  let contractsWithIssues = 0;

  allResults.forEach((result) => {
    totalContracts++;
    const hasIssues =
      result.missingFunctions.length > 0 ||
      result.extraFunctions.length > 0 ||
      result.signatureMismatches.length > 0;

    if (hasIssues) {
      contractsWithIssues++;
      console.log(
        `❌ ${result.contract}: ${result.missingFunctions.length} mancanti, ${result.extraFunctions.length} extra, ${result.signatureMismatches.length} mismatch`
      );
    } else {
      console.log(`✅ ${result.contract}: Tutto OK`);
    }
  });

  console.log(
    `\n🎯 Risultato: ${contractsWithIssues}/${totalContracts} contratti hanno problemi di concordanza ABI`
  );

  if (contractsWithIssues > 0) {
    console.log(`\n💡 Raccomandazioni:`);
    console.log(
      `   - Aggiorna l'ABI in contracts.ts per corrispondere ai file JSON`
    );
    console.log(`   - Verifica che i contratti siano deployati correttamente`);
    console.log(
      `   - Controlla che gli indirizzi dei contratti siano corretti`
    );
  } else {
    console.log(`\n🎉 Tutti gli ABI sono concordanti!`);
  }
}

// Esegui lo script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { compareABIs, loadABIFromJSON, loadABIFromContractsTS };

