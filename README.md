# X402 HuggingFace Inference API

A payment-enabled proxy for HuggingFace Inference API using X402 micropayments. Pay per request with USDC on Base blockchain.

## Live Deployments

| Environment | API | Playground |
|-------------|-----|------------|
| **Testnet** (Base Sepolia) | [x402-huggingface-testnet.operations-4bf.workers.dev](https://x402-huggingface-testnet.operations-4bf.workers.dev) | [x402-huggingface-playground-testnet.pages.dev](https://x402-huggingface-playground-testnet.pages.dev) |
| **Mainnet** (Base) | [x402-huggingface-mainnet.operations-4bf.workers.dev](https://x402-huggingface-mainnet.operations-4bf.workers.dev) | [x402-huggingface-playground-mainnet.pages.dev](https://x402-huggingface-playground-mainnet.pages.dev) |

## Features

- **HuggingFace Compatible**: Same API as HuggingFace (`POST /models/{org}/{model}`)
- **X402 Micropayments**: Pay-per-request with USDC on Base
- **Per-Model Pricing**: Different prices for different models
- **10 Supported Tasks**: Classification, detection, segmentation, embeddings, image generation, speech-to-text, and more
- **Playground UI**: React frontend with wallet integration

## Supported Tasks

| Task | Example Model | Price |
|------|---------------|-------|
| Text Classification | `distilbert/distilbert-base-uncased-finetuned-sst-2-english` | $0.0015 |
| Image Classification | `google/vit-base-patch16-224` | $0.003 |
| Audio Classification | `MIT/ast-finetuned-audioset-10-10-0.4593` | $0.003 |
| Object Detection | `facebook/detr-resnet-50` | $0.0075 |
| Image Segmentation | `facebook/mask2former-swin-large-coco-panoptic` | $0.015 |
| Embeddings | `sentence-transformers/all-MiniLM-L6-v2` | $0.0003 |
| Text to Image | `black-forest-labs/FLUX.1-dev` | $0.03 |
| Image to Image | `lllyasviel/control_v11p_sd15_canny` | $0.03 |
| Speech to Text | `openai/whisper-large-v3` | $0.015 |
| Fill Mask | `google-bert/bert-base-uncased` | $0.00075 |

Models not in the pricing list use the default price of **$0.01**.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .dev.vars.example .dev.vars
```

Edit `.dev.vars`:
```
HF_TOKEN=your_huggingface_token
```

Update `wrangler.toml` with your payment address:
```toml
PAYMENT_ADDRESS = "0xYourWalletAddress"
```

### 3. Run Locally

```bash
npm run dev
```

API available at `http://localhost:8787`

### 4. Deploy

```bash
# Set HuggingFace token secret
wrangler secret put HF_TOKEN

# Deploy to testnet (Base Sepolia)
npm run deploy:testnet

# Deploy to mainnet (Base)
npm run deploy:mainnet
```

## API Usage

### Endpoint

```
POST /models/{org}/{model}
```

Matches HuggingFace Inference API exactly.

### Example: Text Classification

```bash
curl -X POST http://localhost:8787/models/distilbert/distilbert-base-uncased-finetuned-sst-2-english \
  -H "Content-Type: application/json" \
  -d '{"inputs": "I love this product!"}'
```

First request returns `402 Payment Required` with payment details. After signing payment with your wallet, include the signature:

```bash
curl -X POST http://localhost:8787/models/distilbert/distilbert-base-uncased-finetuned-sst-2-english \
  -H "Content-Type: application/json" \
  -H "PAYMENT-SIGNATURE: <base64-encoded-payment>" \
  -d '{"inputs": "I love this product!"}'
```

### Example: Image Classification

```bash
curl -X POST http://localhost:8787/models/google/vit-base-patch16-224 \
  -H "PAYMENT-SIGNATURE: <base64-encoded-payment>" \
  --data-binary @image.jpg
```

### Public Endpoints (No Payment)

- `GET /` - API information
- `GET /pricing` - Current pricing policy

## Per-Model Pricing

Pricing is configured in `src/pricing/policy.ts`. Add models to the `endpoints` object:

```typescript
endpoints: {
  "org/model-name": {
    basePrice: "3000",  // $0.003 (1 USDC = 1,000,000 units)
    description: "Model description",
  },
}
```

Models not listed use `defaultPrice` ($0.01).

## Playground

React frontend for testing the API with wallet integration.

```bash
cd playground
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
```

### Playground Environment

```
VITE_API_URL=http://localhost:8787
VITE_NETWORK=base-sepolia
VITE_WALLETCONNECT_PROJECT_ID=  # Optional - works without it for browser extension wallets
```

## Project Structure

```
├── src/
│   ├── index.ts              # Main entry point
│   ├── x402/
│   │   ├── middleware.ts     # X402 payment middleware
│   │   └── types.ts          # Environment types
│   ├── pricing/
│   │   ├── engine.ts         # Pricing calculation
│   │   ├── policy.ts         # Per-model prices
│   │   └── types.ts          # Pricing types
│   └── routes/
│       ├── models.ts         # HF-compatible /models route
│       └── pricing.ts        # Pricing endpoints
├── playground/               # React frontend
├── wrangler.toml            # Cloudflare Workers config
└── package.json
```

## Environment Variables

### Worker (wrangler.toml)

| Variable | Description |
|----------|-------------|
| `PAYMENT_NETWORK` | `eip155:8453` (Base) or `eip155:84532` (Sepolia) |
| `PAYMENT_ADDRESS` | Your wallet address for receiving payments |
| `DEFAULT_PRICE` | Default price in USDC atomic units |

### Secrets

| Secret | Description |
|--------|-------------|
| `HF_TOKEN` | HuggingFace API token |
| `CDP_API_KEY_ID` | Optional: Coinbase CDP key ID |
| `CDP_API_KEY_SECRET` | Optional: Coinbase CDP key secret |

## Payment Flow

1. Client sends request without payment
2. Server returns `402 Payment Required` with price and payment details
3. Client signs EIP-712 payment authorization with wallet
4. Client retries with `PAYMENT-SIGNATURE` header
5. Server verifies and processes request
6. Server settles payment on-chain
7. Response includes `X-Payment-Transaction` header with tx hash

## License

MIT
