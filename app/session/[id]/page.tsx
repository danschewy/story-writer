"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { use } from "react";
import { getSession as getSessionAction } from "@/lib/actions";
import { DashboardHeader } from "@/components/dashboard-header";
import { StorySession } from "@/components/story-session";
import { supabase } from "@/lib/supabase";

interface SessionPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function SessionPage({ params }: SessionPageProps) {
  const { id } = use(params);
  const [storySession, setStorySession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Auth error:", error);
          router.push("/");
          return;
        }

        if (!user) {
          console.log("No user found");
          router.push("/");
          return;
        }

        const sessionData = await getSessionAction(id);
        if (!sessionData) {
          console.error("Failed to fetch session data");
          router.push("/dashboard");
          return;
        }

        if (isMounted) {
          setStorySession(sessionData);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error in checkAuth:", error);
        router.push("/dashboard");
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session) {
        router.push("/");
      } else {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (error || !user) {
          router.push("/");
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 container py-6 px-8">
          <div className="flex items-center justify-center h-[50vh]">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        </main>
      </div>
    );
  }

  if (!storySession) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6 px-8">
        <StorySession session={storySession} sessionId={id} />
      </main>
    </div>
  );
}
