"use client";

import React, { useEffect, useState } from "react";
import { X, LogOut, Package, Phone, MapPin, Mail, Calendar, CreditCard, Clock, FileText, CheckCircle2, AlertCircle, Shield } from "lucide-react";
import Link from "next/link";
import { useApp } from "../AppContext";

export default function UserProfileModal() {
  const { isProfileOpen, setIsProfileOpen, user, orders, logout, fetchOrders } = useApp();
  const [activeTab, setActiveTab] = useState<"profile" | "orders">("profile");

  useEffect(() => {
    if (isProfileOpen) {
      fetchOrders();
    }
  }, [isProfileOpen]);

  if (!isProfileOpen || !user) return null;

  function getStatusColor(statusName: string) {
    switch (statusName) {
      case "PENDING":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "PROCESSING":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "SHIPPING":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "COMPLETED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "CANCELLED":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  }

  function getStatusIcon(statusName: string) {
    switch (statusName) {
      case "PENDING":
        return <Clock className="w-3.5 h-3.5" />;
      case "PROCESSING":
        return <Package className="w-3.5 h-3.5" />;
      case "SHIPPING":
        return <Package className="w-3.5 h-3.5 animate-pulse" />;
      case "COMPLETED":
        return <CheckCircle2 className="w-3.5 h-3.5" />;
      case "CANCELLED":
        return <AlertCircle className="w-3.5 h-3.5" />;
      default:
        return <Clock className="w-3.5 h-3.5" />;
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div 
        className="relative w-full max-w-2xl h-[550px] overflow-hidden rounded-2xl border border-gray-150 bg-white shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient strip */}
        <div className="h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600" />
        
        {/* Close Button */}
        <button
          onClick={() => setIsProfileOpen(false)}
          className="absolute top-4 right-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Tabs */}
        <div className="flex border-b border-gray-150 px-8 pt-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-4 text-sm font-semibold border-b-2 px-1 transition-all mr-6 ${
              activeTab === "profile" 
                ? "border-black text-black" 
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Tài Khoản
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-4 text-sm font-semibold border-b-2 px-1 transition-all flex items-center gap-1.5 ${
              activeTab === "orders" 
                ? "border-black text-black" 
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            Lịch Sử Đơn Hàng
            {orders.length > 0 && (
              <span className="bg-gray-100 text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {orders.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Content - Scrollable body */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === "profile" ? (
            <div className="space-y-6">
              {/* User Avatar Circle */}
              <div className="flex items-center gap-4 border-b border-gray-100 pb-5">
                <div className="w-16 h-16 rounded-full bg-indigo-50 border border-indigo-150 flex items-center justify-center text-indigo-700 font-extrabold text-2xl uppercase">
                  {user.username.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user.username}</h3>
                  <p className="text-xs text-indigo-650 font-mono">ID Khách hàng: #{user.id}</p>
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Email</p>
                    <p className="text-sm font-semibold text-gray-800 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-xl">
                  <Phone className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Số Điện Thoại</p>
                    <p className="text-sm font-semibold text-gray-800">{user.phone || "Chưa thiết lập"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 p-4 rounded-xl col-span-1 md:col-span-2">
                  <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Địa Chỉ Giao Hàng</p>
                    <p className="text-sm font-semibold text-gray-800 leading-normal">{user.address || "Chưa thiết lập"}</p>
                  </div>
                </div>
              </div>

              {/* Logout & Admin buttons */}
              <div className="pt-4 flex justify-end items-center">
                {!!(user && (user.role_id === 1 || user.username?.toLowerCase() === "admin" || user.email?.toLowerCase().includes("admin"))) && (
                  <Link
                    href="/admin"
                    onClick={() => setIsProfileOpen(false)}
                    className="mr-auto px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 hover:border-indigo-250 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    Trang Quản Trị
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsProfileOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-150 hover:border-red-250 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Đăng Xuất
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-gray-400">
                  <Package className="w-12 h-12 stroke-[1.5] mb-2" />
                  <p className="text-sm font-medium">Bạn chưa thực hiện đơn hàng nào.</p>
                  <p className="text-xs text-gray-400 mt-1">Đơn hàng của bạn sẽ được liệt kê ở đây sau khi thanh toán.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition duration-200">
                    {/* Order summary header */}
                    <div className="bg-gray-50 px-5 py-3.5 border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-900">Mã Đơn: #{order.id}</span>
                        <span className="flex items-center gap-1 text-[11px] text-gray-500">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(order.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      
                      {/* Status and price */}
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(order.status_name)}`}>
                          {getStatusIcon(order.status_name)}
                          {order.status_name}
                        </span>
                        <span className="text-sm font-extrabold text-gray-900">{order.total_price.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>

                    {/* Order items list */}
                    <div className="px-5 py-4 space-y-3">
                      {order.items?.map((item) => (
                        <div key={item.id} className="flex gap-3 justify-between items-center">
                          <div className="flex gap-3 items-center min-w-0">
                            {/* Product thumbnail with hover-flip animation for front/back designs */}
                            {(() => {
                              const designImages = item.custom_design_image ? item.custom_design_image.split('|') : [];
                              const frontImage = designImages[0] || item.product_image || "https://res.cloudinary.com/demo/image/upload/sample.jpg";
                              const backImage = designImages[1];
                              return (
                                <div className="relative w-10 h-10 flex-shrink-0 group overflow-hidden rounded-lg border border-gray-100 bg-gray-50 p-1 cursor-help" title={backImage ? "Rê chuột để xem mặt sau" : ""}>
                                  <img
                                    src={frontImage}
                                    alt={item.product_name}
                                    className="w-full h-full object-contain transition-opacity duration-300 group-hover:opacity-0"
                                  />
                                  {backImage && (
                                    <img
                                      src={backImage}
                                      alt={`${item.product_name} (mặt sau)`}
                                      className="absolute inset-0 w-full h-full object-contain p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    />
                                  )}
                                </div>
                              );
                            })()}
                            
                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-gray-800 truncate">{item.product_name}</h4>
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                Kích cỡ: <span className="font-semibold text-gray-700 uppercase">{item.size || "Mặc định"}</span>
                                <span className="mx-1.5">•</span>
                                Màu sắc: <span className="font-semibold text-gray-700">{item.color || "Mặc định"}</span>
                                {item.custom_design_image && (
                                  <>
                                    <span className="mx-1.5">•</span>
                                    <span className="text-indigo-650 font-bold bg-indigo-50 px-1 rounded">
                                      Tùy chỉnh 3D {item.custom_design_image.includes('|') ? '(2 Mặt)' : '(1 Mặt)'}
                                    </span>
                                  </>
                                )}
                                {item.custom_design_pdf && (
                                  <>
                                    <span className="mx-1.5">•</span>
                                    <a
                                      href={item.custom_design_pdf}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-emerald-650 font-bold bg-emerald-50 px-1.5 py-0.5 rounded hover:bg-emerald-100 transition inline-flex items-center gap-0.5 cursor-pointer"
                                    >
                                      <FileText className="w-2.5 h-2.5" />
                                      Xem PDF
                                    </a>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="text-xs font-bold text-gray-900">{item.price.toLocaleString('vi-VN')} đ</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">SL: x{item.quantity}</p>
                          </div>
                        </div>
                      ))}

                      {/* Delivery address & note */}
                      <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-gray-500">
                        <div>
                          <p className="font-semibold text-gray-700">Giao tới:</p>
                          <p className="mt-0.5 leading-normal">{order.shipping_address} (SĐT: {order.phone})</p>
                        </div>
                        {order.note && (
                          <div>
                            <p className="font-semibold text-gray-700">Ghi chú đơn hàng:</p>
                            <p className="mt-0.5 italic leading-normal">"{order.note}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
