"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { StoryPath } from "@/lib/types";
import {
  generateStoryPaths,
  addStoryPart,
  completeStory,
  getSession,
  generateImageForStory,
} from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Check, Copy, Share2, Image as ImageIcon, Wand2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompletedStoryView } from "@/components/completed-story-view";
import { supabase } from "@/lib/supabase";

interface StorySessionProps {
  session: any;
  sessionId: string;
}

export function StorySession({ session, sessionId }: StorySessionProps) {
  const [storyPaths, setStoryPaths] = useState<StoryPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>("");
  const [customPath, setCustomPath] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localSession, setLocalSession] = useState(session);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
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

        console.log("User authenticated:", user);
        setUser(user);
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/");
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        router.push("/");
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    setLocalSession(session);
    console.log("Story session updated:", {
      isComplete: session.isComplete,
      title: session.title,
      parts: session.parts,
    });
  }, [session]);

  useEffect(() => {
    console.log("Rendering story session:", {
      isComplete: localSession.isComplete,
      title: localSession.title,
      parts: localSession.parts,
    });
  }, [localSession]);

  useEffect(() => {
    // Log image parts for debugging
    localSession.parts.forEach((part: any) => {
      if (part.type === "image") {
        console.log("Image part:", {
          type: part.type,
          image_url: part.image_url,
        });
      }
    });
  }, [localSession.parts]);

  useEffect(() => {
    async function fetchPaths() {
      if (!localSession.isComplete && !selectedPath) {
        setIsGenerating(true);
        try {
          const paths = await generateStoryPaths(sessionId);
          setStoryPaths(paths);
        } catch (error) {
          console.error("Failed to generate paths:", error);
        } finally {
          setIsGenerating(false);
        }
      }
    }

    fetchPaths();
  }, [
    sessionId,
    localSession.isComplete,
    localSession.parts.length,
    selectedPath,
  ]);

  async function handleAddPart() {
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error("Authentication required");
      }

      const content = selectedPath === "custom" ? customPath : selectedPath;

      if (!content) {
        throw new Error("Please select or enter a continuation");
      }

      await addStoryPart(sessionId, content);
      setSelectedPath("");
      setCustomPath("");
      setStoryPaths([]);

      // Update local session immediately
      const updatedSession = await getSession(sessionId);
      if (updatedSession) {
        setLocalSession(updatedSession);
      }

      toast({
        title: "Success!",
        description: "Your contribution has been added to the story",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to add to story",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGenerateImage() {
    setIsGeneratingImage(true);
    try {
      if (!user) {
        throw new Error("Authentication required");
      }

      const imageUrl = await generateImageForStory(sessionId, imagePrompt);
      if (imageUrl) {
        await addStoryPart(sessionId, imagePrompt, "image", imageUrl);
        setImagePrompt("");
        setStoryPaths([]);

        // Update local session immediately
        const updatedSession = await getSession(sessionId);
        if (updatedSession) {
          setLocalSession(updatedSession);
        }

        toast({
          title: "Success!",
          description: "Your image has been added to the story",
        });
      } else {
        throw new Error("Failed to generate image");
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to generate image",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  }

  async function handleGeneratePrompt() {
    setIsGeneratingPrompt(true);
    try {
      if (!user) {
        throw new Error("Authentication required");
      }

      // Get the last few parts of the story for context
      const recentParts = localSession.parts.slice(-3);
      const storyContext = recentParts
        .map((part: any) => part.content)
        .join("\n");

      // Generate a prompt based on the story context
      const prompt = await generateStoryPaths(sessionId, storyContext);
      if (prompt && prompt.length > 0) {
        setImagePrompt(prompt[0].content);
      } else {
        throw new Error("Failed to generate prompt");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate image prompt",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPrompt(false);
    }
  }

  async function handleCompleteStory() {
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error("Authentication required");
      }

      await completeStory(sessionId);
      const updatedSession = await getSession(sessionId);
      if (updatedSession) {
        setLocalSession(updatedSession);
      }
      toast({
        title: "Story completed!",
        description: "The story has been marked as complete",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete story",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function copyShareLink() {
    const url = `${window.location.origin}/session/${sessionId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Link copied!",
      description: "Share this link with friends to collaborate",
    });
  }

  return (
    <div className="space-y-6">
      {localSession.isComplete ? (
        <CompletedStoryView story={localSession} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-amber-900">
              {session.title}
            </h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={copyShareLink}
                className="border-amber-200 hover:bg-amber-50"
              >
                {copied ? (
                  <Check className="mr-2 h-4 w-4 text-amber-700" />
                ) : (
                  <Share2 className="mr-2 h-4 w-4 text-amber-700" />
                )}
                {copied ? "Copied!" : "Share"}
              </Button>
              {session.isCreator && !session.isComplete && (
                <Button
                  variant="outline"
                  onClick={handleCompleteStory}
                  disabled={isLoading}
                  className="border-amber-200 hover:bg-amber-50"
                >
                  Mark as Complete
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {localSession.parts.map((part: any, index: number) => (
              <Card
                key={part.id}
                className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50"
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-amber-700">
                      {part.authorName} •{" "}
                      {new Date(part.timestamp).toLocaleString()}
                    </div>
                    {index === 0 && (
                      <div className="text-xs px-2 py-1 bg-amber-100 text-amber-900 rounded-full">
                        Starting Topic
                      </div>
                    )}
                  </div>
                  {part.type === "image" && part.image_url ? (
                    <div className="relative w-full aspect-[4/3] mb-4">
                      <Image
                        src={part.image_url}
                        alt={part.content}
                        fill
                        className="object-contain rounded-lg"
                        onError={(e) => {
                          console.error("Error loading image:", part.image_url);
                          e.currentTarget.src = "/placeholder-image.png";
                        }}
                        priority
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm rounded-b-lg">
                        {part.content}
                      </div>
                    </div>
                  ) : (
                    <p className="text-amber-900">{part.content}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="text-amber-900">
                Add Text
              </TabsTrigger>
              <TabsTrigger value="image" className="text-amber-900">
                Add Image
              </TabsTrigger>
            </TabsList>
            <TabsContent value="text">
              <div className="space-y-4">
                <RadioGroup
                  value={selectedPath}
                  onValueChange={setSelectedPath}
                >
                  {storyPaths.map((path) => (
                    <div key={path.id} className="flex items-start space-x-2">
                      <RadioGroupItem
                        value={path.content}
                        id={path.id}
                        className="mt-1 text-amber-700"
                      />
                      <Label
                        htmlFor={path.id}
                        className="flex-1 text-amber-900"
                      >
                        {path.content}
                      </Label>
                    </div>
                  ))}
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem
                      value="custom"
                      id="custom-path"
                      className="mt-1 text-amber-700"
                    />
                    <Label
                      htmlFor="custom-path"
                      className="flex-1 text-amber-900"
                    >
                      Write your own continuation:
                    </Label>
                  </div>
                </RadioGroup>
                {selectedPath === "custom" && (
                  <Textarea
                    placeholder="Write your own continuation..."
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    className="min-h-[100px] border-amber-200 focus:border-amber-400"
                  />
                )}
                <Button
                  onClick={handleAddPart}
                  disabled={isLoading || isGenerating || !selectedPath}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Adding...
                    </>
                  ) : (
                    "Continue Story"
                  )}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="image">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Describe the image you want to generate..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="min-h-[100px] border-amber-200 focus:border-amber-400"
                  />
                  <Button
                    variant="outline"
                    onClick={handleGeneratePrompt}
                    disabled={isGeneratingPrompt}
                    className="shrink-0 border-amber-200 hover:bg-amber-50"
                  >
                    {isGeneratingPrompt ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4 text-amber-700" />
                        Generate Prompt
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage || !imagePrompt}
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  {isGeneratingImage ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generate Image
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
