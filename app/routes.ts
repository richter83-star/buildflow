 import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("dashboard", "routes/dashboard.tsx"),

  // ✅ Paid portal MVP routes
  route("redeem", "routes/redeem.tsx"),
  route("portal", "routes/portal.tsx"),
  route("portal/downloads", "routes/portal.downloads.tsx"),
  route("portal/changelog", "routes/portal.changelog.tsx"),

  // OAuth routes
  route("auth/github", "routes/auth/github.tsx"),
  route("auth/github/callback", "routes/auth/github.callback.tsx"),
  route("auth/google", "routes/auth/google.tsx"),
  route("auth/google/callback", "routes/auth/google.callback.tsx"),

  // tRPC API
  route("api/trpc/*", "routes/api.trpc.$.tsx"),
] satisfies RouteConfig;
