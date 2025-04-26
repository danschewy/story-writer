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
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/");
        return;
      }

      try {
        const sessionData = await getSessionAction(id);
        if (!sessionData) {
          router.push("/dashboard");
        } else {
          setStorySession(sessionData);
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        router.push("/dashboard");
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
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
