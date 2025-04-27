"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Volume2, VolumeX, Copy, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

interface CompletedStoryViewProps {
  story: {
    title: string;
    parts: Array<{
      content: string;
      authorName: string;
      timestamp: string;
      type: "text" | "image";
      image_url?: string;
    }>;
  };
}

export function CompletedStoryView({ story }: CompletedStoryViewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log("CompletedStoryView mounted with story:", story);
  }, [story]);

  const fullStory = story.parts.map((part) => part.content).join("\n\n");

  const handleTTS = () => {
    if (!isPlaying) {
      const utterance = new SpeechSynthesisUtterance(fullStory);
      utterance.onend = () => setIsPlaying(false);
      window.speechSynthesis.speak(utterance);
      setIsPlaying(true);
    } else {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied!",
      description: "Share this story with friends",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 px-2 sm:px-0">
      <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 sm:gap-0 text-center sm:text-left">
        <h1 className="text-3xl font-bold text-amber-900 w-full sm:w-auto">
          {story.title}
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleTTS}
            className="border-amber-200 hover:bg-amber-50 w-full sm:w-auto"
          >
            {isPlaying ? (
              <VolumeX className="mr-2 h-4 w-4 text-amber-700" />
            ) : (
              <Volume2 className="mr-2 h-4 w-4 text-amber-700" />
            )}
            {isPlaying ? "Stop" : "Listen"}
          </Button>
          <Button
            variant="outline"
            onClick={copyShareLink}
            className="border-amber-200 hover:bg-amber-50 w-full sm:w-auto"
          >
            {copied ? (
              <Copy className="mr-2 h-4 w-4 text-amber-700" />
            ) : (
              <Share2 className="mr-2 h-4 w-4 text-amber-700" />
            )}
            {copied ? "Copied!" : "Share"}
          </Button>
        </div>
      </div>

      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 sm:p-8">
        <div className="prose prose-amber max-w-none text-lg sm:text-xl">
          {story.parts.map((part, index) => (
            <div key={index} className="mb-8 last:mb-0">
              {part.type === "image" && part.image_url ? (
                <div className="relative w-full aspect-[4/3] mb-4">
                  <Image
                    src={part.image_url}
                    alt={part.content}
                    fill
                    className="object-contain rounded-lg"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm rounded-b-lg hidden sm:block">
                    {part.content}
                  </div>
                </div>
              ) : (
                <p className="text-amber-900 break-words text-base sm:text-lg text-left sm:text-left">
                  {part.content}
                </p>
              )}
              <div className="text-sm text-amber-700 mt-2 text-left">
                — {part.authorName} •{" "}
                {new Date(part.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
