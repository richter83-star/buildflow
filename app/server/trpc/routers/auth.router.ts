import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { procedure, router } from "../trpc";
import { users, sessions } from "~/db/schema";

type SafeUser = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const SESSION_EXPIRY_DAYS = 30;

function generateSessionToken() {
  return crypto.randomUUID().replace(/-/g, "");
}

function createSessionCookie(token: string, maxAgeSeconds: number) {
  return `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export const authRouter = router({
  me: procedure.query(async ({ ctx }) => {
    const user = ctx.user;
    if (!user) {
      return { isSignedIn: false as const, user: null };
    }

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      imageUrl: user.imageUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { isSignedIn: true as const, user: safeUser };
  }),

  register: procedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        firstName: z.string().optional(),
        lastName: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase();

      const [existing] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already in use" });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);

      const [created] = await ctx.db
        .insert(users)
        .values({
          email,
          passwordHash,
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
        })
        .returning();

      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      await ctx.db.insert(sessions).values({
        userId: created.id,
        token,
        expiresAt,
      });

      const safeUser: SafeUser = {
        id: created.id,
        email: created.email,
        firstName: created.firstName,
        lastName: created.lastName,
        imageUrl: created.imageUrl,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };

      return {
        user: safeUser,
        sessionCookie: createSessionCookie(token, SESSION_EXPIRY_DAYS * 24 * 60 * 60),
      };
    }),

  login: procedure
    .input(
      z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const email = input.email.toLowerCase();

      const [user] = await ctx.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      // OAuth users may have no password hash
      if (!user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(input.password, user.passwordHash);
      if (!isValid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      await ctx.db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt,
      });

      const safeUser: SafeUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return {
        user: safeUser,
        sessionCookie: createSessionCookie(token, SESSION_EXPIRY_DAYS * 24 * 60 * 60),
      };
    }),

  logout: procedure.mutation(async () => {
    return {
      clearCookie: `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    };
  }),
});
