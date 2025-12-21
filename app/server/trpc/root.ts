import { router } from './trpc';
import { todoRouter } from './routers/todo.router';
import { productRouter } from './routers/product.router';
import { chatRouter } from './routers/chat.router';
import { authRouter } from './routers/auth.router';

// Define the root router that combines all your sub-routers
export const appRouter = router({
  todo: todoRouter,
  product: productRouter,
  chat: chatRouter,
  auth: authRouter,
});

// Export type definition of the API
export type AppRouter = typeof appRouter; 