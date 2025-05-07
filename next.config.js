/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: [
        "i.imgur.com", // Common for Warpcast PFPs
        "storage.googleapis.com", // Google Cloud Storage (Warpcast/Farcaster often uses this)
        "warpcast.com", // Warpcast domain
        "farcaster.xyz", // Farcaster domain
        "via.placeholder.com", // Placeholder domain
      ],
    },
  };
  
  module.exports = nextConfig;