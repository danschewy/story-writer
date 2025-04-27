import { createClient, createAdminClient } from "@/lib/supabase-server";
import { nanoid } from "nanoid";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { sessionId, context } = await request.json();
    console.log(
      "Generating paths for session in generate-paths:",
      sessionId,
      "with context:",
      context
    );

    // Get the authorization header
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("No authorization header");
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];
    const supabase = await createClient();
    console.log("Created Supabase client");

    // Verify the token
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("Authentication error:", { userError, user });
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Use admin client to bypass RLS for fetching story parts
    const adminClient = createAdminClient();
    console.log("Created admin client for fetching story parts");

    // Get the story parts
    const { data: storySession, error } = await adminClient
      .from("sessions")
      .select(
        `
        story_parts (
          content,
          type
        )
      `
      )
      .eq("id", sessionId)
      .single();

    if (error) {
      console.error("Error fetching story parts:", error);
      return NextResponse.json(
        { error: "Failed to fetch story parts" },
        { status: 500 }
      );
    }

    if (!storySession) {
      console.error("No story session found for ID:", sessionId);
      return NextResponse.json(
        { error: "Story session not found" },
        { status: 404 }
      );
    }

    console.log("Fetched story session:", {
      id: sessionId,
      partsCount: storySession.story_parts?.length,
    });

    const storyContent = storySession.story_parts
      .map((part) => part.content)
      .join("\n\n");

    // If context is provided, use it for image prompt generation
    if (context) {
      console.log("Generating image prompt with context");
      const { text } = await generateText({
        model: openai("gpt-4.1-nano"),
        prompt: `You are a creative writing assistant helping to generate an image prompt for a story. 
        Here's the story so far:
        
        ${storyContent}
        
        Based on the story's current direction and tone, generate a detailed image prompt that would illustrate a key moment or scene.
        The prompt should:
        1. Be descriptive and vivid
        2. Include specific details about the scene, characters, and atmosphere
        3. Be suitable for an AI image generation model
        4. Be 1-2 sentences long
        
        Format the response as a single image prompt.`,
        temperature: 0.8,
        maxTokens: 200,
      });

      console.log("Generated image prompt:", text);
      return NextResponse.json({
        paths: [
          {
            id: nanoid(),
            content: text.trim(),
            type: "text" as const,
          },
        ],
      });
    }

    // Otherwise, generate story continuations
    console.log("Generating story continuations");
    const { text } = await generateText({
      model: openai("gpt-4.1-nano"),
      prompt: `You are a creative writing assistant helping with a collaborative story. 
      Here's the story so far:
      
      ${storyContent}
      
      Based on the story's current direction and tone, generate 3 different possible continuations. 
      Each continuation should:
      1. Be 2-3 sentences long
      2. Take the story in a unique and interesting direction
      3. Maintain consistency with the established narrative
      4. Include elements of surprise or intrigue
      5. Be diverse in tone and style from the other options
      
      Format each continuation as a numbered list item (1., 2., 3.) with no extra text before or after the list.
      Example format:
      1. First continuation text here
      2. Second continuation text here
      3. Third continuation text here`,
      temperature: 0.8,
      maxTokens: 500,
    });

    console.log("Generated continuations:", text);

    // Parse the response into separate paths
    const paths = text
      .split(/\d+\./)
      .slice(1) // Remove any text before the first number
      .map((content) => ({
        id: nanoid(),
        content: content.trim(),
        type: "text" as const,
      }))
      .filter((path) => path.content); // Remove any empty paths

    console.log("Parsed paths:", paths);

    return NextResponse.json({
      paths: paths.slice(0, 3), // Ensure we only return 3 paths
    });
  } catch (error) {
    console.error("Failed to generate paths:", error);
    return NextResponse.json(
      {
        error: "Failed to generate paths",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
