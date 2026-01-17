import { Hono, MiddlewareHandler } from "hono";
import type { HonoEnv } from "../../x402";
import { HuggingFaceClient, DEFAULT_MODELS } from "../../service";

const DEFAULT_MODEL = DEFAULT_MODELS["speech-to-text"];

export function createSpeechToTextRoute(
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

      // HF expects raw binary audio data
      const audioData = new Uint8Array(await c.req.arrayBuffer());

      if (audioData.length === 0) {
        return c.json({ error: "Missing audio data in request body" }, 400);
      }

      const result = await client.automaticSpeechRecognition(model, audioData);
      return c.json(result);
    } catch (error) {
      console.error("Speech to text error:", error);
      return c.json(
        { error: error instanceof Error ? error.message : "Unknown error" },
        500
      );
    }
  });

  return router;
}
