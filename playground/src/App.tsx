import { useState } from "react";
import { useAccount } from "wagmi";
import { Header, InputForm, ResultDisplay, TaskSelector } from "./components";
import { useX402Fetch } from "./hooks/useX402Fetch";
import { TaskType, TASKS } from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

function App() {
  const { isConnected } = useAccount();
  const { fetchWithPayment, isReady } = useX402Fetch();

  const [selectedTask, setSelectedTask] = useState<TaskType>("text-classification");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [priceCharged, setPriceCharged] = useState<string | null>(null);

  const handleTaskChange = (task: TaskType) => {
    setSelectedTask(task);
    setResult(null);
    setError(null);
    setTransactionHash(null);
    setPriceCharged(null);
  };

  const handleSubmit = async (data: { text?: string; file?: File; model?: string }) => {
    if (!fetchWithPayment) {
      setError("Wallet not connected");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setTransactionHash(null);
    setPriceCharged(null);

    try {
      const taskConfig = TASKS[selectedTask];
      // Use custom model or default
      const model = data.model || taskConfig.defaultModel;

      // HuggingFace-compatible endpoint: /models/{org}/{model}
      const endpoint = `${API_URL}/models/${model}`;

      const headers: Record<string, string> = {};
      let requestBody: BodyInit;

      if (data.file) {
        // HF-compatible: send raw binary for image/audio
        requestBody = await data.file.arrayBuffer();
      } else if (data.text) {
        // HF-compatible: JSON with { inputs: "..." }
        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify({ inputs: data.text });
      } else {
        throw new Error("No input provided");
      }

      const response = await fetchWithPayment(endpoint, {
        method: "POST",
        headers,
        body: requestBody,
      });

      // Extract payment info from response headers
      const txHash = response.headers.get("X-Payment-Transaction");
      const charged = response.headers.get("X-Price-Charged");

      if (txHash) setTransactionHash(txHash);
      if (charged) setPriceCharged(charged);

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || "Request failed");
        } catch {
          throw new Error(errorText || "Request failed");
        }
      }

      // Handle binary response (images and audio)
      const contentType = response.headers.get("Content-Type") || "";
      if (contentType.startsWith("image/")) {
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        setResult({ image: base64, contentType });
      } else if (contentType.startsWith("audio/")) {
        const blob = await response.blob();
        const base64 = await blobToBase64(blob);
        setResult({ audio: base64, contentType });
      } else {
        const responseData = await response.json();
        setResult(responseData);
      }
    } catch (err) {
      console.error("Request error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Header />

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Wallet connection prompt */}
        {!isConnected && (
          <div className="p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <p className="text-blue-300">
              Connect your wallet to use the API. Payments are made in USDC on Base.
            </p>
          </div>
        )}

        {/* Task selection */}
        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
          <TaskSelector
            selectedTask={selectedTask}
            onTaskChange={handleTaskChange}
          />
        </div>

        {/* Input form */}
        <div className="p-6 bg-gray-800/50 border border-gray-700 rounded-lg">
          <h2 className="text-lg font-semibold text-white mb-4">
            {TASKS[selectedTask].name}
          </h2>
          <InputForm
            task={selectedTask}
            onSubmit={handleSubmit}
            disabled={!isReady}
            isLoading={isLoading}
          />
        </div>

        {/* Result display */}
        <ResultDisplay
          task={selectedTask}
          result={result}
          error={error}
          transactionHash={transactionHash}
          priceCharged={priceCharged}
        />
      </main>
    </div>
  );
}

// Helper to convert blob to base64
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default App;
