import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // Force cookie read before exchange
    const cookieStore = await cookies();
    cookieStore.getAll();

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    // Force cookie read after exchange
    cookieStore.getAll();

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(
        new URL("/?error=callback_error", request.url)
      );
    }
  }

  return NextResponse.redirect(new URL("/dashboard", request.url));
}
