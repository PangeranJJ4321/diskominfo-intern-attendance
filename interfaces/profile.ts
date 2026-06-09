import type { ProfileUser } from "./models";

export interface ProfilePictureProps {
  user: ProfileUser;
  onUpdate: (updatedUser: ProfileUser) => void;
}

export interface ProfileCardProps {
  user: ProfileUser;
  onUpdate: (updatedUser: ProfileUser) => void;
  hasCredential: boolean;
}

export interface FaceRegisterProps {
  user: ProfileUser;
  onUpdate: (updatedUser: ProfileUser) => void;
  openByDefault?: boolean;
}

export type AlignmentStepKey =
  | "smile"
  | "left"
  | "right"
  | "up"
  | "down"
  | "center";

export interface FacePoint {
  x: number;
  y: number;
}

export interface AlignmentStep {
  key: AlignmentStepKey;
  title: string;
  instruction: string;
  completion: string;
}

export interface FaceRegisterDialogProps {
  userId: string;
  userName: string;
  openByDefault?: boolean;
  onSuccess?: (updatedUser: ProfileUser) => void;
}

export interface EditProfilePictureDialogProps {
  userId: string;
  currentImage: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedUser: ProfileUser) => void;
}

export interface EditProfileDialogProps {
  userId: string;
  initialName: string;
  hasCredentialAccount: boolean;
  onSuccess: (updatedUser: ProfileUser) => void;
}

export interface DeleteAccountCardProps {
  userId: string;
}

export interface ConfirmDeleteAccountDialogProps {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface AccountConnectionsCardProps {
  user: ProfileUser;
  onUpdate: (updatedUser: ProfileUser) => void;
}

export interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}
