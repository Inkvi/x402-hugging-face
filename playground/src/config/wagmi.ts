import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia, base } from "wagmi/chains";

const network = import.meta.env.VITE_NETWORK || "base-sepolia";

// Select chain based on environment
const chains = network === "base" ? [base] as const : [baseSepolia] as const;

export const wagmiConfig = getDefaultConfig({
  appName: "X402 API Playground", // CUSTOMIZE: Your app name
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo",
  chains,
  ssr: false,
});

export { chains };
