import { SignJWT, jwtVerify } from "jose"
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "garuda-os-dev-secret-replace-in-production-with-32-char-min"
)
const COOKIE_NAME = "g_session"
const EXPIRY      = 60 * 60 * 24 // 24 hours in seconds

export type JWTPayload = {
  sub: string   // user id
  username: string
  name: string
  role: "superadmin" | "admin" | "team"
}

// ── PASSWORD HASHING (node:crypto, no external packages) ──
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex")
  const hash = scryptSync(plain, salt, 32).toString("hex")
  return `${salt}:${hash}`
}

export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, storedHash] = stored.split(":")
  if (!salt || !storedHash) return false
  const inputHash = scryptSync(plain, salt, 32)
  const storedBuf = Buffer.from(storedHash, "hex")
  return timingSafeEqual(inputHash, storedBuf)
}

// ── JWT HELPERS ──
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${EXPIRY}s`)
    .setSubject(payload.sub)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

// ── COOKIE HELPERS (server components / route handlers) ──
export async function getSessionFromCookies(): Promise<JWTPayload | null> {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export function buildSessionCookie(token: string) {
  return {
    name:     COOKIE_NAME,
    value:    token,
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge:   EXPIRY,
    path:     "/",
  }
}

export function clearSessionCookie() {
  return {
    name:    COOKIE_NAME,
    value:   "",
    maxAge:  0,
    path:    "/",
  }
}
