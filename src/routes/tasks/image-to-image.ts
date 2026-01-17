import { Hono, MiddlewareHandler } from "hono";
import type { HonoEnv } from "../../x402";
import { HuggingFaceClient, DEFAULT_MODELS } from "../../service";

const DEFAULT_MODEL = DEFAULT_MODELS["image-to-image"];

export function createImageToImageRoute(
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

      // HF expects raw binary image data
      const imageData = new Uint8Array(await c.req.arrayBuffer());

      if (imageData.length === 0) {
        return c.json({ error: "Missing image data in request body" }, 400);
      }

      // For image-to-image, parameters can be passed via headers or query
      const prompt = c.req.header("X-Prompt") || c.req.query("prompt");
      const parameters = prompt ? { prompt } : undefined;

      const imageBlob = await client.imageToImage(model, imageData, parameters);

      // Return raw image binary like HF does
      return new Response(imageBlob, {
        headers: {
          "Content-Type": imageBlob.type || "image/png",
        },
      });
    } catch (error) {
      console.error("Image to image error:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        500
      );
    }
  });

  return router;
}
