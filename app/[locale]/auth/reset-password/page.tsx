"use client";

import { useState, useEffect } from "react";
import React from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const animationStyles = `
  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-50px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideUpFromBottom {
    from {
      opacity: 0;
      transform: translateY(50px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .slide-in-from-left {
    animation: slideInFromLeft 0.6s ease-out;
  }

  .slide-up-from-bottom {
    animation: slideUpFromBottom 0.6s ease-out;
  }
`;

export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = pathname.split("/")[1];

  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const otpFromParams = searchParams.get("otp");
  const methodFromParams = searchParams.get("method");
  const isOtpFlow = methodFromParams === "otp" || (!!otpFromParams && !token);
  const hasInvalidRecoveryParams = !email || (!token && !isOtpFlow);
  const initialError = hasInvalidRecoveryParams
    ? locale === "id"
      ? isOtpFlow
        ? "Kode OTP tidak valid atau telah kadaluarsa"
        : "Link tidak valid atau telah kadaluarsa"
      : isOtpFlow
        ? "Invalid or expired OTP code"
        : "Invalid or expired link"
    : "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState(otpFromParams || "");
  const [isLoading, setIsLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [error, setError] = useState(initialError);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const resendTimerRef = React.useRef<number | null>(null);
  const isMountedRef = React.useRef(true);
  const isInvalidState =
    hasInvalidRecoveryParams ||
    error.toLowerCase().includes("invalid") ||
    error.toLowerCase().includes("tidak valid");

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (resendTimerRef.current) {
        clearInterval(resendTimerRef.current as unknown as number);
        resendTimerRef.current = null;
      }
    };
  }, []);

  const handleBack = () => {
    if (isMountedRef.current) {
      router.push(`/${locale}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Prevent submitting password reset before OTP verification in OTP flow
    if (isOtpFlow && !otpVerified) {
      setError(t("enterOtpFirst") || "Please verify the OTP first");
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("passwordTooShort"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isOtpFlow
            ? {
                email,
                otp,
                newPassword: password,
                locale,
              }
            : {
                email,
                token,
                newPassword: password,
                locale,
              }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t("failedToReset"));
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        if (isMountedRef.current) {
          router.replace(`/${locale}/auth/sign-in?from=reset`);
        }
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(t("errorOccurred"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen flex">
        <div className="hidden md:flex md:w-1/2 bg-linear-to-tl from-primary via-red-900 to-secondary text-white flex-col justify-between p-8 md:p-12 slide-in-from-left">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center overflow-hidden">
                <Image
                  src="/intern-logo.jpeg"
                  alt="Logo"
                  width={48}
                  height={48}
                  className="object-cover"
                />
              </div>
              <h1 className="text-2xl font-bold">{t("brandName")}</h1>
            </div>
            <div className="text-sm opacity-90 bg-white/10 px-4 py-2 rounded-full w-fit border border-white/30">
              {t("brandTagline")}
            </div>
          </div>

          <div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              {t("heroTitle")}
            </h2>
            <p className="text-base font-extralight md:text-lg opacity-90 max-w-md">
              {t("heroDescription")}
            </p>
          </div>
        </div>

        <div className="w-full md:w-1/2 bg-accent flex items-center justify-center p-8 md:p-12">
          <Card className="w-full max-w-md ring-0 slide-up-from-bottom">
            <div className="p-8">
              {isInvalidState ? (
                <>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 text-center">
                    {isOtpFlow ? t("otpErrorTitle") : t("errorTitle")}
                  </h2>
                  <p className="text-gray-600 text-center mb-8">{error}</p>
                  <Button
                    onClick={() => {
                      if (isMountedRef.current) {
                        router.push(`/${locale}/auth/forgot-password`);
                      }
                    }}
                    variant="gradient"
                    className="w-full"
                  >
                    {isOtpFlow ? t("requestNewOtp") : t("requestNewLink")}
                  </Button>
                </>
              ) : success ? (
                <>
                  <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 text-center">
                    {t("successTitle")}
                  </h2>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <p className="text-green-700 text-sm">
                      {t("successMessage")}
                    </p>
                  </div>
                  <p className="text-gray-600 text-center text-sm">
                    {t("redirecting")}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 text-center">
                    {isOtpFlow ? t("otpTitle") : t("title")}
                  </h2>
                  <p className="text-gray-500 mb-8 text-center text-sm">
                    {isOtpFlow ? t("otpSubtitle") : t("subtitle")}
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {isOtpFlow && (
                      <div className="space-y-4">
                        {!otpVerified ? (
                          <>
                            <div className="space-y-2">
                              <Label
                                htmlFor="otp"
                                className="text-gray-900 font-medium"
                              >
                                {t("otpCode")}
                              </Label>
                              <Input
                                id="otp"
                                type="text"
                                inputMode="numeric"
                                placeholder={t("otpPlaceholder")}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    // prevent form submit via Enter before OTP verification
                                    e.preventDefault();
                                  }
                                }}
                                required
                                className="h-10 border-gray-200 bg-gray-50 tracking-[0.35em] text-center"
                              />
                            </div>

                            {error && (
                              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                              </div>
                            )}

                            <div className="flex gap-3">
                              <Button
                                type="button"
                                variant="default"
                                onClick={async () => {
                                  setError("");
                                  setIsLoading(true);
                                  try {
                                    const res = await fetch("/api/auth/verify-otp", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ email, otp, locale }),
                                    });
                                    const json = await res.json();
                                    if (!res.ok) {
                                      setError(json.error || t("otpInvalid"));
                                    } else {
                                      setOtpVerified(true);
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    setError(t("errorOccurred"));
                                  } finally {
                                    setIsLoading(false);
                                  }
                                }}
                                className="flex-1"
                                disabled={isLoading}
                              >
                                {isLoading ? t("verifying") : t("verifyOtpButton")}
                              </Button>

                              <Button
                                type="button"
                                variant="ghost"
                                onClick={async () => {
                                  if (!email) {
                                    setError(t("errorOccurred"));
                                    return;
                                  }
                                  if (resendCooldown > 0) return;
                                  setError("");
                                  setIsLoading(true);
                                  try {
                                    const res = await fetch("/api/auth/forgot-password", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ email, locale }),
                                    });
                                    const json = await res.json();
                                    if (!res.ok) {
                                      setError(json.error || t("errorOccurred"));
                                    } else {
                                      // start 60s cooldown
                                      setResendCooldown(60);
                                      resendTimerRef.current = window.setInterval(() => {
                                        setResendCooldown((s) => {
                                          if (s <= 1) {
                                            if (resendTimerRef.current) {
                                              clearInterval(resendTimerRef.current as unknown as number);
                                              resendTimerRef.current = null;
                                            }
                                            return 0;
                                          }
                                          return s - 1;
                                        });
                                      }, 1000);
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    setError(t("errorOccurred"));
                                  } finally {
                                    setIsLoading(false);
                                  }
                                }}
                                className="flex-1"
                                disabled={isLoading || resendCooldown > 0}
                              >
                                {resendCooldown > 0
                                  ? `${t("requestNewOtp")} (${resendCooldown}s)`
                                  : t("requestNewOtp")}
                              </Button>
                            </div>
                          </>
                        ) : null}
                      </div>
                    )}

                    {(!isOtpFlow || otpVerified) && (
                      <>
                        <div className="space-y-2">
                          <Label
                            htmlFor="password"
                            className="text-gray-900 font-medium"
                          >
                            {t("newPassword")}
                          </Label>
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-10 border-gray-200 bg-gray-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor="confirmPassword"
                            className="text-gray-900 font-medium"
                          >
                            {t("confirmPassword")}
                          </Label>
                          <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="h-10 border-gray-200 bg-gray-50"
                          />
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="showPassword"
                            checked={showPassword}
                            onChange={(e) => setShowPassword(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <label
                            htmlFor="showPassword"
                            className="ml-2 text-sm text-gray-600"
                          >
                            {t("showPassword")}
                          </label>
                        </div>

                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                          </div>
                        )}

                        <Button
                          type="submit"
                          variant="gradient"
                          disabled={isLoading}
                          className="w-full h-11 text-base font-medium mt-8"
                        >
                          {isLoading ? t("updating") : t("resetButton")}
                        </Button>
                      </>
                    )}
                  </form>
                </>
              )}

              <button
                onClick={handleBack}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors py-2 hover:bg-gray-50 rounded-md"
                title="Back to landing page"
              >
                <LogOut className="h-4 w-4" />
                {t("backHome")}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
