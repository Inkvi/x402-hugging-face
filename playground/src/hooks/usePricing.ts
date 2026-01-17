import { useQuery } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

interface PricingResponse {
  price: string;
  priceUsd: string;
  currency: string;
  source: string;
  description?: string;
}

/**
 * Hook to fetch current pricing from the API
 *
 * Usage:
 * const { data: pricing, isLoading, error } = usePricing();
 */
export function usePricing() {
  return useQuery<PricingResponse>({
    queryKey: ["pricing"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/pricing`);
      if (!response.ok) {
        throw new Error("Failed to fetch pricing");
      }
      return response.json();
    },
    staleTime: 60_000, // Cache for 1 minute
  });
}

/**
 * Hook to calculate price for specific request parameters
 *
 * Usage:
 * const { data: pricing } = useCalculatePrice({ input: "test", options: {} });
 */
export function useCalculatePrice(body: Record<string, unknown>, enabled = true) {
  return useQuery<PricingResponse & { breakdown: unknown }>({
    queryKey: ["pricing", "calculate", body],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/pricing/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        throw new Error("Failed to calculate price");
      }
      return response.json();
    },
    enabled,
    staleTime: 30_000, // Cache for 30 seconds
  });
}
