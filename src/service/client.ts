import type {
  ImageClassificationResponse,
  TextClassificationResponse,
  AudioClassificationResponse,
  ObjectDetectionResponse,
  ImageSegmentationResponse,
  EmbeddingsResponse,
  SpeechToTextResponse,
  FillMaskResponse,
} from "./types";

const HF_INFERENCE_API_BASE = "https://router.huggingface.co/hf-inference/models";

/**
 * Hugging Face Inference API Client
 *
 * Supports tasks with predictable, fixed costs only.
 */
export class HuggingFaceClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    model: string,
    body: unknown,
    contentType: string = "application/json"
  ): Promise<T> {
    const url = `${HF_INFERENCE_API_BASE}/${model}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    };

    let requestBody: BodyInit;
    if (contentType === "application/json") {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(body);
    } else {
      // Binary data (image or audio)
      headers["Content-Type"] = contentType;
      requestBody = body as BodyInit;
    }

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: requestBody,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HuggingFace API error: ${response.status} - ${error}`);
    }

    // Check if response is binary (for image generation)
    const responseContentType = response.headers.get("Content-Type") || "";
    if (responseContentType.startsWith("image/")) {
      return response.blob() as unknown as T;
    }

    return response.json() as Promise<T>;
  }

  /**
   * Image Classification
   * Input: image (base64 or binary)
   * Output: array of {label, score}
   */
  async imageClassification(
    model: string,
    imageData: Uint8Array
  ): Promise<ImageClassificationResponse> {
    return this.request<ImageClassificationResponse>(
      model,
      imageData,
      "application/octet-stream"
    );
  }

  /**
   * Text Classification (Sentiment Analysis)
   * Input: text string
   * Output: array of array of {label, score}
   */
  async textClassification(
    model: string,
    text: string
  ): Promise<TextClassificationResponse> {
    return this.request<TextClassificationResponse>(model, { inputs: text });
  }

  /**
   * Audio Classification
   * Input: audio (binary)
   * Output: array of {label, score}
   */
  async audioClassification(
    model: string,
    audioData: Uint8Array
  ): Promise<AudioClassificationResponse> {
    return this.request<AudioClassificationResponse>(
      model,
      audioData,
      "application/octet-stream"
    );
  }

  /**
   * Object Detection
   * Input: image (binary)
   * Output: array of {label, score, box}
   */
  async objectDetection(
    model: string,
    imageData: Uint8Array
  ): Promise<ObjectDetectionResponse> {
    return this.request<ObjectDetectionResponse>(
      model,
      imageData,
      "application/octet-stream"
    );
  }

  /**
   * Image Segmentation
   * Input: image (binary)
   * Output: array of {label, score, mask}
   */
  async imageSegmentation(
    model: string,
    imageData: Uint8Array
  ): Promise<ImageSegmentationResponse> {
    return this.request<ImageSegmentationResponse>(
      model,
      imageData,
      "application/octet-stream"
    );
  }

  /**
   * Feature Extraction (Embeddings)
   * Input: text or array of texts
   * Output: embedding vector(s)
   */
  async featureExtraction(
    model: string,
    inputs: string | string[]
  ): Promise<EmbeddingsResponse> {
    return this.request<EmbeddingsResponse>(model, { inputs });
  }

  /**
   * Text to Image
   * Input: prompt text
   * Output: generated image (Blob)
   */
  async textToImage(
    model: string,
    prompt: string,
    parameters?: {
      negative_prompt?: string;
      height?: number;
      width?: number;
      num_inference_steps?: number;
      guidance_scale?: number;
    }
  ): Promise<Blob> {
    const body: Record<string, unknown> = { inputs: prompt };
    if (parameters) {
      body.parameters = parameters;
    }
    return this.request<Blob>(model, body);
  }

  /**
   * Image to Image
   * Input: image with optional prompt
   * Output: transformed image (Blob)
   */
  async imageToImage(
    model: string,
    imageData: Uint8Array,
    parameters?: {
      prompt?: string;
      negative_prompt?: string;
      num_inference_steps?: number;
      guidance_scale?: number;
      strength?: number;
    }
  ): Promise<Blob> {
    // For image-to-image, we need to send image as base64 in JSON
    const base64Image = btoa(
      String.fromCharCode.apply(null, Array.from(imageData))
    );
    const body: Record<string, unknown> = { inputs: base64Image };
    if (parameters) {
      body.parameters = parameters;
    }
    return this.request<Blob>(model, body);
  }

  /**
   * Automatic Speech Recognition (Speech to Text)
   * Input: audio (binary)
   * Output: {text, chunks?}
   */
  async automaticSpeechRecognition(
    model: string,
    audioData: Uint8Array
  ): Promise<SpeechToTextResponse> {
    return this.request<SpeechToTextResponse>(
      model,
      audioData,
      "application/octet-stream"
    );
  }

  /**
   * Fill Mask
   * Input: text with [MASK] token
   * Output: array of {sequence, score, token, token_str}
   */
  async fillMask(model: string, text: string): Promise<FillMaskResponse> {
    return this.request<FillMaskResponse>(model, { inputs: text });
  }
}
