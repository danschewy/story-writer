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
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <span className="text-xl font-bold">StoryForge</span>
          </div>
          <LoginButton />
        </div>
      </header>
      <main className="flex-1">
        <section className="container py-12 md:py-24 lg:py-32">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
                Write stories together with AI assistance
              </h1>
              <p className="text-muted-foreground md:text-xl">
                Collaborate with friends to create unique stories. Take turns
                adding to the narrative with AI-generated suggestions or your
                own ideas.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <LoginButton size="lg" />
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="rounded-lg border bg-card p-8 shadow-sm">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold">How it works</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start gap-2">
                        <Users className="mt-1 h-5 w-5 text-primary" />
                        <div>
                          <span className="font-medium">Create a session</span>
                          <p className="text-sm text-muted-foreground">
                            Start a new story and invite friends with a unique
                            link
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <BookOpen className="mt-1 h-5 w-5 text-primary" />
                        <div>
                          <span className="font-medium">Choose a topic</span>
                          <p className="text-sm text-muted-foreground">
                            Select from AI-generated prompts or create your own
                          </p>
                        </div>
                      </li>
                      <li className="flex items-start gap-2">
                        <Feather className="mt-1 h-5 w-5 text-primary" />
                        <div>
                          <span className="font-medium">
                            Take turns writing
                          </span>
                          <p className="text-sm text-muted-foreground">
                            Continue the story with AI suggestions or your own
                            ideas
                          </p>
                        </div>
                      </li>
                    </ul>
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
