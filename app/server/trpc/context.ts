import { inferAsyncReturnType } from "@trpc/server";
import { db } from "../../db/index.server";
import { users, sessions, type SafeUser } from "../../db/schema";
import { eq, and, gt } from "drizzle-orm";

export const SESSION_COOKIE_NAME = "session_token";

/**
 * Parse session cookie and get user from database
 * IMPORTANT: never crash the whole app if the auth tables are missing/mismatched.
 */
async function getSessionUser(
  request: Request
): Promise<{ user: SafeUser | null; sessionToken: string | null }> {
  const cookieHeader = request.headers.get("Cookie") || "";

  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const [key, ...vals] = c.split("=");
        return [key, vals.join("=")];
      })
  );

  const sessionToken = cookies[SESSION_COOKIE_NAME];
  if (!sessionToken) return { user: null, sessionToken: null };

  try {
    const result = await db
      .select({
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          imageUrl: users.imageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.token, sessionToken), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (result.length === 0) return { user: null, sessionToken };
    return { user: result[0].user, sessionToken };
  } catch (err) {
    // If you hit the wrong DB/schema, treat as logged out instead of nuking the app
    console.error("[auth] getSessionUser failed; treating as signed out.", err);
    return { user: null, sessionToken: null };
  }
}

/**
 * Creates context for a tRPC request
 */
export async function createContext({ request }: { request: Request }) {
  const { user, sessionToken } = await getSessionUser(request);

  return {
    request,
    db,
    user,
    sessionToken,
  };
}

export type Context = inferAsyncReturnType<typeof createContext>;
