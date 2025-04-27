"use client";

import { LoginButton } from "@/components/login-button";
import { BookOpen, Feather, Users } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function HomeContent() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect");

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
          console.error("Home: getUser error", error);
        }

        if (user) {
          console.log(
            "Home: Valid user found, redirecting to",
            redirectUrl || "/dashboard"
          );
          router.push(redirectUrl || "/dashboard");
        } else {
          console.log("Home: No valid user, showing login");
        }
        setLoading(false);
      } catch (error) {
        console.error("Home: Error in checkAuth:", error);
        setLoading(false);
      }
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
          console.log(
            "Home: onAuthStateChange - signed in, redirecting to",
            redirectUrl || "/dashboard"
          );
          router.push(redirectUrl || "/dashboard");
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, redirectUrl]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container flex flex-col items-center justify-center gap-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Welcome to StoryHearth
          </h1>
          <p className="max-w-[600px] text-lg text-muted-foreground sm:text-xl">
            Create and collaborate on stories with friends. Let your imagination
            run wild!
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <LoginButton size="lg" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
              <BookOpen className="h-6 w-6" />
              <h3 className="font-semibold">Create Stories</h3>
              <p className="text-sm text-muted-foreground">
                Start a new story and invite others to collaborate
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
              <Feather className="h-6 w-6" />
              <h3 className="font-semibold">Write Together</h3>
              <p className="text-sm text-muted-foreground">
                Take turns adding to the story and watch it evolve
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
              <Users className="h-6 w-6" />
              <h3 className="font-semibold">Share & Enjoy</h3>
              <p className="text-sm text-muted-foreground">
                Share your completed stories with friends and family
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
