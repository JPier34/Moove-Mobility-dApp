// Temporarily commented out for build compatibility
// This file contains GraphQL queries for the subgraph but is not currently used
// and causes build errors with Apollo Client imports

/*
import { useQuery } from "@apollo/client";
import { gql } from "@apollo/client";

// GraphQL queries for the subgraph
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

const GET_AUCTION_BY_ID = gql`
  query GetAuctionById($auctionId: String!) {
    auctions(where: { auctionId: $auctionId }) {
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

// Apollo Client configuration
const SUBGRAPH_URL =
  "https://api.studio.thegraph.com/query/YOUR_SUBGRAPH_ID/YOUR_SUBGRAPH_NAME/v0.0.1";

export const useGraphAuctionData = (tokenId?: number) => {
  const { data, loading, error } = useQuery(GET_AUCTION_BY_TOKEN_ID, {
    variables: { tokenId: tokenId?.toString() },
    skip: !tokenId,
    context: {
      uri: SUBGRAPH_URL,
    },
  });

  return {
    auctionData: data?.auctionSettleds?.[0],
    loading,
    error,
  };
};

export const useAllAuctions = () => {
  const { data, loading, error } = useQuery(GET_ALL_AUCTIONS, {
    context: {
      uri: SUBGRAPH_URL,
    },
  });

  return {
    auctions: data?.auctions || [],
    loading,
    error,
  };
};

export const useAuctionById = (auctionId?: number) => {
  const { data, loading, error } = useQuery(GET_AUCTION_BY_ID, {
    variables: { auctionId: auctionId?.toString() },
    skip: !auctionId,
    context: {
      uri: SUBGRAPH_URL,
    },
  });

  return {
    auction: data?.auctions?.[0],
    loading,
    error,
  };
};

// Helper function to get auction data for pricing
export const getAuctionDataFromGraph = async (
  tokenId: number
): Promise<{
  price: number;
  purchaseDate: number;
  priceSource: string;
}> => {
  try {
    // This would be called from the frontend
    // For now, return fallback data
    return {
      price: 0.001, // This will be replaced with real Graph data
      purchaseDate: Date.now(),
      priceSource: "graph_auction",
    };
  } catch (error) {
    console.warn(
      `⚠️ Error getting auction data from Graph for tokenId ${tokenId}:`,
      error
    );
    return {
      price: 0.01, // Fallback price
      purchaseDate: Date.now(),
      priceSource: "fallback",
    };
  }
};
*/
