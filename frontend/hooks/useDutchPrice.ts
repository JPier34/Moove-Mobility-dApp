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
    // ✅ DEBUG: Log for auction #4
    if (auction.auctionId === "4") {
      console.log("🔍 [useDutchPrice #4] Hook called:", {
        auctionId: auction.auctionId,
        auctionType: auction.auctionType,
        auctionTypeNumber: Number(auction.auctionType),
        isDutchAuction: Number(auction.auctionType) === 1,
        comparison: `${Number(auction.auctionType)} === 1`,
      });
    }

    if (Number(auction.auctionType) !== 1) {
      // Not Dutch auction
      if (auction.auctionId === "4") {
        console.log("🔍 [useDutchPrice #4] Not a Dutch auction, returning");
      }
      return;
    }

    // Use seconds instead of milliseconds to match smart contract
    const now = Math.floor(Date.now() / 1000);
    // ✅ FIX: Handle both Date objects and ISO strings
    const startTime = Math.floor(
      (typeof auction.startTime === "string"
        ? new Date(auction.startTime).getTime()
        : auction.startTime.getTime()) / 1000
    );
    const endTime = Math.floor(
      (typeof auction.endTime === "string"
        ? new Date(auction.endTime).getTime()
        : auction.endTime.getTime()) / 1000
    );
    const elapsed = now - startTime;
    const duration = endTime - startTime;

    // Check if auction is still active
    const auctionActive =
      Number(auction.status) === 1 && elapsed >= 0 && elapsed < duration; // ACTIVE (corrected to match contract)

    // ✅ DEBUG: Log for auction #4
    if (auction.auctionId === "4") {
      console.log("🔍 [useDutchPrice #4] Debug:", {
        auctionId: auction.auctionId,
        now: now,
        startTime: startTime,
        endTime: endTime,
        startTimeString: auction.startTime,
        endTimeString: auction.endTime,
        elapsed: elapsed,
        duration: duration,
        status: auction.status,
        statusType: typeof auction.status,
        statusNumber: Number(auction.status),
        statusCheck: `${Number(auction.status)} === 1`,
        elapsedCheck: `${elapsed} >= 0`,
        durationCheck: `${elapsed} < ${duration}`,
        auctionActive: auctionActive,
        isActive: auctionActive,
        isNaNStartTime: isNaN(startTime),
        isNaNEndTime: isNaN(endTime),
        isNaNElapsed: isNaN(elapsed),
        isNaNDuration: isNaN(duration),
      });
    }

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

    // Set minimum price to prevent going too low (0.000001 ETH minimum - same as system validation)
    const minimumPrice = 0.000001;
    const finalPrice = Math.max(
      currentPriceValue,
      Math.max(reservePrice, minimumPrice)
    );

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
