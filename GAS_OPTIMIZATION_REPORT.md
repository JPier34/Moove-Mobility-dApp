# 🚀 Gas Optimization Report - Moove dApp

## 📊 Executive Summary

Basato sull'analisi del gas reporter, abbiamo identificato diverse aree di ottimizzazione per ridurre significativamente i costi di gas. Le funzioni più costose sono:

- `mintStickerNFT`: 289K-1.1M gas (avg: 433K)
- `batchMintRentalPasses`: 627K-2.9M gas (avg: 2.2M)
- `createAuction`: 329K-391K gas (avg: 338K)
- `createCustomization`: 262K-282K gas (avg: 268K)

## 🎯 Ottimizzazioni Identificate

### 1. **MooveNFT.sol - Ottimizzazioni Critiche**

#### 1.1 `mintStickerNFT` Function (433K gas avg)

**Problemi identificati:**

- Duplicazione di stringhe in memoria
- Accessi multipli allo storage
- Validazioni ridondanti

**Ottimizzazioni proposte:**

```solidity
// OPTIMIZATION 1: Pack struct data
struct StickerNFT {
    string name;
    string description;
    StickerCategory category;
    StickerRarity rarity;
    address creator;
    uint32 creationDate; // Packed with other data
    bool isLimitedEdition;
    uint32 editionSize; // Reduced from uint256
    uint32 editionNumber; // Reduced from uint256
    CustomizationOptions customization;
}

// OPTIMIZATION 2: Use calldata for read-only parameters
function mintStickerNFT(
    address to,
    string calldata stickerName, // Changed from memory
    string calldata metadataURI, // Changed from memory
    StickerCategory category,
    StickerRarity rarity,
    bool isLimitedEdition,
    uint256 editionSize,
    CustomizationOptions calldata customizationOptions, // Changed from memory
    string calldata editionName, // Changed from memory
    address royaltyRecipient,
    uint96 royaltyPercentage
) external onlyAccessControlRole(keccak256("CUSTOMIZATION_ADMIN_ROLE")) {
    // ... implementation
}

// OPTIMIZATION 3: Batch storage operations
function _mintStickerInternal(
    address to,
    string calldata stickerName,
    string calldata stickerDescription,
    StickerCategory category,
    StickerRarity rarity,
    bool isLimitedEdition,
    uint256 editionSize,
    CustomizationOptions calldata customizationOptions,
    string calldata _tokenURI,
    address royaltyRecipient,
    uint96 royaltyPercentage
) internal {
    // Batch all storage operations together
    uint256 tokenId = _tokenIdCounter++;

    // Single storage operation for sticker data
    stickers[tokenId] = StickerNFT({
        name: stickerName,
        description: stickerDescription,
        category: category,
        rarity: rarity,
        creator: msg.sender,
        creationDate: uint32(block.timestamp), // Packed
        isLimitedEdition: isLimitedEdition,
        editionSize: uint32(editionSize), // Packed
        editionNumber: uint32(isLimitedEdition ? _getNextEditionNumber(msg.sender, stickerName, editionSize) : 0),
        customization: customizationOptions
    });

    // Batch boolean operations
    isCustomizable[tokenId] = _hasCustomizationOptions(customizationOptions);

    // Single push operation
    creatorStickers[msg.sender].push(tokenId);

    // Conditional royalty setting
    if (royaltyRecipient != address(0) && royaltyPercentage > 0) {
        _setTokenRoyalty(tokenId, royaltyRecipient, royaltyPercentage);
    }

    // Batch mint operations
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, _tokenURI);

    emit StickerMinted(tokenId, msg.sender, to, stickerName, category, rarity, isLimitedEdition);
}
```

#### 1.2 `customizeSticker` Function (179K gas avg)

**Ottimizzazioni:**

```solidity
// OPTIMIZATION: Use calldata and pack events
function customizeSticker(
    uint256 tokenId,
    string calldata changeDescription, // Changed from memory
    string calldata newState, // Changed from memory
    string calldata newTokenURI // Changed from memory
) external onlyValidToken(tokenId) onlyOwnerOrApproved(tokenId) {
    // Batch storage operations
    customizationHistory[tokenId].push(CustomizationChange({
        description: changeDescription,
        timestamp: uint32(block.timestamp), // Packed
        state: newState
    }));

    _setTokenURI(tokenId, newTokenURI);

    emit StickerCustomized(tokenId, msg.sender, changeDescription, newState);
}
```

