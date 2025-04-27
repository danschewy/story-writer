"use client";

import { LoginButton } from "@/components/login-button";
import { BookOpen, Feather, Users } from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-100 via-amber-50 to-orange-100 relative">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
      <main className="flex-1 relative flex items-center justify-center">
        <div className="container max-w-5xl mx-auto flex flex-col items-center justify-center gap-6 py-12 sm:py-24 text-center px-4">
          {/* Mobile Login Button */}
          <div className="block sm:hidden w-full max-w-sm mb-8">
            <LoginButton size="lg" />
          </div>

          {/* Title and Description */}
          <div className="space-y-3 sm:space-y-4">
            <h1 className="text-4xl font-bold tracking-tighter text-amber-900 sm:text-5xl md:text-6xl lg:text-7xl">
              Welcome to StoryHearth
            </h1>
            <p className="mx-auto max-w-[600px] text-lg text-amber-700 sm:text-xl md:text-2xl">
              Create and collaborate on stories with friends. Let your
              imagination run wild!
            </p>
          </div>

          {/* Desktop Login Button and Completed Stories Link */}
          <div className="flex flex-col gap-3 sm:gap-4 w-full max-w-sm sm:max-w-none sm:flex-row">
            <div className="hidden sm:block w-full sm:w-auto">
              <LoginButton size="lg" />
            </div>
            <Link
              href="/completed"
              className="inline-flex items-center justify-center rounded-md bg-white px-6 py-4 sm:px-8 sm:py-6 text-base sm:text-lg font-medium text-amber-900 shadow-sm hover:bg-amber-50 transition-colors w-full sm:w-auto"
            >
              View Completed Stories
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-8 sm:mt-12 w-full">
            <div className="group flex flex-col items-center gap-4 rounded-xl border border-amber-200 bg-white/80 p-4 sm:p-6 shadow-sm transition-all hover:shadow-md hover:scale-105">
              <div className="rounded-full bg-amber-100 p-3">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-amber-700" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-amber-900">
                Create Stories
              </h3>
              <p className="text-sm sm:text-base text-amber-700">
                Start a new story and invite others to collaborate
              </p>
            </div>
            <div className="group flex flex-col items-center gap-4 rounded-xl border border-amber-200 bg-white/80 p-4 sm:p-6 shadow-sm transition-all hover:shadow-md hover:scale-105">
              <div className="rounded-full bg-amber-100 p-3">
                <Feather className="h-6 w-6 sm:h-8 sm:w-8 text-amber-700" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-amber-900">
                Write Together
              </h3>
              <p className="text-sm sm:text-base text-amber-700">
                Take turns adding to the story and watch it evolve
              </p>
            </div>
            <div className="group flex flex-col items-center gap-4 rounded-xl border border-amber-200 bg-white/80 p-4 sm:p-6 shadow-sm transition-all hover:shadow-md hover:scale-105">
              <div className="rounded-full bg-amber-100 p-3">
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-amber-700" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-amber-900">
                Share & Enjoy
              </h3>
              <p className="text-sm sm:text-base text-amber-700">
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
