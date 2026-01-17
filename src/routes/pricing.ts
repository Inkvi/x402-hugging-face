import { Hono } from "hono";
import type { HonoEnv } from "../x402";
import { PricingEngine } from "../pricing";

/**
 * Create pricing routes
 *
 * These routes allow clients to query pricing information
 * before making paid requests.
 */
export function createPricingRouter(pricingEngine: PricingEngine): Hono<HonoEnv> {
  const router = new Hono<HonoEnv>();

  /**
   * GET /pricing
   *
   * Get the current price for the default operation
   */
  router.get("/", (c) => {
    const result = pricingEngine.calculatePrice();

    // Convert atomic units to human-readable USD
    const priceUsd = (Number(result.price) / 1_000_000).toFixed(6);

    return c.json({
      price: result.price,
      priceUsd: `$${priceUsd}`,
      currency: "USDC",
      source: result.breakdown.source,
      description: result.breakdown.description,
    });
  });

  /**
   * POST /pricing/calculate
   *
   * Calculate price for a specific request body
   * Useful for clients to preview the price before making a paid request
   */
  router.post("/calculate", async (c) => {
    let body: Record<string, unknown> = {};
    try {
      body = await c.req.json();
    } catch {
      // Empty or invalid body
    }

    const endpoint = c.req.query("endpoint");
    const category = c.req.query("category");

    const result = pricingEngine.calculatePrice(body, endpoint || undefined, category || undefined);

    const priceUsd = (Number(result.price) / 1_000_000).toFixed(6);

    return c.json({
      price: result.price,
      priceUsd: `$${priceUsd}`,
      currency: "USDC",
      breakdown: result.breakdown,
    });
  });

  /**
   * GET /pricing/policy
   *
   * Get the full pricing policy (for transparency)
   */
  router.get("/policy", (c) => {
    return c.json(pricingEngine.getPolicy());
  });

  return router;
}
