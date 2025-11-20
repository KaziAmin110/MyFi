import express from "express";
import cors from "cors";
import { PORT } from "./config/env";
import authRouter from "./routes/auth.routes";
import userRouter from "./routes/user.routes";

const app = express();

// Middleware
app.use(
  cors({
    origin: ["https://hoppscotch.io", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: false }));

// Routes
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
