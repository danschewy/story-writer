"use server";

import type { Session, StoryPart, StoryPath } from "@/lib/types";
import { nanoid } from "nanoid";
import { generateText, experimental_generateImage as generateImage } from "ai";
import { openai } from "@ai-sdk/openai";
import { createClient } from "./supabase-server";
import { requireAuth } from "./auth-helpers";

export async function createSession(topic: string): Promise<string> {
  console.log("Server: Starting createSession with topic:", topic);
  const supabase = await createClient();
  console.log("Server: Created server client");

  console.log("Server: Attempting to get user...");
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("Server: getUser result:", {
    hasUser: !!user,
    error: userError,
    userData: user
      ? {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      : null,
  });

  if (userError) {
    console.error("Server: User error:", userError);
    throw new Error("Authentication required");
  }

  if (!user) {
    console.error("Server: No user found");
    throw new Error("Authentication required");
  }

  const userId = user.id;
  console.log("Server: User authenticated:", { userId });

  const sessionId = nanoid(10);
  console.log("Server: Generated session ID:", sessionId);

  console.log("Server: Creating session in database...");
  const { error } = await supabase.from("sessions").insert({
    id: sessionId,
    title: topic,
    created_at: new Date().toISOString(),
    created_by: userId,
    is_complete: false,
    participants: [userId],
  });

  if (error) {
    console.error("Server: Error creating session:", error);
    throw new Error("Failed to create session");
  }

  console.log("Server: Creating first story part...");
  const { error: partError } = await supabase.from("story_parts").insert({
    id: nanoid(),
    session_id: sessionId,
    content: topic,
    author_id: userId,
    author_name:
      user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous",
    timestamp: new Date().toISOString(),
    type: "text",
  });

  if (partError) {
    console.error("Server: Error creating first story part:", partError);
    throw new Error("Failed to create first story part");
  }

  console.log("Server: Session created successfully:", sessionId);
  return sessionId;
}

export async function getUserSessions(): Promise<Session[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return [];
  }

  const userId = user.id;

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select(
      `
      id,
      title,
      created_at,
      is_complete,
      created_by,
      participants,
      story_parts (
        timestamp,
        type,
        image_url
      )
    `
    )
    .or(`created_by.eq.${userId},participants.cs.{${userId}}`);

  if (error) {
    console.error("Error fetching sessions:", error);
    return [];
  }

  return sessions.map((s) => {
    // Find the latest image from story parts
    const latestImage = s.story_parts
      ?.filter((part: any) => part.type === "image" && part.image_url)
      .sort(
        (a: any, b: any) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];

    return {
      id: s.id,
      title: s.title,
      createdAt: s.created_at,
      participantCount: s.participants?.length || 1,
      lastUpdate:
        s.story_parts?.[s.story_parts.length - 1]?.timestamp || s.created_at,
      isComplete: s.is_complete,
      createdBy: s.created_by,
      latestImage: latestImage?.image_url,
    };
  });
}

export async function getSession(sessionId: string) {
  console.log(`[getSession ${sessionId}] Starting function`);
  const supabase = await createClient();
  console.log(`[getSession ${sessionId}] Created Supabase client`);

  try {
    console.log(`[getSession ${sessionId}] Attempting to get user...`);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    console.log(`[getSession ${sessionId}] getUser result:`, {
      hasUser: !!user,
      error: userError,
      userId: user?.id,
      userEmail: user?.email,
    });

    if (userError) {
      console.error(`[getSession ${sessionId}] User error:`, userError);
      return null;
    }

    if (!user) {
      console.error(`[getSession ${sessionId}] No user found`);
      return null;
    }
    console.log(`[getSession ${sessionId}] User authenticated: ${user.id}`);

    // First check if the session exists and user has access
    console.log(`[getSession ${sessionId}] Checking session existence...`);
    const { data: sessionExists, error: existsError } = await supabase
      .from("sessions")
      .select("id, created_by, participants")
      .eq("id", sessionId)
      .single();

    console.log(`[getSession ${sessionId}] Session exists check result:`, {
      exists: !!sessionExists,
      error: existsError,
      data: sessionExists,
    });

    if (existsError) {
      console.error(
        `[getSession ${sessionId}] Error checking session existence:`,
        existsError
      );
      return null;
    }

    if (!sessionExists) {
      console.error(`[getSession ${sessionId}] Session not found.`);
      return null;
    }
    console.log(`[getSession ${sessionId}] Session found.`);

    // Check if user has access to the session
    console.log(`[getSession ${sessionId}] Checking user access...`);
    const hasAccess =
      sessionExists.created_by === user.id ||
      sessionExists.participants?.includes(user.id);

    console.log(`[getSession ${sessionId}] Access check result:`, {
      hasAccess,
      userId: user.id,
      createdBy: sessionExists.created_by,
      participants: sessionExists.participants,
    });

    if (!hasAccess) {
      console.error(`[getSession ${sessionId}] User does not have access:`, {
        userId: user.id,
        createdBy: sessionExists.created_by,
        participants: sessionExists.participants,
      });
      return null;
    }
    console.log(`[getSession ${sessionId}] User has access.`);

    // Then fetch the full session data
    console.log(`[getSession ${sessionId}] Fetching full session data...`);
    const { data: storySession, error: fetchError } = await supabase
      .from("sessions")
      .select(
        `
        *,
        story_parts (
          id,
          content,
          author_id,
          author_name,
          timestamp,
          type,
          image_url
        )
      `
      )
      .eq("id", sessionId)
      .single();

    console.log(`[getSession ${sessionId}] Full session data result:`, {
      hasData: !!storySession,
      error: fetchError,
      id: storySession?.id,
      parts: storySession?.story_parts?.length,
    });

    if (fetchError) {
      console.error(
        `[getSession ${sessionId}] Error fetching session:`,
        fetchError
      );
      return null;
    }

    if (!storySession) {
      console.error(`[getSession ${sessionId}] Full session data not found.`);
      return null;
    }
    console.log(`[getSession ${sessionId}] Full session data fetched.`);

    // Add user to participants if not already there
    if (!storySession.participants?.includes(user.id)) {
      console.log(`[getSession ${sessionId}] Adding user to participants...`);
      const { error: updateError } = await supabase
        .from("sessions")
        .update({
          participants: [...(storySession.participants || []), user.id],
        })
        .eq("id", sessionId);

      if (updateError) {
        console.error(
          `[getSession ${sessionId}] Error updating participants:`,
          updateError
        );
        // Don't block returning the session data if participant update fails
      } else {
        console.log(`[getSession ${sessionId}] User added to participants.`);
      }
    }

    console.log(`[getSession ${sessionId}] Returning session data.`);
    return {
      ...storySession,
      parts: storySession.story_parts,
      isComplete: storySession.is_complete,
      currentUser: {
        id: user.id,
        name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Anonymous",
      },
      isCreator: storySession.created_by === user.id,
    };
  } catch (error) {
    console.error(`[getSession ${sessionId}] Unexpected error:`, error);
    return null;
  }
}

