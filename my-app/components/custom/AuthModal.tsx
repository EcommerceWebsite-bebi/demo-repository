"use client";

import React, { useState } from "react";
import { X, Mail, Lock, User, Phone, MapPin, Loader2, Sparkles } from "lucide-react";
import { useApp } from "../AppContext";

export default function AuthModal() {
  const { isAuthOpen, setIsAuthOpen, login, register } = useApp();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  if (!isAuthOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLoginMode) {
        if (!email || !password) {
          setError("Vui lòng điền đầy đủ email và mật khẩu");
          setIsLoading(false);
          return;
        }
        const res = await login(email, password);
        if (res.success) {
          setIsAuthOpen(false);
          resetForm();
        } else {
          setError(res.message || "Đăng nhập thất bại");
        }
      } else {
        if (!username || !email || !password || !phone || !address) {
          setError("Vui lòng điền đầy đủ tất cả các trường");
          setIsLoading(false);
          return;
        }
        const res = await register(username, email, password, phone, address);
        if (res.success) {
          setIsAuthOpen(false);
          resetForm();
        } else {
          setError(res.message || "Đăng ký thất bại");
        }
      }
    } catch (e) {
      setError("Đã xảy ra lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setEmail("");
    setPassword("");
    setUsername("");
    setPhone("");
    setAddress("");
    setError(null);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white/95 p-8 shadow-2xl backdrop-blur-md transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600" />
        
        {/* Close Button */}
        <button
          onClick={() => {
            setIsAuthOpen(false);
            resetForm();
          }}
          className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Mouseee Shop
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isLoginMode ? "Chào Mừng Trở Lại" : "Tạo Tài Khoản Mới"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isLoginMode ? "Đăng nhập để đồng bộ giỏ hàng và xem đơn hàng" : "Tham gia mua sắm và tùy chỉnh áo thun 3D"}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-50 border border-red-150 p-3.5 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
                Tên hiển thị
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Nguyễn Văn A"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
              Email đăng nhập
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
              />
            </div>
          </div>

          {!isLoginMode && (
            <>
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
                  Số điện thoại
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">
                  Địa chỉ giao hàng
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="123 Đường ABC, Quận 1, TP. HCM"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm text-gray-800 focus:border-black focus:ring-1 focus:ring-black outline-none transition"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-black py-3 text-sm font-semibold text-white hover:bg-gray-850 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer shadow-md mt-6"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isLoginMode ? (
              "Đăng Nhập"
            ) : (
              "Đăng Ký Tài Khoản"
            )}
          </button>
        </form>

        {/* Footer Mode Switcher */}
        <div className="mt-6 text-center text-xs text-gray-500 border-t border-gray-100 pt-5">
          {isLoginMode ? (
            <p>
              Chưa có tài khoản?{" "}
              <button
                onClick={() => {
                  setIsLoginMode(false);
                  setError(null);
                }}
                className="font-bold text-indigo-650 hover:underline"
              >
                Đăng ký ngay
              </button>
            </p>
          ) : (
            <p>
              Đã có tài khoản?{" "}
              <button
                onClick={() => {
                  setIsLoginMode(true);
                  setError(null);
                }}
                className="font-bold text-indigo-650 hover:underline"
              >
                Đăng nhập
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
