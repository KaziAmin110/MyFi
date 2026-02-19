import { Response } from "express";
import { expandRecurrences } from "../utils/appointments.utils";
import { AuthRequest } from "../middlewares/auth.middleware";
import {
  createAppointmentDB,
  createRemindersDB,
  getUpcomingAppointmentsDB,
  getPastAppointmentsWithCheckInsDB,
  getAppointmentByIdDB,
  getCheckInsByAppointmentIdDB,
  updateAppointmentDB,
  deleteUnsentRemindersDB,
  softDeleteAppointmentDB,
  getCheckInByDateDB,
  createCheckInDB,
  getAllActiveAppointmentsDB,
} from "../services/appointments.service";

// Creates a new appointment and schedules initial reminders if enabled
export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user;
    const {
      title,
      start_date,
      end_date,
      days_of_week,
      is_recurring,
      recurrence_frequency,
      max_occurences,
      reminder_enabled,
    } = req.body;

    if (!start_date) {
      return res
        .status(400)
        .json({ success: false, message: "start_date is required" });
    }

    const startDate = new Date(start_date);
    if (isNaN(startDate.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid start_date" });
    }

    if (startDate < new Date()) {
      const now = new Date();
      if (startDate.getTime() < now.getTime() - 60000) {
        return res.status(400).json({
          success: false,
          message: "start_date cannot be in the past",
        });
      }
    }

    if (is_recurring) {
      if (!Array.isArray(days_of_week) || days_of_week.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "days_of_week must be a non-empty array for recurring appointments",
        });
      }
    }

    const appointment = await createAppointmentDB({
      user_id: userId,
      title,
      start_date,
      end_date,
      days_of_week,
      is_recurring,
      recurrence_frequency,
      max_occurences,
      reminder_enabled,
      is_active: true,
    });

    if (reminder_enabled) {
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(startDate);
      rangeEnd.setFullYear(rangeEnd.getFullYear() + 2);

      const validDates = expandRecurrences(
        appointment as any,
        rangeStart,
        rangeEnd,
      );

      const upcoming = validDates.slice(0, 4);

      if (upcoming.length > 0) {
        const reminders = upcoming.map((date) => {
          const remindAt = new Date(date);
          remindAt.setMinutes(remindAt.getMinutes() - 15);
          return {
            appointment_id: appointment.id,
            user_id: userId,
            scheduled_date: date.toISOString().split("T")[0],
            remind_at: remindAt.toISOString(),
            is_sent: false,
          };
        });

        await createRemindersDB(reminders);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appointment,
    });
  } catch (error: any) {
    console.error("Create Appointment Exception:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Retrieves appointments based on status ('upcoming' or 'past')
export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user;
    const { status } = req.query;

    if (status !== "upcoming" && status !== "past") {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'upcoming' or 'past'.",
      });
    }

    if (status === "upcoming") {
      const appointments = await getUpcomingAppointmentsDB(userId as string);

      if (!appointments)
        return res.status(200).json({ success: true, data: [] });

      const now = new Date();
      const future = new Date();
      future.setFullYear(future.getFullYear() + 2);

      const upcomingAppointments = appointments.filter((app: any) => {
        const occurrences = expandRecurrences(app, now, future);
        return occurrences.length > 0;
      });

      return res
        .status(200)
        .json({ success: true, data: upcomingAppointments });
    } else {
      const appointments = await getPastAppointmentsWithCheckInsDB(
        userId as string,
      );
      return res.status(200).json({ success: true, data: appointments });
    }
  } catch (error: any) {
    console.error("Get Appointments Exception:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Generates a calendar view with all appointment occurrences within a date range
export const getCalendar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format" });
    }

    const appointments = await getAllActiveAppointmentsDB(userId as string);

    if (!appointments)
      return res.status(200).json({ success: true, data: { dates: [] } });

    const allDates = new Set<string>();

    appointments.forEach((app: any) => {
      const occurrences = expandRecurrences(app, start, end);
      occurrences.forEach((date) => {
        allDates.add(date.toISOString().split("T")[0]);
      });
    });

    return res
      .status(200)
      .json({ success: true, data: { dates: Array.from(allDates).sort() } });
  } catch (error: any) {
    console.error("Get Calendar Exception:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Fetches a single appointment and its check-in history
export const getAppointmentById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user;
    const { appointmentId } = req.params;

    const appointment = await getAppointmentByIdDB(
      appointmentId,
      userId as string,
    );

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const checkIns = await getCheckInsByAppointmentIdDB(appointmentId);

    return res
      .status(200)
      .json({ success: true, data: { ...appointment, check_ins: checkIns } });
  } catch (error: any) {
    console.error("Get Appointment By Id Exception:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Updates an appointment and regenerates reminders if necessary
export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user;
    const { appointmentId } = req.params;
    const updates = req.body;

    const existing = await getAppointmentByIdDB(
      appointmentId,
      userId as string,
    );

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const updated = await updateAppointmentDB(appointmentId, updates);

    // Handle Reminder Changes
    if (updates.reminder_enabled === false) {
      await deleteUnsentRemindersDB(appointmentId);
    } else if (
      updates.reminder_enabled === true ||
      (existing.reminder_enabled && updates.reminder_enabled !== false)
    ) {
      const startChanged =
        updates.start_date && updates.start_date !== existing.start_date;
      const daysChanged =
        updates.days_of_week &&
        JSON.stringify(updates.days_of_week) !==
          JSON.stringify(existing.days_of_week);

      if (startChanged || daysChanged || updates.reminder_enabled === true) {
        await deleteUnsentRemindersDB(appointmentId);

        const startDate = new Date(updated.start_date);
        const rangeStart = new Date(startDate);
        const rangeEnd = new Date(startDate);
        rangeEnd.setFullYear(rangeEnd.getFullYear() + 2);

        const validDates = expandRecurrences(
          updated as any,
          rangeStart,
          rangeEnd,
        );
        const upcoming = validDates.slice(0, 4);

        if (upcoming.length > 0) {
          const reminders = upcoming.map((date) => {
            const remindAt = new Date(date);
            remindAt.setMinutes(remindAt.getMinutes() - 15);
            return {
              appointment_id: updated.id,
              user_id: userId,
              scheduled_date: date.toISOString().split("T")[0],
              remind_at: remindAt.toISOString(),
              is_sent: false,
            };
          });

          await createRemindersDB(reminders);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Update Appointment Exception:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Soft deletes an appointment and removes pending reminders
export const deleteAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user;
    const { appointmentId } = req.params;

    const existing = await getAppointmentByIdDB(
      appointmentId,
      userId as string,
    );

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    await softDeleteAppointmentDB(appointmentId);
    await deleteUnsentRemindersDB(appointmentId);

    return res
      .status(200)
      .json({ success: true, message: "Appointment deleted successfully" });
  } catch (error: any) {
    console.error("Delete Appointment Exception:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Validates and records a check-in for a specific occurrence
export const checkIn = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user;
    const { appointmentId } = req.params;
    const { scheduled_date } = req.body;

    if (!scheduled_date) {
      return res
        .status(400)
        .json({ success: false, message: "scheduled_date is required" });
    }

    const appointment = await getAppointmentByIdDB(
      appointmentId,
      userId as string,
    );

    if (!appointment || !appointment.is_active) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or inactive",
      });
    }

    const startOfDay = new Date(scheduled_date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(scheduled_date);
    endOfDay.setHours(23, 59, 59, 999);

    const validOccurrences = expandRecurrences(
      appointment as any,
      startOfDay,
      endOfDay,
    );

    if (validOccurrences.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid check-in date for this appointment",
      });
    }

    const existingCheckIn = await getCheckInByDateDB(
      appointmentId,
      scheduled_date,
    );

    if (existingCheckIn) {
      return res.status(409).json({
        success: false,
        message: "Check-in already exists for this date",
      });
    }

    const newCheckIn = await createCheckInDB({
      appointment_id: appointmentId,
      user_id: userId,
      scheduled_date,
      checked_in_at: new Date().toISOString(),
      status: "completed",
    });

    return res.status(201).json({
      success: true,
      message: "Checked in successfully",
      data: newCheckIn,
    });
  } catch (error: any) {
    console.error("Check-in Exception:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Fetches check-in history for an appointment
export const getCheckIns = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user;
    const { appointmentId } = req.params;

    const appointment = await getAppointmentByIdDB(
      appointmentId,
      userId as string,
    );

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    const checkIns = await getCheckInsByAppointmentIdDB(appointmentId);

    return res.status(200).json({ success: true, data: checkIns });
  } catch (error: any) {
    console.error("Get Check-ins Exception:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
