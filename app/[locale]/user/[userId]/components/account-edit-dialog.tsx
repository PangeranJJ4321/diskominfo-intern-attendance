"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { InputGroup, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateUserSchema } from "@/lib/schemas/user";
import { toast } from "sonner";
import { PencilIcon, LockIcon, UserIcon } from "lucide-react";

interface AccountEditDialogProps {
  userId: string;
  initialName: string;
  initialEmail: string;
  hasCredentialAccount: boolean;
}

/**
 * Dialog for editing account information and changing password.
 */
export function AccountEditDialog({
  userId,
  initialName,
  initialEmail,
  hasCredentialAccount,
}: AccountEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  // Account info state
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      // Reset form when closing
      setName(initialName);
      setEmail(initialEmail);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setAccountError("");
      setPasswordError("");
      setActiveTab("account");
    }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError("");

    const parsed = updateUserSchema.safeParse({
      name,
      email,
    });

    if (!parsed.success) {
      setAccountError(
        Object.values(parsed.error.flatten().fieldErrors).flat()[0] ||
          "Validation failed",
      );
      return;
    }

    setAccountLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update account");
      }

      toast.success("Account information updated");
      setOpen(false);
      window.location.reload();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setAccountError(message);
      toast.error(message);
    } finally {
      setAccountLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || "Failed to change password");
      }

      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setPasswordError(message);
      toast.error(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <PencilIcon className="h-4 w-4" />
          Edit account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Account</DialogTitle>
          <DialogDescription>
            Update your account information or change your password.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account" className="gap-2">
              <UserIcon className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="password" className="gap-2">
              <LockIcon className="h-4 w-4" />
              Password
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="mt-4">
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <InputGroup>
                  <InputGroupInput
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setAccountError("");
                    }}
                    disabled={accountLoading}
                    placeholder="Enter your full name"
                  />
                </InputGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <InputGroup>
                  <InputGroupInput
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setAccountError("");
                    }}
                    disabled={accountLoading}
                    placeholder="Enter your email"
                  />
                </InputGroup>
              </div>

              {accountError ? (
                <p className="text-sm text-red-500">{accountError}</p>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={accountLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={accountLoading}>
                  {accountLoading ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="password" className="mt-4">
            {!hasCredentialAccount ? (
              <div className="rounded-lg border bg-muted/50 p-4 text-center">
                <LockIcon className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  You don&apos;t have a password set up. You signed in using a
                  social provider.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <InputGroup>
                    <InputGroupInput
                      id="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value);
                        setPasswordError("");
                      }}
                      disabled={passwordLoading}
                      placeholder="Enter current password"
                    />
                  </InputGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <InputGroup>
                    <InputGroupInput
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setPasswordError("");
                      }}
                      disabled={passwordLoading}
                      placeholder="Enter new password (min 8 characters)"
                    />
                  </InputGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <InputGroup>
                    <InputGroupInput
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError("");
                      }}
                      disabled={passwordLoading}
                      placeholder="Confirm new password"
                    />
                  </InputGroup>
                </div>

                {passwordError ? (
                  <p className="text-sm text-red-500">{passwordError}</p>
                ) : null}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={passwordLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={passwordLoading}>
                    {passwordLoading ? "Changing..." : "Change password"}
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
