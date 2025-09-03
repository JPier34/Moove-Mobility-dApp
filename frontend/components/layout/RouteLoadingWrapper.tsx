"use client";

import { useRouteLoading } from "@/hooks/useRouteLoading";
import RouteLoading from "@/components/ui/RouteLoading";

export default function RouteLoadingWrapper() {
  const { isLoading } = useRouteLoading();

  return <RouteLoading isLoading={isLoading} message="Navigating..." />;
}

