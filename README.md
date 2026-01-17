# X402 API Proxy Template

A template for creating X402 payment-enabled API proxies on Cloudflare Workers. Wrap any Web2 API with blockchain-based pay-per-request authentication using USDC on Base.

## Features

- **X402 Payment Protocol**: Automatic payment verification and settlement
- **USDC on Base**: Payments in USDC stablecoin on Base mainnet or Sepolia testnet
- **Flexible Pricing**: Hierarchical pricing engine (endpoint → category → default)
- **Cloudflare Workers**: Edge deployment for low latency
- **TypeScript**: Full type safety throughout
- **Hono Framework**: Lightweight, fast web framework
- **Playground Included**: React frontend with wallet integration

## Quick Start

### 1. Clone and Setup

```bash
# Clone the template
git clone https://github.com/your-org/x402-proxy-template.git my-api-proxy
cd my-api-proxy

# Install dependencies
npm install

# Copy environment template
cp .dev.vars.example .dev.vars
```

### 2. Configure Your API

1. **Update `wrangler.toml`**:
   - Change `name` to your project name
   - Set your `PAYMENT_ADDRESS` (wallet to receive payments)
   - Set your `DEFAULT_PRICE`

2. **Customize the service client** in `src/service/client.ts`:
   - Update `baseUrl` to your API's base URL
   - Implement your API methods (process, getStatus, etc.)
   - Update type definitions in `src/service/types.ts`

3. **Configure pricing** in `src/pricing/policy.ts`:
   - Set endpoint-specific prices
   - Define category-based pricing
   - Adjust default price

4. **Update routes** in `src/routes/service.ts`:
   - Modify endpoints for your API
   - Update request/response handling

### 3. Set API Key

```bash
# For local development, edit .dev.vars
API_KEY=your_api_key_here

# For production, use wrangler secrets
wrangler secret put API_KEY --env testnet
wrangler secret put API_KEY --env mainnet
```

### 4. Run Locally

```bash
npm run dev
```

The API will be available at `http://localhost:8787`.

### 5. Deploy

```bash
# Deploy to testnet (Base Sepolia)
npm run deploy:testnet

# Deploy to mainnet (Base)
npm run deploy:mainnet
```

## Project Structure

```
├── src/
│   ├── index.ts              # Main Hono app entry point
│   ├── x402/
│   │   ├── middleware.ts     # X402 payment verification middleware
│   │   └── types.ts          # Environment & type definitions
│   ├── pricing/
│   │   ├── engine.ts         # Pricing calculation engine
│   │   ├── policy.ts         # Pricing configuration (CUSTOMIZE)
│   │   └── types.ts          # Pricing types
│   ├── service/
│   │   ├── client.ts         # Your API client (CUSTOMIZE)
│   │   └── types.ts          # Service types (CUSTOMIZE)
│   └── routes/
│       ├── pricing.ts        # Pricing endpoints
│       └── service.ts        # Service endpoints (CUSTOMIZE)
├── playground/               # React frontend
│   ├── src/
│   │   ├── App.tsx          # Main app (CUSTOMIZE)
│   │   ├── components/      # UI components
│   │   ├── hooks/           # X402 & pricing hooks
│   │   └── config/          # Wagmi/wallet config
│   └── ...
├── wrangler.toml            # Cloudflare Workers config
└── package.json
```

## Customization Guide

### Service Client

Edit `src/service/client.ts` to wrap your API:

```typescript
export class ServiceClient {
  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || "https://api.your-service.com";
  }

  async yourMethod(input: YourInput): Promise<YourResponse> {
    const response = await fetch(`${this.baseUrl}/your-endpoint`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });
    return response.json();
  }
}
```

### Pricing Policy

Edit `src/pricing/policy.ts` to set your prices:

```typescript
export const defaultPricingPolicy: PricingPolicy = {
  defaultPrice: "100000", // $0.10 USDC

  endpoints: {
    "/v1/expensive": {
      basePrice: "500000", // $0.50
      description: "Premium feature",
    },
  },

  categories: {
    "basic": { basePrice: "50000" },    // $0.05
    "premium": { basePrice: "200000" }, // $0.20
  },
};
```

