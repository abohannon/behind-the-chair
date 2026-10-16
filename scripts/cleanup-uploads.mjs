// Bounded maintenance of abandoned resumes. Never deletes submitted attachments.
// Default is a dry run; pass --delete after reviewing counts.
import { createClient } from "@supabase/supabase-js";
const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } =
  process.env;
if (!url || !key)
  throw new Error("Load the intended environment before running cleanup.");
const admin = createClient(url, key, { auth: { persistSession: false } });
const cutoff = Date.now() - 24 * 60 * 60 * 1000;
const { data: users, error } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 100,
});
if (error) throw error;
let total = 0;
for (const user of users.users) {
  const { data: folders, error: folderError } = await admin.storage
    .from("resumes")
    .list(user.id, { limit: 100 });
  if (folderError) throw folderError;
  const { data: apps, error: appError } = await admin
    .from("applications")
    .select("resume_path")
    .like("resume_path", `${user.id}/%`);
  if (appError) throw appError;
  const referenced = new Set(apps.map((a) => a.resume_path));
  for (const folder of folders ?? []) {
    if (folder.id) continue; // Never touch legacy profile-level files.
    const { data: files, error: filesError } = await admin.storage
      .from("resumes")
      .list(`${user.id}/${folder.name}`, { limit: 10 });
    if (filesError) throw filesError;
    for (const file of files ?? []) {
      const path = `${user.id}/${folder.name}/${file.name}`;
      if (
        file.id &&
        file.created_at &&
        Date.parse(file.created_at) < cutoff &&
        !referenced.has(path)
      ) {
        total++;
        if (process.argv.includes("--delete")) {
          // Recheck immediately before deletion; recent attempts are never eligible.
          const { count, error: countError } = await admin
            .from("applications")
            .select("id", { head: true, count: "exact" })
            .eq("resume_path", path);
          if (countError) throw countError;
          if (count === 0) {
            const { error: deleteError } = await admin.storage
              .from("resumes")
              .remove([path]);
            if (deleteError) throw deleteError;
          }
        }
      }
    }
  }
}
console.log(
  `${total} abandoned resume(s) older than 24 hours ${process.argv.includes("--delete") ? "processed" : "eligible (dry run)"}. Bounded to 100 accounts and 100 upload folders per account.`,
);
