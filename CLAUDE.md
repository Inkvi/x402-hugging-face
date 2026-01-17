# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Worker (root directory)
```bash
npm run dev              # Start local dev server at http://localhost:8787
npm run typecheck        # Type check without emitting
npm run deploy:testnet   # Deploy to Base Sepolia
npm run deploy:mainnet   # Deploy to Base mainnet
```

### Playground (playground/ directory)
```bash
npm run dev              # Start Vite dev server
npm run typecheck        # Type check
npm run build            # Build for production
npm run deploy:testnet   # Deploy to Cloudflare Pages (testnet)
npm run deploy:mainnet   # Deploy to Cloudflare Pages (mainnet)
```

### Secrets Management
```bash
wrangler secret put API_KEY --env testnet
wrangler secret put API_KEY --env mainnet
```

## Architecture

This is a template for wrapping Web2 APIs with X402 payment protocol on Cloudflare Workers.

### Worker Structure
- **`src/index.ts`** - Hono app entry point, mounts routers
- **`src/x402/middleware.ts`** - Custom X402 payment middleware (verify → execute → settle)
- **`src/pricing/engine.ts`** - Hierarchical pricing: endpoint → category → default
- **`src/pricing/policy.ts`** - Price configuration (CUSTOMIZE THIS)
- **`src/service/client.ts`** - API wrapper template (CUSTOMIZE THIS)
- **`src/routes/service.ts`** - Paid endpoints (CUSTOMIZE THIS)

### Pricing Options
**Simple fixed price**: Just set `DEFAULT_PRICE` in `wrangler.toml` (e.g., "10000" = $0.01)

**Alternative**: For static per-route pricing, `@x402/hono` has a built-in `paymentMiddleware` that's simpler:
```typescript
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
app.use(paymentMiddleware({ "POST /v1/process": { accepts: { price: "$0.01", ... } } }, resourceServer));
```

The custom `PricingEngine` is useful for dynamic pricing based on request parameters.

### Payment Flow
1. Request without `PAYMENT-SIGNATURE` header → 402 with `PAYMENT-REQUIRED` header
2. Client signs EIP-712 payment authorization
3. Request with signature → verify with facilitator → execute handler → settle on-chain
4. Response includes `X-Price-Charged`, `X-Payment-Transaction` headers

### Playground Structure
- **`src/hooks/useX402Fetch.ts`** - Wraps fetch with wallet payment signing via wagmi
- **`src/hooks/usePricing.ts`** - React Query hook for pricing endpoint
- **`src/config/wagmi.ts`** - RainbowKit + Wagmi config for Base networks

### Networks
- Base Mainnet: `eip155:8453`
- Base Sepolia: `eip155:84532`

### USDC Addresses
- Mainnet: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

### Facilitators
- Free: `https://x402.org/facilitator`
- Coinbase CDP: Configured via `CDP_API_KEY_ID` and `CDP_API_KEY_SECRET` env vars

## Key Customization Points

Files marked with `// CUSTOMIZE` comments:
1. `src/service/client.ts` - Wrap your upstream API
2. `src/pricing/policy.ts` - Set your prices (in USDC atomic units, 1 USDC = 1000000)
3. `src/routes/service.ts` - Define your paid endpoints
4. `wrangler.toml` - Set `PAYMENT_ADDRESS` and project name
5. `playground/src/App.tsx` - Build UI for your specific API
