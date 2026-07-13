"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ImagePlus, RotateCw, Sparkles, Type, WandSparkles } from "lucide-react";

const COLORS=[{name:"Trắng",value:"#f7f7f5"},{name:"Đen",value:"#202124"},{name:"Xám",value:"#73777d"},{name:"Cam",value:"#d85f3d"}];

export default function FeatureSection(){
 const [side,setSide]=useState<"front"|"back">("front"); const [color,setColor]=useState(COLORS[0]); const [label,setLabel]=useState("MOUSEEE"); const [artwork,setArtwork]=useState(true);
 return <section className="custom-feature custom-feature-interactive">
  <div className="mini-designer">
   <div className="designer-topbar"><div><WandSparkles/><strong>Studio thử nhanh</strong><span>Đang tự động lưu</span></div><div className="side-switch"><button className={side==="front"?"active":""} onClick={()=>setSide("front")}>Mặt trước</button><button className={side==="back"?"active":""} onClick={()=>setSide("back")}>Mặt sau</button></div></div>
   <div className="designer-workspace"><div className="designer-tools"><label><Type/><span>Thêm chữ</span><input value={label} maxLength={12} onChange={e=>setLabel(e.target.value.toUpperCase())}/></label><button className={artwork?"selected":""} onClick={()=>setArtwork(v=>!v)}><ImagePlus/><span>{artwork?"Ẩn artwork":"Thêm artwork"}</span></button><button onClick={()=>setSide(v=>v==="front"?"back":"front")}><RotateCw/><span>Xoay áo</span></button></div>
    <div className="shirt-stage"><div className="shirt-object" style={{"--shirt-color":color.value} as React.CSSProperties}><svg viewBox="0 0 360 420"><path d="M112 45 65 68 20 132l54 36 26-37v249h160V131l26 37 54-36-45-64-47-23c-15 21-37 32-68 32s-53-11-68-32Z" fill="var(--shirt-color)" stroke="#cfd2d6" strokeWidth="3"/><path d="M144 51c8 16 20 24 36 24s28-8 36-24" fill="none" stroke="#c7c9cc" strokeWidth="6" strokeLinecap="round"/></svg><div className={`shirt-design ${side}`}>{artwork?<Sparkles/>:null}<strong>{label||"YOUR TEXT"}</strong><small>{side==="front"?"ORIGINAL EDITION":"DESIGNED BY YOU"}</small></div></div><div className="color-picker"><span>Màu áo</span>{COLORS.map(item=><button key={item.name} aria-label={item.name} className={color.name===item.name?"active":""} style={{background:item.value}} onClick={()=>setColor(item)}/>)}</div></div>
   </div>
  </div>
  <div className="custom-feature-copy"><span className="feature-kicker"><Sparkles/> Cá nhân hóa trong vài giây</span><h2>Thiết kế chiếc áo<br/>chỉ thuộc về bạn</h2><p>Thử ngay màu sắc, typography và artwork trên áo. Khi đã có ý tưởng, mở Studio 3D để hoàn thiện thiết kế ở mọi góc nhìn.</p><ul><li>Xem trước mặt trước và mặt sau</li><li>Tự động lưu trong quá trình thiết kế</li><li>Sẵn sàng đặt in ngay khi hoàn tất</li></ul><Link href="/custom" className="btn-primary">Mở Studio 3D <ArrowRight/></Link></div>
 </section>
}
