"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// Import existing profile components
import { ProfilePicture } from "@/app/profile/[userId]/components/profile-picture";
import { ProfileCard } from "@/app/profile/[userId]/components/profile-card";
import { AccountConnectionsCard } from "@/app/profile/[userId]/components/account-connections-card";
import { DeleteAccountCard } from "@/app/profile/[userId]/components/delete-account-card";
import { FaceRegister } from "@/app/profile/[userId]/components/face-register";
import { InternCard } from "@/app/profile/[userId]/components/intern-card";

import { useInternStore } from "@/stores/useInternStore";
import { fetchUser } from "@/lib/services/users";
import { type ProfileUser } from "@/interfaces/models";

interface ProfileSheetProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSheet({ userId, open, onOpenChange }: ProfileSheetProps) {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Zustand store for interns
  const interns = useInternStore((s) => s.interns);
  const fetchInterns = useInternStore((s) => s.fetchInterns);

  useEffect(() => {
    if (!open || !userId) return;

    let active = true;

    async function loadData() {
      setLoading(true);
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
  }, [userId, open]);

  useEffect(() => {
    if (open) {
      void fetchInterns();
    }
  }, [open, fetchInterns]);

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl md:max-w-2xl p-0 flex flex-col h-full bg-background/95 backdrop-blur-xl border-l-border/20 z-[100]">
        <SheetHeader className="px-6 py-4 border-b border-border/20 shrink-0 mt-4">
          <SheetTitle>Profil Akun</SheetTitle>
          <SheetDescription>Kelola informasi personal, data magang, dan pengaturan akun Anda.</SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 w-full h-full overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border/50 [&::-webkit-scrollbar-thumb]:rounded-full">
          <div className="p-6 flex flex-col gap-6">
            {loading || !user ? (
              <div className="flex flex-col gap-6">
                <Card className="bg-background/50 border-border/20 shadow-none">
                  <CardContent className="p-6 flex flex-col items-center gap-4">
                    <Skeleton className="h-28 w-28 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </CardContent>
                </Card>
                <Card className="bg-background/50 border-border/20 shadow-none">
                  <CardContent className="p-6 space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col gap-6 pb-8">
                <ProfilePicture user={user} onUpdate={handleUserUpdate} />

                <ProfileCard
                  user={user}
                  onUpdate={handleUserUpdate}
                  hasCredential={hasCredential}
                />

                <InternCard userId={user.id} />

                {!internsLoading && (
                  <FaceRegister
                    user={user}
                    onUpdate={handleUserUpdate}
                    openByDefault={hasInterns && !hasFaceDescriptor}
                  />
                )}

                <AccountConnectionsCard user={user} onUpdate={handleUserUpdate} />
                <DeleteAccountCard userId={user.id} />
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
