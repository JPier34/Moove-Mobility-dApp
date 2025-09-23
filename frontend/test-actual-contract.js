// Test per verificare quale versione del contratto MooveAuction è deployata
// Indirizzo: 0x329203985A29E3c78aD140B0D3e383D2fE58d832

async function testActualContract() {
  try {
    console.log("🔍 Testing actual deployed contract...");

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    const contractAddress = "0x329203985A29E3c78aD140B0D3e383D2fE58d832";

    // Test 1: Verifica accessibilità
    const contract = new ethers.Contract(
      contractAddress,
      ["function totalAuctions() view returns (uint256)"],
      signer
    );

    const totalAuctions = await contract.totalAuctions();
    console.log(
      `✅ Contract accessible, total auctions: ${totalAuctions.toString()}`
    );

    // Test 2: Calcola i method selector per entrambe le versioni
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

    console.log("\n📊 Method Selectors:");
    console.log(`8 params:  ${selector8}`);
    console.log(`10 params: ${selector10}`);
    console.log(`Error:     0x007902ee`);

    // Test 3: Verifica quale corrisponde
    if (selector8 === "0x007902ee") {
      console.log("\n✅ CONTRATTO USA 8 PARAMETRI!");
      console.log("La funzione corretta è:");
      console.log(sig8);
    } else if (selector10 === "0x007902ee") {
      console.log("\n✅ CONTRATTO USA 10 PARAMETRI!");
      console.log("La funzione corretta è:");
      console.log(sig10);
    } else {
      console.log("\n❌ Nessuna corrispondenza trovata!");
      console.log("Il contratto potrebbe avere una signature diversa.");
    }

    // Test 4: Prova a chiamare con 8 parametri
    console.log("\n🧪 Testing actual call with 8 parameters...");
    try {
      const contract8 = new ethers.Contract(
        contractAddress,
        [
          "function createAuction(address,uint256,uint8,uint256,uint256,uint256,uint256,uint256) external returns (uint256)",
        ],
        signer
      );

      // Test di chiamata (senza inviare transazione)
      const testData = contract8.interface.encodeFunctionData("createAuction", [
        "0x40E455515bf712144C1A5D859F19d64b537754f7", // nftContract
        79, // tokenId
        2, // auctionType
        ethers.parseEther("0.001"), // startingPrice
        0, // reservePrice
        0, // buyNowPrice
        300, // duration
        0, // bidIncrement
      ]);

      console.log("✅ 8-parameter call data generated successfully");
      console.log("Method selector:", testData.substring(0, 10));
    } catch (error8) {
      console.log("❌ 8-parameter call failed:", error8.message);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Esegui il test
testActualContract();
