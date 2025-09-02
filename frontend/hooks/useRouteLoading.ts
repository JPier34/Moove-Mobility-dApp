import { useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

export function useRouteLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Show loading when navigation starts
  const navigateWithLoading = useCallback(
    (url: string) => {
      console.log("🔄 Starting route navigation to:", url);
      setIsLoading(true);
      router.push(url);
    },
    [router]
  );

  // Hide loading when route changes (new page loaded)
  useEffect(() => {
    if (isLoading) {
      console.log("✅ Route changed, hiding loading:", pathname);
      setIsLoading(false);
    }
  }, [pathname, isLoading]);

  // Hide loading when component unmounts
  useEffect(() => {
    return () => {
      setIsLoading(false);
    };
  }, []);

  // Auto-hide loading after timeout (fallback)
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.log("⏰ Loading timeout, hiding spinner");
        setIsLoading(false);
      }, 5000); // 5 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  return {
    isLoading,
    navigateWithLoading,
    setIsLoading,
  };
}
