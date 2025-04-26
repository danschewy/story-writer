"use client";

import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { FcGoogle } from "react-icons/fc";

interface LoginButtonProps {
  size?: "default" | "sm" | "lg" | "icon";
}

export function LoginButton({ size = "default" }: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoading(false);
      if (user) {
        router.push("/dashboard");
      }
    });
  }, [router]);

  const handleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("Error signing in:", error);
      }
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  if (isLoading) {
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

  return (
    <Button
      variant="outline"
      size={size}
      onClick={handleLogin}
      className="border-amber-200 hover:bg-amber-50"
    >
      <FcGoogle className="mr-2 h-5 w-5" />
      Sign in with Google
    </Button>
  );
}
