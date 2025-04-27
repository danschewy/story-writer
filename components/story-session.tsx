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
  const { toast } = useToast();

  useEffect(() => {
    setLocalSession(session);
    console.log("Story session prop updated:", {
      isComplete: session.isComplete,
      title: session.title,
      partsCount: session.parts?.length,
      currentUser: session.currentUser,
    });
  }, [session]);

  useEffect(() => {
    console.log("Rendering story session state:", {
      isComplete: localSession.isComplete,
      title: localSession.title,
      partsCount: localSession.parts?.length,
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
          console.log("Fetching story paths for session:", sessionId);
          const paths = await generateStoryPaths(sessionId);
          console.log("Fetched paths:", paths);
          setStoryPaths(paths);
        } catch (error) {
          console.error("Failed to generate paths:", error);
          toast({
            title: "Error",
            description: "Failed to load story suggestions.",
            variant: "destructive",
          });
        } finally {
          setIsGenerating(false);
        }
      }
    }

    if (localSession && !localSession.isComplete) {
      fetchPaths();
    }
  }, [
    sessionId,
    localSession?.isComplete,
    localSession?.parts?.length,
    selectedPath,
    toast,
  ]);

  async function handleAddPart() {
    setIsLoading(true);
    try {
      if (!session?.currentUser?.id) {
        toast({
          title: "Error",
          description: "Authentication required.",
          variant: "destructive",
        });
        return;
      }

      const content = selectedPath === "custom" ? customPath : selectedPath;
      if (!content) {
        throw new Error("Please select or enter a continuation");
      }

      console.log("Adding text part:", { sessionId, content });
      const success = await addStoryPart(sessionId, content);
      if (!success) {
        throw new Error("Failed to add story part on server.");
      }

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
      console.error("Error in handleAddPart:", error);
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
      if (!session?.currentUser?.id) {
        toast({
          title: "Error",
          description: "Authentication required.",
          variant: "destructive",
        });
        return;
      }
      if (!imagePrompt) {
        throw new Error("Please enter a description for the image.");
      }

      console.log("Generating image:", { sessionId, imagePrompt });
      const imageUrl = await generateImageForStory(sessionId, imagePrompt);
      if (imageUrl) {
        console.log("Adding image part:", { sessionId, imagePrompt, imageUrl });
        const success = await addStoryPart(
          sessionId,
          imagePrompt,
          "image",
          imageUrl
        );
        if (!success) {
          throw new Error("Failed to add image part to story.");
        }
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
        throw new Error("Failed to generate or upload image");
      }
    } catch (error) {
      console.error("Error in handleGenerateImage:", error);
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
      if (!session?.currentUser?.id) {
        toast({
          title: "Error",
          description: "Authentication required.",
          variant: "destructive",
        });
        return;
      }

      // Get the last few parts of the story for context
      const recentParts = localSession.parts.slice(-3);
      const storyContext = recentParts
        .map((part: any) => part.content)
        .join("\n");

      console.log("Generating image prompt with context:", storyContext);
      const paths = await generateStoryPaths(sessionId, storyContext);
      if (paths && paths.length > 0) {
        console.log("Using generated path as image prompt:", paths[0].content);
        setImagePrompt(paths[0].content);
        toast({
          title: "Prompt Generated",
          description: "A prompt based on the recent story has been generated.",
        });
      } else {
        throw new Error("Failed to generate prompt suggestions");
      }
    } catch (error) {
      console.error("Error in handleGeneratePrompt:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate image prompt",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPrompt(false);
    }
  }

  async function handleCompleteStory() {
    setIsLoading(true);
    try {
      if (!session?.currentUser?.id) {
        toast({
          title: "Error",
          description: "Authentication required.",
          variant: "destructive",
        });
        return;
      }
      if (!session.isCreator) {
        toast({
          title: "Error",
          description: "Only the story creator can mark it as complete.",
          variant: "destructive",
        });
        return;
      }

      console.log("Completing story:", sessionId);
      const success = await completeStory(sessionId);
      if (!success) {
        throw new Error("Failed to mark story as complete on server.");
      }

      const updatedSession = await getSession(sessionId);
      if (updatedSession) {
        setLocalSession(updatedSession);
      }
      toast({
        title: "Story completed!",
        description: "The story has been marked as complete",
      });
    } catch (error) {
      console.error("Error in handleCompleteStory:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to complete story",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function copyShareLink() {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/session/${sessionId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link copied!",
        description: "Share this link with friends to collaborate",
      });
    } else {
      toast({
        title: "Error",
        description: "Could not copy link.",
        variant: "destructive",
      });
    }
  }

  if (!localSession || !localSession.parts) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <p className="ml-2 text-amber-700">Loading session details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {localSession.isComplete ? (
        <CompletedStoryView story={localSession} />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-amber-900">
              {localSession.title}
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
              {localSession.isCreator && !localSession.isComplete && (
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
                        priority={index < 3}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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

          {!localSession.isComplete && localSession.currentUser && (
            <Tabs defaultValue="text" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-amber-100">
                <TabsTrigger
                  value="text"
                  className="data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900"
                >
                  Add Text
                </TabsTrigger>
                <TabsTrigger
                  value="image"
                  className="data-[state=active]:bg-amber-200 data-[state=active]:text-amber-900"
                >
                  Add Image
                </TabsTrigger>
              </TabsList>
              <TabsContent value="text">
                {isGenerating ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-700 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                    <p className="mt-2 text-amber-700">
                      Generating story paths...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 p-4 border border-amber-200 rounded-b-md">
                    <RadioGroup
                      value={selectedPath}
                      onValueChange={setSelectedPath}
                    >
                      {storyPaths.map((path) => (
                        <div
                          key={path.id}
                          className="flex items-start space-x-2"
                        >
                          <RadioGroupItem
                            value={path.content}
                            id={path.id}
                            className="mt-1 text-amber-700"
                          />
                          <Label
                            htmlFor={path.id}
                            className="flex-1 text-amber-900 cursor-pointer"
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
                          className="flex-1 text-amber-900 cursor-pointer"
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
                )}
              </TabsContent>
              <TabsContent value="image">
                <div className="space-y-4 p-4 border border-amber-200 rounded-b-md">
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
                      className="shrink-0 border-amber-200 hover:bg-amber-50 text-amber-900"
                      title="Generate prompt suggestion based on recent story"
                    >
                      {isGeneratingPrompt ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-4 w-4 text-amber-700" />
                          Suggest Prompt
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
                        Generate & Add Image
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </>
      )}
    </div>
  );
}
