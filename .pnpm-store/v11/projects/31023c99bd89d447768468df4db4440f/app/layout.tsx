import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "../components/AppContext";
import AuthModal from "../components/custom/AuthModal";
import UserProfileModal from "../components/custom/UserProfileModal";
import CartDrawer from "../components/custom/CartDrawer";
import ProductDetailModal from "../components/custom/ProductDetailModal";
import MissionTracker from "../components/daily/MissionTracker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MOUSEEE",
  description: "Generated from Stitch import",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProvider>
          {children}
          <AuthModal />
          <UserProfileModal />
          <CartDrawer />
          <ProductDetailModal />
          <MissionTracker />
        </AppProvider>
      </body>
    </html>
  );
}


