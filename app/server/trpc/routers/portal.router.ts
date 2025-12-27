import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { router, procedure, middleware } from '../trpc';
import { entitlements, products } from '../../../db/schema';

const requireAuth = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

const protectedProcedure = procedure.use(requireAuth);

export const portalRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        productSlug: products.slug,
        status: entitlements.status,
      })
      .from(entitlements)
      .innerJoin(products, eq(entitlements.productId, products.id))
      .where(eq(entitlements.userId, ctx.user.id));

    return {
      user: ctx.user,
      entitlements: rows,
    };
  }),

  hasEntitlement: protectedProcedure
    .input(z.object({
      productSlug: z.string().min(1),
    }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({ id: entitlements.id })
        .from(entitlements)
        .innerJoin(products, eq(entitlements.productId, products.id))
        .where(
          and(
            eq(entitlements.userId, ctx.user.id),
            eq(products.slug, input.productSlug),
            eq(entitlements.status, 'active')
          )
        )
        .limit(1);

      return rows.length > 0;
    }),
});