export async function generateStoryPaths(
  sessionId: string,
  context?: string
): Promise<StoryPath[]> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Authentication error:", { userError, user });
    return [];
  }

  try {
    // Use the current URL if available, otherwise use the environment variable
    const baseUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : process.env.NEXT_PUBLIC_APP_URL;

    if (!baseUrl) {
      throw new Error("No base URL available");
    }

    console.log(
      "Generating paths for session:",
      sessionId,
      "with context:",
      context
    );
    const response = await fetch(`${baseUrl}/api/generate-paths`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${
          (
            await supabase.auth.getSession()
          ).data.session?.access_token
        }`,
      },
      credentials: "include",
      body: JSON.stringify({
        sessionId,
        context,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed to generate paths:", data);
      throw new Error(data.error || "Failed to generate paths");
    }

    console.log("Generated paths:", data);
    return data.paths;
  } catch (error) {
    console.error("Error generating paths:", error);
    return [];
  }
}

export async function generateImageForStory(
  sessionId: string,
  prompt: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Authentication error:", { userError, user });
      return null;
    }

    const { image } = await generateImage({
      model: openai.image("gpt-image-1"),
      prompt,
      providerOptions: {
        openai: { quality: "low" },
      },
    });

    // Convert base64 to blob
    const base64Data = image.base64;
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    const blob = new Blob(byteArrays, { type: "image/png" });

    // Upload to Supabase Storage with proper path structure
    const fileName = `${user.id}/${sessionId}/${nanoid()}.png`;
    const { data, error } = await supabase.storage
      .from("story-images")
      .upload(fileName, blob, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("Error uploading image to Supabase:", error);
      if (error.message.includes("permission denied")) {
        console.error("Storage permission error. Please check RLS policies.");
      }
      return null;
    }

    // Get the public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("story-images").getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error("Failed to generate image:", error);
    return null;
  }
}

export async function addStoryPart(
  sessionId: string,
  content: string,
  type: "text" | "image" = "text",
  imageUrl?: string
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Authentication error:", { userError, user });
    return false;
  }

  const userId = user.id;

  console.log("Adding story part:", {
    sessionId,
    content,
    type,
    imageUrl,
  });

  const { error } = await supabase.from("story_parts").insert({
    id: nanoid(),
    session_id: sessionId,
    content,
    author_id: userId,
    author_name:
      user.user_metadata?.full_name || user.email?.split("@")[0] || "Anonymous",
    timestamp: new Date().toISOString(),
    type,
    image_url: imageUrl,
  });

  if (error) {
    console.error("Error adding story part:", error);
    return false;
  }

  return true;
}

export async function completeStory(sessionId: string): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.error("Authentication error:", { userError, user });
    return false;
  }

  const userId = user.id;

  console.log("Completing story:", { sessionId, userId });

  const { error } = await supabase
    .from("sessions")
    .update({ is_complete: true })
    .eq("id", sessionId)
    .eq("created_by", userId);

  if (error) {
    console.error("Error completing story:", error);
    return false;
  }

  console.log("Story completed successfully");
  return true;
}

export async function generateStoryTopics(): Promise<string[]> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4.1-nano"),
      prompt: `Generate 5 creative and engaging story prompts for a collaborative storytelling app. 
      Each prompt should be 1-2 sentences long and include an element of mystery, fantasy, or science fiction.
      Make them diverse in tone and setting.
      Format each prompt as a numbered list item (1., 2., etc.).`,
      temperature: 0.8,
      maxTokens: 500,
    });

    // Parse the response into separate topics
    const generatedTopics = text
      .split(/\d+\.\s/)
      .filter(Boolean)
      .map((topic) => topic.trim())
      .slice(0, 5); // Ensure we only get 5 topics

    return generatedTopics;
  } catch (error) {
    console.error("Failed to generate topics:", error);
    // Fallback to default topics if AI generation fails
    return [
      "A mysterious door appears in a forest",
      "Time suddenly stops for everyone except you",
      "An ancient artifact is discovered in your backyard",
      "You can suddenly understand animal languages",
      "A letter arrives from a parallel universe",
    ];
  }
}
