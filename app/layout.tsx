import { Analytics } from "@vercel/analytics/next";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EmailFlow Pro - Advanced Email Marketing Platform",
  description: "Professional email marketing platform with advanced analytics, automation, and beautiful templates. Grow your business with EmailFlow Pro.",
  keywords: "email marketing, email campaigns, newsletter, automation, analytics",
  authors: [{ name: "EmailFlow Team" }],
  creator: "EmailFlow Pro",
  openGraph: {
    title: "EmailFlow Pro - Advanced Email Marketing Platform",
    description: "Professional email marketing platform with advanced analytics, automation, and beautiful templates.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
