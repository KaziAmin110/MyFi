import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

interface Reminder {
  id: number;
  user_id: string;
  remind_at: string;
  is_sent: boolean;
  users: {
    expo_push_token: string | null;
  };
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const now = new Date().toISOString();

    // 1. Fetch unsent reminders that are due
    const { data: reminders, error: fetchError } = await supabase
      .from("appointment_reminders")
      .select(
        `
        id,
        user_id,
        remind_at,
        is_sent,
        users (
          expo_push_token
        )
      `,
      )
      .eq("is_sent", false)
      .lte("remind_at", now);

    if (fetchError) throw fetchError;

    if (!reminders || reminders.length === 0) {
      return new Response(
        JSON.stringify({ message: "No reminders to send." }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const notifications = [];
    const sentIds = [];

    for (const reminder of reminders as any[]) {
      const token = reminder.users?.expo_push_token;
      if (token && token.startsWith("ExponentPushToken")) {
        notifications.push({
          to: token,
          sound: "default",
          title: "Appointment Reminder",
          body: "You have an upcoming appointment soon!",
          data: { reminderId: reminder.id },
        });
        sentIds.push(reminder.id);
      } else {
        console.log(`No valid Expo push token for user ${reminder.user_id}`);
        // Optionally mark as sent anyway or log it
        sentIds.push(reminder.id);
      }
    }

    // 2. Send to Expo
    if (notifications.length > 0) {
      const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(notifications),
      });

      const expoData = await expoResponse.json();
      console.log("Expo response:", expoData);
    }

    // 3. Mark as sent in DB
    if (sentIds.length > 0) {
      const { error: updateError } = await supabase
        .from("appointment_reminders")
        .update({ is_sent: true, sent_at: now })
        .in("id", sentIds);

      if (updateError) throw updateError;
    }

    return new Response(
      JSON.stringify({
        message: `Sent ${notifications.length} notifications.`,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
