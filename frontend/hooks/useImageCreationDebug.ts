"use client";

import { useState, useCallback } from "react";
import { uploadToPinata } from "@/utils/pinata";

interface ImageCreationDebugData {
  step: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
}

export function useImageCreationDebug() {
  const [debugLog, setDebugLog] = useState<ImageCreationDebugData[]>([]);
  const [isDebugging, setIsDebugging] = useState(false);

  const addLog = useCallback(
    (step: string, success: boolean, data?: any, error?: string) => {
      setDebugLog((prev) => [
        ...prev,
        {
          step,
          success,
          data,
          error,
          timestamp: Date.now(),
        },
      ]);
    },
    []
  );

  const debugImageUpload = useCallback(
    async (file: File) => {
      setIsDebugging(true);
      setDebugLog([]);

      try {
        // Step 1: Check file properties
        addLog("File Analysis", true, {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
        });

        // Step 2: Check Pinata configuration
        const hasPinataConfig =
          process.env.NEXT_PUBLIC_PINATA_API_KEY || process.env.PINATA_API_KEY;

        addLog("Pinata Configuration", !!hasPinataConfig, {
          hasApiKey: !!process.env.NEXT_PUBLIC_PINATA_API_KEY,
          hasSecretKey: !!process.env.NEXT_PUBLIC_PINATA_SECRET_KEY,
          apiKeyLength: process.env.NEXT_PUBLIC_PINATA_API_KEY?.length || 0,
          secretKeyLength:
            process.env.NEXT_PUBLIC_PINATA_SECRET_KEY?.length || 0,
        });

        if (!hasPinataConfig) {
          addLog(
            "Upload Skipped",
            true,
            "Pinata not configured, would use mock hash"
          );
          return {
            success: false,
            reason: "Pinata not configured",
            mockHash: `QmMockImageHashForTesting${Date.now()}`,
          };
        }

        // Step 3: Upload to Pinata
        addLog("Pinata Upload Start", true, "Starting upload to Pinata IPFS");

        const ipfsHash = await uploadToPinata(file);

        addLog("Pinata Upload Success", true, {
          ipfsHash,
          gatewayUrl: `https://ipfs.io/ipfs/${ipfsHash}`,
          pinataUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        });

        // Step 4: Test image accessibility
        const testUrls = [
          `https://ipfs.io/ipfs/${ipfsHash}`,
          `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
          `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
        ];

        for (const url of testUrls) {
          try {
            const response = await fetch(url, { method: "HEAD" });
            addLog(`Test ${url}`, response.ok, {
              status: response.status,
              statusText: response.statusText,
              contentType: response.headers.get("content-type"),
            });
          } catch (error) {
            addLog(`Test ${url}`, false, null, `Error: ${error}`);
          }
        }

        return {
          success: true,
          ipfsHash,
          gatewayUrls: testUrls,
        };
      } catch (error) {
        addLog("Upload Error", false, null, `Error: ${error}`);
        return {
          success: false,
          reason: "Upload failed",
          error: error,
        };
      } finally {
        setIsDebugging(false);
      }
    },
    [addLog]
  );

  const debugMetadataCreation = useCallback(
    async (metadata: any) => {
      setIsDebugging(true);
      setDebugLog([]);

      try {
        // Step 1: Analyze metadata structure
        addLog("Metadata Analysis", true, {
          hasName: !!metadata.name,
          hasDescription: !!metadata.description,
          hasImage: !!metadata.image,
          imageType: typeof metadata.image,
          imageValue: metadata.image,
          attributesCount: metadata.attributes?.length || 0,
        });

        // Step 2: Analyze image field
        if (metadata.image) {
          if (metadata.image.startsWith("QmMock")) {
            addLog("Mock Image Detected", true, {
              imageValue: metadata.image,
              reason: "Mock hash detected in image field",
            });
          } else if (metadata.image.startsWith("Qm")) {
            addLog("IPFS Hash Detected", true, {
              imageValue: metadata.image,
              gatewayUrl: `https://ipfs.io/ipfs/${metadata.image}`,
            });
          } else if (metadata.image.startsWith("http")) {
            addLog("HTTP URL Detected", true, {
              imageValue: metadata.image,
            });
          } else {
            addLog("Unknown Image Format", false, {
              imageValue: metadata.image,
            });
          }
        } else {
          addLog("No Image Field", false, "Metadata has no image field");
        }

        // Step 3: Test image accessibility if it's a URL
        if (metadata.image && metadata.image.startsWith("http")) {
          try {
            const response = await fetch(metadata.image, { method: "HEAD" });
            addLog("Image URL Test", response.ok, {
              url: metadata.image,
              status: response.status,
              statusText: response.statusText,
              contentType: response.headers.get("content-type"),
            });
          } catch (error) {
            addLog("Image URL Test", false, null, `Error: ${error}`);
          }
        }

        return {
          success: true,
          metadata,
        };
      } catch (error) {
        addLog("Metadata Analysis Error", false, null, `Error: ${error}`);
        return {
          success: false,
          reason: "Analysis failed",
          error: error,
        };
      } finally {
        setIsDebugging(false);
      }
    },
    [addLog]
  );

  const clearLog = useCallback(() => {
    setDebugLog([]);
  }, []);

  return {
    debugLog,
    isDebugging,
    debugImageUpload,
    debugMetadataCreation,
    clearLog,
  };
}


