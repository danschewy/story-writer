import { createClient } from "./supabase-server";

export async function getServerAuthSession() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      name:
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "Anonymous",
      email: user.email,
    },
  };
}

export async function requireAuth() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    throw new Error("Authentication required");
  }

  return session;
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
  }
}
