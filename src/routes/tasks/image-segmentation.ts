import { Hono, MiddlewareHandler } from "hono";
import type { HonoEnv } from "../../x402";
import { HuggingFaceClient, DEFAULT_MODELS } from "../../service";

const DEFAULT_MODEL = DEFAULT_MODELS["image-segmentation"];

export function createImageSegmentationRoute(
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

      const result = await client.imageSegmentation(model, imageData);
      return c.json(result);
    } catch (error) {
      console.error("Image segmentation error:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        500
      );
    }
  });

  return router;
}