### 2. **MooveCustomization.sol - Ottimizzazioni**

#### 2.1 `createCustomization` Function (268K gas avg)

**Ottimizzazioni:**

```solidity
// OPTIMIZATION 1: Pack struct data
struct Customization {
    uint256 id;
    string name;
    string description;
    CustomizationType custType;
    uint256 price;
    string imageURI;
    bool isActive;
    uint32 maxSupply; // Reduced from uint256
    uint32 currentSupply; // Reduced from uint256
}

// OPTIMIZATION 2: Use calldata
function createCustomization(
    string calldata name, // Changed from memory
    string calldata description, // Changed from memory
    CustomizationType custType,
    uint256 price,
    string calldata imageURI, // Changed from memory
    uint256 maxSupply
) external override onlyRole(CUSTOMIZATION_ADMIN_ROLE) returns (uint256 customizationId) {
    // Batch storage operations
    customizationId = _customizationIdCounter++;

    _customizations[customizationId] = Customization({
        id: customizationId,
        name: name,
        description: description,
        custType: custType,
        price: price,
        imageURI: imageURI,
        isActive: true,
        maxSupply: uint32(maxSupply), // Packed
        currentSupply: 0
    });

    // Batch array operations
    _customizationsByType[custType].push(customizationId);
    _activeCustomizations[customizationId] = true;

    emit CustomizationCreated(customizationId, name, custType, price);
}
```

#### 2.2 `applyCustomization` Function (98K gas avg)

**Ottimizzazioni:**

```solidity
// OPTIMIZATION: Batch storage operations and use unchecked
function applyCustomization(
    uint256 tokenId,
    uint256 customizationId
) external payable override nonReentrant {
    require(mooveNFT.ownerOf(tokenId) == msg.sender, "Not token owner");

    Customization storage customization = _customizations[customizationId];
    require(customization.id != 0, "Customization does not exist");
    require(customization.isActive, "Customization not active");
    require(msg.value >= customization.price, "Insufficient payment");

    // Batch storage operations
    _vehicleCustomizations[tokenId].push(customizationId);
    _isCustomizationApplied[tokenId][customizationId] = true;

    // Use unchecked for gas optimization
    unchecked {
        customization.currentSupply++;
    }

    // Handle specific types efficiently
    if (customization.custType == CustomizationType.PERFORMANCE) {
        _applyPerformanceBonus(tokenId, customizationId);
    } else if (customization.custType == CustomizationType.AESTHETIC) {
        _applyAestheticChange(tokenId, customizationId);
    }

    emit CustomizationApplied(tokenId, customizationId, msg.sender, customization.price);
}
```

### 3. **MooveRentalPass.sol - Ottimizzazioni Critiche**

#### 3.1 `batchMintRentalPasses` Function (2.2M gas avg)

**Problema principale:** Loop inefficiente con operazioni di storage multiple

**Ottimizzazioni:**

```solidity
// OPTIMIZATION: Batch storage operations and use unchecked
function batchMintRentalPasses(
    address[] calldata recipients, // Changed from memory
    string[] calldata accessCodes, // Changed from memory
    uint256[] calldata durations // Changed from memory
) external onlyRole(MINTER_ROLE) {
    require(recipients.length == accessCodes.length && recipients.length == durations.length, "Array length mismatch");

    uint256 length = recipients.length;

    // Batch operations
    for (uint256 i = 0; i < length;) {
        address recipient = recipients[i];
        string calldata accessCode = accessCodes[i];
        uint256 duration = durations[i];

        require(recipient != address(0), "Invalid recipient");
        require(bytes(accessCode).length > 0, "Invalid access code");
        require(duration > 0, "Invalid duration");
        require(!_accessCodeUsed[accessCode], "Access code already used");

        uint256 tokenId = _tokenIdCounter++;
        uint256 expiryTime = block.timestamp + duration;

        // Batch storage operations
        _accessCodeUsed[accessCode] = true;
        _accessCodeToToken[accessCode] = tokenId;

        rentalPasses[tokenId] = RentalPass({
            recipient: recipient,
            accessCode: accessCode,
            expiryTime: uint32(expiryTime), // Packed
            isActive: true
        });

        _mint(recipient, tokenId);

        emit RentalPassMinted(tokenId, recipient, accessCode, expiryTime);

        // Use unchecked for gas optimization
        unchecked { i++; }
    }
}
```

