import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export default async function DashboardPage() {
  await connection();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch study day settings
  const { data: settings } = await supabase
    .from("study_day_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <DashboardClient
      email={user.email ?? ""}
      profile={profile}
      settings={settings}
    />
  );
}
