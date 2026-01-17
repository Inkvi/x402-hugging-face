/**
 * Hugging Face Playground Type Definitions
 */

export type TaskType =
  | "text-classification"
  | "image-classification"
  | "audio-classification"
  | "object-detection"
  | "image-segmentation"
  | "feature-extraction"
  | "text-to-image"
  | "image-to-image"
  | "automatic-speech-recognition"
  | "text-to-speech"
  | "fill-mask";

export type InputType = "text" | "image" | "audio" | "prompt";

export interface TaskConfig {
  name: string;
  inputType: InputType;
  description: string;
  placeholder: string;
  defaultModel: string;
}

export const TASKS: Record<TaskType, TaskConfig> = {
  "text-classification": {
    name: "Text Classification",
    inputType: "text",
    description: "Classify text (sentiment analysis)",
    placeholder: "Enter text to classify sentiment...",
    defaultModel: "distilbert/distilbert-base-uncased-finetuned-sst-2-english",
  },
  "image-classification": {
    name: "Image Classification",
    inputType: "image",
    description: "Classify images into categories",
    placeholder: "Upload an image to classify",
    defaultModel: "google/vit-base-patch16-224",
  },
  "audio-classification": {
    name: "Audio Classification",
    inputType: "audio",
    description: "Classify audio into categories",
    placeholder: "Upload audio to classify",
    defaultModel: "MIT/ast-finetuned-audioset-10-10-0.4593",
  },
  "object-detection": {
    name: "Object Detection",
    inputType: "image",
    description: "Detect objects with bounding boxes",
    placeholder: "Upload an image to detect objects",
    defaultModel: "facebook/detr-resnet-50",
  },
  "image-segmentation": {
    name: "Image Segmentation",
    inputType: "image",
    description: "Segment images into regions",
    placeholder: "Upload an image to segment",
    defaultModel: "facebook/mask2former-swin-large-coco-panoptic",
  },
  "feature-extraction": {
    name: "Embeddings",
    inputType: "text",
    description: "Generate text embeddings",
    placeholder: "Enter text to generate embeddings...",
    defaultModel: "sentence-transformers/all-MiniLM-L6-v2",
  },
  "text-to-image": {
    name: "Text to Image",
    inputType: "prompt",
    description: "Generate images from text",
    placeholder: "Describe the image you want to generate...",
    defaultModel: "black-forest-labs/FLUX.1-dev",
  },
  "image-to-image": {
    name: "Image to Image",
    inputType: "image",
    description: "Transform images with AI",
    placeholder: "Upload an image to transform",
    defaultModel: "lllyasviel/control_v11p_sd15_canny",
  },
  "automatic-speech-recognition": {
    name: "Speech to Text",
    inputType: "audio",
    description: "Transcribe audio to text",
    placeholder: "Upload audio to transcribe",
    defaultModel: "openai/whisper-large-v3",
  },
  "text-to-speech": {
    name: "Text to Speech",
    inputType: "text",
    description: "Generate speech from text",
    placeholder: "Enter text to convert to speech...",
    defaultModel: "facebook/mms-tts-eng",
  },
  "fill-mask": {
    name: "Fill Mask",
    inputType: "text",
    description: "Predict masked tokens",
    placeholder: "Enter text with [MASK] token, e.g. 'The capital of France is [MASK].'",
    defaultModel: "google-bert/bert-base-uncased",
  },
};

/**
 * Pricing information
 */
export interface Pricing {
  price: string;
  priceUsd: string;
  currency: string;
  source: string;
  description?: string;
}
