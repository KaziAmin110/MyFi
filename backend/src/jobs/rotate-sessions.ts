import cron from "node-cron";
import { supabase } from "../database/db";
import { createSessionRecord } from "../services/chat.service";
import { summarizePreviousSessionsIfNeeded } from "../services/summarization.service";

const BATCH_SIZE = 10;

export const rotateExpiredSessions = async () => {
  const { data: expiredSessions, error } = await supabase
    .from("chat_sessions")
    .select("user_id")
    .eq("status", "active")
    .lt("week_end_date", new Date().toISOString());

  if (error) {
    console.error("[SESSION ROTATION] Query failed:", error.message);
    return;
  }
  if (!expiredSessions?.length) return;

  const userIds = [...new Set(expiredSessions.map((s) => s.user_id))];
  console.log(`[SESSION ROTATION] Rotating sessions for ${userIds.length} users`);

  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (userId) => {
        try {
          await summarizePreviousSessionsIfNeeded(userId);
          await createSessionRecord(userId);
          console.log(`[SESSION ROTATION] ✓ ${userId}`);
        } catch (err) {
          console.error(`[SESSION ROTATION] ✗ ${userId}:`, err);
        }
      })
    );
  }

  console.log(`[SESSION ROTATION] Done — ${userIds.length} users processed`);
};

export const startSessionRotationJob = () => {
  cron.schedule("0 0 * * 1", rotateExpiredSessions);
  console.log("[CRON] Session rotation job scheduled (every Monday at midnight)");
};
