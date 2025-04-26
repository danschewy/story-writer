"use client";

import { StorySession } from "@/components/story-session";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/actions";

export default function SessionPage({
  params,
}: {
  params: { sessionId: string };
}) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (error) {
          console.error("Session: getUser error", error);
        }

        if (!user) {
          console.log("Session: No valid user, redirecting to home");
          router.push("/");
        } else {
          console.log("Session: Valid user found");
          // Fetch session data
          const sessionData = await getSession(params.sessionId);
          if (sessionData) {
            setSession(sessionData);
          } else {
            console.error("Session: Failed to fetch session data");
            router.push("/");
          }
        }
        setLoading(false);
      } catch (error) {
        console.error("Session: Error in checkAuth:", error);
        setLoading(false);
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (!session) {
        console.log(
          "Session: onAuthStateChange - signed out, redirecting to home"
        );
        router.push("/");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, params.sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <StorySession session={session} sessionId={params.sessionId} />;
}
