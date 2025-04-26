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
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        router.push("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  if (user) {
    return (
      <Button variant="outline" size={size} onClick={handleSignOut}>
        <LogOut className="mr-2 h-4 w-4" />
        Sign Out
      </Button>
    );
  }

  return (
    <Button
      size={size}
      onClick={() =>
        supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })
      }
    >
      <FcGoogle className="mr-2 h-5 w-5" />
      Sign in with Google
    </Button>
  );
}
