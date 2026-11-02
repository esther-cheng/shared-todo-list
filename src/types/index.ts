export interface User {
  id: string;
  username: string;
  name: string;
  avatar_color: string;
  is_private?: boolean;
  created_at: string;
}

export interface UserNotificationSettings {
  id: string;
  user_id: string;
  email: string | null;
  email_verified: boolean;
  phone_number?: string | null;
  phone_verified?: boolean;
  notify_mentions: boolean;
  notify_prep_window: boolean;
  notify_due_soon: boolean;
  notify_task_completed: boolean;
  notify_space_invite: boolean;
  channel_email: boolean;
  channel_push: boolean;
  channel_sms?: boolean;
  timing: "instant" | "daily_digest";
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  channel: "email" | "push" | "sms" | "in_app";
  title: string;
  message: string;
  task_id: string | null;
  status: "sent" | "delivered" | "pending";
  created_at: string;
}

export interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
  created_at?: string;
  updated_at?: string;
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
  category?: string | null;
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
