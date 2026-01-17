import { useState, useRef, useCallback } from "react";
import { TaskType, TASKS, InputType } from "../types";

interface InputFormProps {
  task: TaskType;
  onSubmit: (data: { text?: string; file?: File; model?: string }) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function InputForm({ task, onSubmit, disabled, isLoading }: InputFormProps) {
  const [textInput, setTextInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const taskConfig = TASKS[task];
  const inputType: InputType = taskConfig.inputType;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputType === "text" || inputType === "prompt") {
      if (textInput.trim()) {
        onSubmit({ text: textInput.trim(), model: model || undefined });
      }
    } else if (inputType === "image" || inputType === "audio") {
      if (file) {
        onSubmit({ file, model: model || undefined });
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const isValid =
    inputType === "text" || inputType === "prompt"
      ? textInput.trim().length > 0
      : file !== null;

  const renderInput = () => {
    if (inputType === "text" || inputType === "prompt") {
      return (
        <textarea
          id="input"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={taskConfig.placeholder}
          disabled={disabled || isLoading}
          rows={4}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg
                     text-white placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
      );
    }

    // File upload (image or audio)
    const acceptTypes = inputType === "image" ? "image/*" : "audio/*";

    return (
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
                    ${dragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-700 hover:border-gray-600"}
                    ${disabled || isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileChange}
          disabled={disabled || isLoading}
          className="hidden"
        />

        {file ? (
          <div className="space-y-2">
            <div className="text-green-400">
              {inputType === "image" ? (
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              )}
            </div>
            <p className="text-white font-medium">{file.name}</p>
            <p className="text-sm text-gray-400">
              {(file.size / 1024).toFixed(1)} KB
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-gray-400">
              {inputType === "image" ? (
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )}
            </div>
            <p className="text-gray-300">{taskConfig.placeholder}</p>
            <p className="text-sm text-gray-500">
              Drag and drop or click to select
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="input" className="block text-sm font-medium text-gray-300 mb-2">
          Input
        </label>
        {renderInput()}
      </div>

      {/* Optional model override */}
      <div>
        <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
          Model (optional)
        </label>
        <input
          id="model"
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder={`Default: ${taskConfig.defaultModel}`}
          disabled={disabled || isLoading}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg
                     text-white placeholder-gray-500 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </div>

      <button
        type="submit"
        disabled={disabled || isLoading || !isValid}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium
                   hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors duration-200"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          "Submit (Pay with USDC)"
        )}
      </button>
    </form>
  );
}
