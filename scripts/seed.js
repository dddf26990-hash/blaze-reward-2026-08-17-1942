/* global process */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!SUPABASE_URL || !SERVICE_KEY || !ADMIN_EMAIL) {
  console.error("Missing required env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const DEFAULT_CATEGORIES = [
  "Free Money", "Gift Cards", "Robux Websites", "Robux Cards", "Visa Cards",
  "Free Fire", "Free V-Bucks", "Reward Apps", "Walk for Rbx", "PC Apps",
  "Microsoft Rewards", "AI Tools", "Discord Boost"
];

async function main() {
  const rows = DEFAULT_CATEGORIES.map((name, i) => ({
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
    sort_order: i,
    is_visible: true,
    is_deleted: false,
  }));
  const { error: catErr } = await supabase.from("categories").upsert(rows, { onConflict: "slug" });
  if (catErr) { console.error("Category seed failed:", catErr.message); process.exit(1); }
  console.log("Seeded " + rows.length + " categories.");

  const { data: user, error: userErr } = await supabase
    .from("profiles").select("id, email, role").eq("email", ADMIN_EMAIL).single();
  if (userErr) {
    console.warn("No profile found for " + ADMIN_EMAIL + ". Register that email in the app first.");
  } else if (user.role === "admin") {
    console.log(ADMIN_EMAIL + " is already an admin.");
  } else {
    const { error: updErr } = await supabase.from("profiles").update({ role: "admin" }).eq("id", user.id);
    if (updErr) { console.error("Failed to grant admin role:", updErr.message); process.exit(1); }
    console.log("Granted admin role to " + ADMIN_EMAIL);
  }
  console.log("Seed complete.");
}

main().catch((e) => { console.error(e); process.exit(1); });
