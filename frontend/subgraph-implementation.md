# Moove Auction Subgraph

## Schema Definition (schema.graphql)

```graphql
type Auction @entity {
  id: ID!
  auctionId: BigInt!
  tokenId: BigInt!
  auctionType: Int!
  startPrice: BigInt!
  endTime: BigInt!
  winner: Bytes!
  finalBid: BigInt!
  settled: Boolean!
  createdAt: BigInt!
  settledAt: BigInt
  transactionHash: Bytes!
  blockNumber: BigInt!
}

type AuctionSettled @entity {
  id: ID!
  auctionId: BigInt!
  tokenId: BigInt!
  winner: Bytes!
  finalBid: BigInt!
  timestamp: BigInt!
  transactionHash: Bytes!
  blockNumber: BigInt!
}

type AuctionCreated @entity {
  id: ID!
  auctionId: BigInt!
  tokenId: BigInt!
  auctionType: Int!
  startPrice: BigInt!
  endTime: BigInt!
  timestamp: BigInt!
  transactionHash: Bytes!
  blockNumber: BigInt!
}
```

## Subgraph Configuration (subgraph.yaml)

```yaml
specVersion: 0.0.5
schema:
  file: ./schema.graphql
dataSources:
  - kind: ethereum
    name: MooveAuction
    network: sepolia
    source:
      address: "0x463a4fff0796AF7C69788463629AeF046A2fc211"
      abi: MooveAuction
      startBlock: 9000000 # Adjust to when your contract was deployed
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.7
      language: wasm/assemblyscript
      entities:
        - Auction
        - AuctionSettled
        - AuctionCreated
      abis:
        - name: MooveAuction
          file: ./abis/MooveAuction.json
      eventHandlers:
        - event: AuctionSettled(indexed uint256,indexed uint256,address,uint256,uint256)
          handler: handleAuctionSettled
        - event: AuctionCreated(indexed uint256,indexed uint256,uint8,uint256,uint256)
          handler: handleAuctionCreated
      callHandlers: []
      blockHandlers: []
      file: ./src/mapping.ts
```

## Event Handlers (src/mapping.ts)

```typescript
import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  AuctionSettled,
  AuctionCreated,
} from "../generated/MooveAuction/MooveAuction";
import {
  Auction,
  AuctionSettled as AuctionSettledEntity,
  AuctionCreated as AuctionCreatedEntity,
} from "../generated/schema";

export function handleAuctionSettled(event: AuctionSettled): void {
  let auctionId = event.params.auctionId.toString();
  let tokenId = event.params.tokenId.toString();

  // Create AuctionSettled entity
  let auctionSettled = new AuctionSettledEntity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  auctionSettled.auctionId = event.params.auctionId;
  auctionSettled.tokenId = event.params.tokenId;
  auctionSettled.winner = event.params.winner;
  auctionSettled.finalBid = event.params.finalBid;
  auctionSettled.timestamp = event.params.timestamp;
  auctionSettled.transactionHash = event.transaction.hash;
  auctionSettled.blockNumber = event.block.number;
  auctionSettled.save();

  // Update or create Auction entity
  let auction = Auction.load(auctionId);
  if (auction == null) {
    auction = new Auction(auctionId);
  }

  auction.auctionId = event.params.auctionId;
  auction.tokenId = event.params.tokenId;
  auction.winner = event.params.winner;
  auction.finalBid = event.params.finalBid;
  auction.settled = true;
  auction.settledAt = event.params.timestamp;
  auction.transactionHash = event.transaction.hash;
  auction.blockNumber = event.block.number;

  auction.save();
}

export function handleAuctionCreated(event: AuctionCreated): void {
  let auctionId = event.params.auctionId.toString();

  // Create AuctionCreated entity
  let auctionCreated = new AuctionCreatedEntity(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  auctionCreated.auctionId = event.params.auctionId;
  auctionCreated.tokenId = event.params.tokenId;
  auctionCreated.auctionType = event.params.auctionType;
  auctionCreated.startPrice = event.params.startPrice;
  auctionCreated.endTime = event.params.endTime;
  auctionCreated.timestamp = event.params.timestamp;
  auctionCreated.transactionHash = event.transaction.hash;
  auctionCreated.blockNumber = event.block.number;
  auctionCreated.save();

  // Create or update Auction entity
  let auction = Auction.load(auctionId);
  if (auction == null) {
    auction = new Auction(auctionId);
  }

  auction.auctionId = event.params.auctionId;
  auction.tokenId = event.params.tokenId;
  auction.auctionType = event.params.auctionType;
  auction.startPrice = event.params.startPrice;
  auction.endTime = event.params.endTime;
  auction.settled = false;
  auction.createdAt = event.params.timestamp;
  auction.transactionHash = event.transaction.hash;
  auction.blockNumber = event.block.number;

  auction.save();
}
```

## Frontend Integration

```typescript
// hooks/useGraphAuctionData.ts
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";

const GET_AUCTION_BY_TOKEN_ID = gql`
  query GetAuctionByTokenId($tokenId: String!) {
    auctionSettleds(where: { tokenId: $tokenId }) {
      id
      auctionId
      tokenId
      winner
      finalBid
      timestamp
      transactionHash
      blockNumber
    }
  }
`;

const GET_ALL_AUCTIONS = gql`
  query GetAllAuctions {
    auctions(orderBy: createdAt, orderDirection: desc) {
      id
      auctionId
      tokenId
      auctionType
      startPrice
      endTime
      winner
      finalBid
      settled
      createdAt
      settledAt
      transactionHash
    }
  }
`;

export const useGraphAuctionData = (tokenId?: number) => {
  const { data, loading, error } = useQuery(GET_AUCTION_BY_TOKEN_ID, {
    variables: { tokenId: tokenId?.toString() },
    skip: !tokenId,
  });

  return {
    auctionData: data?.auctionSettleds?.[0],
    loading,
    error,
  };
};

export const useAllAuctions = () => {
  const { data, loading, error } = useQuery(GET_ALL_AUCTIONS);

  return {
    auctions: data?.auctions || [],
    loading,
    error,
  };
};
```

## Deployment Steps

1. **Install Graph CLI**:

```bash
npm install -g @graphprotocol/graph-cli
```

2. **Initialize Subgraph**:

```bash
graph init --studio moove-auction-subgraph
```

3. **Deploy to The Graph Studio**:

```bash
graph deploy --studio moove-auction-subgraph
```

4. **Update Frontend**:

```typescript
// Replace the corrupted contract calls with Graph queries
const getAuctionDataFromGraph = async (tokenId: number) => {
  const { auctionData } = useGraphAuctionData(tokenId);

  if (auctionData) {
    return {
      price: parseFloat(ethers.formatEther(auctionData.finalBid)),
      purchaseDate: Number(auctionData.timestamp) * 1000,
      priceSource: "graph_auction",
    };
  }

  return {
    price: getFallbackPrice(tokenId),
    purchaseDate: Date.now(),
    priceSource: "fallback",
  };
};
```

## 🎯 **Risultati Attesi**

Con il subgraph avrai:

- **Dati precisi**: NFT #110 = 0.001 ETH (dall'Auction 15)
- **Query veloci**: < 100ms per ogni NFT
- **Dati storici completi**: Tutti gli eventi dall'inizio
- **Real-time updates**: Nuovi eventi indicizzati automaticamente

Vuoi che procediamo con l'implementazione del subgraph?


