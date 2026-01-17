import { TaskType } from "../types";

interface ResultDisplayProps {
  task: TaskType;
  result: unknown;
  error?: string | null;
  transactionHash?: string | null;
  priceCharged?: string | null;
}

interface ClassificationItem {
  label: string;
  score: number;
}

interface ObjectDetectionItem {
  label: string;
  score: number;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
}

interface FillMaskItem {
  sequence: string;
  score: number;
  token_str: string;
}

export function ResultDisplay({
  task,
  result,
  error,
  transactionHash,
  priceCharged,
}: ResultDisplayProps) {
  if (error) {
    return (
      <div className="p-4 bg-red-900/50 border border-red-700 rounded-lg">
        <h3 className="text-sm font-medium text-red-400 mb-2">Error</h3>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const renderPaymentInfo = () => {
    if (!transactionHash && !priceCharged) return null;

    return (
      <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
        <h3 className="text-sm font-medium text-green-400 mb-2">Payment Successful</h3>
        {priceCharged && (
          <p className="text-sm text-green-300">
            Amount: ${(Number(priceCharged) / 1_000_000).toFixed(6)} USDC
          </p>
        )}
        {transactionHash && (
          <p className="text-sm text-green-300 break-all">
            Transaction:{" "}
            <a
              href={`https://sepolia.basescan.org/tx/${transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:underline"
            >
              {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
            </a>
          </p>
        )}
      </div>
    );
  };

  const renderClassificationResult = (items: ClassificationItem[]) => (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white font-medium">{item.label}</span>
              <span className="text-gray-400">{(item.score * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${item.score * 100}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderObjectDetectionResult = (items: ObjectDetectionItem[]) => (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">{item.label}</span>
            <span className="text-sm text-gray-400">
              {(item.score * 100).toFixed(1)}%
            </span>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            Box: ({Math.round(item.box.xmin)}, {Math.round(item.box.ymin)}) to (
            {Math.round(item.box.xmax)}, {Math.round(item.box.ymax)})
          </div>
        </div>
      ))}
    </div>
  );

  const renderImageResult = (data: { image: string; contentType?: string }) => (
    <div className="space-y-2">
      <p className="text-sm text-gray-400">Generated Image:</p>
      <img
        src={`data:${data.contentType || "image/png"};base64,${data.image}`}
        alt="Generated"
        className="max-w-full rounded-lg border border-gray-700"
      />
      <a
        href={`data:${data.contentType || "image/png"};base64,${data.image}`}
        download="generated-image.png"
        className="inline-block text-sm text-blue-400 hover:text-blue-300"
      >
        Download Image
      </a>
    </div>
  );

  const renderAudioResult = (data: { audio: string; contentType?: string }) => (
    <div className="space-y-2">
      <p className="text-sm text-gray-400">Generated Audio:</p>
      <audio
        controls
        src={`data:${data.contentType || "audio/wav"};base64,${data.audio}`}
        className="w-full"
      />
      <a
        href={`data:${data.contentType || "audio/wav"};base64,${data.audio}`}
        download="generated-audio.wav"
        className="inline-block text-sm text-blue-400 hover:text-blue-300"
      >
        Download Audio
      </a>
    </div>
  );

  const renderTranscriptionResult = (data: { text: string; chunks?: Array<{ text: string; timestamp: [number, number] }> }) => (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-400 mb-2">Transcription:</p>
        <p className="text-white bg-gray-700/50 p-4 rounded-lg">{data.text}</p>
      </div>
      {data.chunks && data.chunks.length > 0 && (
        <div>
          <p className="text-sm text-gray-400 mb-2">Timestamps:</p>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {data.chunks.map((chunk, index) => (
              <div key={index} className="flex gap-2 text-sm">
                <span className="text-gray-500 font-mono">
                  [{chunk.timestamp[0].toFixed(2)}s - {chunk.timestamp[1].toFixed(2)}s]
                </span>
                <span className="text-gray-300">{chunk.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderEmbeddingsResult = (embeddings: number[] | number[][]) => {
    const embeddingArray = Array.isArray(embeddings[0])
      ? embeddings as number[][]
      : [embeddings as number[]];

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Generated {embeddingArray.length} embedding(s) with {embeddingArray[0]?.length || 0} dimensions
        </p>
        <div className="max-h-40 overflow-y-auto bg-gray-700/50 p-3 rounded-lg">
          <pre className="text-xs text-gray-300 font-mono">
            [{embeddingArray[0]?.slice(0, 10).map(v => v.toFixed(6)).join(", ")}...]
          </pre>
        </div>
        <button
          onClick={() => {
            const blob = new Blob([JSON.stringify(embeddings)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "embeddings.json";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Download Embeddings (JSON)
        </button>
      </div>
    );
  };

  const renderFillMaskResult = (items: FillMaskItem[]) => (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="p-3 bg-gray-700/50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white font-medium">"{item.token_str}"</span>
            <span className="text-sm text-gray-400">
              {(item.score * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-sm text-gray-400">{item.sequence}</p>
        </div>
      ))}
    </div>
  );

  const renderTaskResult = () => {
    // HF returns raw results - no wrapper
    const data = result as unknown;

    switch (task) {
      case "text-classification": {
        // HF returns [[{label, score}, ...]]
        const items = data as ClassificationItem[][];
        return renderClassificationResult(items[0] || []);
      }

      case "image-classification":
      case "audio-classification": {
        // HF returns [{label, score}, ...]
        return renderClassificationResult(data as ClassificationItem[]);
      }

      case "object-detection":
        return renderObjectDetectionResult(data as ObjectDetectionItem[]);

      case "image-segmentation": {
        const segments = data as Array<{ label: string; score: number; mask: string }>;
        return (
          <div className="space-y-2">
            <p className="text-sm text-gray-400">
              Found {segments?.length || 0} segments
            </p>
            {renderClassificationResult(
              segments?.map((s) => ({
                label: s.label,
                score: s.score,
              })) || []
            )}
          </div>
        );
      }

      case "feature-extraction":
        return renderEmbeddingsResult(data as number[] | number[][]);

      case "text-to-image":
      case "image-to-image":
        return renderImageResult(data as { image: string; contentType?: string });

      case "automatic-speech-recognition":
        return renderTranscriptionResult(data as { text: string; chunks?: Array<{ text: string; timestamp: [number, number] }> });

      case "text-to-speech":
        return renderAudioResult(data as { audio: string; contentType?: string });

      case "fill-mask":
        return renderFillMaskResult(data as FillMaskItem[]);

      default:
        return (
          <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
            {JSON.stringify(result, null, 2)}
          </pre>
        );
    }
  };

  return (
    <div className="space-y-4">
      {renderPaymentInfo()}

      <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Result</h3>
        {renderTaskResult()}
      </div>
    </div>
  );
}
