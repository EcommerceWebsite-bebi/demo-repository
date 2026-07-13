import Header from "../../components/Header";
import Hero from "../../components/homepage/Hero";
import ProductGrid from "../../components/ProductGrid";
import FeatureSection from "../../components/homepage/FeatureSection";
import SupportStrip from "../../components/homepage/SupportStrip";
import Footer from "../../components/Footer";

const categories=[
  ["Streetwear","/images/mouseee/cosmic-black-tee.png"],
  ["Minimal","/images/mouseee/abstract-white-tee-back.png"],["Graphic","/images/mouseee/hero-streetwear-v2.png"],["Oversized","/images/mouseee/washed-charcoal-hoodie.png"]
];
const reviews=[
  ["Minh Khang","Chất áo dày dặn, form oversize chuẩn đẹp. In sắc nét, mặc lên rất thoải mái."],
  ["Thảo Vy","Thiết kế độc đáo, đúng vibe streetwear. Giao hàng nhanh, đóng gói chỉn chu."],
  ["Quang Huy","Tự design áo trên 3D dễ lắm, nhìn trước được thành phẩm rất chân thật."]
];
export default function Homepage(){return <div className="commerce-page"><Header/><main><Hero/><section className="content-section categories"><div className="section-heading"><h2>Khám phá theo phong cách</h2><a href="/shop">Xem tất cả →</a></div><div className="category-grid">{categories.map(([name,img])=><a href="/shop" key={name}><img src={img} alt={name}/><strong>{name}</strong></a>)}</div></section><ProductGrid/><FeatureSection/><section className="content-section testimonials"><div className="section-heading"><h2>Khách hàng nói gì</h2></div><div className="review-grid">{reviews.map(([name,copy])=><article key={name}><div className="stars">★★★★★</div><p>{copy}</p><strong>{name} <span>✓</span></strong><small>Đã mua hàng</small></article>)}</div></section><SupportStrip/></main><Footer/></div>}
