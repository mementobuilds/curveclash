import { useEffect, useRef } from "react";
import { useBedrockPassport } from "@bedrock_org/passport";

export default function AuthCallback() {
  const { loginCallback } = useBedrockPassport();
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");

    if (token && refreshToken) {
      calledRef.current = true;
      const login = async () => {
        try {
          const success = await loginCallback(token, refreshToken);
          if (success) {
            localStorage.setItem("accessToken", token);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem(
              "passport-token",
              JSON.stringify({ state: { accessToken: token, refreshToken } })
            );
          }
        } catch (e) {
          console.error("Login callback error:", e);
        }
        const pendingGame = localStorage.getItem("pendingGameId");
        if (pendingGame) {
          localStorage.removeItem("pendingGameId");
          window.location.href = window.location.origin + "/?game=" + encodeURIComponent(pendingGame);
        } else {
          window.location.href = window.location.origin + "/";
        }
      };
      login();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-2xl">Signing in...</div>
    </div>
  );
}
