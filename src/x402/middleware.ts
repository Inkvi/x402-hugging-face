import { Context, MiddlewareHandler, Next } from "hono";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { createFacilitatorConfig } from "@coinbase/x402";
import { PricingEngine } from "../pricing";
import type { HonoEnv } from "./types";

// USDC contract addresses on Base
const USDC_ADDRESSES: Record<string, `0x${string}`> = {
  "eip155:8453": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base Mainnet
  "eip155:84532": "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Base Sepolia
};

/**
 * Get USDC contract address for a given network
 */
export function getUsdcAddress(network: string): `0x${string}` {
  const address = USDC_ADDRESSES[network];
  if (!address) {
    throw new Error(`Unsupported network: ${network}. Only Base mainnet (eip155:8453) and Base Sepolia (eip155:84532) are supported.`);
  }
  return address;
}

/**
 * Options for creating the X402 middleware
 */
export interface X402MiddlewareOptions {
  /**
   * Pricing engine instance for calculating prices
   */
  pricingEngine: PricingEngine;

  /**
   * Description of the API service (shown in payment required response)
   */
  serviceDescription: string;

  /**
   * Optional function to extract the endpoint path for pricing lookup
   * Use this for dynamic routes like /models/:org/:model
   */
  getEndpoint?: (c: Context<HonoEnv>) => string;

  /**
   * Optional function to extract pricing input from request body
   * Override this if you need to calculate prices based on request parameters
   */
  extractPricingInput?: (body: unknown) => Record<string, unknown>;
}

/**
 * Create X402 payment verification middleware
 *
 * This middleware:
 * 1. Calculates the required payment amount using the pricing engine
 * 2. Returns 402 Payment Required if no payment signature is provided
 * 3. Verifies the payment signature with the facilitator
 * 4. Settles the payment after the request is processed
 * 5. Adds payment information headers to the response
 */
export function createX402Middleware(options: X402MiddlewareOptions): MiddlewareHandler<HonoEnv> {
  const { pricingEngine, serviceDescription, getEndpoint, extractPricingInput } = options;

  let facilitatorClient: HTTPFacilitatorClient | null = null;

  return async (c: Context<HonoEnv>, next: Next) => {
    const env = c.env;
    const network = (env.PAYMENT_NETWORK || "eip155:8453") as `${string}:${string}`;
    const payTo = env.PAYMENT_ADDRESS;

    // Check for payment header (v2: PAYMENT-SIGNATURE, v1: X-Payment)
    const paymentHeader = c.req.header("PAYMENT-SIGNATURE") || c.req.header("X-Payment");

    // Extract request body for pricing calculation
    let body: unknown = {};
    try {
      body = await c.req.json();
    } catch {
      // No body or invalid JSON - use empty object for pricing
    }

    // Calculate price based on endpoint (model path) if available
    const pricingInput = extractPricingInput ? extractPricingInput(body) : body as Record<string, unknown>;
    const endpoint = getEndpoint ? getEndpoint(c) : undefined;
    const priceResult = pricingEngine.calculatePrice(pricingInput, endpoint);

    // If no payment header, return 402 with payment requirements
    if (!paymentHeader) {
      const paymentRequired = {
        x402Version: 2,
        error: "Payment required",
        resource: {
          url: c.req.url,
          description: serviceDescription,
          mimeType: "application/json",
        },
        accepts: [
          {
            scheme: "exact",
            network,
            asset: getUsdcAddress(network),
            amount: priceResult.price,
            payTo,
            maxTimeoutSeconds: 60,
            extra: {
              // EIP-712 domain parameters for USDC on Base
              name: "USD Coin",
              version: "2",
            },
          },
        ],
      };

      // Encode for PAYMENT-REQUIRED header (v2 protocol)
      const paymentRequiredEncoded = btoa(JSON.stringify(paymentRequired));

      return new Response(JSON.stringify(paymentRequired), {
        status: 402,
        headers: {
          "Content-Type": "application/json",
          "PAYMENT-REQUIRED": paymentRequiredEncoded,
          "Access-Control-Expose-Headers": "PAYMENT-REQUIRED",
        },
      });
    }

    // Initialize facilitator client
    if (!facilitatorClient) {
      // Use Coinbase CDP facilitator if credentials provided, otherwise use free x402.org facilitator
      const facilitatorConfig =
        env.CDP_API_KEY_ID && env.CDP_API_KEY_SECRET
          ? createFacilitatorConfig(env.CDP_API_KEY_ID, env.CDP_API_KEY_SECRET)
          : { url: "https://x402.org/facilitator" };
      facilitatorClient = new HTTPFacilitatorClient(facilitatorConfig);
    }

    // Decode and verify payment
    try {
      const paymentPayload = JSON.parse(atob(paymentHeader));

      const paymentRequirements = {
        scheme: "exact" as const,
        network,
        asset: getUsdcAddress(network),
        amount: priceResult.price,
        payTo,
        maxTimeoutSeconds: 60,
        extra: {
          name: "USD Coin",
          version: "2",
        },
      };

      // Verify payment with facilitator
      const verifyResult = await facilitatorClient.verify(
        paymentPayload,
        paymentRequirements
      );

      if (!verifyResult.isValid) {
        return c.json(
          {
            error: "Payment verification failed",
            reason: verifyResult.invalidReason,
          },
          402
        );
      }

      // Store payment context for downstream use
      c.set("x402-payment", {
        amount: priceResult.price,
        source: priceResult.breakdown.source,
      });

      // Add price info to response headers
      c.header("X-Price-Charged", priceResult.price);
      c.header("X-Price-Source", priceResult.breakdown.source);

      // Continue to handler
      await next();

      // Settle payment after successful response
      try {
        const settleResult = await facilitatorClient.settle(
          paymentPayload,
          paymentRequirements
        );

        if (settleResult.success) {
          c.header("X-Payment-Transaction", settleResult.transaction);
          c.header("X-Payment-Network", settleResult.network);
        }
      } catch (settleError) {
        console.error("Settlement failed:", settleError);
        // Don't fail the request if settlement fails - payment was verified
      }

      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Payment processing failed";
      return c.json({ error: message }, 402);
    }
  };
}
