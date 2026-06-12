"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";
import { EditProfilePictureDialog } from "./edit-profile-picture-dialog";
import { getInitials } from "@/lib/string-utils";
import type { ProfilePictureProps } from "@/interfaces/profile";

export function ProfilePicture({ user, onUpdate }: ProfilePictureProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const initials = getInitials(user.name);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="relative group">
        <Avatar className="h-48 w-48 border border-border shadow-sm">
          <AvatarImage src={user.image || undefined} alt={user.name} />
          <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-0 right-0 h-9 w-9 rounded-full border border-border shadow bg-background hover:bg-muted"
          onClick={() => setDialogOpen(true)}
          aria-label="Edit foto profil"
        >
          <Camera className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">{user.name}</h2>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      {dialogOpen && (
        <EditProfilePictureDialog
          userId={user.id}
          currentImage={user.image}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={onUpdate}
        />
      )}
    </div>
  );
}
