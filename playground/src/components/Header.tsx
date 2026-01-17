import { ConnectButton } from "@rainbow-me/rainbowkit";

const network = import.meta.env.VITE_NETWORK || "base-sepolia";

export function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-700">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">HuggingFace X402</h1>
        <span
          className={`px-2 py-1 text-xs rounded ${
            network === "base"
              ? "bg-green-600 text-white"
              : "bg-yellow-600 text-white"
          }`}
        >
          {network === "base" ? "Mainnet" : "Testnet"}
        </span>
      </div>
      <ConnectButton />
    </header>
  );
}
