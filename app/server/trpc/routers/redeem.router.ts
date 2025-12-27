import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { router, procedure, middleware } from '../trpc';
import { entitlements, licenseKeys, products } from '../../../db/schema';
import { hashLicenseKey, normalizeLicenseKey } from '../../../utils/license.server';

const requireAuth = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

const protectedProcedure = procedure.use(requireAuth);

export const redeemRouter = router({
  license: protectedProcedure
    .input(z.object({
      key: z.string().min(1, 'License key is required'),
    }))
    .mutation(async ({ ctx, input }) => {
      const normalizedKey = normalizeLicenseKey(input.key);
      const keyHash = hashLicenseKey(normalizedKey);

      return ctx.db.transaction(async (tx) => {
        const [licenseKey] = await tx
          .select()
          .from(licenseKeys)
          .where(eq(licenseKeys.keyHash, keyHash))
          .limit(1);

        if (!licenseKey) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid license key' });
        }

        if (licenseKey.status !== 'unused') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'License key already used or revoked' });
        }

        const [product] = await tx
          .select({ id: products.id, slug: products.slug })
          .from(products)
          .where(eq(products.id, licenseKey.productId))
          .limit(1);

        if (!product) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'License key not linked to a product' });
        }

        await tx
          .insert(entitlements)
          .values({
            userId: ctx.user.id,
            productId: product.id,
            status: 'active',
            source: 'license',
          })
          .onConflictDoUpdate({
            target: [entitlements.userId, entitlements.productId],
            set: { status: 'active', source: 'license' },
          });

        await tx
          .update(licenseKeys)
          .set({
            status: 'redeemed',
            redeemedByUserId: ctx.user.id,
            redeemedAt: new Date(),
          })
          .where(
            and(
              eq(licenseKeys.id, licenseKey.id),
              eq(licenseKeys.status, 'unused')
            )
          );

        return { ok: true, productSlug: product.slug };
      });
    }),
});
