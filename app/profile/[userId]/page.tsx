"use client";

import { use, useEffect } from "react";
import { Navbar } from "@/components/custom/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfilePicture } from "./components/profile-picture";
import { ProfileCard } from "./components/profile-card";
import { AccountConnectionsCard } from "./components/account-connections-card";
import { DeleteAccountCard } from "./components/delete-account-card";
import { FaceRegister } from "./components/face-register";
import { InternCard } from "./components/intern-card";
import { type ProfilePageProps } from "@/interfaces/profile";
import { useProfileStore } from "@/stores/profile-store";

/**
 * Renders the user-specific profile page. Fetches profile data via the
 * Zustand store and passes the loaded user down to child components
 * that still require prop-based data.
 *
 * @param {ProfilePageProps} props - The page props containing the dynamic route params.
 * @returns {React.JSX.Element} The rendered ProfilePage component.
 */
export default function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = use(params);
  const user = useProfileStore((s) => s.user);
  const loading = useProfileStore((s) => s.loading);
  const fetchProfile = useProfileStore((s) => s.fetchProfile);
  const reset = useProfileStore((s) => s.reset);

  useEffect(() => {
    void fetchProfile(userId);

    return () => {
      reset();
    };
  }, [userId, fetchProfile, reset]);

  return (
    <>
      <Navbar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col gap-6">
          {loading || !user ? (
            <div className="flex flex-col gap-6">
              <Card>
                <CardContent className="p-6 flex flex-col items-center gap-4">
                  <Skeleton className="h-28 w-28 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <ProfilePicture />

              <ProfileCard />

              {/* Intern Card — manages its own intern data fetching via the
                  intern store, but still needs the userId prop for CRUD
                  operations such as create and delete. */}
              <InternCard userId={user.id} />

              {/* Face Register — reads user and face descriptor state from
                  the profile store internally. */}
              <FaceRegister />

              <AccountConnectionsCard />

              <DeleteAccountCard userId={user.id} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
