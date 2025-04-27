"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
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
  const resolvedParams = use(params);
  const [storySession, setStorySession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const effectRunId = Math.random().toString(36).substring(7);
    console.log(
      `[SessionPage Effect RUNNING ${effectRunId}] ID: ${resolvedParams.id}`
    );

    async function checkSessionAccess() {
      try {
        // Step 1: Check if user is authenticated
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error(`[SessionPage ${effectRunId}] Auth error:`, authError);
          setError("Authentication error. Please log in.");
          setLoading(false);
          return;
        }

        if (!user) {
          console.error(`[SessionPage ${effectRunId}] No user found`);
          setError("Please log in to access this session.");
          setLoading(false);
          return;
        }

        // Step 2: Check if session exists and user has access
        const sessionData = await getSessionAction(resolvedParams.id);

        if (!sessionData) {
          console.error(
            `[SessionPage ${effectRunId}] Session not found or access denied`
          );
          setError("Session not found or you don't have access to it.");
          setLoading(false);
          return;
        }

        // Step 3: Verify user has access to the session
        const hasAccess =
          sessionData.created_by === user.id ||
          sessionData.participants?.includes(user.id);

        if (!hasAccess) {
          console.error(
            `[SessionPage ${effectRunId}] User does not have access to session`
          );
          setError("You don't have access to this session.");
          setLoading(false);
          return;
        }

        // Step 4: If all checks pass, update the session data
        if (isMounted) {
          setStorySession(sessionData);
          setLoading(false);
        }
      } catch (error) {
        console.error(`[SessionPage ${effectRunId}] Unexpected error:`, error);
        setError("An unexpected error occurred. Please try again.");
        setLoading(false);
      }
    }

    checkSessionAccess();

    return () => {
      console.log(
        `[SessionPage Effect CLEANUP ${effectRunId}] ID: ${resolvedParams.id}`
      );
      isMounted = false;
    };
  }, [resolvedParams.id]);

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

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 container py-6 px-8">
          <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <p className="text-red-600 font-bold">{error}</p>
            <div className="flex gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Go to Home
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!storySession) {
    return (
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <main className="flex-1 container py-6 px-8">
          <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <p className="text-red-600 font-bold">
              Session data is missing. Cannot display session.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
            >
              Go to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader />
      <main className="flex-1 container py-6 px-8">
        <StorySession session={storySession} sessionId={resolvedParams.id} />
      </main>
    </div>
  );
}
