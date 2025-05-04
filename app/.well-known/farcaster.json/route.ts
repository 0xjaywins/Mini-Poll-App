import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    accountAssociation: {
      header: "eyJmaWQiOjE3OTc5LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4MGMxNWE5QkVmRTg3RjY0N0IwMDNhMjI0MTY4NDYwMzYyODQ0M2Y4YiJ9",
      payload: "eyJkb21haW4iOiJtaW5pLXBvbGwtYXBwLnZlcmNlbC5hcHAifQ",
      signature: "MHgwYzY2NDdjZDhjOWJiY2JmYzg2NGIzZjVjYWVjY2ExMTdlOTY4ZGQwMWIzMmM0NGViMjU5ZDhlOGQyMzdhZTZiMDU1MmNmNWRiMDU1MDMwNTZmNTNhZmEwZDZlZTBlZmIyMmJmNDNmMDQ4NTdhMzk2NmY0YmMzODk2N2NlZDI5ZjFi"
    },
    frame: {
      version: "1",
      name: "Mini Poll App",
      homeUrl: "https://mini-poll-app.vercel.app",
      iconUrl: "https://mini-poll-app.vercel.app/images/icon.png",
      splashImageUrl: "https://mini-poll-app.vercel.app/images/splash.png",
      splashBackgroundColor: "#ffffff",
      subtitle: "Vote on fun polls!",
      description: "Compare dApps, tokens, and NFTs in the Monad ecosystem within Warpcast.",
      screenshotUrls: [],
      primaryCategory: "social",
      tags: ["poll", "voting", "warpcast", "social", "monad"],
      heroImageUrl: "https://mini-poll-app.vercel.app/images/hero.png",
      tagline: "Vote on fun polls!",
      ogTitle: "Mini Poll App",
      ogDescription: "Compare dApps, tokens, and NFTs in the Monad ecosystem within Warpcast.",
      ogImageUrl: "https://mini-poll-app.vercel.app/images/og.png"
    },
  };

  return NextResponse.json(farcasterConfig);
}