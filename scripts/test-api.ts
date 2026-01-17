import { createWalletClient, http, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { wrapFetchWithPayment, x402Client } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";

const API_URL = process.env.API_URL || "http://localhost:8787";
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

if (!PRIVATE_KEY) {
  console.error("PRIVATE_KEY environment variable required");
  process.exit(1);
}

async function main() {
  console.log("Setting up wallet...");

  const account = privateKeyToAccount(PRIVATE_KEY);
  console.log(`Wallet address: ${account.address}`);

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(),
  }).extend(publicActions);

  // Create X402 client with EVM scheme
  const x402 = new x402Client().register(
    "eip155:84532", // Base Sepolia
    new ExactEvmScheme({
      address: account.address,
      signTypedData: async (args) => {
        return walletClient.signTypedData({
          account,
          domain: args.domain as Parameters<typeof walletClient.signTypedData>[0]["domain"],
          types: args.types as Parameters<typeof walletClient.signTypedData>[0]["types"],
          primaryType: args.primaryType,
          message: args.message as Parameters<typeof walletClient.signTypedData>[0]["message"],
        });
      },
    })
  );

  const fetchWithPayment = wrapFetchWithPayment(fetch, x402);

  console.log(`\nTesting API at ${API_URL}...\n`);

  // Test health endpoint
  console.log("1. Testing /health...");
  const healthRes = await fetch(`${API_URL}/health`);
  console.log(`   Status: ${healthRes.status}`);
  console.log(`   Response: ${JSON.stringify(await healthRes.json())}\n`);

  // Test pricing endpoint
  console.log("2. Testing /pricing...");
  const pricingRes = await fetch(`${API_URL}/pricing`);
  const pricing = await pricingRes.json();
  console.log(`   Status: ${pricingRes.status}`);
  console.log(`   Response: ${JSON.stringify(pricing)}\n`);

  // Test paid endpoint without payment (should get 402)
  console.log("3. Testing /v1/process without payment (expect 402)...");
  const noPayRes = await fetch(`${API_URL}/v1/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: "test" }),
  });
  console.log(`   Status: ${noPayRes.status}`);
  if (noPayRes.status === 402) {
    console.log("   Got 402 Payment Required as expected\n");
  }

  // Test paid endpoint with payment
  console.log("4. Testing /v1/process WITH payment...");
  try {
    const paidRes = await fetchWithPayment(`${API_URL}/v1/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "Hello X402!" }),
    });

    console.log(`   Status: ${paidRes.status}`);
    console.log(`   X-Price-Charged: ${paidRes.headers.get("X-Price-Charged")}`);
    console.log(`   X-Price-Source: ${paidRes.headers.get("X-Price-Source")}`);
    console.log(`   X-Payment-Transaction: ${paidRes.headers.get("X-Payment-Transaction")}`);

    const result = await paidRes.json();
    console.log(`   Response: ${JSON.stringify(result, null, 2)}`);

    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error(`   Error: ${error}`);
    process.exit(1);
  }
}

main().catch(console.error);
