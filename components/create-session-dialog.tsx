"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState, useEffect } from "react";
import { createSession, generateStoryTopics } from "@/lib/actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateSessionDialog({
  open,
  onOpenChange,
}: CreateSessionDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [customTopic, setCustomTopic] = useState("");
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth error:", error);
          router.push("/");
          return;
        }

        if (!session?.user) {
          console.log("No session found");
          router.push("/");
          return;
        }

        console.log("User authenticated:", session.user);
        setUser(session.user);
      } catch (error) {
        console.error("Error checking auth:", error);
        router.push("/");
      }
    }

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.push("/");
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // Generate story prompts when dialog opens
  useEffect(() => {
    async function generateTopics() {
      if (open) {
        setIsGeneratingTopics(true);
        try {
          const generatedTopics = await generateStoryTopics();
          setTopics(generatedTopics);
        } catch (error) {
          console.error("Failed to generate topics:", error);
          toast({
            title: "Error",
            description:
              "Failed to generate story prompts. Using default topics.",
            variant: "destructive",
          });
        } finally {
          setIsGeneratingTopics(false);
        }
      }
    }

    generateTopics();
  }, [open, toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!user) {
        console.error("No user found");
        router.push("/");
        return;
      }

      const finalTopic =
        selectedTopic === "custom" ? customTopic : selectedTopic;

      if (!finalTopic) {
        throw new Error("Please select or enter a topic");
      }

      console.log("Creating session with topic:", finalTopic);
      const sessionId = await createSession(finalTopic);
      console.log("Session created:", sessionId);

      toast({
        title: "Success!",
        description: "Your story session has been created",
      });
      router.push(`/session/${sessionId}`);
    } catch (error) {
      console.error("Error creating session:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a new story session</DialogTitle>
            <DialogDescription>
              Choose a starting topic for your collaborative story or create
              your own.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isGeneratingTopics ? (
              <div className="flex items-center justify-center py-4">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                <p className="ml-2 text-sm text-muted-foreground">
                  Generating story prompts...
                </p>
              </div>
            ) : (
              <RadioGroup
                value={selectedTopic}
                onValueChange={setSelectedTopic}
              >
                {topics.map((topic, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={topic} id={`topic-${index}`} />
                    <Label htmlFor={`topic-${index}`}>{topic}</Label>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="topic-custom" />
                  <Label htmlFor="topic-custom">Create your own:</Label>
                </div>
              </RadioGroup>
            )}
            {selectedTopic === "custom" && (
              <Input
                placeholder="Enter your own topic..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="mt-2"
              />
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading || isGeneratingTopics}>
              {isLoading ? "Creating..." : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
