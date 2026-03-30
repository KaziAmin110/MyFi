import { Router } from "express";
import { authenticateUser } from "../middlewares/auth.middleware";
import {
  createAppointment,
  getAppointments,
  getCalendar,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  checkIn,
  getCheckIns,
} from "../controllers/appointments.controller";

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateUser);

router.post("/", createAppointment);
router.get("/", getAppointments);
router.get("/calendar", getCalendar);
router.get("/:appointmentId", getAppointmentById);
router.put("/:appointmentId", updateAppointment);
router.delete("/:appointmentId", deleteAppointment);

router.post("/:appointmentId/check-in", checkIn);
router.get("/:appointmentId/check-ins", getCheckIns);

export default router;
