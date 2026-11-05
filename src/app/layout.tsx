import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blue Panda — Official Online Store & Marketplace",
  description:
    "Shop curated tech, sneakers, streetwear, accessories, and beauty on Blue Panda — fast delivery, verified official stores, and exclusive rewards.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${plusJakartaSans.className} antialiased text-slate-900 selection:bg-blue-600 selection:text-white`}>
        {children}
      </body>
    </html>
  );
}
