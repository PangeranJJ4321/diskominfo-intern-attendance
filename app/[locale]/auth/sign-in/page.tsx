"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useRouter, usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { LogOut } from "lucide-react";
import { Link } from "@/i18n/navigation";

const animationStyles = `
  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideUpFromBottom {
    from {
      opacity: 0;
      transform: translateY(100px);
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

export default function SignInPage() {
  const t = useTranslations("auth.signIn");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1] || "en";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleBack = () => {
    router.push(`/${locale}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { error: signInError } = await authClient.signIn.email({
        email,
        password,
        callbackURL: "/dashboard",
      });

      if (signInError) {
        setError(signInError.message || "Sign in failed");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An error occurred during sign in");
      console.error(err);
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
        {/* Right Side - Sign In Form */}
        <div className="w-full md:w-1/2 bg-accent flex items-center justify-center p-8 md:p-12">
          <Card className="w-full max-w-md ring-0 slide-up-from-bottom">
          <div className="p-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 text-center">
              {t("welcome")}
            </h2>
            <p className="text-gray-500 mb-8 text-center">{t("subtitle")}</p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-900 font-medium">
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

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-gray-900 font-medium"
                  >
                    {t("password")}
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm text-secondary hover:underline font-medium"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 border-gray-200 bg-gray-50"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6 text-sm">
                  {error}
                </div>
              )}

              {/* Sign In Button */}
              <Button
                type="submit"
                variant="gradient"
                disabled={isLoading}
                className="w-full h-11 text-base font-medium mt-8"
              >
                {isLoading ? t("signingIn") : t("signInButton")}
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-gray-500 mt-8">
              {t("noAccount")}{" "}
              <Link
                href="/auth/sign-up"
                className="text-secondary hover:underline font-medium"
              >
                {t("signUp")}
              </Link>
            </p>

            {/* Back Button */}
            <button
              onClick={handleBack}
              className="w-full mt-4 inline-flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors py-2 hover:bg-gray-50 rounded-md"
              title="Back to landing page"
            >
              <LogOut className="h-4 w-4" />
              {t("back") || "Kembali"}
            </button>
          </div>
        </Card>
      </div>
      </div>
    </>
  );
}
