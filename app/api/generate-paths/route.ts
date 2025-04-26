import { createClient } from "@/lib/supabase-server";
import { nanoid } from "nanoid";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { sessionId, context } = await request.json();
    const supabase = await createClient();
    console.log(context, "context");
    // Get the story parts
    const { data: storySession, error } = await supabase
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

    if (error || !storySession) {
      console.error("Error fetching story parts:", error);
      return NextResponse.json(
        { error: "Failed to fetch story parts" },
        { status: 500 }
      );
    }

    const storyContent = storySession.story_parts
      .map((part) => part.content)
      .join("\n\n");

    // If context is provided, use it for image prompt generation
    if (context) {
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
      
      Format each continuation as a numbered list item (1., 2., 3.).
      Make sure each continuation is distinct and offers a different path for the story to take.`,
      temperature: 0.8,
      maxTokens: 500,
    });

    // Parse the response into separate paths
    const paths = text
      .split(/\d+\.\s/)
      .filter(Boolean)
      .map((content) => ({
        id: nanoid(),
        content: content.trim(),
        type: "text" as const,
      }));

    return NextResponse.json({
      paths: paths.slice(0, 3), // Ensure we only return 3 paths
    });
  } catch (error) {
    console.error("Failed to generate paths:", error);
    return NextResponse.json(
      { error: "Failed to generate paths" },
      { status: 500 }
    );
  }
}
