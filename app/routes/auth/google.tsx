import { redirect, type LoaderFunctionArgs } from "react-router";
import { generateState, generateCodeVerifier } from "arctic";
import { google, createStateCookie, createCodeVerifierCookie } from "~/server/oauth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  void request;

  if (!google) {
    throw new Response("Google OAuth not configured", { status: 500 });
  }

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ["openid", "email", "profile"]);

  return redirect(url.toString(), {
    headers: [
      ["Set-Cookie", createStateCookie(state)],
      ["Set-Cookie", createCodeVerifierCookie(codeVerifier)],
    ],
  });
}
