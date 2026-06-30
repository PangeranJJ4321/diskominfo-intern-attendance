"use client";

import { useRouter } from "next/navigation";
import { ForgotPasswordForm } from "./components/forgot-password-form";
import { Logo } from "@/components/custom/logo";
import { LogOut } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex bg-background guest-page">
      {/* Left Panel — Branding */}
      <div className="hidden md:flex md:w-1/2 bg-linear-to-tl from-primary via-red-900 to-secondary text-white flex-col justify-between p-8 md:p-12">
        <Logo textClassName="text-white font-bold text-lg" />

        <div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Membangun Pelayanan Publik Digital yang Unggul.
          </h2>
          <p className="text-base font-extralight md:text-lg opacity-90 max-w-md">
            Lupa kata sandi? Jangan khawatir, kami akan membantu Anda
            memulihkan akses ke akun Anda.
          </p>
        </div>
      </div>

      {/* Right Panel — Forgot Password Form */}
      <div className="w-full md:w-1/2 bg-accent flex flex-col items-center justify-center p-8 md:p-12">
        <div className="w-full max-w-sm">
          <ForgotPasswordForm />
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="w-full mt-4 inline-flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-colors py-2 hover:bg-muted rounded-md"
            title="Kembali ke beranda"
          >
            <LogOut className="h-4 w-4" />
            Kembali Ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
