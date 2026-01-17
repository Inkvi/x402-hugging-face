import { Hono, MiddlewareHandler } from "hono";
import type { HonoEnv } from "../../x402";
import { HuggingFaceClient, DEFAULT_MODELS } from "../../service";

const DEFAULT_MODEL = DEFAULT_MODELS["text-to-image"];

export function createTextToImageRoute(
  x402Middleware: MiddlewareHandler<HonoEnv>
): Hono<HonoEnv> {
  const router = new Hono<HonoEnv>();

  router.post("/:org?/:model?", x402Middleware, async (c) => {
    const env = c.env;
    const client = new HuggingFaceClient(env.HF_TOKEN);

    try {
      const org = c.req.param("org");
      const modelName = c.req.param("model");
      const model = org && modelName ? `${org}/${modelName}` : DEFAULT_MODEL;

      const body = (await c.req.json()) as {
        inputs: string;
        parameters?: {
          negative_prompt?: string;
          height?: number;
          width?: number;
          num_inference_steps?: number;
          guidance_scale?: number;
        };
      };

      if (!body.inputs) {
        return c.json({ error: "Missing 'inputs' field (prompt)" }, 400);
      }

      const imageBlob = await client.textToImage(
        model,
        body.inputs,
        body.parameters
      );

      // Return raw image binary like HF does
      return new Response(imageBlob, {
        headers: {
          "Content-Type": imageBlob.type || "image/png",
        },
      });
    } catch (error) {
      console.error("Text to image error:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        500
      );
    }
  });

  return router;
}
