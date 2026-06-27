import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { LogoProps } from "@/interfaces/custom";

export function Logo({
  className,
  iconClassName,
  textClassName,
  hideTextOnMobile = false,
  href = "/",
}: LogoProps) {
  return (
    <Link
      href={href}
      id="company-logo"
      className={cn(
        "flex items-center gap-2 font-semibold tracking-tight transition-opacity hover:opacity-80",
        className,
      )}
    >
      <div
        className={cn(
          "flex size-7 items-center justify-center overflow-hidden rounded-md",
          iconClassName,
        )}
      >
        <Image
          src="/logo.jpeg"
          alt="DISKOMINFO INTERN Logo"
          width={28}
          height={28}
          className="h-full w-full object-cover"
          priority
        />
      </div>
      <span
        className={cn(
          textClassName,
          hideTextOnMobile ? "hidden sm:inline" : "",
        )}
      >
        DISKOMINFO INTERN
      </span>
    </Link>
  );
}
