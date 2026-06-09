import Image from "next/image";
import { SignUpForm } from "./components/signup-form";
import { Logo } from "@/components/custom/logo";

/**
 * Renders the sign-up page containing the logo, sign-up form, and an illustrative background image.
 *
 * @returns {JSX.Element} The rendered sign-up page component.
 */
export default function SignUpPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-12">
      <div className="relative hidden bg-muted lg:block lg:col-span-8">
        <Image
          src="/diskominfo-2.jpeg"
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
            <SignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
}
