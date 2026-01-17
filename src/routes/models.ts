import { Hono } from "hono";
import type { HonoEnv } from "../x402";
import { createX402Middleware } from "../x402";
import { PricingEngine } from "../pricing";

const HF_API_BASE = "https://router.huggingface.co/hf-inference/models";

/**
 * HuggingFace-compatible /models route
 *
 * Matches HF API exactly:
 * POST /models/{org}/{model}
 */
export function createModelsRouter(pricingEngine: PricingEngine): Hono<HonoEnv> {
  const router = new Hono<HonoEnv>();

  const x402Middleware = createX402Middleware({
    pricingEngine,
    serviceDescription: "HuggingFace Inference API",
    // Extract model path for per-model pricing lookup
    getEndpoint: (c) => {
      const org = c.req.param("org");
      const model = c.req.param("model");
      return `${org}/${model}`;
    },
  });

  // POST /models/:org/:model - exact HF API match
  router.post("/:org/:model", x402Middleware, async (c) => {
    const env = c.env;
    const org = c.req.param("org");
    const model = c.req.param("model");
    const fullModel = `${org}/${model}`;

    try {
      // Get original request details
      const contentType = c.req.header("Content-Type") || "";
      const body = await c.req.arrayBuffer();

      // Forward to HuggingFace
      const hfResponse = await fetch(`${HF_API_BASE}/${fullModel}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.HF_TOKEN}`,
          "Content-Type": contentType,
        },
        body,
      });

      if (!hfResponse.ok) {
        const error = await hfResponse.text();
        return new Response(JSON.stringify({ error }), {
          status: hfResponse.status,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Return HF response as-is
      const responseContentType = hfResponse.headers.get("Content-Type") || "application/json";
      const responseBody = await hfResponse.arrayBuffer();

      return new Response(responseBody, {
        status: hfResponse.status,
        headers: {
          "Content-Type": responseContentType,
        },
      });
    } catch (error) {
      console.error("HuggingFace API error:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        500
      );
    }
  });

  return router;
}
