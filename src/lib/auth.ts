import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

export const COOKIE = "cq_session";

function secret() {
  return new TextEncoder().encode(
    process.env.AUTH_SECRET || "dev-secret-change-me-please-32chars"
  );
}

export async function createSession(userId: string, role: string) {
  const token = await new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.INSECURE_COOKIES !== "1",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export function destroySession() {
  cookies().delete(COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const id = await getSessionUserId();
  if (!id) return null;
  const user = await db.user.findUnique({ where: { id } });
  if (!user || !user.active) return null;
  return user;
}

/** For server components / pages. Redirects to /login when signed out. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireAdminPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

/** For route handlers. Returns null if unauthorised. */
export async function apiUser(requireAdmin = false) {
  const user = await getCurrentUser();
  if (!user) return null;
  if (requireAdmin && user.role !== "ADMIN") return null;
  return user;
}
