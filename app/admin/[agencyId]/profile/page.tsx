"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfilePicture } from "@/app/profile/[userId]/components/profile-picture";
import { ProfileCard } from "@/app/profile/[userId]/components/profile-card";
import { AccountConnectionsCard } from "@/app/profile/[userId]/components/account-connections-card";
import { DeleteAccountCard } from "@/app/profile/[userId]/components/delete-account-card";
import { FaceRegister } from "@/app/profile/[userId]/components/face-register";
import { InternCard } from "@/app/profile/[userId]/components/intern-card";
import { useInternStore } from "@/stores/useInternStore";
import { fetchUser } from "@/lib/services/users";
import { type ProfileUser } from "@/interfaces/models";

export default function AdminProfilePage() {
  const { data: session, isPending: sessionPending } = useSession();
  const userId = session?.user?.id;

  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Zustand store for interns
  const interns = useInternStore((s) => s.interns);
  const fetchInterns = useInternStore((s) => s.fetchInterns);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function loadData() {
      try {
        const data = await fetchUser(userId!);
        if (active) {
          setUser(data);
        }
      } catch (error) {
        console.error("Failed to fetch user profile data", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [userId]);

  /** Load interns from Zustand store */
  useEffect(() => {
    if (userId) {
      void fetchInterns();
    }
  }, [userId, fetchInterns]);

  const handleUserUpdate = (updatedUser: ProfileUser) => {
    setUser(updatedUser);
  };

  const userInterns = interns.filter((i) => i.userId === userId);
  const hasInterns = userInterns.length > 0;
  const hasFaceDescriptor = user ? user.faceDescriptors.length > 0 : false;

  const internsLoading = false;

  const hasCredential = user
    ? user.accounts.some((acc) => acc.providerId === "credential")
    : false;

  const showLoading = sessionPending || loading || !userId || !user;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-bold tracking-tight">Profil Saya</h1>
        <p className="text-muted-foreground text-sm">
          Kelola informasi profil, data pemagang, pendaftaran wajah, dan akun terhubung Anda.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {showLoading ? (
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
            <ProfilePicture user={user} onUpdate={handleUserUpdate} />

            <ProfileCard
              user={user}
              onUpdate={handleUserUpdate}
              hasCredential={hasCredential}
            />

            {/* Intern Card */}
            <InternCard userId={user.id} />

            {/* Face Register */}
            {!internsLoading && (
              <FaceRegister
                user={user}
                onUpdate={(updatedUser: ProfileUser) => {
                  handleUserUpdate(updatedUser);
                }}
                openByDefault={hasInterns && !hasFaceDescriptor}
              />
            )}

            <AccountConnectionsCard user={user} onUpdate={handleUserUpdate} />
            <DeleteAccountCard userId={user.id} />
          </div>
        )}
      </div>
    </div>
  );
}
