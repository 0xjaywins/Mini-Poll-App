import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Web App Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* PWA Metadata */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/icon.png" />
        <link rel="apple-touch-icon" href="/images/icon.png" />

        {/* Open Graph Tags */}
        <meta property="og:title" content="Mini Poll App" />
        <meta
          property="og:description"
          content="Compare dApps, tokens, and NFTs in the Monad ecosystem within Warpcast."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://mini-poll-app.vercel.app" />

        {/* Farcaster Frame Metadata */}
        <meta name="fc:frame" content="vNext" />
        <meta name="fc:frame:button:1" content="Vote on Poll" />
        <meta name="fc:frame:button:1:action" content="post" />
        <meta name="fc:frame:post_url" content="https://mini-poll-app.vercel.app/api/vote" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}