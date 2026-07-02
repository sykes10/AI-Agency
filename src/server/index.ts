import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { articlesRouter } from "./routes/articles.js";
import { eventsRouter } from "./routes/events.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(__dirname, "../../web");

const app = express();
app.use(cors());
app.use(express.json());
app.use(articlesRouter);
app.use(eventsRouter);
app.use(express.static(webDir));
app.get("/", (_req, res) => {
  res.sendFile(path.join(webDir, "index.html"));
});

const PORT = Number(process.env.PORT ?? 3000);
app.listen(PORT, () => {
  console.log(`Press Agency listening on http://localhost:${PORT}`);
});
