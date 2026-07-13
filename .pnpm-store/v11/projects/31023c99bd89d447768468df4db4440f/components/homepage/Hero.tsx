import Link from "next/link";
import { ArrowRight, RotateCcw, ShieldCheck, Truck } from "lucide-react";

export default function Hero() {
  return <section className="home-hero">
    <div className="hero-media" aria-hidden="true">
      <img src="/images/mouseee/hero-streetwear-v2.png" alt=""/>
    </div>
    <div className="hero-shade" aria-hidden="true" />
    <div className="hero-copy">
      <h1>Mặc chất riêng<br/>Tạo dấu ấn riêng</h1>
      <p>Khám phá thiết kế mới hoặc tự tạo chiếc áo mang dấu ấn của bạn</p>
      <div className="hero-actions"><Link className="btn-primary" href="/shop">Mua ngay</Link><Link className="text-link" href="/custom">Tùy chỉnh áo 3D <ArrowRight size={18}/></Link></div>
      <div className="hero-trust"><span><RotateCcw/>Đổi trả 30 ngày</span><span><Truck/>Giao nhanh toàn quốc</span></div>
    </div>
    <span className="hero-note"><ShieldCheck/> Thiết kế chính hãng MOUSEEE</span>
  </section>;
}
