# Analisi Metodo Selector e Test Contratto

## 🔍 **Problema Identificato**

Il metodo selector dalla transazione fallita è: `0x007902ee`

Questo dovrebbe corrispondere alla signature:
`createAuction(address,uint256,uint8,uint256,uint256,uint256,uint256,uint256,uint256,uint256)`

Ma il contratto restituisce "Function not found".

## 🧪 **Test da Eseguire**

1. **Eseguire questo script nella console del browser:**

```javascript
// Test diretto del contratto
async function testDirectContract() {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // Test con ABI minimale
  const contractAddress = "0x329203985A29E3c78aD140B0D3e383D2fE58d832";

  // Test 1: Contratto senza ABI specifica per createAuction
  const contract = new ethers.Contract(
    contractAddress,
    ["function totalAuctions() view returns (uint256)"],
    signer
  );

  console.log("Total auctions:", await contract.totalAuctions());

  // Test 2: Chiamata raw per verificare se la funzione esiste
  try {
    const data =
      "0x007902ee" + // metodo selector
      "00000000000000000000000040e455515bf712144c1a5d859f19d64b537754f7" + // nftContract
      "000000000000000000000000000000000000000000000000000000000000004f" + // tokenId (79)
      "0000000000000000000000000000000000000000000000000000000000000002" + // auctionType (2)
      "000000000000000000000000000000000000000000000000000000e8d4a51000" + // startingPrice
      "0000000000000000000000000000000000000000000000000000000000000000" + // reservePrice
      "0000000000000000000000000000000000000000000000000000000000000000" + // buyNowPrice
      "0000000000000000000000000000000000000000000000000000000000000078" + // duration (120)
      "0000000000000000000000000000000000000000000000000000000000000000" + // bidIncrement
      "000000000000000000000000000000000000000000000000000000000000012c" + // extensionThreshold (300)
      "0000000000000000000000000000000000000000000000000000000000000258"; // extensionDuration (600)

    const result = await provider.call({
      to: contractAddress,
      data: data,
    });

    console.log("✅ Raw call succeeded:", result);
  } catch (error) {
    console.log("❌ Raw call failed:", error.message);
  }

  // Test 3: Prova con signature diverse
  const signatures = [
    "createAuction(address,uint256,uint8,uint256,uint256,uint256,uint256,uint256)",
    "createAuction(address,uint256,uint8,uint256,uint256,uint256,uint256,uint256,uint256,uint256)",
    "create(address,uint256,uint8,uint256,uint256,uint256,uint256,uint256)",
    "newAuction(address,uint256,uint8,uint256,uint256,uint256,uint256,uint256)",
  ];

  for (const sig of signatures) {
    const selector = ethers.keccak256(ethers.toUtf8Bytes(sig)).substring(0, 10);
    console.log(`${sig} -> ${selector}`);
  }
}

testDirectContract();
```

## 🎯 **Possibili Soluzioni**

1. **Verificare se il contratto è stato aggiornato**
2. **Controllare se la funzione ha un nome diverso**
3. **Testare con 8 parametri invece di 10**
4. **Verificare l'ABI aggiornato dal contratto deployato**
