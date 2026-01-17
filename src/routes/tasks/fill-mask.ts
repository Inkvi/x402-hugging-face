import { Hono, MiddlewareHandler } from "hono";
import type { HonoEnv } from "../../x402";
import { HuggingFaceClient, DEFAULT_MODELS } from "../../service";

const DEFAULT_MODEL = DEFAULT_MODELS["fill-mask"];

export function createFillMaskRoute(
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

      const body = (await c.req.json()) as { inputs: string };

      if (!body.inputs) {
        return c.json({ error: "Missing 'inputs' field" }, 400);
      }

      if (!body.inputs.includes("[MASK]")) {
        return c.json({ error: "Input must contain [MASK] token" }, 400);
      }

      const result = await client.fillMask(model, body.inputs);
      return c.json(result);
    } catch (error) {
      console.error("Fill mask error:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        500
      );
    }
  });

  return router;
}
