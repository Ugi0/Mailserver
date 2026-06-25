import express, { Request, Response, NextFunction } from "express";
import handleUsers from "./routes/users.js";
import handleRules from "./routes/rules.js";
import handleRegistrationCode from "./routes/registrationCode.js";
import cors from "cors";
import { authMiddleware } from "./helpers/middleware.js";
import cookieParser from "cookie-parser";

const app = express();
const PORT = Number(process.env.PORT) || 8080;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

const api = express.Router();
app.use("/api", api);

api.get("/healthz", (req: Request, res: Response) => {
  res.json({ ok: true });
});

api.use("/registration-code", handleRegistrationCode);

api.use("/users", handleUsers);
api.use("/rules", authMiddleware, handleRules);

app.use((req: Request, res: Response) => {
  res.status(404).send("Not Found");
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.sendStatus(401);
  next();
}