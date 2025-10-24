import express from "express";
import cors from "cors";
import { PORT } from "../config/env";

const app = express();

app.use(
  cors({
    origin: ["https://hoppscotch.io", "http://localhost:3000"],
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.listen(PORT, async () => {
  console.log(`Server is running on https://localhost:${PORT}`);
});

export default app;
