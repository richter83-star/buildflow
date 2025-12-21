import type { NewProduct, NewTodo } from './schema';
import { db } from './index.server';
import * as schema from './schema';

// Seed data with proper UUIDs (including the one expected by route)
export const seedProducts: NewProduct[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440000", // UUID expected by route
    name: "Modern Living Room Sofa",
    price: "1299.99",
    thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
    dimensions: {
      width: 84,
      height: 32,
      depth: 36
    },
    model3DUrl: "https://example.com/models/sofa_001.glb"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440001", // Second UUID from our tests
    name: "Modern Leather Sofa",
    price: "1299.99",
    thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
    dimensions: {
      width: 84,
      height: 32,
      depth: 36
    },
    model3DUrl: "https://example.com/models/modern-leather-sofa.glb"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002", // Third UUID
    name: "Ergonomic Office Chair",
    price: "499.99",
    thumbnailUrl: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
    dimensions: {
      width: 24,
      height: 36,
      depth: 24
    },
    model3DUrl: "https://example.com/models/office-chair.glb"
  }
];

// Sample todos for testing
export const seedTodos: NewTodo[] = [
  {
    title: "Set up AR product viewer",
    description: "Configure 3D model rendering for products",
    completed: false,
  },
  {
    title: "Test product database",
    description: "Ensure all products are properly seeded",
    completed: true,
  },
  {
    title: "Deploy to Kubernetes",
    description: "Set up K8s deployment for production",
    completed: false,
  }
];

// Generic seed data structure - add new tables here
export const seedData = {
  products: seedProducts,
  todos: seedTodos,
};

// Generic function to seed the database with all defined tables
export async function seedDatabase() {
  try {
    console.log('Seeding database...');
    
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