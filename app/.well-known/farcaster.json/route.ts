import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    accountAssociation: {
      "header": "eyJmaWQiOjI2MjY2MiwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDAxOGI1NDc3Y2YxYWJkMWFhODBjMTViNzAyODRCNmM2OTJGNzVERDAifQ",
      "payload": "eyJkb21haW4iOiJtaW5pLXBvbGwtYXBwLnZlcmNlbC5hcHAifQ",
      "signature": "MHgyNmY5YzA3ZWU1YWE4YzAyZTBjNjA4ZDUwMGQ4ZmQ2OTJkYjczMjdjMGQ2N2EwYTVlNGM2NWEyZGVhNDU0YmQzMjNlZGE0MzI5OWU3MjdjMDRjMzYyZDY2NWMzNTc1YWY0MTU1NWFhY2Q4YzA0NDg0NmE4YjRlN2Y3MzhjMjIyNDFi"
    },
    frame: {
      version: "1",
      name: "Mini Poll App",
      homeUrl: APP_URL,
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
      ogImageUrl: "https://mini-poll-app.vercel.app/opengraph-image.png"
    },
  };

  return NextResponse.json(farcasterConfig);
}