/**
 * Cloudflare Worker environment bindings
 */
export interface Env {
  // Payment configuration
  PAYMENT_NETWORK: string;
  PAYMENT_ADDRESS: string;
  DEFAULT_PRICE: string;

  // Hugging Face API token
  HF_TOKEN: string;

  // Optional: Coinbase CDP facilitator credentials (mainnet)
  CDP_API_KEY_ID?: string;
  CDP_API_KEY_SECRET?: string;
}

/**
 * Payment context stored after successful verification
 */
export interface PaymentContext {
  amount: string;
  source: string;
  transactionHash?: string;
}

/**
 * Hono environment type with X402 payment context
 */
export interface HonoEnv {
  Bindings: Env;
  Variables: {
    "x402-payment"?: PaymentContext;
  };
}
