import type { PricingPolicy } from "./types";

/**
 * Hugging Face Inference API Pricing Policy
 *
 * All prices are in USDC atomic units (1 USDC = 1,000,000 units)
 *
 * Per-model pricing with 50% markup over estimated HF costs.
 * Models not listed here will use the default price.
 */
export const defaultPricingPolicy: PricingPolicy = {
  // Default price for unlisted models ($0.01)
  defaultPrice: "10000",

  // Per-model pricing (endpoint key = "org/model")
  endpoints: {
    // Text Classification - $0.0015
    "distilbert/distilbert-base-uncased-finetuned-sst-2-english": {
      basePrice: "1500",
      description: "Text classification (sentiment analysis)",
    },

    // Image Classification - $0.003
    "google/vit-base-patch16-224": {
      basePrice: "3000",
      description: "Image classification",
    },

    // Audio Classification - $0.003
    "MIT/ast-finetuned-audioset-10-10-0.4593": {
      basePrice: "3000",
      description: "Audio classification",
    },

    // Object Detection - $0.0075
    "facebook/detr-resnet-50": {
      basePrice: "7500",
      description: "Object detection with bounding boxes",
    },

    // Image Segmentation - $0.015
    "facebook/mask2former-swin-large-coco-panoptic": {
      basePrice: "15000",
      description: "Image segmentation",
    },

    // Embeddings - $0.0003
    "sentence-transformers/all-MiniLM-L6-v2": {
      basePrice: "300",
      description: "Text embeddings",
    },
    "thenlper/gte-large": {
      basePrice: "300",
      description: "Text embeddings",
    },

    // Text to Image - $0.03
    "black-forest-labs/FLUX.1-dev": {
      basePrice: "30000",
      description: "Text to image generation",
    },
    "stabilityai/stable-diffusion-xl-base-1.0": {
      basePrice: "30000",
      description: "Text to image generation",
    },

    // Image to Image - $0.03
    "lllyasviel/control_v11p_sd15_canny": {
      basePrice: "30000",
      description: "Image to image transformation",
    },

    // Speech to Text - $0.015
    "openai/whisper-large-v3": {
      basePrice: "15000",
      description: "Automatic speech recognition",
    },
    "openai/whisper-small": {
      basePrice: "7500",
      description: "Automatic speech recognition (small)",
    },

    // Fill Mask - $0.00075
    "google-bert/bert-base-uncased": {
      basePrice: "750",
      description: "Fill mask token prediction",
    },
  },

  categories: {},
};
