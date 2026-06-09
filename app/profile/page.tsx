"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Navbar } from "@/components/custom/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Renders a profile redirect helper component that reads the current session
 * and redirects the user to their user-specific profile page, or to the sign-in page if not logged in.
 *
 * @returns {React.JSX.Element} The rendered ProfileRedirect component.
 */
export default function ProfileRedirect() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (session?.user?.id) {
      router.replace(`/profile/${session.user.id}`);
    } else {
      router.replace("/auth/sign-in");
    }
  }, [session, isPending, router]);

  return (
    <>
      <Navbar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <Skeleton className="h-28 w-28 rounded-full" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
