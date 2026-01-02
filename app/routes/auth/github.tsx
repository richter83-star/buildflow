import { redirect, type LoaderFunctionArgs } from "react-router";
import { generateState } from "arctic";
import { github, createStateCookie } from "~/server/oauth.server";

export async function loader({ request }: LoaderFunctionArgs) {
  void request;

  if (!github) {
    throw new Response("GitHub OAuth not configured", { status: 500 });
  }

  const state = generateState();
  const url = github.createAuthorizationURL(state, ["user:email"]);

  return redirect(url.toString(), {
    headers: {
      "Set-Cookie": createStateCookie(state),
    },
  });
}
