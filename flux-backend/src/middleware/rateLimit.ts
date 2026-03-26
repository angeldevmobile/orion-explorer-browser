import rateLimit from "express-rate-limit";
import type { Request } from "express";

const isLocalhost = (req: Request): boolean => {
  const ip = req.ip ?? "";
  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1";
};

// Límite global: 5000 requests por 15 min (omitido para localhost)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  skip: isLocalhost,
  message: { error: "Demasiadas solicitudes, intenta más tarde" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// Límite para auth: 20 intentos por 15 min
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Demasiados intentos de autenticación, espera 15 minutos" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

// Límite para API de voz: 100 requests por 15 min
export const voiceLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Demasiadas solicitudes de voz, intenta más tarde" },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});