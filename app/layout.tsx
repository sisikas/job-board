import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Good Sort",
  description: "Search current job openings by role or location.",
  metadataBase: new URL("https://thegoodsort.vercel.app"),
  openGraph: {
    title: "The Good Sort",
    description: "Search current job openings by role or location.",
    siteName: "The Good Sort",
    type: "website",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "The Good Sort",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Good Sort",
    description: "Search current job openings by role or location.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
