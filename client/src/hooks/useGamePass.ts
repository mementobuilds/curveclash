import { useState, useEffect, useCallback, useRef } from "react";

const PASS_API_BASE = "https://app.orangeweb3.com/api/games/passes";
const TENANT_CODE = import.meta.env.VITE_ORANGE_TENANT_CODE || "orange-xxxxxxx";
const PURCHASE_URL = import.meta.env.VITE_ORANGE_PURCHASE_URL || "https://app.orangeweb3.com";

export interface GamePassState {
  passToken: string | null;
  cameWithPass: boolean;
  passValidated: boolean;
  passTimeRemaining: number;
  isGuestMode: boolean;
  passEnabled: boolean;
  passError: string | null;
  showPassErrorDialog: boolean;
  showPassExpiredDialog: boolean;
  showWelcomeDialog: boolean;
  isRedeeming: boolean;
  passExpired: boolean;
}

export function useGamePass() {
  const [passToken, setPassToken] = useState<string | null>(null);
  const [cameWithPass] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasTokenInUrl = urlParams.has("pass_token");
    const hasTokenInSession = !!sessionStorage.getItem("game_pass_token");
    return hasTokenInUrl || hasTokenInSession;
  });
  const [passValidated, setPassValidated] = useState(false);
  const [passTimeRemaining, setPassTimeRemaining] = useState(0);
  const [passExpired, setPassExpired] = useState(false);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [passEnabled, setPassEnabled] = useState(() => {
    const stored = localStorage.getItem("game_pass_enabled");
    return stored === "true";
  });
  const [passError, setPassError] = useState<string | null>(null);
  const [showPassErrorDialog, setShowPassErrorDialog] = useState(false);
  const [showPassExpiredDialog, setShowPassExpiredDialog] = useState(false);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialCheckDone = useRef(false);
  const tokenReady = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get("pass_token");

    if (tokenFromUrl) {
      sessionStorage.setItem("game_pass_token", tokenFromUrl);
      setPassToken(tokenFromUrl);
      tokenReady.current = true;

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("pass_token");
      window.history.replaceState({}, "", newUrl.pathname + newUrl.search);

      if (!passEnabled) {
        setPassEnabled(true);
        localStorage.setItem("game_pass_enabled", "true");
      }
    } else {
      const storedToken = sessionStorage.getItem("game_pass_token");
      if (storedToken) {
        setPassToken(storedToken);
        tokenReady.current = true;
      }
    }
  }, []);

  useEffect(() => {
    if (!passEnabled || initialCheckDone.current) return;
    initialCheckDone.current = true;

    if (tokenReady.current && passToken) {
      validateOrCheckStatus(passToken);
    } else if (!passToken) {
      setShowWelcomeDialog(true);
    }
  }, [passEnabled, passToken]);

  const validateOrCheckStatus = useCallback(async (token: string) => {
    setIsRedeeming(true);
    setPassError(null);
    try {
      const statusResult = await checkPassStatusInternal(token);
      if (statusResult.valid && statusResult.secondsRemaining > 0) {
        setPassValidated(true);
        setPassExpired(false);
        setPassTimeRemaining(statusResult.secondsRemaining);
        return;
      }

      const redeemResult = await redeemPassInternal(token);
      if (redeemResult.valid) {
        setPassValidated(true);
        setPassExpired(false);
        setPassTimeRemaining(redeemResult.secondsRemaining || 0);
      } else {
        setPassError(redeemResult.error || "Pass validation failed");
        setShowPassErrorDialog(true);
      }
    } catch {
      setPassError("Network error validating pass");
      setShowPassErrorDialog(true);
    } finally {
      setIsRedeeming(false);
    }
  }, []);

  const redeemPassInternal = async (token: string) => {
    try {
      const response = await fetch(`${PASS_API_BASE}/redeem`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenant_code: TENANT_CODE }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Pass validation failed" }));
        return { valid: false, error: error.error || "Pass validation failed" };
      }

      const data = await response.json();
      if (data.seconds_remaining > 0) {
        return { valid: true, secondsRemaining: data.seconds_remaining, endsAt: data.ends_at };
      } else {
        return { valid: false, error: "This pass has expired" };
      }
    } catch {
      return { valid: false, error: "Network error validating pass" };
    }
  };

  const checkPassStatusInternal = async (token: string) => {
    try {
      const response = await fetch(
        `${PASS_API_BASE}/status?tenant_code=${TENANT_CODE}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        return { valid: false, secondsRemaining: 0 };
      }

      const data = await response.json();
      return {
        valid: data.seconds_remaining > 0,
        secondsRemaining: data.seconds_remaining,
        endsAt: data.ends_at,
      };
    } catch {
      return { valid: false, secondsRemaining: 0 };
    }
  };

  const redeemPass = useCallback(async (token: string) => {
    setIsRedeeming(true);
    setPassError(null);
    try {
      const result = await redeemPassInternal(token);
      if (result.valid) {
        setPassValidated(true);
        setPassExpired(false);
        setPassTimeRemaining(result.secondsRemaining || 0);
      } else {
        setPassError(result.error || "Pass validation failed");
        setShowPassErrorDialog(true);
      }
      return result;
    } finally {
      setIsRedeeming(false);
    }
  }, []);

  const checkPassStatus = useCallback(async (token: string) => {
    return checkPassStatusInternal(token);
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (passValidated && passTimeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setPassTimeRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            setPassExpired(true);
            setShowPassExpiredDialog(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [passValidated, passTimeRemaining > 0]);

  const canStartGame = useCallback(() => {
    if (!passEnabled) return true;
    if (isGuestMode) return true;
    if (passValidated && passTimeRemaining > 0) return true;
    return false;
  }, [passEnabled, isGuestMode, passValidated, passTimeRemaining]);

  const togglePassEnabled = useCallback((enabled: boolean) => {
    setPassEnabled(enabled);
    localStorage.setItem("game_pass_enabled", String(enabled));
    if (!enabled) {
      setIsGuestMode(false);
      setPassExpired(false);
      setShowWelcomeDialog(false);
      setShowPassErrorDialog(false);
      setShowPassExpiredDialog(false);
    } else {
      initialCheckDone.current = false;
    }
  }, []);

  const handlePlayAsGuest = useCallback(() => {
    setIsGuestMode(true);
    setShowPassErrorDialog(false);
    setShowWelcomeDialog(false);
    setShowPassExpiredDialog(false);
  }, []);

  const handleGetNewPass = useCallback(() => {
    window.open(PURCHASE_URL, "_blank");
  }, []);

  const dismissPassExpired = useCallback(() => {
    setShowPassExpiredDialog(false);
  }, []);

  const dismissPassError = useCallback(() => {
    setShowPassErrorDialog(false);
  }, []);

  const dismissWelcomeDialog = useCallback(() => {
    setShowWelcomeDialog(false);
  }, []);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    passToken,
    cameWithPass,
    passValidated,
    passTimeRemaining,
    passExpired,
    isGuestMode,
    passEnabled,
    passError,
    showPassErrorDialog,
    showPassExpiredDialog,
    showWelcomeDialog,
    isRedeeming,
    redeemPass,
    checkPassStatus,
    canStartGame,
    togglePassEnabled,
    handlePlayAsGuest,
    handleGetNewPass,
    dismissPassExpired,
    dismissPassError,
    dismissWelcomeDialog,
    formatTime,
  };
}
