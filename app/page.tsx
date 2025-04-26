"use client";

import { LoginButton } from "@/components/login-button";
import { BookOpen, Feather, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Home: getSession error", error);
      }

      if (session?.user) {
        console.log("Home: Valid session found, redirecting to /dashboard");
        router.push("/dashboard");
      } else {
        console.log("Home: No valid session, showing login");
      }
      setLoading(false);
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        console.log(
          "Home: onAuthStateChange - signed in, redirecting to /dashboard"
        );
        router.push("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-xl font-bold">StoryForge</span>
            </div>
            <div className="w-24" /> {/* Placeholder for button */}
          </div>
        </header>
        <main className="flex-1">
          <div className="flex items-center justify-center h-[50vh]">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-50 to-orange-50">
      <header className="border-b bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="container flex h-16 items-center justify-between px-8">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-amber-700" />
            <span className="text-xl font-bold text-amber-900">
              StoryHearth
            </span>
          </div>
          <LoginButton />
        </div>
      </header>
      <main className="flex-1">
        <section className="container py-12 md:py-24 lg:py-32 px-8">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter text-amber-900 sm:text-5xl md:text-6xl">
                Gather around the StoryHearth
              </h1>
              <p className="text-amber-800 md:text-xl">
                Share stories with friends in a cozy space. Take turns adding to
                the narrative with AI assistance or your own creative spark.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <LoginButton size="lg" />
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative h-[400px] w-full rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 p-8 shadow-lg">
                <div className="absolute inset-0 bg-[url('/hearth-pattern.png')] opacity-10"></div>
                <div className="relative h-full w-full rounded-lg border-2 border-amber-200 bg-white/50 p-6 shadow-inner">
                  <div className="space-y-4">
                    <div className="h-4 w-3/4 rounded bg-amber-200/50"></div>
                    <div className="h-4 w-1/2 rounded bg-amber-200/50"></div>
                    <div className="h-4 w-2/3 rounded bg-amber-200/50"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
