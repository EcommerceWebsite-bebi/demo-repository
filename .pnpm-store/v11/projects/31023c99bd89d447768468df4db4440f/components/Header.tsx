"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useApp } from "./AppContext";

const NAV = [
  ["/shop", "Sản phẩm"], ["/custom", "Tùy chỉnh 3D"],
  ["/daily", "Daily"], ["/aboutus", "Về chúng tôi"],
] as const;

export default function Header() {
  const pathname = usePathname();
  const { user, cart, setIsCartOpen, setIsAuthOpen, setIsProfileOpen } = useApp();
  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <header className="commerce-header">
      <Link href="/" className="brand-mark" aria-label="MOUSEEE - Trang chủ">MOUSEEE</Link>
      <nav className="commerce-nav" aria-label="Điều hướng chính">
        {NAV.map(([href, label]) => <Link key={href} href={href} className={pathname?.startsWith(href) ? "active" : ""}>{label}</Link>)}
      </nav>
      <label className="header-search">
        <Search size={17} aria-hidden="true" />
        <input aria-label="Tìm kiếm sản phẩm" placeholder="Tìm áo, phong cách, bộ sưu tập..." />
      </label>
      <div className="header-actions">
        <button className="mobile-menu" aria-label="Mở menu"><Menu /></button>
        <button aria-label="Tài khoản" onClick={() => user ? setIsProfileOpen(true) : setIsAuthOpen(true)}><UserRound /></button>
        <button className="desktop-action" aria-label="Sản phẩm yêu thích"><Heart /></button>
        <button className="cart-action" aria-label={`Giỏ hàng có ${count} sản phẩm`} onClick={() => setIsCartOpen(true)}><ShoppingBag />{count > 0 ? <span>{count}</span> : null}</button>
      </div>
    </header>
  );
}
