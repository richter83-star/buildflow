import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("signup", "routes/signup.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("ai-automation-for-smbs", "routes/landing.ai-automation-for-smbs.tsx"),
  route("prompt-automation-templates", "routes/landing.prompt-automation-templates.tsx"),
  route("checkout", "routes/checkout.tsx"),
  route("checkout/success", "routes/checkout.success.tsx"),
  route("checkout/cancel", "routes/checkout.cancel.tsx"),

  // ✅ Paid portal MVP routes
  route("redeem", "routes/redeem.tsx"),
  route("portal", "routes/portal.tsx"),

  // ✅ Portal module pages
  route("portal/start", "routes/portal.start.tsx"),
  route("portal/setup", "routes/portal.setup.tsx"),
  route("portal/seo", "routes/portal.seo.tsx"),
  route("portal/troubleshooting", "routes/portal.troubleshooting.tsx"),
  route("portal/downloads", "routes/portal.downloads.tsx"),
  route("portal/changelog", "routes/portal.changelog.tsx"),
  route("portal/demo", "routes/portal.demo.tsx"),

  // OAuth routes
  route("auth/github", "routes/auth/github.tsx"),
  route("auth/github/callback", "routes/auth/github.callback.tsx"),
  route("auth/google", "routes/auth/google.tsx"),
  route("auth/google/callback", "routes/auth/google.callback.tsx"),

  // tRPC API
  route("api/trpc/*", "routes/api.trpc.$.tsx"),
  route("api/stripe/webhook", "routes/api.stripe.webhook.tsx"),
] satisfies RouteConfig;
