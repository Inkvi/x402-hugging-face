import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import type { HonoEnv } from "./x402";
import { PricingEngine, defaultPricingPolicy } from "./pricing";
import { createPricingRouter } from "./routes";
import { createModelsRouter } from "./routes/models";

/**
 * X402 Hugging Face Inference API Proxy
 *
 * HuggingFace-compatible API with X402 payments.
 * Route: POST /models/{org}/{model}
 */
const app = new Hono<HonoEnv>();

// Global middleware
app.use("*", cors());
app.use("*", logger());

// Initialize the pricing engine
const pricingEngine = new PricingEngine(defaultPricingPolicy);

// =============================================================================
// PUBLIC ENDPOINTS (no payment required)
// =============================================================================

app.get("/", (c) => {
  return c.json({
    name: "X402 Hugging Face Inference API",
    version: "1.0.0",
    description: "HuggingFace-compatible API with X402 micropayments",
    usage: {
      endpoint: "POST /models/{org}/{model}",
      example: "POST /models/distilbert/distilbert-base-uncased-finetuned-sst-2-english",
      body: '{ "inputs": "I love this!" }',
    },
    pricing: "GET /pricing",
    payment: {
      network: "Base (mainnet or Sepolia testnet)",
      currency: "USDC",
      protocol: "X402",
    },
  });
});

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// =============================================================================
// PRICING ENDPOINTS
// =============================================================================
app.route("/pricing", createPricingRouter(pricingEngine));

// =============================================================================
// MODELS ENDPOINT (HuggingFace-compatible, paid)
// =============================================================================
app.route("/models", createModelsRouter(pricingEngine));

// =============================================================================
// ERROR HANDLING
// =============================================================================
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message,
    },
    500
  );
});

app.notFound((c) => {
  return c.json(
    {
      error: "Not Found",
      message: `Route ${c.req.method} ${c.req.path} not found`,
      hint: "Use POST /models/{org}/{model}",
    },
    404
  );
});

export default app;
