import { useMemo } from "react";
import { useWalletClient } from "wagmi";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";

const network = import.meta.env.VITE_NETWORK || "base-sepolia";
const networkId = network === "base" ? "eip155:8453" : "eip155:84532";

/**
 * Hook that provides a fetch function wrapped with X402 payment signing
 *
 * Usage:
 * const { fetchWithPayment, isReady } = useX402Fetch();
 *
 * // Make a paid request
 * const response = await fetchWithPayment("https://api.example.com/v1/process", {
 *   method: "POST",
 *   body: JSON.stringify({ input: "hello" }),
 * });
 */
export function useX402Fetch() {
  const { data: walletClient } = useWalletClient();

  const fetchWithPayment = useMemo(() => {
    if (!walletClient) {
      return null;
    }

    const x402 = new x402Client().register(
      networkId,
      new ExactEvmScheme({
        address: walletClient.account.address,
        signTypedData: async (args) => {
          return walletClient.signTypedData({
            account: walletClient.account,
            domain: args.domain as Parameters<
              typeof walletClient.signTypedData
            >[0]["domain"],
            types: args.types as Parameters<
              typeof walletClient.signTypedData
            >[0]["types"],
            primaryType: args.primaryType,
            message: args.message as Parameters<
              typeof walletClient.signTypedData
            >[0]["message"],
          });
        },
      })
    );

    return wrapFetchWithPayment(fetch, x402);
  }, [walletClient]);

  return {
    fetchWithPayment,
    isReady: !!walletClient,
  };
}
