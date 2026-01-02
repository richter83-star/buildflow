import { redirect, type LoaderFunctionArgs } from "react-router";
import { github, handleOAuthCallback, parseCookies, clearOAuthCookies } from "~/server/oauth.server";

interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!github) {
    throw new Response("GitHub OAuth not configured", { status: 500 });
  }

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const storedState = cookies["oauth_state"];

  if (!code || !state || state !== storedState) {
    return redirect("/login?error=invalid_state");
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
        "User-Agent": "buildflow",
      },
    });

    if (!userResponse.ok) {
      return redirect("/login?error=oauth_failed");
    }

    const githubUser: GitHubUser = await userResponse.json();

    let email = githubUser.email;

    if (!email) {
      const emailResponse = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
          "User-Agent": "buildflow",
        },
      });

      if (!emailResponse.ok) {
        return redirect("/login?error=no_email");
      }

      const emails: GitHubEmail[] = await emailResponse.json();
      const primary = emails.find((e) => e.primary && e.verified);
      email = primary?.email || emails[0]?.email;
    }

    if (!email) {
      return redirect("/login?error=no_email");
    }

    const sessionCookie = await handleOAuthCallback("github", String(githubUser.id), {
      email,
      name: githubUser.name || githubUser.login,
      avatarUrl: githubUser.avatar_url,
    });

    const clearCookies = clearOAuthCookies();

    return redirect("/dashboard", {
      headers: [
        ["Set-Cookie", sessionCookie],
        ...clearCookies.map((c) => ["Set-Cookie", c] as [string, string]),
      ],
    });
  } catch (error) {
    console.error("GitHub OAuth error:", error);
    return redirect("/login?error=oauth_failed");
  }
}
