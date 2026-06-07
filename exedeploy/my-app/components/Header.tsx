"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppContext";

export default function Header() {
  const pathname = usePathname();
  const { user, cart, setIsCartOpen, setIsAuthOpen, setIsProfileOpen } = useApp();

  const isAdmin = !!(user && (user.role_id === 2 || user.username?.toLowerCase() === "admin" || user.email?.toLowerCase().includes("admin")));

  const navItems = [
    { href: "/shop", label: "SHOP" },
    { href: "/custom", label: "CUSTOM" },
    { href: "/daily", label: "DAILY" },
    { href: "/contact", label: "CONTACT" },
    ...(isAdmin ? [{ href: "/admin", label: "ADMIN" }] : []),
    { href: "https://www.facebook.com/profile.php?id=61590546749223", label: "ABOUT US" },
  ];

  const cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-200 flex justify-between items-center w-full px-margin-x h-24">
      <Link href="/" aria-label="Home" className="text-2xl font-bold tracking-tight">MOUSEEE</Link>
      <nav className="hidden md:flex items-center space-x-8">
        {navItems.map((item) => {
          const isExternal = item.href.startsWith("http");
          const active = !isExternal && pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className={`text-sm ${
                active ? "text-black border-b border-black pb-1" : "text-gray-600 hover:text-black"
              } hover:border-b hover:border-black pb-0 hover:pb-1 transition-all duration-150`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center space-x-6">
        <div className="relative hidden sm:block">
          <input className="bg-gray-100 border-none py-2 pl-4 pr-10 rounded-full w-48 focus:ring-1 focus:ring-black" placeholder="Search" type="text" />
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 scale-75">search</span>
        </div>
        
        {/* User profile button */}
        <button 
          onClick={() => user ? setIsProfileOpen(true) : setIsAuthOpen(true)}
          className="hover:opacity-70 transition-opacity duration-300 scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          {user ? (
            <span className="w-7 h-7 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center uppercase">
              {user.username.charAt(0)}
            </span>
          ) : (
            <span className="material-symbols-outlined">person</span>
          )}
        </button>

        {/* Shopping bag button */}
        <button 
          onClick={() => setIsCartOpen(true)}
          className="hover:opacity-70 transition-opacity duration-300 scale-95 relative cursor-pointer"
        >
          <span className="material-symbols-outlined">shopping_bag</span>
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

