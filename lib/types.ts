export interface Session {
  id: string;
  title: string;
  createdAt: string;
  participantCount: number;
  lastUpdate: string;
  isComplete: boolean;
  createdBy: string;
  latestImage?: string;
}

export interface StoryPart {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  timestamp: string;
  type: "text" | "image";
  imageUrl?: string;
}

export interface StoryPath {
  id: string;
  content: string;
  type: "text" | "image";
  imageUrl?: string;
}

// Supabase database types
export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          title: string;
          created_at: string;
          created_by: string;
          is_complete: boolean;
          participants: string[];
        };
        Insert: {
          id: string;
          title: string;
          created_at?: string;
          created_by: string;
          is_complete?: boolean;
          participants?: string[];
        };
        Update: {
          id?: string;
          title?: string;
          created_at?: string;
          created_by?: string;
          is_complete?: boolean;
          participants?: string[];
        };
      };
      story_parts: {
        Row: {
          id: string;
          session_id: string;
          content: string;
          author_id: string;
          author_name: string;
          timestamp: string;
          type: "text" | "image";
          image_url?: string;
        };
        Insert: {
          id: string;
          session_id: string;
          content: string;
          author_id: string;
          author_name: string;
          timestamp?: string;
          type: "text" | "image";
          image_url?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          content?: string;
          author_id?: string;
          author_name?: string;
          timestamp?: string;
          type?: "text" | "image";
          image_url?: string;
        };
      };
    };
  };
}
