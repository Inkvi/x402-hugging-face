/**
 * Hugging Face Inference API Types
 *
 * Types for supported tasks with predictable, fixed costs.
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface HuggingFaceError {
  error: string;
  estimated_time?: number;
}

// =============================================================================
// IMAGE CLASSIFICATION
// =============================================================================

export interface ImageClassificationInput {
  model?: string;
  image: string; // base64 encoded image or URL
}

export interface ImageClassificationResult {
  label: string;
  score: number;
}

export type ImageClassificationResponse = ImageClassificationResult[];

// =============================================================================
// TEXT CLASSIFICATION
// =============================================================================

export interface TextClassificationInput {
  model?: string;
  inputs: string;
}

export interface TextClassificationResult {
  label: string;
  score: number;
}

export type TextClassificationResponse = TextClassificationResult[][];

// =============================================================================
// AUDIO CLASSIFICATION
// =============================================================================

export interface AudioClassificationInput {
  model?: string;
  audio: string; // base64 encoded audio
}

export interface AudioClassificationResult {
  label: string;
  score: number;
}

export type AudioClassificationResponse = AudioClassificationResult[];

// =============================================================================
// OBJECT DETECTION
// =============================================================================

export interface ObjectDetectionInput {
  model?: string;
  image: string; // base64 encoded image or URL
}

export interface ObjectDetectionResult {
  label: string;
  score: number;
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

export type ObjectDetectionResponse = ObjectDetectionResult[];

// =============================================================================
// IMAGE SEGMENTATION
// =============================================================================

export interface ImageSegmentationInput {
  model?: string;
  image: string; // base64 encoded image or URL
}

export interface ImageSegmentationResult {
  label: string;
  score: number;
  mask: string; // base64 encoded mask image
}

export type ImageSegmentationResponse = ImageSegmentationResult[];

// =============================================================================
// EMBEDDINGS (Feature Extraction)
// =============================================================================

export interface EmbeddingsInput {
  model?: string;
  inputs: string | string[];
  batch_size?: number;
}

export type EmbeddingsResponse = number[] | number[][];

// =============================================================================
// TEXT TO IMAGE
// =============================================================================

export interface TextToImageInput {
  model?: string;
  inputs: string; // prompt
  parameters?: {
    negative_prompt?: string;
    height?: number;
    width?: number;
    num_inference_steps?: number;
    guidance_scale?: number;
  };
}

// Response is binary image data (Blob)
export type TextToImageResponse = Blob;

// =============================================================================
// IMAGE TO IMAGE
// =============================================================================

export interface ImageToImageInput {
  model?: string;
  inputs: string; // base64 encoded image
  parameters?: {
    prompt?: string;
    negative_prompt?: string;
    num_inference_steps?: number;
    guidance_scale?: number;
    strength?: number;
  };
}

// Response is binary image data (Blob)
export type ImageToImageResponse = Blob;

// =============================================================================
// SPEECH TO TEXT (Automatic Speech Recognition)
// =============================================================================

export interface SpeechToTextInput {
  model?: string;
  audio: string; // base64 encoded audio
  duration_minutes?: number; // for pricing calculation
}

export interface SpeechToTextResponse {
  text: string;
  chunks?: Array<{
    text: string;
    timestamp: [number, number];
  }>;
}

// =============================================================================
// FILL MASK
// =============================================================================

export interface FillMaskInput {
  model?: string;
  inputs: string; // text with [MASK] token
}

export interface FillMaskResult {
  sequence: string;
  score: number;
  token: number;
  token_str: string;
}

export type FillMaskResponse = FillMaskResult[];

// =============================================================================
// TASK TYPE UNION
// =============================================================================

export type TaskType =
  | "image-classification"
  | "text-classification"
  | "audio-classification"
  | "object-detection"
  | "image-segmentation"
  | "embeddings"
  | "text-to-image"
  | "image-to-image"
  | "speech-to-text"
  | "fill-mask";

// Prohibited tasks (variable output costs)
export type ProhibitedTaskType =
  | "chat-completion"
  | "text-generation"
  | "summarization"
  | "translation"
  | "question-answering"
  | "text-to-video";
