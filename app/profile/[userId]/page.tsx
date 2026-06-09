"use client";

import { use, useEffect, useState } from "react";
import { Navbar } from "@/components/custom/navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfilePicture } from "./components/profile-picture";
import { ProfileCard } from "./components/profile-card";
import { AccountConnectionsCard } from "./components/account-connections-card";
import { DeleteAccountCard } from "./components/delete-account-card";
import { FaceRegister } from "./components/face-register";
import { fetchUser } from "@/lib/services/users";
import { type ProfileUser } from "@/interfaces/models";
import { type ProfilePageProps } from "@/interfaces/profile";


export default function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = use(params);
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleUserUpdate = (updatedUser: ProfileUser) => {
    setUser(updatedUser);
  };

  const hasCredential = user
    ? user.accounts.some((acc) => acc.providerId === "credential")
    : false;

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
              <ProfilePicture user={user} onUpdate={handleUserUpdate} />

              <ProfileCard
                user={user}
                onUpdate={handleUserUpdate}
                hasCredential={hasCredential}
              />

              <FaceRegister
                user={user}
                onUpdate={handleUserUpdate}
                openByDefault={user.faceDescriptors.length === 0}
              />
              <AccountConnectionsCard user={user} onUpdate={handleUserUpdate} />
              <DeleteAccountCard userId={user.id} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
