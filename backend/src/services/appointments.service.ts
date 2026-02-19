import { supabase } from "../database/db";

// Creates a new appointment in the database
export const createAppointmentDB = async (appointmentData: any) => {
  const { data, error } = await supabase
    .from("appointments")
    .insert(appointmentData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// Batch inserts appointment reminders
export const createRemindersDB = async (reminders: any[]) => {
  const { error } = await supabase
    .from("appointment_reminders")
    .insert(reminders);

  if (error) throw new Error(error.message);
};

// Fetches all active upcoming appointments for a user
export const getUpcomingAppointmentsDB = async (userId: string) => {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw new Error(error.message);
  return data;
};

// Fetches past appointments that have at least one completed or missed check-in
export const getPastAppointmentsWithCheckInsDB = async (userId: string) => {
  const { data: checkIns, error: checkInError } = await supabase
    .from("appointment_check_ins")
    .select("appointment_id")
    .eq("user_id", userId)
    .in("status", ["completed", "missed"]);

  if (checkInError) throw new Error(checkInError.message);

  const appointmentIds = Array.from(
    new Set(checkIns.map((c: any) => c.appointment_id)),
  );

  if (appointmentIds.length === 0) return [];

  const { data: appointments, error: appError } = await supabase
    .from("appointments")
    .select("*")
    .in("id", appointmentIds)
    .eq("is_active", true);

  if (appError) throw new Error(appError.message);
  return appointments;
};

// Retrieves a single appointment by ID and User ID
export const getAppointmentByIdDB = async (
  appointmentId: string,
  userId: string,
) => {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

// Retrieves all check-in history for a specific appointment
export const getCheckInsByAppointmentIdDB = async (appointmentId: string) => {
  const { data, error } = await supabase
    .from("appointment_check_ins")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("scheduled_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

// Updates details of an existing appointment
export const updateAppointmentDB = async (
  appointmentId: string,
  updates: any,
) => {
  const { data, error } = await supabase
    .from("appointments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", appointmentId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// Deletes all unsent reminders for a specific appointment
export const deleteUnsentRemindersDB = async (appointmentId: string) => {
  const { error } = await supabase
    .from("appointment_reminders")
    .delete()
    .eq("appointment_id", appointmentId)
    .eq("is_sent", false);

  if (error) throw new Error(error.message);
};

// Soft deletes an appointment by setting is_active to false
export const softDeleteAppointmentDB = async (appointmentId: string) => {
  const { error } = await supabase
    .from("appointments")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", appointmentId);

  if (error) throw new Error(error.message);
};

// Checks if a check-in already exists for a specific appointment and date
export const getCheckInByDateDB = async (
  appointmentId: string,
  scheduledDate: string,
) => {
  const { data, error } = await supabase
    .from("appointment_check_ins")
    .select("id")
    .eq("appointment_id", appointmentId)
    .eq("scheduled_date", scheduledDate)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

// Records a new check-in for an appointment
export const createCheckInDB = async (checkInData: any) => {
  const { data, error } = await supabase
    .from("appointment_check_ins")
    .insert(checkInData)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

// Fetches all active appointments for calendar generation
export const getAllActiveAppointmentsDB = async (userId: string) => {
  const { data, error } = await supabase
    .from("appointments")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true);

  if (error) throw new Error(error.message);
  return data;
};
