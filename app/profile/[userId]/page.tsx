"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/custom/navbar";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfilePicture } from "./components/profile-picture";
import { ProfileCard } from "./components/profile-card";
import { AccountConnectionsCard } from "./components/account-connections-card";
import { DeleteAccountCard } from "./components/delete-account-card";
import { FaceRegister } from "./components/face-register";
import { InternCard } from "./components/intern-card";
import { useInternStore } from "@/stores/useInternStore";
import { fetchUser } from "@/lib/services/users";
import { type ProfileUser } from "@/interfaces/models";
import { type ProfilePageProps } from "@/interfaces/profile";

/**
 * Profile page showing user info, intern data, face registration, and settings.
 *
 * Uses Zustand store for interns instead of direct API calls.
 *
 * @param {ProfilePageProps} props - The component props.
 * @returns {React.JSX.Element} The rendered profile page.
 */
export default function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Zustand store for interns
  const interns = useInternStore((s) => s.interns);
  const fetchInterns = useInternStore((s) => s.fetchInterns);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const data = await fetchUser(userId);
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
    void fetchInterns();
  }, [userId, fetchInterns]);

  const handleUserUpdate = (updatedUser: ProfileUser) => {
    setUser(updatedUser);
  };

  const userInterns = interns.filter((i) => i.userId === userId);
  const hasInterns = userInterns.length > 0;
  const hasFaceDescriptor = user ? user.faceDescriptors.length > 0 : false;

  // Interns are loaded when store fetch is complete (no separate loading state needed)
  const internsLoading = false;

  const hasCredential = user
    ? user.accounts.some((acc) => acc.providerId === "credential")
    : false;

  return (
    <>
      <Navbar />
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" className="pl-0 hover:bg-transparent">
              <ArrowLeft className="mr-2 size-4" />
              Kembali ke Dashboard
            </Button>
          </Link>
        </div>
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
              <ProfilePicture user={user} onUpdate={handleUserUpdate} />

              <ProfileCard
                user={user}
                onUpdate={handleUserUpdate}
                hasCredential={hasCredential}
              />

              {/* Intern Card — shown first to ensure intern is created before face registration */}
              <InternCard userId={user.id} />

              {/* Face Register — only show after intern data exists or if face needs registration */}
              {!internsLoading && (
                <FaceRegister
                  user={user}
                  onUpdate={(updatedUser: ProfileUser) => {
                    handleUserUpdate(updatedUser);
                    router.push("/dashboard");
                  }}
                  openByDefault={hasInterns && !hasFaceDescriptor}
                />
              )}

              <AccountConnectionsCard user={user} onUpdate={handleUserUpdate} />
              <DeleteAccountCard userId={user.id} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
