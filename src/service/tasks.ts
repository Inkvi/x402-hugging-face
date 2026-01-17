import type { TaskType, ProhibitedTaskType } from "./types";

/**
 * Default models for each supported task
 */
export const DEFAULT_MODELS: Record<TaskType, string> = {
  "image-classification": "google/vit-base-patch16-224",
  "text-classification": "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
  "audio-classification": "MIT/ast-finetuned-audioset",
  "object-detection": "facebook/detr-resnet-50",
  "image-segmentation": "facebook/mask2former-swin-large-coco-panoptic",
  "embeddings": "thenlper/gte-large",
  "text-to-image": "black-forest-labs/FLUX.1-dev",
  "image-to-image": "lllyasviel/control_v11p_sd15_canny",
  "speech-to-text": "openai/whisper-large-v3",
  "fill-mask": "google-bert/bert-base-uncased",
};

/**
 * Task configuration with descriptions
 */
export const TASK_CONFIG: Record<
  TaskType,
  { description: string; inputType: string; outputType: string }
> = {
  "image-classification": {
    description: "Classify images into predefined categories",
    inputType: "image",
    outputType: "labels with confidence scores",
  },
  "text-classification": {
    description: "Classify text (sentiment analysis, topic classification)",
    inputType: "text",
    outputType: "labels with confidence scores",
  },
  "audio-classification": {
    description: "Classify audio into categories (speech, music, etc.)",
    inputType: "audio",
    outputType: "labels with confidence scores",
  },
  "object-detection": {
    description: "Detect objects in images with bounding boxes",
    inputType: "image",
    outputType: "detected objects with bounding boxes",
  },
  "image-segmentation": {
    description: "Segment images into distinct regions",
    inputType: "image",
    outputType: "segmentation masks",
  },
  "embeddings": {
    description: "Generate vector embeddings for text",
    inputType: "text or text array",
    outputType: "embedding vectors",
  },
  "text-to-image": {
    description: "Generate images from text prompts",
    inputType: "text prompt",
    outputType: "generated image",
  },
  "image-to-image": {
    description: "Transform images using AI models",
    inputType: "image with optional prompt",
    outputType: "transformed image",
  },
  "speech-to-text": {
    description: "Transcribe audio to text",
    inputType: "audio",
    outputType: "transcribed text",
  },
  "fill-mask": {
    description: "Predict masked tokens in text",
    inputType: "text with [MASK] token",
    outputType: "predicted tokens with scores",
  },
};

/**
 * Prohibited tasks with reasons
 */
export const PROHIBITED_TASKS: Record<ProhibitedTaskType, string> = {
  "chat-completion": "Output token count varies based on conversation",
  "text-generation": "Output length is unpredictable",
  "summarization": "Summary length depends on input content",
  "translation": "Translated text length varies",
  "question-answering": "Answer length is unpredictable",
  "text-to-video": "Video duration and complexity vary",
};

/**
 * Check if a task is prohibited
 */
export function isProhibitedTask(task: string): task is ProhibitedTaskType {
  return task in PROHIBITED_TASKS;
}

/**
 * Get default model for a task
 */
export function getDefaultModel(task: TaskType): string {
  return DEFAULT_MODELS[task];
}
