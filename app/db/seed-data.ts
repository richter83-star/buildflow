import type { NewLicenseKey, NewProduct, NewTodo } from './schema';
import { db } from './index.server';
import * as schema from './schema';
import { generateLicenseKey, hashLicenseKey, normalizeLicenseKey } from '../utils/license.server';

const AUTOMATOR_PRODUCT_ID = '8f06b6f3-8d86-4b0c-9e5a-7abf3a3e9f01';

// Seed data with proper UUIDs
export const seedProducts: NewProduct[] = [
  {
    id: AUTOMATOR_PRODUCT_ID,
    slug: 'automator',
    name: 'Automator Portal',
  },
];

const generatedLicenseKeys = Array.from({ length: 3 }, () => generateLicenseKey());

export const seedLicenseKeys: NewLicenseKey[] = generatedLicenseKeys.map((rawKey) => {
  const normalizedKey = normalizeLicenseKey(rawKey);

  return {
    productId: AUTOMATOR_PRODUCT_ID,
    keyHash: hashLicenseKey(normalizedKey),
  };
});

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
  }
];

// Generic seed data structure - add new tables here
export const seedData = {
  products: seedProducts,
  licenseKeys: seedLicenseKeys,
  todos: seedTodos,
};

// Generic function to seed the database with all defined tables
export async function seedDatabase() {
  try {
    console.log('Seeding database...');

    if (generatedLicenseKeys.length > 0) {
      console.log('Generated license keys (store these for redemption tests):');
      generatedLicenseKeys.forEach((key) => {
        console.log(`- ${key}`);
      });
    }

    // Generic seeding - automatically handles any tables defined in seedData
    const seedPromises = Object.entries(seedData).map(async ([tableName, data]) => {
      const table = schema[tableName as keyof typeof schema];
      if (table && Array.isArray(data)) {
        console.log(`Seeding ${tableName} with ${data.length} records...`);
        await db.insert(table).values(data).onConflictDoNothing();
        console.log(`✓ ${tableName} seeded successfully`);
      }
    });

    // Wait for all seeding operations to complete
    await Promise.all(seedPromises);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase().then(() => {
    console.log('Seeding completed');
    process.exit(0);
  }).catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}
