import { NextResponse } from "next/server";
import { APP_URL } from "../../../lib/constants";

export async function GET() {
  const farcasterConfig = {
    accountAssociation:{
    "header": "eyJmaWQiOjE3OTc5LCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4MGMxNWE5QkVmRTg3RjY0N0IwMDNhMjI0MTY4NDYwMzYyODQ0M2Y4YiJ9",
    "payload": "eyJkb21haW4iOiJtb25hZC1taW5pYXBwLXRlbXBsYXRlLXNldmVuLnZlcmNlbC5hcHAifQ",
    "signature": "MHgwYzY2NDdjZDhjOWJiY2JmYzg2NGIzZjVjYWVjY2ExMTdlOTY4ZGQwMWIzMmM0NGViMjU5ZDhlOGQyMzdhZTZiMDU1MmNmNWRiMDU1MDMwNTZmNTNhZmEwZDZlZTBlZmIyMmJmNDNmMDQ4NTdhMzk2NmY0YmMzODk2N2NlZDI5ZjFi"
  },
    frame: {
      version: "1",
      name: "Mini Poll App", // Removed extra space
      // homeUrl: "https://",
      iconUrl: "https://mini-poll-app.vercel.app//images/icon.png", //Ensure this image exists
      splashImageUrl: "https://mini-poll-app.vercel.app//images/splash.png", // Ensure this image exists
      splashBackgroundColor: "#ffffff",
      subtitle: "Vote on fun polls!",
      description: "A simple app to vote on polls like Cats vs Dogs within Warpcast.",
      screenshotUrls: [], // Add screenshots if available
      primaryCategory: "social", // Changed to "social" (more fitting for a polling app)
      tags: ["poll", "voting", "warpcast", "social"], // Updated tags to better describe the app
      heroImageUrl: "https://mini-poll-app.vercel.app//images/feed.png", // Add if you have a 1200x630 PNG
      tagline: "Vote on fun polls!",
      ogTitle: "Mini Poll App",
      ogDescription: "Vote on polls like dapps and NFT projects within Warpcast.",
    },
  };

  return NextResponse.json(farcasterConfig);
}