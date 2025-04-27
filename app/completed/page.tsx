"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { BookOpen } from "lucide-react";

interface CompletedStory {
  id: string;
  title: string;
  created_at: string;
  created_by: string;
  story_parts: Array<{
    content: string;
    author_name: string;
    timestamp: string;
    type: "text" | "image";
    image_url?: string;
  }>;
}

export default function CompletedStoriesPage() {
  const [stories, setStories] = useState<CompletedStory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCompletedStories() {
      try {
        const { data, error } = await supabase
          .from("sessions")
          .select(
            `
            id,
            title,
            created_at,
            created_by,
            story_parts (
              content,
              author_name,
              timestamp,
              type,
              image_url
            )
          `
          )
          .eq("is_complete", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching completed stories:", error);
          return;
        }

        setStories(data || []);
      } catch (error) {
        console.error("Error in fetchCompletedStories:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCompletedStories();
  }, []);

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

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-amber-100 via-amber-50 to-orange-100 relative">
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />
      <DashboardHeader />
      <main className="flex-1 relative container py-4 sm:py-6 px-4 sm:px-8 flex flex-col">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-amber-900">
          Completed Stories
        </h1>
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 flex-1">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="border-amber-200 bg-white/80 shadow-sm hover:shadow-md transition-all h-full"
            >
              {story.story_parts.find(
                (part) => part.type === "image" && part.image_url
              ) && (
                <div className="relative h-40 sm:h-48 w-full">
                  <Image
                    src={
                      story.story_parts.find(
                        (part) => part.type === "image" && part.image_url
                      )?.image_url || ""
                    }
                    alt={story.title}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                  <div className="hidden absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm  sm:block">
                    {
                      story.story_parts.find(
                        (part) => part.type === "image" && part.image_url
                      )?.content
                    }
                  </div>
                </div>
              )}
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl text-amber-900 min-h-[3rem]">
                  {story.title}
                </CardTitle>
                <CardDescription className="hidden sm:block text-sm sm:text-base text-amber-700">
                  Created {new Date(story.created_at).toLocaleDateString()} at{" "}
                  {new Date(story.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="line-clamp-3 text-sm text-amber-800">
                  {story.story_parts[0]?.type === "text"
                    ? story.story_parts[0]?.content
                    : ""}
                </p>
              </CardContent>
              <CardFooter className="p-4 sm:p-6">
                <Button
                  asChild
                  className="w-full bg-amber-700 hover:bg-amber-800 text-white text-sm sm:text-base py-2 sm:py-3"
                >
                  <Link href={`/session/${story.id}`}>Read Story</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
          {stories.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-8 sm:py-12 text-center">
              <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-amber-700 mb-3 sm:mb-4" />
              <h2 className="text-lg sm:text-xl font-semibold mb-2 text-amber-900">
                No completed stories yet
              </h2>
              <p className="text-sm sm:text-base text-amber-700 mb-3 sm:mb-4">
                Stories will appear here once they are marked as complete
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