### Routes

Edit `src/routes/service.ts` to define your endpoints:

```typescript
router.post("/your-endpoint", x402Middleware, async (c) => {
  const client = new ServiceClient(c.env.API_KEY);
  const body = await c.req.json();
  const result = await client.yourMethod(body);
  return c.json(result);
});
```

## API Endpoints

### Public (No Payment Required)

- `GET /` - API information
- `GET /health` - Health check
- `GET /pricing` - Current pricing
- `POST /pricing/calculate` - Calculate price for request
- `GET /pricing/policy` - Full pricing policy

### Paid (X402 Payment Required)

- `POST /v1/process` - Main paid endpoint (customize this)
- `GET /v1/status/:id` - Get operation status (free)
- `POST /v1/cancel/:id` - Cancel operation (free)

## Payment Flow

1. Client makes request without payment
2. Server returns `402 Payment Required` with payment requirements
3. Client signs payment authorization with wallet (EIP-712)
4. Client retries request with `PAYMENT-SIGNATURE` header
5. Server verifies payment with facilitator
6. Server processes request
7. Server settles payment on-chain
8. Response includes payment confirmation headers

## Pricing Architecture

This template includes a custom pricing engine that supports hierarchical pricing (endpoint → category → default) with parameter-based multipliers. This was designed for complex use cases like AI model APIs where different operations have different costs.

### Simple Fixed Price (Most Common)

For most APIs with a single fixed price, you don't need the full pricing engine. Just set `DEFAULT_PRICE` in `wrangler.toml`:

```toml
DEFAULT_PRICE = "10000"  # $0.01 USDC (1 USDC = 1,000,000 atomic units)
```

The pricing engine will return this default for all requests.

### Alternative: Using `@x402/hono` Built-in Middleware

For simple static pricing, you can use the `paymentMiddleware` from `@x402/hono` directly instead of the custom middleware in this template. It provides a declarative route-based configuration:

```typescript
import { paymentMiddleware, x402ResourceServer } from "@x402/hono";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";

const facilitatorClient = new HTTPFacilitatorClient({ url: "https://x402.org/facilitator" });
const resourceServer = new x402ResourceServer(facilitatorClient)
  .register("eip155:84532", new ExactEvmScheme());

app.use(
  paymentMiddleware(
    {
      "POST /v1/process": {
        accepts: {
          scheme: "exact",
          price: "$0.01",  // Human-readable price
          network: "eip155:84532",
          payTo: "0xYourAddress",
        },
        description: "API access",
      },
    },
    resourceServer,
  ),
);
```

This approach is simpler when you have:
- Fixed prices per endpoint
- No dynamic pricing based on request parameters
- Multiple endpoints with different static prices

### When to Use the Custom Pricing Engine

The custom `PricingEngine` in this template is useful when you need:
- **Dynamic pricing** based on request parameters (e.g., image size, token count)
- **Parameter multipliers** (e.g., price × `num_outputs`)
- **Category-based fallbacks** for grouping similar endpoints
- **Programmatic price calculation** at runtime

## Environment Variables

### Worker (wrangler.toml)

| Variable | Description |
|----------|-------------|
| `PAYMENT_NETWORK` | Chain ID (`eip155:8453` for Base, `eip155:84532` for Sepolia) |
| `PAYMENT_ADDRESS` | Your wallet address to receive payments |
| `DEFAULT_PRICE` | Default price in USDC atomic units (1 USDC = 1000000) |

### Secrets (wrangler secret)

| Secret | Description |
|--------|-------------|
| `API_KEY` | Your upstream API key |
| `CDP_API_KEY_ID` | Optional: Coinbase CDP API key ID |
| `CDP_API_KEY_SECRET` | Optional: Coinbase CDP API key secret |

### Playground (.env)

| Variable | Description |
|----------|-------------|
| `VITE_NETWORK` | `base-sepolia` or `base` |
| `VITE_API_URL` | Your deployed worker URL |
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |

## Playground Setup

```bash
cd playground
npm install
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

Deploy to Cloudflare Pages:

```bash
npm run deploy:testnet
# or
npm run deploy:mainnet
```

## License

MIT
