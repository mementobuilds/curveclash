import React, { useEffect, useRef, useMemo } from "react";
import { BedrockPassportProvider, useBedrockPassport } from "@bedrock_org/passport";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, createConfig, WagmiProvider } from "wagmi";
import { mainnet } from "wagmi/chains";
import useAuthStore from "../lib/stores/useAuthStore";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: Infinity,
    },
  },
});

const wagmiConfig = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
});

const baseUrl = import.meta.env.VITE_BASE_URL || "https://api.bedrockpassport.com";
const authCallbackUrl = import.meta.env.VITE_AUTH_CALLBACK_URL || `${window.location.origin}/auth/callback`;
const tenantId = import.meta.env.VITE_TENANT_ID || "";
const subscriptionKey = import.meta.env.VITE_SUBSCRIPTION_KEY || "";
const walletConnectId = import.meta.env.VITE_WALLET_CONNECT_ID || "";
const defaultChainId = Number(import.meta.env.VITE_DEFAULT_CHAIN_ID ?? 1);

function AuthSyncer({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user } = useBedrockPassport();
  const syncedRef = useRef(false);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (isLoggedIn && user && !syncedRef.current) {
      syncedRef.current = true;
      const u = user as any;
      setUser({
        id: u.id || "",
        email: u.email || "",
        name: u.name || "",
        displayName: u.displayName || u.name || "",
        picture: u.picture || u.photoUrl || "",
        provider: u.provider || "",
      });
    }
    if (!isLoggedIn && syncedRef.current) {
      syncedRef.current = false;
      logout();
    }
  }, [isLoggedIn, user, setUser, logout]);

  return <>{children}</>;
}

const AuthSyncerMemo = React.memo(AuthSyncer);

export default function BedrockProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BedrockPassportProvider
          baseUrl={baseUrl}
          authCallbackUrl={authCallbackUrl}
          tenantId={tenantId}
          subscriptionKey={subscriptionKey}
          walletConnectId={walletConnectId}
          defaultChainId={defaultChainId}
        >
          <AuthSyncerMemo>{children}</AuthSyncerMemo>
        </BedrockPassportProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
