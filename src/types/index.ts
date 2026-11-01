export interface User {
  id: string;
  username: string;
  name: string;
  avatar_color: string;
  is_private?: boolean;
  created_at: string;
}

export interface SpaceMember {
  user_id: string;
  username: string;
  name: string;
  avatar_color: string;
  role: "owner" | "member";
  is_private?: boolean;
  created_at?: string;
}

export interface Space {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  created_by?: string;
  created_at: string;
  task_count?: number;
  members?: SpaceMember[];
  member_count?: number;
}

export interface SearchedUser {
  id: string;
  username: string;
  name: string;
  avatar_color: string;
  is_private: boolean;
  friendship_status: "none" | "friends" | "pending_sent" | "pending_received";
  can_add_to_space: boolean;
}

export interface FriendsData {
  friends: SearchedUser[];
  pending_incoming: SearchedUser[];
  pending_outgoing: SearchedUser[];
}

export interface FilterCounts {
  all: number;
  tagged: number;
  radar: number;
  spaces: Record<string, number>;
}

export interface TaskNote {
  id: string;
  task_id: string;
  author: string;
  content: string;
  tagged_users: string[];
  created_at: string;
}

export interface Task {
  id: string;
  space_id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  lead_time_days: number;
  reminder_date: string | null;
  status: "todo" | "in_progress" | "completed";
  created_by: string;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  space_name?: string;
  space_color?: string;
  space_icon?: string;
  notes?: TaskNote[];
  notes_count?: number;
  tagged_users?: string[];
  latest_note?: {
    author: string;
    content: string;
    created_at: string;
  } | null;
}