### 4. **MooveAuction.sol - Ottimizzazioni**

#### 4.1 `createAuction` Function (338K gas avg)

**Ottimizzazioni:**

```solidity
// OPTIMIZATION: Pack struct data and use calldata
struct Auction {
    address seller;
    uint256 tokenId;
    uint256 startingPrice;
    uint256 currentPrice;
    uint256 buyNowPrice;
    uint256 reservePrice;
    uint32 startTime; // Packed
    uint32 endTime; // Packed
    uint32 minBidIncrement; // Packed
    AuctionType auctionType;
    bool isActive;
    bool isReserveMet;
    address highestBidder;
    uint256 highestBid;
}

function createAuction(
    uint256 tokenId,
    uint256 startingPrice,
    uint256 duration,
    AuctionType auctionType,
    uint256 buyNowPrice,
    uint256 reservePrice
) external nonReentrant {
    // Batch storage operations
    uint256 auctionId = _auctionIdCounter++;

    auctions[auctionId] = Auction({
        seller: msg.sender,
        tokenId: tokenId,
        startingPrice: startingPrice,
        currentPrice: startingPrice,
        buyNowPrice: buyNowPrice,
        reservePrice: reservePrice,
        startTime: uint32(block.timestamp), // Packed
        endTime: uint32(block.timestamp + duration), // Packed
        minBidIncrement: uint32(_minimumBidIncrement), // Packed
        auctionType: auctionType,
        isActive: true,
        isReserveMet: false,
        highestBidder: address(0),
        highestBid: 0
    });

    // Batch array operations
    _userAuctions[msg.sender].push(auctionId);
    _activeAuctions.push(auctionId);

    emit AuctionCreated(auctionId, msg.sender, tokenId, startingPrice, auctionType);
}
```

## 🔧 Ottimizzazioni Generali Applicabili

### 1. **Packing Structs**

```solidity
// Before
struct Example {
    uint256 value1;
    bool flag1;
    uint256 value2;
    bool flag2;
}

// After - Packed
struct Example {
    uint256 value1;
    uint256 value2;
    bool flag1;
    bool flag2;
}
```

### 2. **Use calldata instead of memory**

```solidity
// Before
function process(string memory data) external { }

// After
function process(string calldata data) external { }
```

### 3. **Unchecked Math Operations**

```solidity
// Before
for (uint256 i = 0; i < array.length; i++) { }

// After
for (uint256 i = 0; i < array.length;) {
    // ... operations
    unchecked { i++; }
}
```

### 4. **Batch Storage Operations**

```solidity
// Before
mapping[address] = value1;
mapping[address] = value2;
array.push(item);

// After - Group related operations
mapping[address] = value1;
mapping[address] = value2;
array.push(item);
```

### 5. **Use Events Efficiently**

```solidity
// Before - Multiple events
emit Event1(param1);
emit Event2(param2);

// After - Single packed event
emit BatchEvent(param1, param2);
```

## 📈 Stime di Risparmio

Basato sulle ottimizzazioni proposte:

| Function                | Current Gas | Optimized Gas | Savings |
| ----------------------- | ----------- | ------------- | ------- |
| `mintStickerNFT`        | 433,807     | ~300,000      | ~30%    |
| `batchMintRentalPasses` | 2,202,526   | ~1,500,000    | ~32%    |
| `createAuction`         | 338,593     | ~250,000      | ~26%    |
| `createCustomization`   | 268,760     | ~200,000      | ~25%    |
| `applyCustomization`    | 98,104      | ~75,000       | ~24%    |

**Risparmio totale stimato: ~25-30% sui costi di gas**

## 🚀 Prossimi Passi

1. **Implementare le ottimizzazioni in ordine di priorità**
2. **Testare ogni ottimizzazione per verificare la funzionalità**
3. **Eseguire benchmark di gas per confermare i miglioramenti**
4. **Considerare ottimizzazioni aggiuntive per funzioni specifiche**

## ⚠️ Considerazioni Importanti

- **Sicurezza**: Le ottimizzazioni non devono compromettere la sicurezza
- **Compatibilità**: Mantenere la compatibilità con le interfacce esistenti
- **Test**: Eseguire test completi dopo ogni ottimizzazione
- **Documentazione**: Aggiornare la documentazione per riflettere i cambiamenti
