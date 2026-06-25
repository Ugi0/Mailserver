import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const SECRET = process.env.JWT_SECRET as string;
if (!SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

export interface JwtPayload {
  userId: number;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies["mail-session-token"];

  if (!token) {
    return res.sendStatus(401);
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded as JwtPayload;
    next();
  } catch {
    return res.sendStatus(403);
  }
}