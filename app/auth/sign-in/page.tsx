import Image from "next/image";
import { SignInForm } from "./components/signin-form";
import { Logo } from "@/components/custom/logo";

/**
 * Renders the login page containing the logo, sign-in form, and an illustrative background image.
 *
 * @returns {JSX.Element} The rendered login page component.
 */
export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-12">
      <div className="relative hidden bg-muted lg:block lg:col-span-8">
        <Image
          src="/sppg-1.jpeg"
          alt="Latar belakang autentikasi"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 58vw"
          className="object-cover dark:opacity-20 dark:grayscale"
        />
      </div>
      <div className="flex flex-col gap-4 p-6 md:p-10 lg:col-span-4">
        <div className="flex justify-center gap-2 md:justify-start">
          <Logo className="font-medium" iconClassName="size-6" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignInForm />
          </div>
        </div>
      </div>
    </div>
  );
}
