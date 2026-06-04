"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/auth/sign-in");
          },
        },
      });
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <SidebarMenuButton
      onClick={handleLogout}
      disabled={isLoading}
      className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
    >
      <LogOut className="h-5 w-5" />
      <span>{isLoading ? "Keluar..." : "Keluar"}</span>
    </SidebarMenuButton>
  );
}
