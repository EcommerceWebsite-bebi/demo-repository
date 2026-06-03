"use client";

import React, { useState, useEffect } from "react";
import { X, ShoppingBag, Trash2, Plus, Minus, CreditCard, ChevronRight, Loader2, CheckCircle2, UserCheck } from "lucide-react";
import { useApp } from "../AppContext";

export default function CartDrawer() {
  const { 
    isCartOpen, 
    setIsCartOpen, 
    cart, 
    updateCartItem, 
    removeCartItem, 
    user, 
    setIsAuthOpen, 
    checkout 
  } = useApp();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shippingAddress, setShippingAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync user info to checkout fields when they log in
  useEffect(() => {
    if (user) {
      setShippingAddress(user.address || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  if (!isCartOpen) return null;

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(false);

    if (!shippingAddress || !phone) {
      setError("Vui lòng nhập địa chỉ giao hàng và số điện thoại.");
      return;
    }

    setLoading(true);
    try {
      const res = await checkout(shippingAddress, phone, note);
      if (res.success) {
        setCheckoutSuccess(true);
        setNote("");
        setTimeout(() => {
          setCheckoutSuccess(false);
          setIsCartOpen(false);
          setIsCheckingOut(false);
        }, 3000);
      } else {
        setError(res.message || "Đặt hàng thất bại");
      }
    } catch (e) {
      setError("Đã xảy ra lỗi hệ thống khi thanh toán.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 transition-transform duration-300">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-150 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gray-900" />
            <h2 className="text-lg font-bold text-gray-900">Giỏ Hàng Của Bạn</h2>
            <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </div>
          <button 
            onClick={() => {
              setIsCartOpen(false);
              setIsCheckingOut(false);
            }}
            className="p-1 text-gray-400 hover:text-black rounded-lg hover:bg-gray-50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success screen */}
        {checkoutSuccess ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-emerald-50/50">
            <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Đặt Hàng Thành Công!</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              Cảm ơn bạn đã mua sắm tại Mouseee. Đơn hàng của bạn đã được tiếp nhận và xử lý.
            </p>
            <p className="text-xs text-gray-400 mt-4">
              Màn hình sẽ đóng lại trong chốc lát...
            </p>
          </div>
        ) : isCheckingOut ? (
          /* Checkout Panel view */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Thông tin nhận hàng</h3>
                <button 
                  onClick={() => setIsCheckingOut(false)}
                  className="text-xs text-indigo-650 font-semibold hover:underline"
                >
                  Quay lại giỏ hàng
                </button>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-150 text-xs text-rose-700 font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handlePlaceOrder} className="space-y-4" id="checkout-form">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                    Địa chỉ giao hàng *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Số nhà, tên đường, quận, thành phố..."
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                    Số điện thoại nhận hàng *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1.5">
                    Ghi chú đơn hàng (Tùy chọn)
                  </label>
                  <textarea
                    placeholder="Giao giờ hành chính, gọi điện trước khi giao..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm text-gray-800 focus:border-black focus:ring-1 focus:ring-black outline-none transition resize-none"
                  />
                </div>
              </form>

              {/* Order total info */}
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-4.5 space-y-2.5">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Tổng tiền sản phẩm</span>
                  <span>{cart.total_price.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Phí vận chuyển</span>
                  <span className="text-emerald-600 font-bold uppercase">Miễn phí</span>
                </div>
                <div className="border-t border-gray-200 pt-2.5 flex justify-between text-sm font-extrabold text-gray-900">
                  <span>Tổng thanh toán</span>
                  <span>{cart.total_price.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>

            {/* Checkout Actions */}
            <div className="p-6 border-t border-gray-150 bg-white">
              <button
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="w-full py-4 bg-black hover:bg-gray-850 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition shadow-lg cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Đặt Hàng ({cart.total_price.toLocaleString('vi-VN')} đ)
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Normal Cart List View */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 py-20">
                  <ShoppingBag className="w-12 h-12 stroke-[1.5] mb-2" />
                  <p className="text-sm font-medium">Giỏ hàng của bạn đang trống.</p>
                  <p className="text-xs text-gray-400 mt-1">Dạo quanh cửa hàng và chọn những chiếc áo thun đẹp mắt!</p>
                </div>
              ) : (
                cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4 justify-between items-start">
                    <img
                      src={item.image || "https://res.cloudinary.com/demo/image/upload/sample.jpg"}
                      alt={item.name}
                      className="w-16 h-16 object-contain rounded-xl border border-gray-150 bg-gray-50 p-1 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate" title={item.name}>{item.name}</h4>
                      <p className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap gap-x-2">
                        {item.size && (
                          <span>Kích cỡ: <strong className="text-gray-700 uppercase">{item.size}</strong></span>
                        )}
                        {item.color && (
                          <span>Màu: <strong className="text-gray-700">{item.color}</strong></span>
                        )}
                      </p>
                      
                      {/* Qty update buttons */}
                      <div className="flex items-center gap-2.5 mt-2">
                        <button
                          onClick={() => updateCartItem(item.id, item.quantity - 1)}
                          className="w-6 h-6 border border-gray-200 hover:border-gray-300 rounded-md flex items-center justify-center text-gray-500 hover:text-black transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold w-4 text-center text-gray-800 font-mono">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItem(item.id, item.quantity + 1)}
                          className="w-6 h-6 border border-gray-200 hover:border-gray-300 rounded-md flex items-center justify-center text-gray-500 hover:text-black transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <div className="text-right flex flex-col items-end justify-between h-full">
                      <span className="text-sm font-extrabold text-gray-950">{(item.price * item.quantity).toLocaleString('vi-VN')} đ</span>
                      <button
                        onClick={() => removeCartItem(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition mt-2"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Summary Footer */}
            {cart.items.length > 0 && (
              <div className="p-6 border-t border-gray-150 bg-gray-50/50 space-y-4">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-gray-500 font-medium">Tổng tiền tạm tính:</span>
                  <span className="text-lg font-extrabold text-gray-950">{cart.total_price.toLocaleString('vi-VN')} đ</span>
                </div>

                {user ? (
                  <button
                    onClick={() => setIsCheckingOut(true)}
                    className="w-full py-4 bg-black hover:bg-gray-850 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition shadow-lg cursor-pointer"
                  >
                    Tiến Hành Thanh Toán
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsAuthOpen(true);
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 active:scale-98 transition shadow-lg cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    Đăng Nhập Để Thanh Toán
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
