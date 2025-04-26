"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { CreateSessionDialog } from "@/components/create-session-dialog";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export function CreateSessionButton() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!isMounted) return;

      if (error) {
        console.error("Auth error:", error);
        return;
      }

      setUser(user);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (session) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (!error && user) {
          setUser(user);
        }
      } else {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleClick = () => {
    if (!user) {
      router.push("/");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <Button onClick={handleClick}>
        <PlusCircle className="mr-2 h-4 w-4" />
        New Story Session
      </Button>
      <CreateSessionDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
