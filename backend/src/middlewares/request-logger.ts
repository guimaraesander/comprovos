import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";

type AuthenticatedUser = {
  id?: string;
  sub?: string;
  role?: string;
  email?: string;
};

type RequestWithUser = Request & {
  user?: AuthenticatedUser;
};

function getUserInfo(req: RequestWithUser) {
  const user = req.user;

  if (!user) {
    return {
      userId: null,
      userRole: null,
      userEmail: null,
    };
  }

  return {
    userId: user.id ?? user.sub ?? null,
    userRole: user.role ?? null,
    userEmail: user.email ?? null,
  };
}

function getDurationInMs(start: bigint, end: bigint) {
  return Number(end - start) / 1_000_000;
}

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startedAt = process.hrtime.bigint();
  const requestId = randomUUID();

  res.locals.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const endedAt = process.hrtime.bigint();
    const durationMs = getDurationInMs(startedAt, endedAt);
    const { userId, userRole, userEmail } = getUserInfo(req as RequestWithUser);

    const logEntry = {
      level: "info",
      type: "http_request",
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(2)),
      ip: req.ip,
      userAgent: req.get("user-agent") ?? null,
      userId,
      userRole,
      userEmail,
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(logEntry));
  });

  next();
}