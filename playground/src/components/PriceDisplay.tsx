import { usePricing } from "../hooks/usePricing";

/**
 * Component to display current pricing
 */
export function PriceDisplay() {
  const { data: pricing, isLoading, error } = usePricing();

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg">
        <p className="text-gray-400">Loading pricing...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-900/50 rounded-lg">
        <p className="text-red-400">Failed to load pricing</p>
      </div>
    );
  }

  if (!pricing) {
    return null;
  }

  return (
    <div className="p-4 bg-gray-800 rounded-lg">
      <h3 className="text-sm font-medium text-gray-400 mb-2">Current Price</h3>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-white">{pricing.priceUsd}</span>
        <span className="text-sm text-gray-400">{pricing.currency}</span>
      </div>
      {pricing.description && (
        <p className="mt-1 text-sm text-gray-500">{pricing.description}</p>
      )}
    </div>
  );
}
