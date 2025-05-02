import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    accountAssociation: {
      header: "your-header-from-warpcast", // Update after regenerating
      payload: "your-payload-from-warpcast", // Update after regenerating
      signature: "your-signature-from-warpcast", // Update after regenerating
    },
    frame: {
      version: "1",
      name: "Mini Poll App", // Removed extra space
      homeUrl: APP_URL,
      iconUrl: `${APP_URL}/images/icon.png`, // Ensure this image exists
      splashImageUrl: `${APP_URL}/images/splash.png`, // Ensure this image exists
      splashBackgroundColor: "#ffffff",
      subtitle: "Vote on fun polls!",
      description: "A simple app to vote on polls like Cats vs Dogs within Warpcast.",
      screenshotUrls: [], // Add screenshots if available
      primaryCategory: "social", // Changed to "social" (more fitting for a polling app)
      tags: ["poll", "voting", "warpcast", "social"], // Updated tags to better describe the app
      heroImageUrl: `${APP_URL}/images/hero.png`, // Add if you have a 1200x630 PNG
      tagline: "Vote on fun polls!",
      ogTitle: "Mini Poll App",
      ogDescription: "Vote on polls like Cats vs Dogs within Warpcast.",
      ogImageUrl: `${APP_URL}/images/og.png`, // Add if you have a 1200x630 PNG
    },
  };

  return NextResponse.json(farcasterConfig);
}