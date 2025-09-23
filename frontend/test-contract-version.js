// Test per verificare quale versione del contratto è deployata
// Eseguire questo nella console del browser

async function testContractVersion() {
  try {
    console.log("🔍 Testing contract version...");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contractAddress = "0x329203985A29E3c78aD140B0D3e383D2fE58d832";

    // Test 1: Verifica se il contratto è accessibile
    const contract = new ethers.Contract(
      contractAddress,
      ["function totalAuctions() view returns (uint256)"],
      signer
    );

    const totalAuctions = await contract.totalAuctions();
    console.log(
      `✅ Contract accessible, total auctions: ${totalAuctions.toString()}`
    );

    // Test 2: Prova con 8 parametri (versione vecchia)
    console.log("🔍 Testing 8 parameters (old version)...");
    try {
      const contract8 = new ethers.Contract(
        contractAddress,
        [
          "function createAuction(address,uint256,uint8,uint256,uint256,uint256,uint256,uint256) external returns (uint256)",
        ],
        signer
      );

      // Solo test di esistenza, non chiamata effettiva
      const func8 = contract8.interface.getFunction("createAuction");
      console.log("✅ 8-parameter version exists:", func8.format());
    } catch (error8) {
      console.log("❌ 8-parameter version not found:", error8.message);
    }

    // Test 3: Prova con 10 parametri (versione nuova)
    console.log("🔍 Testing 10 parameters (new version)...");
    try {
      const contract10 = new ethers.Contract(
        contractAddress,
        [
          "function createAuction(address,uint256,uint8,uint256,uint256,uint256,uint256,uint256,uint256,uint256) external returns (uint256)",
        ],
        signer
      );

      // Solo test di esistenza, non chiamata effettiva
      const func10 = contract10.interface.getFunction("createAuction");
      console.log("✅ 10-parameter version exists:", func10.format());
    } catch (error10) {
      console.log("❌ 10-parameter version not found:", error10.message);
    }

    // Test 4: Calcola i method selector per confronto
    console.log("🔍 Method selectors:");
    const sig8 =
      "createAuction(address,uint256,uint8,uint256,uint256,uint256,uint256,uint256)";
    const sig10 =
      "createAuction(address,uint256,uint8,uint256,uint256,uint256,uint256,uint256,uint256,uint256)";

    const selector8 = ethers
      .keccak256(ethers.toUtf8Bytes(sig8))
      .substring(0, 10);
    const selector10 = ethers
      .keccak256(ethers.toUtf8Bytes(sig10))
      .substring(0, 10);

    console.log(`8 params:  ${sig8}`);
    console.log(`8 params selector:  ${selector8}`);
    console.log(`10 params: ${sig10}`);
    console.log(`10 params selector: ${selector10}`);

    // Test 5: Verifica quale selector corrisponde al nostro errore
    const errorSelector = "0x007902ee";
    console.log(`\nError selector: ${errorSelector}`);

    if (selector8 === errorSelector) {
      console.log("✅ Error selector matches 8-parameter version!");
    } else if (selector10 === errorSelector) {
      console.log("✅ Error selector matches 10-parameter version!");
    } else {
      console.log("❌ Error selector doesn't match either version!");
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Esegui il test
testContractVersion();
