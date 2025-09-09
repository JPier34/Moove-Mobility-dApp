"use client";

interface WalletLoadingScreenProps {
  message?: string;
}

export default function WalletLoadingScreen({
  message = "Loading...",
}: WalletLoadingScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-moove-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        {/* Simplified loading spinner */}
        <div className="mb-4">
          <div className="mx-auto w-12 h-12 bg-moove-primary rounded-full flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>

        {/* Simplified message */}
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            {message}
          </h2>
        </div>
      </div>
    </div>
  );
}
