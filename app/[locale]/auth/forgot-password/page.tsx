"use client";

import { useState } from "react";
import React from "react";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LogOut, Mail, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";

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

export default function ForgotPasswordPage() {
  const t = useTranslations("auth.forgotPassword");
  const router = useRouter();
  const pathname = usePathname();
  const locale = (pathname && pathname.split("/")[1]) || "en";

  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"email" | "otp" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleBack = () => {
    if (isMountedRef.current) {
      router.replace(`/${locale}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const endpoint =
        method === "otp"
          ? "/api/auth/forgot-password"
          : "/api/auth/send-reset-link";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send recovery message");
        return;
      }

      if (method === "otp") {
        router.push(
          `/${locale}/auth/reset-password?email=${encodeURIComponent(email)}&method=otp`,
        );
        return;
      }

      setSuccess(true);
      setEmail("");
    } catch (err) {
      console.error(err);
      setError("An error occurred. Please try again.");
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
              <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 text-center">
                {t("title")}
              </h2>
              <p className="text-gray-500 mb-6 text-center">{t("subtitle")}</p>

              <div className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("email")}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      method === "email"
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    {t("emailMethod")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("otp")}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      method === "otp"
                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-gray-200"
                        : "text-gray-500 hover:text-gray-900"
                    }`}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    {t("otpMethod")}
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <p className="px-1 text-center">
                    {t("emailMethodDescription")}
                  </p>
                  <p className="px-1 text-center">
                    {t("otpMethodDescription")}
                  </p>
                </div>
              </div>

              {success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <p className="text-green-700 text-sm font-medium">
                    {t("successMessage")}
                  </p>
                  <p className="text-green-600 text-xs mt-2">
                    {t("checkEmail")}
                  </p>
                </div>
              ) : // Only show form after the user selects a recovery method
              method ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-gray-900 font-medium"
                    >
                      {t("email")}
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-10 border-gray-200 bg-gray-50"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={isLoading}
                    className="w-full h-11 text-base font-medium mt-8"
                  >
                    {isLoading
                      ? t("sending")
                      : method === "otp"
                        ? t("otpSendButton")
                        : t("sendButton")}
                  </Button>
                </form>
              ) : (
                <div className="text-center text-sm text-gray-500 mb-6">
                  {t("chooseMethodPrompt")}
                </div>
              )}

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  {t("rememberPassword")}{" "}
                  <Link
                    href="/auth/sign-in"
                    className="text-secondary hover:underline font-medium"
                  >
                    {t("backToSignIn")}
                  </Link>
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  try {
                    // quick debug log to see clicks in browser console
                    console.log("ForgotPassword: Back clicked", { locale });
                    handleBack();
                    // fallback in case router.replace fails
                    setTimeout(() => {
                      if (
                        typeof window !== "undefined" &&
                        window.location.pathname !== `/${locale}`
                      ) {
                        window.location.href = `/${locale}`;
                      }
                    }, 200);
                  } catch (err) {
                    console.error("Back handler failed", err);
                    if (typeof window !== "undefined")
                      window.location.href = `/${locale}`;
                  }
                }}
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
