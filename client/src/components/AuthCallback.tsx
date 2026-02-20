import { useEffect } from "react";
import { useBedrockPassport } from "@bedrock_org/passport";

export default function AuthCallback() {
  const { loginCallback } = useBedrockPassport();

  useEffect(() => {
    const login = async (token: string, refreshToken: string) => {
      const success = await loginCallback(token, refreshToken);
      if (success) {
        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem(
          "passport-token",
          JSON.stringify({
            state: { accessToken: token, refreshToken },
          })
        );
        window.location.href = window.location.origin + "/";
      }
    };

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const refreshToken = params.get("refreshToken");

    if (token && refreshToken) {
      login(token, refreshToken);
    }
  }, [loginCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-2xl">Signing in...</div>
    </div>
  );
}
