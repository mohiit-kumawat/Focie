import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const instant = false;

export default async function DashboardPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 1. Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. Fetch study day settings
  const { data: settings } = await supabase
    .from("study_day_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // 3. Fetch accepted friends for gifting & social interactions
  const { data: friendships } = await supabase
    .from("friendships")
    .select("requester_id, recipient_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

  const friendIds: string[] = [];
  if (friendships) {
    for (const f of friendships) {
      if (f.requester_id === user.id) friendIds.push(f.recipient_id);
      else friendIds.push(f.requester_id);
    }
  }

  let friendsList: { id: string; name: string; username: string; avatarUrl: string | null }[] = [];
  if (friendIds.length > 0) {
    const { data: friendProfiles } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_url")
      .in("id", friendIds);

    if (friendProfiles) {
      friendsList = friendProfiles.map((p) => ({
        id: p.id,
        name: p.display_name || p.username,
        username: p.username,
        avatarUrl: p.avatar_url,
      }));
    }
  }

  return (
    <DashboardClient
      email={user.email ?? ""}
      profile={profile}
      settings={settings}
      friends={friendsList}
    />
  );
}
