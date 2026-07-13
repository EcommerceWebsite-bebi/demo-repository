"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ShoppingBag, Star, Sparkles, AlertCircle, Loader2, CheckCircle2, MessageSquare } from "lucide-react";
import { useApp, Product } from "../AppContext";

export default function ProductDetailModal() {
  const { 
    activeProductDetail, 
    setActiveProductDetail, 
    addToCart, 
    user, 
    setIsAuthOpen,
    submitReview,
    fetchProductById
  } = useApp();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [addedMessage, setAddedMessage] = useState(false);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [currentId, setCurrentId] = useState<number | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Reset states and fetch reviews when active product changes
  useEffect(() => {
    // Cancellation flag: prevents async callback from reopening modal after close
    let cancelled = false;

    if (activeProductDetail && activeProductDetail.id !== currentId) {
      setCurrentId(activeProductDetail.id);
      setSelectedSize(activeProductDetail.sizes?.[0] || null);
      setSelectedColor(activeProductDetail.colors?.[0] || null);
      setQuantity(1);
      setReviewError(null);
      setComment("");
      setRating(5);
      setActiveImage(activeProductDetail.image || null);

      // Async fetch full product info with reviews
      fetchProductById(activeProductDetail.id).then((freshProduct) => {
        // Only update if modal is still open for this product (not closed in the meantime)
        if (!cancelled && freshProduct && freshProduct.id === activeProductDetail.id) {
          setActiveProductDetail(freshProduct);
          if (freshProduct.image && !activeImage) {
            setActiveImage(freshProduct.image);
          }
        }
      });
    } else if (!activeProductDetail) {
      setCurrentId(null);
      setActiveImage(null);
    }

    // Cleanup: mark as cancelled so pending async fetch won't reopen modal
    return () => {
      cancelled = true;
    };
  }, [activeProductDetail, currentId]);


  if (!activeProductDetail) return null;

  const product = activeProductDetail;
  const isOutOfStock = product.stock <= 0;

  async function handleAddToCart() {
    if (isOutOfStock) return;
    setAdding(true);
    await addToCart(product.id, quantity, selectedSize, selectedColor);
    setAdding(false);
    setAddedMessage(true);
    setTimeout(() => {
      setAddedMessage(false);
      setActiveProductDetail(null); // Close modal
    }, 1500);
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setReviewError(null);

    if (!comment.trim()) {
      setReviewError("Vui lòng nhập nội dung nhận xét.");
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await submitReview(product.id, rating, comment);
      if (res.success) {
        setComment("");
        setRating(5);
        
        // Refresh product detail reviews immediately
        const freshProduct = await fetchProductById(product.id);
        if (freshProduct) {
          setActiveProductDetail(freshProduct);
        }
      } else {
        setReviewError(res.message || "Không thể gửi nhận xét.");
      }
    } catch (err) {
      setReviewError("Đã xảy ra lỗi kết nối khi gửi nhận xét.");
    } finally {
      setSubmittingReview(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-white rounded-2xl border border-gray-150 shadow-2xl flex flex-col md:flex-row my-8 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => setActiveProductDetail(null)}
          className="absolute top-4 right-4 z-10 rounded-full bg-white/80 p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 shadow-sm border border-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Product Image & Details */}
        <div className="w-full md:w-1/2 bg-gray-50 border-r border-gray-100 p-8 flex flex-col items-center justify-center min-h-[300px] md:min-h-0 space-y-4">
          <div className="relative aspect-square w-full max-w-sm flex items-center justify-center">
            <img
              src={activeImage || product.image || "https://res.cloudinary.com/demo/image/upload/sample.jpg"}
              alt={product.name}
              className="object-contain max-h-full max-w-full rounded-xl transition duration-500"
            />
            {product.is_customizable === 1 && (
              <span className="absolute top-0 left-0 bg-indigo-600 border border-indigo-700 text-white font-bold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-md shadow flex items-center gap-1">
                <Sparkles className="w-3 h-3 animate-pulse" /> Custom 3D Ready
              </span>
            )}
          </div>

          {/* Thumbnails Gallery */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 flex-wrap justify-center max-w-sm">
              {product.images.map((imgUrl, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImage(imgUrl)}
                  className={`w-12 h-12 rounded-lg border overflow-hidden p-0.5 transition ${
                    (activeImage === imgUrl || (!activeImage && index === 0))
                      ? "border-black ring-1 ring-black"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <img src={imgUrl} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Options & Checkout & Reviews - Scrollable */}
        <div className="w-full md:w-1/2 flex flex-col h-full overflow-y-auto max-h-[90vh] md:max-h-[85vh]">
          <div className="p-8 space-y-6 flex-1">
            
            {/* Info details header */}
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded">
                {product.category_name || "Thành Viên"}
              </span>
              <h2 className="text-2xl font-extrabold text-gray-950 mt-2">{product.name}</h2>
              
              <div className="flex items-center gap-4 mt-2">
                {product.discount_price !== null && product.discount_price !== undefined && product.discount_price < product.price ? (
                  <>
                    <span className="text-xl font-extrabold text-red-600">
                      {product.discount_price.toLocaleString('vi-VN')} đ
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      {product.price.toLocaleString('vi-VN')} đ
                    </span>
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded shadow-sm">
                      -{Math.round(((product.price - product.discount_price) / product.price) * 100)}%
                    </span>
                  </>
                ) : (
                  <span className="text-xl font-extrabold text-gray-900">
                    {product.price.toLocaleString('vi-VN')} đ
                  </span>
                )}
                <span className={`text-xs font-semibold ${isOutOfStock ? 'text-red-500 bg-red-50 px-2 py-0.5 rounded' : 'text-gray-500'}`}>
                  {isOutOfStock ? "Hết hàng" : `Kho còn: ${product.stock} sản phẩm`}
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-gray-650 leading-relaxed border-t border-b border-gray-100 py-4">
              {product.description || "Mô tả sản phẩm đang được cập nhật. Chất liệu vải cotton cao cấp mát mịn, thấm hút mồ hôi tốt, đường may tinh xảo bền bỉ thích hợp mặc hàng ngày."}
            </p>

            {/* Size selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">
                  Chọn kích cỡ (Size)
                </label>
                <div className="flex gap-2">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`h-9 min-w-9 rounded-lg border font-bold text-xs uppercase transition ${
                        selectedSize === s
                          ? "border-black bg-black text-white"
                          : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color selector */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-gray-400 mb-2">
                  Chọn màu sắc
                </label>
                <div className="flex gap-2.5">
                  {product.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition ${
                        selectedColor === c
                          ? "border-black bg-black text-white"
                          : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Cart button */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border border-gray-200 rounded-lg h-11 bg-white">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 hover:bg-gray-50 text-gray-500 h-full flex items-center justify-center font-bold"
                  disabled={isOutOfStock}
                >
                  -
                </button>
                <span className="px-2 font-mono font-bold text-sm w-8 text-center text-gray-800">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 hover:bg-gray-50 text-gray-500 h-full flex items-center justify-center font-bold"
                  disabled={isOutOfStock}
                >
                  +
                </button>
              </div>

              {addedMessage ? (
                <div className="flex-1 h-11 bg-emerald-50 text-emerald-700 border border-emerald-150 rounded-lg flex items-center justify-center gap-1.5 text-xs font-semibold animate-pulse">
                  <CheckCircle2 className="w-4 h-4" /> Đã thêm vào giỏ hàng!
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || adding}
                  className="flex-1 h-11 bg-black hover:bg-gray-850 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition shadow disabled:bg-gray-100 disabled:text-gray-400 disabled:border-none disabled:cursor-not-allowed cursor-pointer"
                >
                  {adding ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      {isOutOfStock ? "Đã Hết Hàng" : "Thêm Vào Giỏ Hàng"}
                    </>
                  )}
                </button>
              )}
            </div>

            {/* REVIEWS SECTION */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Nhận xét sản phẩm ({product.reviews?.length || 0})
                </h3>
              </div>

              {/* Review Input Form */}
              {user ? (
                <form onSubmit={handleReviewSubmit} className="bg-gray-50 border border-gray-150 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-600">Đánh giá của bạn:</span>
                    
                    {/* Star selector */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-0.5 text-yellow-400 hover:scale-110 transition"
                        >
                          <Star className={`w-4 h-4 ${rating >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {reviewError && (
                    <div className="text-[11px] text-red-600 font-semibold">{reviewError}</div>
                  )}

                  <div className="flex gap-2">
                    <textarea
                      placeholder="Chia sẻ trải nghiệm của bạn về chất liệu, kích thước..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={2}
                      className="flex-1 rounded-lg border border-gray-200 bg-white p-2.5 text-xs text-gray-800 outline-none focus:border-black transition resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg active:scale-95 transition flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Gửi"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-500">
                  <button
                    onClick={() => {
                      setActiveProductDetail(null);
                      setIsAuthOpen(true);
                    }}
                    className="font-bold text-indigo-650 hover:underline"
                  >
                    Đăng nhập
                  </button>{" "}
                  để viết nhận xét cho sản phẩm này.
                </div>
              )}

              {/* Reviews List */}
              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                {(!product.reviews || product.reviews.length === 0) ? (
                  <p className="text-xs text-gray-400 italic py-2">Chưa có đánh giá nào cho sản phẩm này.</p>
                ) : (
                  product.reviews.map((rev) => (
                    <div key={rev.id} className="border-b border-gray-55/60 pb-3 last:border-none">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-800">{rev.username}</span>
                          <div className="flex text-yellow-400">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-2.5 h-2.5 ${i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(rev.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-xs text-gray-650 mt-1 leading-normal">{rev.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
