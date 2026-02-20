import React from "react";
import { BedrockPassportProvider } from "@bedrock_org/passport";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, createConfig, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";

const queryClient = new QueryClient();

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

export default function BedrockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const baseUrl = import.meta.env.VITE_BASE_URL || "https://api.bedrockpassport.com";
  const authCallbackUrl = import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/auth/callback`;
  const tenantId = import.meta.env.VITE_TENANT_ID || "";
  const subscriptionKey = import.meta.env.VITE_SUBSCRIPTION_KEY || "";
  const walletConnectId = import.meta.env.VITE_WALLET_CONNECT_ID || "";
  const defaultChainId = Number(import.meta.env.VITE_DEFAULT_CHAIN_ID ?? 1);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BedrockPassportProvider
          baseUrl={baseUrl}
          authCallbackUrl={authCallbackUrl}
          tenantId={tenantId}
          subscriptionKey={subscriptionKey}
          walletConnectId={walletConnectId}
          defaultChainId={defaultChainId}
        >
          {children}
        </BedrockPassportProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
