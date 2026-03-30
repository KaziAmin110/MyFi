import express from "express";
import cors from "cors";
import { PORT } from "./config/env";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";
import assessmentRouter from "./routes/assessment.routes";
import appointmentsRouter from "./routes/appointments.routes";
import chatRouter from "./routes/chat.routes";
import { startSessionRotationJob } from "./jobs/rotate-sessions";

const app = express();

// Middleware
app.use(
  cors({
    origin: [
      "https://hoppscotch.io",
      "http://localhost:3000",
      "http://localhost:8081",
    ],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/assessments", assessmentRouter);
app.use("/api/appointments", appointmentsRouter);
app.use("/api/chat", chatRouter);

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  startSessionRotationJob();
});

export default app;
