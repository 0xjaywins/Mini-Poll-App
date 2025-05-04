import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    accountAssociation: {
      header: "your-new-header-from-warpcast", // Will update after fixing manifest
      payload: "your-new-payload-from-warpcast", // Will update after fixing manifest
      signature: "your-new-signature-from-warpcast" // Will update after fixing manifest
    },
    frame: {
      version: "1",
      name: "Mini Poll App",
      homeUrl: "https://mini-poll-app.vercel.app", // Added explicitly, must match your domain
      iconUrl: "https://mini-poll-app.vercel.app/images/icon.png", // Ensure this image exists
      splashImageUrl: "https://mini-poll-app.vercel.app/images/splash.png", // Ensure this image exists
      splashBackgroundColor: "#ffffff",
      subtitle: "Vote on fun polls!",
      description: "Compare dApps, tokens, and NFTs in the Monad ecosystem within Warpcast.", // Updated
      screenshotUrls: [], // Add screenshots if available (optional)
      primaryCategory: "social",
      tags: ["poll", "voting", "warpcast", "social", "monad"],
      heroImageUrl: "https://mini-poll-app.vercel.app/images/hero.png", // Ensure this image exists
      tagline: "Vote on fun polls!",
      ogTitle: "Mini Poll App",
      ogDescription: "Compare dApps, tokens, and NFTs in the Monad ecosystem within Warpcast.",
      ogImageUrl: "https://mini-poll-app.vercel.app/images/og.png" // Ensure this image exists
    },
  };

  return NextResponse.json(farcasterConfig);
}