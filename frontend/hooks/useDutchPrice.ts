"use client";

import { useState, useEffect, useCallback } from "react";
import { Auction } from "@/types/auction";

export interface DutchPriceResult {
  currentPrice: string;
  isActive: boolean;
  timeRemaining: number;
  priceReduction: number;
}

export function useDutchPrice(
  auction: Auction,
  updateInterval: number = 1000
): DutchPriceResult {
  const [currentPrice, setCurrentPrice] = useState(auction.startPrice);
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [priceReduction, setPriceReduction] = useState(0);

  const calculatePrice = useCallback(() => {
    if (auction.auctionType !== 1) {
      // Not Dutch auction
      return;
    }

    const now = new Date().getTime();
    const startTime = new Date(auction.startTime).getTime();
    const endTime = new Date(auction.endTime).getTime();
    const elapsed = now - startTime;
    const duration = endTime - startTime;

    // Check if auction is still active
    const auctionActive =
      auction.status === 1 && elapsed >= 0 && elapsed < duration;
    setIsActive(auctionActive);

    // Calculate time remaining
    const remaining = Math.max(0, endTime - now);
    setTimeRemaining(remaining);

    if (elapsed <= 0) {
      // Auction hasn't started yet
      setCurrentPrice(auction.startPrice);
      setPriceReduction(0);
      return;
    }

    if (elapsed >= duration) {
      // Auction has ended
      setCurrentPrice(auction.reservePrice);
      setPriceReduction(
        parseFloat(auction.startPrice) - parseFloat(auction.reservePrice)
      );
      setIsActive(false);
      return;
    }

    // Calculate current price
    const startPrice = parseFloat(auction.startPrice);
    const reservePrice = parseFloat(auction.reservePrice);
    const totalReduction = startPrice - reservePrice;
    const currentReduction = (totalReduction * elapsed) / duration;
    const currentPriceValue = startPrice - currentReduction;

    // Ensure price doesn't go below reserve
    const finalPrice = Math.max(currentPriceValue, reservePrice);

    setCurrentPrice(finalPrice.toFixed(6));
    setPriceReduction(currentReduction);
  }, [auction]);

  useEffect(() => {
    calculatePrice();
    const interval = setInterval(calculatePrice, updateInterval);
    return () => clearInterval(interval);
  }, [calculatePrice, updateInterval]);

  return {
    currentPrice,
    isActive,
    timeRemaining,
    priceReduction,
  };
}










