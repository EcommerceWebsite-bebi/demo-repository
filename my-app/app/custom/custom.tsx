"use client";

import { useState, useEffect } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import CustomForm from "../../components/custom/CustomForm";
import CustomPreview from "../../components/custom/CustomPreview";
import { useApp } from "../../components/AppContext";
import { ShoppingBag, CreditCard, Loader2, CheckCircle2, MapPin, Phone, MessageSquare, Sparkles } from "lucide-react";

export default function CustomPage() {
  const { products, user, token, setIsAuthOpen, checkoutDirect } = useApp();

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Minimalist");
  const [size, setSize] = useState("medium");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null);

  // Purchase states
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("Black");
  const [shippingAddress, setShippingAddress] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [noteVal, setNoteVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Sync user info when logged in
  useEffect(() => {
    if (user) {
      setShippingAddress(user.address || "");
      setPhoneVal(user.phone || "");
    }
  }, [user]);

  function createDesign() {
    const url = `/api/generate?prompt=${encodeURIComponent(prompt)}&style=${encodeURIComponent(
      style
    )}&size=${encodeURIComponent(size)}&_=${Date.now()}`;
    setPreviewUrl(url);
  }

  // Find backend customizable product
  const customizableProduct = products.find(p => p.is_customizable === 1) || {
    id: 1,
    name: "Custom Oversize T-Shirt",
    price: 19.99,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White"]
  };

  async function handlePurchase(e: React.FormEvent) {
    e.preventDefault();
    setPurchaseError(null);

    if (!token) {
      setIsAuthOpen(true);
      return;
    }

    if (!shippingAddress || !phoneVal) {
      setPurchaseError("Vui lòng nhập địa chỉ giao hàng và số điện thoại.");
      return;
    }

    setLoading(true);
    try {
      const items = [{
        product_id: customizableProduct.id,
        quantity: 1,
        size: selectedSize,
        color: selectedColor,
        custom_design_image: backPreviewUrl ? `${previewUrl}|${backPreviewUrl}` : previewUrl
      }];

      const res = await checkoutDirect(shippingAddress, phoneVal, noteVal, items);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setPrompt("");
          setPreviewUrl(null);
          setNoteVal("");
        }, 4000);
      } else {
        setPurchaseError(res.message || "Đặt hàng thất bại");
      }
    } catch (e) {
      setPurchaseError("Đã xảy ra lỗi hệ thống khi thanh toán.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <Header />
      <main className="flex-1 px-margin-x py-16 space-y-16">
        <div className="max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-950">
            Thiết Kế Áo Thun 3D Với AI
          </h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed max-w-2xl">
            Tạo thiết kế độc bản bằng Canvas Studio hoặc tạo nhanh bằng prompt AI. Thử đồ trực tiếp trong phòng thử 3D và đặt mua mẫu áo thun của bạn ngay.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <CustomForm
              prompt={prompt}
              style={style}
              size={size}
              onPromptChange={setPrompt}
              onStyleChange={setStyle}
              onSizeChange={setSize}
              onCreateDesign={createDesign}
              onReset={() => {
                setPrompt("");
                setStyle("Minimalist");
                setSize("medium");
                setPreviewUrl(null);
                setBackPreviewUrl(null);
              }}
            />

            {/* Direct Purchase Section */}
            {previewUrl && (
              <div className="border border-indigo-150 rounded-2xl bg-white p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />
                
                {success ? (
                  <div className="text-center py-6 flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3 animate-bounce">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Đặt Mua Thành Công!</h3>
                    <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                      Đơn hàng thiết kế áo thun của bạn đã được gửi thành công. Bạn có thể kiểm tra trạng thái trong hồ sơ đơn hàng cá nhân.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePurchase} className="space-y-5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-650" />
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-500">
                        Đặt mua áo thun tự thiết kế
                      </h3>
                    </div>

                    {purchaseError && (
                      <div className="p-3 rounded-xl bg-red-50 border border-red-150 text-xs text-red-700 font-semibold">
                        {purchaseError}
                      </div>
                    )}

                    {/* Price display */}
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="text-xs text-gray-500">Sản phẩm: {customizableProduct.name}</span>
                      <span className="text-sm font-extrabold text-gray-900">{customizableProduct.price.toLocaleString('vi-VN')} đ</span>
                    </div>

                    {/* Size and Color selections for custom shirt */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
                          Chọn Size
                        </label>
                        <select
                          value={selectedSize}
                          onChange={(e) => setSelectedSize(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-700 bg-white"
                        >
                          {customizableProduct.sizes.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
                          Chọn Màu
                        </label>
                        <select
                          value={selectedColor}
                          onChange={(e) => setSelectedColor(e.target.value)}
                          className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-700 bg-white"
                        >
                          {customizableProduct.colors.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Shipping form inputs */}
                    {token ? (
                      <div className="space-y-3.5 pt-2">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Địa chỉ nhận hàng *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Số nhà, tên đường, quận, thành phố..."
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-black outline-none transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" /> Số điện thoại *
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="Ví dụ: 0912345678"
                            value={phoneVal}
                            onChange={(e) => setPhoneVal(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-black outline-none transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" /> Ghi chú
                          </label>
                          <textarea
                            placeholder="Ý kiến hoặc yêu cầu đặc biệt về đơn hàng..."
                            value={noteVal}
                            onChange={(e) => setNoteVal(e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-black outline-none transition resize-none"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-500 my-2">
                        Vui lòng{" "}
                        <button
                          type="button"
                          onClick={() => setIsAuthOpen(true)}
                          className="font-bold text-indigo-650 hover:underline"
                        >
                          Đăng nhập
                        </button>{" "}
                        để điền thông tin và đặt đơn thiết kế này.
                      </div>
                    )}

                    {/* Purchase Action Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-black hover:bg-gray-850 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition shadow"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : token ? (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Thanh Toán Thiết Kế ({customizableProduct.price.toLocaleString('vi-VN')} đ)
                        </>
                      ) : (
                        "Đăng Nhập Để Mua Ngay"
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>

          <CustomPreview
            previewUrl={previewUrl}
            style={style}
            size={size}
            prompt={prompt}
            onApplyArtwork={(front, back) => {
              setPreviewUrl(front || null);
              setBackPreviewUrl(back || null);
            }}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
