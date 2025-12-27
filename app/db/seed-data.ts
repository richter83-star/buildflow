import type { NewProduct, NewTodo } from './schema';
import { eq } from 'drizzle-orm';
import { db } from './index.server';
import * as schema from './schema';
import { generateLicenseKey, hashLicenseKey, normalizeLicenseKey } from '../utils/license.server';

// Seed data with required slugs
export const seedProducts: NewProduct[] = [
  {
    slug: 'automator',
    name: 'Automator Portal',
  },
];

// Sample todos for testing
export const seedTodos: NewTodo[] = [
  {
    title: 'Set up Automator Portal',
    description: 'Confirm entitlement access for Automator customers',
    completed: false,
  },
  {
    title: 'Verify license redemption flow',
    description: 'Redeem a license key and reach /portal',
    completed: false,
  },
  {
    title: 'Draft onboarding content',
    description: 'Write initial Start Here, Setup, and Troubleshooting docs',
    completed: false,
  },
];

function buildLicenseKeys(productId: string, rawKeys: string[]) {
  return rawKeys.map((rawKey) => {
    const normalizedKey = normalizeLicenseKey(rawKey);

    return {
      productId,
      keyHash: hashLicenseKey(normalizedKey),
    };
  });
}

// Generic function to seed the database with all defined tables
export async function seedDatabase() {
  try {
    console.log('Seeding database...');

    console.log(`Seeding products with ${seedProducts.length} records...`);
    await db.insert(schema.products).values(seedProducts).onConflictDoNothing({
      target: schema.products.slug,
    });
    console.log('✓ products seeded successfully');

    const [automatorProduct] = await db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.slug, 'automator'))
      .limit(1);

    if (!automatorProduct) {
      throw new Error('Automator product not found after seed.');
    }

    const generatedLicenseKeys = Array.from({ length: 3 }, () => generateLicenseKey());

    if (generatedLicenseKeys.length > 0) {
      console.log('Generated license keys (store these for redemption tests):');
      generatedLicenseKeys.forEach((key) => {
        console.log(`- ${key}`);
      });
    }

    console.log('Seeding licenseKeys with 3 records...');
    await db
      .delete(schema.licenseKeys)
      .where(eq(schema.licenseKeys.productId, automatorProduct.id));

    await db.insert(schema.licenseKeys).values(
      buildLicenseKeys(automatorProduct.id, generatedLicenseKeys),
    );
    console.log('✓ licenseKeys seeded successfully');

    console.log(`Seeding todos with ${seedTodos.length} records...`);
    await db.insert(schema.todos).values(seedTodos);
    console.log('✓ todos seeded successfully');

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
