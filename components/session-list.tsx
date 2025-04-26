"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users } from "lucide-react";
import Link from "next/link";
import { getUserSessions } from "@/lib/actions";
import type { Session } from "@/lib/types";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export function SessionList() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSessions() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.error("Auth error:", userError);
          setError("Authentication required");
          return;
        }

        const userSessions = await getUserSessions();
        if (isMounted) {
          setSessions(userSessions);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch sessions:", error);
        setError("Failed to load sessions");
        setIsLoading(false);
      }
    }

    fetchSessions();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (!error && user) {
          const userSessions = await getUserSessions();
          if (isMounted) {
            setSessions(userSessions);
          }
        }
      } else {
        if (isMounted) {
          setSessions([]);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="h-24 bg-muted" />
            <CardContent className="h-20 mt-4 space-y-2">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Error loading sessions</h2>
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No story sessions yet</h2>
        <p className="text-muted-foreground mb-4">
          Create your first story session to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <Card
          key={session.id}
          className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50"
        >
          {session.latestImage && (
            <div className="relative h-48 w-full">
              <Image
                src={session.latestImage}
                alt={`Latest image from ${session.title}`}
                fill
                className="object-cover rounded-t-lg"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="line-clamp-1 text-amber-900">
              {session.title}
            </CardTitle>
            <CardDescription className="text-amber-700">
              Created {new Date(session.createdAt).toLocaleDateString()} at{" "}
              {new Date(session.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-amber-700">
              <Users className="mr-1 h-4 w-4" />
              {session.participantCount} participants
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-amber-800">
              Last updated {new Date(session.lastUpdate).toLocaleDateString()}{" "}
              at{" "}
              {new Date(session.lastUpdate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full bg-amber-700 hover:bg-amber-800">
              <Link href={`/session/${session.id}`}>
                {session.isComplete ? "View Story" : "Continue Story"}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
