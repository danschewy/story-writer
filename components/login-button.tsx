"use client";

import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/lib/auth-context";

interface LoginButtonProps {
  size?: "default" | "sm" | "lg" | "icon";
}

export function LoginButton({ size = "default" }: LoginButtonProps) {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) {
    return (
      <Button
        variant="outline"
        size={size}
        className="border-amber-200 hover:bg-amber-50"
        disabled
      >
        <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </Button>
    );
  }

  if (user) {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={signOut}
        className="border-amber-200 hover:bg-amber-50"
      >
        <LogOut className="mr-2 h-5 w-5" />
        Sign out
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={signIn}
      className="border-amber-200 hover:bg-amber-50"
    >
      <FcGoogle className="mr-2 h-5 w-5" />
      Sign in with Google
    </Button>
  );
}
