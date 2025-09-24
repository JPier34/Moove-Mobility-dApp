import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { ethers } from "ethers";
import { contracts } from "@/utils/contracts";
import { useStartRevealPhase } from "@/hooks/useAuction";
import toast from "react-hot-toast";

interface SealedBidStatusManager {
  checkAndTransitionStatus: (auctionId: number) => Promise<void>;
  startRevealPhaseForNewAuction: (auctionId: number) => Promise<boolean>;
  isProcessing: boolean;
  error: string | null;
}

export function useSealedBidStatusManager(): SealedBidStatusManager {
  const { address, isConnected } = useAccount();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    startRevealPhase,
    isPending,
    error: revealError,
  } = useStartRevealPhase();

  // Check if current user is the winner of a sealed bid auction
  const checkForWinner = useCallback(
    async (auctionId: number, auctionContract: ethers.Contract) => {
      if (!address) return;

      try {
        // Get auction data to find the winner
        const auctionData = await auctionContract.getAuction(auctionId);
        const highestBidder = auctionData.highestBidder;
        const highestBid = auctionData.highestBid;

        // Get auction status for detailed logging
        const auctionStatus = Number(auctionData.status);

        console.log(`🔍 Checking winner for auction ${auctionId}:`, {
          auctionStatus,
          highestBidder,
          highestBid: ethers.formatEther(highestBid),
          currentUser: address,
          isWinner:
            typeof highestBidder === "string" &&
            highestBidder.toLowerCase() === address.toLowerCase(),
          isZeroAddress: highestBidder === ethers.ZeroAddress,
          isZeroBid: highestBid === 0n,
          timestamp: new Date().toISOString(),
        });

        // Check if there's a valid winner
        if (highestBidder === ethers.ZeroAddress || highestBid === 0n) {
          console.log(
            `❌ Auction ${auctionId} FAILED - No valid bids revealed:`,
            {
              auctionStatus,
              highestBidder,
              highestBid: ethers.formatEther(highestBid),
              reason:
                highestBidder === ethers.ZeroAddress
                  ? "Zero address winner"
                  : "Zero bid amount",
              timestamp: new Date().toISOString(),
            }
          );

          // Show notification about failed auction
          toast.error(
            `Auction #${auctionId} failed - no valid bids were revealed`
          );

          // Emit custom event for failed auction with detailed info
          const failedEvent = new CustomEvent("sealedBidFailed", {
            detail: {
              auctionId,
              reason: "No valid bids revealed",
              auctionStatus,
              highestBidder,
              highestBid: ethers.formatEther(highestBid),
              timestamp: new Date().toISOString(),
            },
          });
          window.dispatchEvent(failedEvent);

          return;
        }

        // Check if current user is the winner
        if (
          typeof highestBidder === "string" &&
          highestBidder.toLowerCase() === address.toLowerCase()
        ) {
          console.log(`🏆 USER WON auction ${auctionId}:`, {
            auctionStatus,
            winningBid: ethers.formatEther(highestBid),
            winner: address,
            timestamp: new Date().toISOString(),
          });

          // Show winner notification
          toast.success(
            `🏆 Congratulations! You won auction #${auctionId} for ${ethers.formatEther(
              highestBid
            )} ETH!`
          );

          // Emit custom event for winner notification
          const winnerEvent = new CustomEvent("sealedBidWinner", {
            detail: {
              auctionId,
              winningBid: ethers.formatEther(highestBid),
              winner: address,
              auctionStatus,
              timestamp: new Date().toISOString(),
            },
          });
          window.dispatchEvent(winnerEvent);

          console.log(`✅ Winner notification sent for auction ${auctionId}`);
        } else {
          console.log(`😔 USER LOST auction ${auctionId}:`, {
            auctionStatus,
            winner: highestBidder,
            winningBid: ethers.formatEther(highestBid),
            userAddress: address,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`❌ Error checking winner for auction ${auctionId}:`, {
          error: error instanceof Error ? error.message : "Unknown error",
          auctionId,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [address]
  );

  // Check auction status and transition if needed
  const checkAndTransitionStatus = useCallback(
    async (auctionId: number): Promise<void> => {
      if (!isConnected || !address) {
        throw new Error("Wallet not connected");
      }

      setIsProcessing(true);
      setError(null);

      try {
        if (!window.ethereum) {
          throw new Error("Ethereum provider not available");
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const auctionContract = new ethers.Contract(
          contracts.MooveAuction.address,
          contracts.MooveAuction.abi,
          provider
        );

        // Get auction data
        const auctionData = await auctionContract.getAuction(auctionId);

        // Debug: Log complete auction data structure
        console.log(`🔍 Complete auction data for ${auctionId}:`, {
          auctionId,
          rawData: auctionData,
          keys: Object.keys(auctionData),
          values: Object.values(auctionData),
        });

        // Debug: Log timing information
        console.log(`⏰ Timing debug for auction ${auctionId}:`, {
          auctionId,
          startTime: Number(auctionData.startTime),
          endTime: Number(auctionData.endTime),
          duration: Number(auctionData.endTime) - Number(auctionData.startTime),
          durationMinutes:
            (Number(auctionData.endTime) - Number(auctionData.startTime)) / 60,
          currentTime: Math.floor(Date.now() / 1000),
          startDate: new Date(
            Number(auctionData.startTime) * 1000
          ).toISOString(),
          endDate: new Date(Number(auctionData.endTime) * 1000).toISOString(),
          currentDate: new Date().toISOString(),
          timeExpired:
            Math.floor(Date.now() / 1000) >= Number(auctionData.endTime),
          timeToEnd:
            Number(auctionData.endTime) - Math.floor(Date.now() / 1000),
          timeToEndMinutes:
            (Number(auctionData.endTime) - Math.floor(Date.now() / 1000)) / 60,
        });

        const currentStatus = Number(auctionData.status);
        const auctionType = Number(auctionData.auctionType);
        const endTime = Number(auctionData.endTime);
        const creator = auctionData.creator;
        const currentTime = Math.floor(Date.now() / 1000);

        // Validate creator field
        const isCreator =
          creator && typeof creator === "string"
            ? creator.toLowerCase() === address.toLowerCase()
            : false;

        console.log(`🔍 Checking sealed bid auction ${auctionId}:`, {
          currentStatus,
          auctionType,
          endTime: new Date(endTime * 1000).toISOString(),
          currentTime: new Date().toISOString(),
          timeExpired: currentTime >= endTime,
          creator: creator || "undefined",
          currentUser: address,
          isCreator,
          creatorType: typeof creator,
          creatorValid: !!creator,
        });

        // Only process sealed bid auctions (auctionType === 2)
        if (auctionType !== 2) {
          console.log(`⏭️ Skipping non-sealed bid auction ${auctionId}`);
          return;
        }

        // Handle ACTIVE -> REVEAL transition for sealed bid auctions
        if (currentStatus === 1 && currentTime >= endTime) {
          console.log(
            `🔓 ACTIVE -> REVEAL: Starting reveal phase for sealed bid auction ${auctionId}:`,
            {
              auctionId,
              currentStatus,
              endTime: new Date(endTime * 1000).toISOString(),
              currentTime: new Date().toISOString(),
              timeExpired: currentTime >= endTime,
              creator: creator || "undefined",
              currentUser: address,
              timestamp: new Date().toISOString(),
            }
          );

          try {
            const signer = await provider.getSigner();
            const auctionContractWithSigner = auctionContract.connect(signer);

            console.log(`🔓 Starting reveal phase for auction ${auctionId}`);
            const revealTx = await (
              auctionContractWithSigner as any
            ).startRevealPhase(auctionId);
            console.log(
              `📝 Start reveal phase transaction submitted: ${revealTx.hash}`
            );

            await revealTx.wait();
            console.log(
              `✅ Reveal phase started successfully for auction ${auctionId}`
            );

            // Show notification
            toast.success(`🔓 Reveal phase started for auction #${auctionId}`);

            // After starting reveal phase, immediately end the auction
            setTimeout(async () => {
              try {
                console.log(
                  `🏁 Ending auction ${auctionId} after reveal phase started`
                );
                const endTx = await (
                  auctionContractWithSigner as any
                ).endAuction(auctionId);
                console.log(
                  `📝 End auction transaction submitted: ${endTx.hash}`
                );

                await endTx.wait();
                console.log(`✅ Auction ${auctionId} ended successfully`);

                toast.success(
                  `🏁 Auction #${auctionId} ended - winner determined`
                );

                // Check for winner after ending
                setTimeout(async () => {
                  await checkForWinner(auctionId, auctionContract);
                }, 2000);
              } catch (error) {
                console.error(`❌ Error ending auction ${auctionId}:`, error);
                toast.error(
                  `Failed to end auction: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                );
              }
            }, 3000); // Wait 3 seconds before ending
          } catch (error) {
            console.error(
              `❌ Error starting reveal phase for auction ${auctionId}:`,
              error
            );
            toast.error(
              `Failed to start reveal phase: ${
                error instanceof Error ? error.message : "Unknown error"
              }`
            );
          }
        } else if (currentStatus === 2) {
          // For REVEAL phase, use the new revealEndTime field from the contract
          // First try to get reveal info from the new contract function
          try {
            const revealInfo = await auctionContract.getSealedBidRevealInfo(
              auctionId
            );
            const revealEndTime = revealInfo.revealEndTime;

            console.log(`🔍 REVEAL phase info for auction ${auctionId}:`, {
              auctionId,
              currentStatus,
              revealEndTime: new Date(
                Number(revealEndTime) * 1000
              ).toISOString(),
              currentTime: new Date().toISOString(),
              timeExpired: currentTime >= Number(revealEndTime),
              creator: creator || "undefined",
              currentUser: address,
              timestamp: new Date().toISOString(),
            });

            // Only end the auction if the reveal phase has expired
            if (currentTime >= Number(revealEndTime)) {
              console.log(
                `🏁 REVEAL -> ENDED: Ending sealed bid auction ${auctionId} (reveal phase expired)`
              );

              try {
                const signer = await provider.getSigner();
                const auctionContractWithSigner =
                  auctionContract.connect(signer);

                console.log(
                  `🏁 Ending auction ${auctionId} to determine winner`
                );
                const endTx = await (
                  auctionContractWithSigner as any
                ).endRevealPhase(auctionId);
                console.log(
                  `📝 End reveal phase transaction submitted: ${endTx.hash}`
                );

                await endTx.wait();
                console.log(
                  `✅ Auction ${auctionId} reveal phase ended successfully`
                );

                // Show notification
                toast.success(
                  `🏁 Auction #${auctionId} ended - winner determined`
                );

                // Check for winner after ending
                setTimeout(async () => {
                  await checkForWinner(auctionId, auctionContract);
                }, 2000);
              } catch (error) {
                console.error(
                  `❌ Error ending reveal phase for auction ${auctionId}:`,
                  error
                );
                toast.error(
                  `Failed to end reveal phase: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                );
              }
            } else {
              console.log(
                `⏳ REVEAL phase still active for auction ${auctionId}:`,
                {
                  auctionId,
                  revealEndTime: new Date(
                    Number(revealEndTime) * 1000
                  ).toISOString(),
                  currentTime: new Date().toISOString(),
                  timeRemaining: Math.round(
                    (Number(revealEndTime) - currentTime) / 60
                  ),
                  timeRemainingHours: Math.round(
                    (Number(revealEndTime) - currentTime) / 3600
                  ),
                  message:
                    "Waiting for reveal phase to expire before ending auction",
                  note: "Using new revealEndTime field from contract",
                }
              );
            }
          } catch (error) {
            console.error(
              `❌ Error getting reveal info for auction ${auctionId}:`,
              error
            );
            // Fallback to old logic if new function fails
            const revealEndTime = endTime;

            console.log(
              `🔍 REVEAL -> ENDED: Processing sealed bid auction ${auctionId} (fallback):`,
              {
                auctionId,
                currentStatus,
                endTime: new Date(endTime * 1000).toISOString(),
                revealEndTime: new Date(revealEndTime * 1000).toISOString(),
                currentTime: new Date().toISOString(),
                creator: creator || "undefined",
                currentUser: address,
                timeExpired: currentTime >= revealEndTime,
                timestamp: new Date().toISOString(),
              }
            );

            // Only end the auction if the reveal phase has expired
            if (currentTime >= revealEndTime) {
              console.log(
                `🏁 REVEAL -> ENDED: Ending sealed bid auction ${auctionId} (reveal phase expired - fallback)`
              );

              try {
                const signer = await provider.getSigner();
                const auctionContractWithSigner =
                  auctionContract.connect(signer);

                console.log(
                  `🏁 Ending auction ${auctionId} to determine winner`
                );
                const endTx = await (
                  auctionContractWithSigner as any
                ).endAuction(auctionId);
                console.log(
                  `📝 End auction transaction submitted: ${endTx.hash}`
                );

                await endTx.wait();
                console.log(`✅ Auction ${auctionId} ended successfully`);

                // Show notification
                toast.success(
                  `🏁 Auction #${auctionId} ended - winner determined`
                );

                // Check for winner after ending
                setTimeout(async () => {
                  await checkForWinner(auctionId, auctionContract);
                }, 2000);
              } catch (error) {
                console.error(`❌ Error ending auction ${auctionId}:`, error);
                toast.error(
                  `Failed to end auction: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`
                );
              }
            } else {
              console.log(
                `⏳ REVEAL phase still active for auction ${auctionId} (fallback):`,
                {
                  auctionId,
                  endTime: new Date(endTime * 1000).toISOString(),
                  revealEndTime: new Date(revealEndTime * 1000).toISOString(),
                  currentTime: new Date().toISOString(),
                  timeRemaining: Math.round((revealEndTime - currentTime) / 60),
                  timeRemainingHours: Math.round(
                    (revealEndTime - currentTime) / 3600
                  ),
                  message:
                    "Waiting for reveal phase to expire before ending auction",
                  note: "Using fallback logic - new contract function failed",
                }
              );
            }
          }
        } else if (currentStatus === 3) {
          console.log(
            `🏁 Auction ${auctionId} is ENDED - checking for winner:`,
            {
              auctionId,
              currentStatus,
              endTime: new Date(endTime * 1000).toISOString(),
              currentTime: new Date().toISOString(),
              timestamp: new Date().toISOString(),
            }
          );

          // Check if current user is the winner
          await checkForWinner(auctionId, auctionContract);
        } else {
          console.log(
            `⏳ Auction ${auctionId} is still ACTIVE, waiting for end time:`,
            {
              auctionId,
              currentStatus,
              endTime: new Date(endTime * 1000).toISOString(),
              currentTime: new Date().toISOString(),
              timeRemaining: endTime - currentTime,
              timestamp: new Date().toISOString(),
            }
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `❌ Error checking sealed bid status for auction ${auctionId}:`,
          errorMessage
        );
        setError(errorMessage);
        toast.error(`Failed to check auction status: ${errorMessage}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [isConnected, address, startRevealPhase]
  );

  // Handle reveal phase errors
  useEffect(() => {
    if (revealError) {
      console.error("❌ Reveal phase error:", revealError);
      setError(revealError?.message || "Unknown error");
      toast.error(
        `Reveal phase failed: ${revealError?.message || "Unknown error"}`
      );
    }
  }, [revealError]);

  // Function to automatically start reveal phase for a newly created sealed bid auction
  const startRevealPhaseForNewAuction = useCallback(
    async (auctionId: number): Promise<boolean> => {
      if (!isConnected || !address) {
        console.log(`⏭️ Cannot start reveal phase - wallet not connected`);
        return false;
      }

      try {
        console.log(
          `🚀 Starting reveal phase for newly created sealed bid auction ${auctionId}`
        );

        // Call startRevealPhase directly
        startRevealPhase(auctionId);

        // Show notification
        toast.success(`🔓 Reveal phase started for auction #${auctionId}`);

        console.log(
          `✅ Reveal phase initiated for newly created auction ${auctionId}`
        );
        return true;
      } catch (error) {
        console.error(
          `❌ Error starting reveal phase for auction ${auctionId}:`,
          error
        );
        toast.error(
          `Failed to start reveal phase: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        return false;
      }
    },
    [isConnected, address, startRevealPhase]
  );

  return {
    checkAndTransitionStatus,
    startRevealPhaseForNewAuction,
    isProcessing: isProcessing || isPending,
    error: error || revealError?.message || null,
  };
}

// Hook to automatically monitor sealed bid auctions
export function useSealedBidAutoMonitor() {
  const { checkAndTransitionStatus, isProcessing, error } =
    useSealedBidStatusManager();
  const [monitoredAuctions, setMonitoredAuctions] = useState<Set<number>>(
    new Set()
  );

  // Add auction to monitoring
  const addToMonitoring = useCallback((auctionId: number) => {
    setMonitoredAuctions((prev) => new Set(prev).add(auctionId));
    console.log(`📡 Added auction ${auctionId} to sealed bid monitoring`);
  }, []);

  // Remove auction from monitoring
  const removeFromMonitoring = useCallback((auctionId: number) => {
    setMonitoredAuctions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(auctionId);
      return newSet;
    });
    console.log(`📡 Removed auction ${auctionId} from sealed bid monitoring`);
  }, []);

  // Monitor auctions periodically
  useEffect(() => {
    if (monitoredAuctions.size === 0) return;

    const interval = setInterval(async () => {
      console.log(
        `🔍 Auto-monitoring ${monitoredAuctions.size} sealed bid auctions:`,
        Array.from(monitoredAuctions)
      );

      for (const auctionId of monitoredAuctions) {
        try {
          await checkAndTransitionStatus(auctionId);
        } catch (error) {
          console.error(`❌ Error monitoring auction ${auctionId}:`, error);
        }
      }
    }, 60000); // Check every 60 seconds to reduce MetaMask requests

    return () => clearInterval(interval);
  }, [monitoredAuctions, checkAndTransitionStatus]);

  return {
    addToMonitoring,
    removeFromMonitoring,
    monitoredAuctions: Array.from(monitoredAuctions),
    isProcessing,
    error,
  };
}
