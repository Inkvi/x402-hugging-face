/**
 * Result of price calculation
 */
export interface PriceCalculationResult {
  /**
   * Final price in USDC atomic units (1 USDC = 1,000,000 units)
   */
  price: string;

  /**
   * Breakdown of how the price was calculated
   */
  breakdown: PriceBreakdown;
}

/**
 * Breakdown details of price calculation
 */
export interface PriceBreakdown {
  /**
   * Source of the price (e.g., "endpoint", "category", "default")
   */
  source: string;

  /**
   * Base price before multipliers/additions
   */
  basePrice: string;

  /**
   * Description of the pricing rule applied
   */
  description?: string;

  /**
   * Parameter multipliers applied (if any)
   */
  multipliers?: Record<string, number>;

  /**
   * Parameter additions applied (if any)
   */
  additions?: Record<string, string>;
}

/**
 * Configuration for endpoint-specific pricing
 */
export interface EndpointPricing {
  /**
   * Base price in USDC atomic units
   */
  basePrice: string;

  /**
   * Optional description
   */
  description?: string;

  /**
   * Parameter multipliers - multiply base price by parameter value
   * Example: { "num_outputs": true } multiplies price by num_outputs param
   */
  parameterMultipliers?: Record<string, boolean>;

  /**
   * Parameter additions - add fixed amount based on parameter value
   * Example: { "high_quality": "50000" } adds $0.05 if high_quality param is true
   */
  parameterAdditions?: Record<string, string>;
}

/**
 * Category-based pricing configuration
 */
export interface CategoryPricing {
  /**
   * Base price for this category in USDC atomic units
   */
  basePrice: string;

  /**
   * Description of the category
   */
  description?: string;
}

/**
 * Complete pricing policy configuration
 */
export interface PricingPolicy {
  /**
   * Default price if no specific rule matches
   */
  defaultPrice: string;

  /**
   * Endpoint-specific pricing (highest priority)
   */
  endpoints?: Record<string, EndpointPricing>;

  /**
   * Category-based pricing (medium priority)
   */
  categories?: Record<string, CategoryPricing>;
}
