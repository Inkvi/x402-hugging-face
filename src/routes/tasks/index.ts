import { Hono } from "hono";
import type { HonoEnv } from "../../x402";
import { createX402Middleware } from "../../x402";
import { PricingEngine } from "../../pricing";
import { PROHIBITED_TASKS, TASK_CONFIG, DEFAULT_MODELS } from "../../service";

// Import task routes
import { createImageClassificationRoute } from "./image-classification";
import { createTextClassificationRoute } from "./text-classification";
import { createAudioClassificationRoute } from "./audio-classification";
import { createObjectDetectionRoute } from "./object-detection";
import { createImageSegmentationRoute } from "./image-segmentation";
import { createEmbeddingsRoute } from "./embeddings";
import { createTextToImageRoute } from "./text-to-image";
import { createImageToImageRoute } from "./image-to-image";
import { createSpeechToTextRoute } from "./speech-to-text";
import { createFillMaskRoute } from "./fill-mask";

/**
 * Create task routes with X402 payment middleware
 */
export function createTaskRoutes(pricingEngine: PricingEngine): Hono<HonoEnv> {
  const router = new Hono<HonoEnv>();

  // Middleware to block prohibited tasks
  const prohibitedTaskMiddleware = async (c: any, next: any) => {
    const path = c.req.path;
    const taskName = path.split("/").pop();

    if (taskName && taskName in PROHIBITED_TASKS) {
      return c.json(
        {
          error: "Task not supported",
          task: taskName,
          reason: PROHIBITED_TASKS[taskName as keyof typeof PROHIBITED_TASKS],
          message:
            "This task has unpredictable output costs and is not supported. " +
            "Only tasks with fixed, predictable pricing are available.",
          supportedTasks: Object.keys(TASK_CONFIG),
        },
        403
      );
    }

    await next();
  };

  // Apply prohibited task middleware to all routes
  router.use("*", prohibitedTaskMiddleware);

  // Create X402 middleware factory
  const createTaskMiddleware = (endpoint: string) =>
    createX402Middleware({
      pricingEngine,
      serviceDescription: `Hugging Face ${endpoint.replace("/v1/", "")}`,
    });

  // Mount task routes
  router.route(
    "/image-classification",
    createImageClassificationRoute(createTaskMiddleware("/v1/image-classification"))
  );
  router.route(
    "/text-classification",
    createTextClassificationRoute(createTaskMiddleware("/v1/text-classification"))
  );
  router.route(
    "/audio-classification",
    createAudioClassificationRoute(createTaskMiddleware("/v1/audio-classification"))
  );
  router.route(
    "/object-detection",
    createObjectDetectionRoute(createTaskMiddleware("/v1/object-detection"))
  );
  router.route(
    "/image-segmentation",
    createImageSegmentationRoute(createTaskMiddleware("/v1/image-segmentation"))
  );
  router.route(
    "/embeddings",
    createEmbeddingsRoute(createTaskMiddleware("/v1/embeddings"))
  );
  router.route(
    "/text-to-image",
    createTextToImageRoute(createTaskMiddleware("/v1/text-to-image"))
  );
  router.route(
    "/image-to-image",
    createImageToImageRoute(createTaskMiddleware("/v1/image-to-image"))
  );
  router.route(
    "/speech-to-text",
    createSpeechToTextRoute(createTaskMiddleware("/v1/speech-to-text"))
  );
  router.route(
    "/fill-mask",
    createFillMaskRoute(createTaskMiddleware("/v1/fill-mask"))
  );

  // List available tasks
  router.get("/", (c) => {
    const tasks = Object.entries(TASK_CONFIG).map(([task, config]) => ({
      task,
      endpoint: `/v1/${task}`,
      description: config.description,
      inputType: config.inputType,
      outputType: config.outputType,
      defaultModel: DEFAULT_MODELS[task as keyof typeof DEFAULT_MODELS],
    }));

    return c.json({
      tasks,
      prohibitedTasks: Object.entries(PROHIBITED_TASKS).map(([task, reason]) => ({
        task,
        reason,
      })),
    });
  });

  return router;
}
