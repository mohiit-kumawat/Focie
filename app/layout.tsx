import type { Metadata } from "next";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Focie — Focus feels better together 🌸",
  description:
    "A cozy, kawaii, pastel study-with-friends web app. Track focused sessions, stay accountable with personal study days, and cheer on each other every day.",
  metadataBase: new URL("https://focie.vercel.app"),
  icons: {
    icon: [
      { url: "/icon.png", sizes: "64x64", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Focie — Focus feels better together 🌸",
    description:
      "A cozy, kawaii, pastel study-with-friends web app. Track focused sessions, level up your Fumi companion, and cheer on each other every day.",
    url: "https://focie.vercel.app",
    siteName: "Focie",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Focie — Cozy Kawaii Study Companion",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Focie — Focus feels better together 🌸",
    description:
      "A cozy, kawaii, pastel study-with-friends web app. Track focused sessions, exchange cozy gifts, and study together with Fumi!",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Nunito:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('focusie-theme');
                  var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches) || (stored === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[#FFFDF9] dark:bg-[#171321] text-[#4A3E4D] dark:text-[#F8F1FF] selection:bg-[#FFEBF0] dark:selection:bg-[#4A263D] selection:text-[#FF729F]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
