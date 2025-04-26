"use client";

import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

export function AuthForm() {
  const { toast } = useToast();
  const router = useRouter();

  async function handleGoogleSignIn() {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Authentication failed",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleSignIn}
      >
        <FcGoogle className="mr-2 h-5 w-5" />
        Continue with Google
      </Button>
    </div>
  );
}
