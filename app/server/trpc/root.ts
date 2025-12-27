import { router } from './trpc';
import { todoRouter } from './routers/todo.router';
import { productRouter } from './routers/product.router';
import { chatRouter } from './routers/chat.router';
import { authRouter } from './routers/auth.router';
import { redeemRouter } from './routers/redeem.router';
import { portalRouter } from './routers/portal.router';

// Define the root router that combines all your sub-routers
export const appRouter = router({
  todo: todoRouter,
  product: productRouter,
  chat: chatRouter,
  auth: authRouter,
  redeem: redeemRouter,
  portal: portalRouter,
});

// Export type definition of the API
export type AppRouter = typeof appRouter;
