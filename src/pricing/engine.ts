import type {
  PricingPolicy,
  PriceCalculationResult,
  EndpointPricing,
} from "./types";

/**
 * Pricing engine that calculates prices based on a hierarchical policy
 *
 * Priority (highest to lowest):
 * 1. Endpoint-specific pricing
 * 2. Category-based pricing
 * 3. Default price
 */
export class PricingEngine {
  private policy: PricingPolicy;

  constructor(policy: PricingPolicy) {
    this.policy = policy;
  }

  /**
   * Calculate price for a request
   *
   * @param input - Request parameters that may affect pricing
   * @param endpoint - Optional endpoint path for endpoint-specific pricing
   * @param category - Optional category for category-based pricing
   */
  calculatePrice(
    input: Record<string, unknown> = {},
    endpoint?: string,
    category?: string
  ): PriceCalculationResult {
    // 1. Check endpoint-specific pricing first
    if (endpoint && this.policy.endpoints?.[endpoint]) {
      return this.calculateEndpointPrice(endpoint, input);
    }

    // 2. Check category-based pricing
    if (category && this.policy.categories?.[category]) {
      const categoryPricing = this.policy.categories[category];
      return {
        price: categoryPricing.basePrice,
        breakdown: {
          source: `category:${category}`,
          basePrice: categoryPricing.basePrice,
          description: categoryPricing.description,
        },
      };
    }

    // 3. Fall back to default price
    return {
      price: this.policy.defaultPrice,
      breakdown: {
        source: "default",
        basePrice: this.policy.defaultPrice,
        description: "Default pricing",
      },
    };
  }

  /**
   * Calculate price for a specific endpoint with parameter adjustments
   */
  private calculateEndpointPrice(
    endpoint: string,
    input: Record<string, unknown>
  ): PriceCalculationResult {
    const pricing = this.policy.endpoints![endpoint];
    let price = BigInt(pricing.basePrice);
    const multipliers: Record<string, number> = {};
    const additions: Record<string, string> = {};

    // Apply parameter multipliers
    if (pricing.parameterMultipliers) {
      for (const [param, enabled] of Object.entries(pricing.parameterMultipliers)) {
        if (enabled && param in input) {
          const value = Number(input[param]);
          if (!isNaN(value) && value > 0) {
            price = price * BigInt(value);
            multipliers[param] = value;
          }
        }
      }
    }

    // Apply parameter additions
    if (pricing.parameterAdditions) {
      for (const [param, addAmount] of Object.entries(pricing.parameterAdditions)) {
        if (param in input && input[param]) {
          price = price + BigInt(addAmount);
          additions[param] = addAmount;
        }
      }
    }

    return {
      price: price.toString(),
      breakdown: {
        source: `endpoint:${endpoint}`,
        basePrice: pricing.basePrice,
        description: pricing.description,
        multipliers: Object.keys(multipliers).length > 0 ? multipliers : undefined,
        additions: Object.keys(additions).length > 0 ? additions : undefined,
      },
    };
  }

  /**
   * Get the current pricing policy (useful for debugging/display)
   */
  getPolicy(): PricingPolicy {
    return this.policy;
  }

  /**
   * Get pricing information for a specific endpoint
   */
  getEndpointPricing(endpoint: string): EndpointPricing | undefined {
    return this.policy.endpoints?.[endpoint];
  }

  /**
   * Update the pricing policy (useful for dynamic pricing)
   */
  updatePolicy(policy: PricingPolicy): void {
    this.policy = policy;
  }
}
