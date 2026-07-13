"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  LayoutDashboard, 
  Shirt, 
  ShoppingBag, 
  LogOut, 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Sliders, 
  X, 
  ChevronRight, 
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  Package,
  FileText
} from "lucide-react";
import Link from "next/link";
import { useApp, Product, Order, Category, API_URL } from "../../components/AppContext";

export default function AdminPage() {
  const { 
    user, 
    products, 
    orders, 
    categories, 
    isLoading: isAppLoading, 
    setIsAuthOpen,
    addProduct,
    updateProduct,
    deleteProduct,
    updateOrderStatus,
    fetchCouponsAdmin,
    createCoupon,
    deleteCoupon
  } = useApp();

  const [activeTab, setActiveTab] = useState<"overview" | "products" | "orders" | "coupons">("overview");
  const [isClient, setIsClient] = useState(false);

  // Search & Filter States
  const [productSearch, setProductSearch] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");

  // Product Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    discount_price: "" as string | number,
    stock: 0,
    image: "",
    images: [] as string[],
    category_id: 1,
    is_customizable: 0,
    sizes: [] as string[],
    colors: [] as string[]
  });

  // Size/Color presets for product form
  const sizePresets = ["S", "M", "L", "XL", "XXL", "Free Size"];
  const colorPresets = ["White", "Black", "Navy", "Red", "Heather Grey", "Brown", "Cream", "Green", "Pink", "Yellow"];

  // Order Details Modal States
  const [isOrderDetailModalOpen, setIsOrderDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newOrderStatus, setNewOrderStatus] = useState("");

  // Action Pending loaders
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error", text: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Coupon States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponSearch, setCouponSearch] = useState("");
  const [couponForm, setCouponForm] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: 10,
    min_order_value: 0,
    max_discount: "" as string | number,
    end_date: "",
    usage_limit: "" as string | number
  });

  const loadCoupons = async () => {
    setIsActionLoading(true);
    try {
      const data = await fetchCouponsAdmin();
      setCoupons(data);
    } catch (err) {
      console.error("Lỗi khi load danh sách coupon:", err);
    } finally {
      setIsActionLoading(false);
    }
  };

  const [visitorCount, setVisitorCount] = useState<number>(0);

  const fetchVisitorCount = async () => {
    try {
      const res = await fetch(`${API_URL}/api/visitors`, { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setVisitorCount(data.count ?? 0);
      }
    } catch (err) {
      console.error("Lỗi khi load số lượng truy cập:", err);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      fetchVisitorCount();
    }
  }, [isClient]);

  useEffect(() => {
    if (activeTab === "overview" && isClient) {
      fetchVisitorCount();
    }
  }, [activeTab, isClient]);

  useEffect(() => {
    if (activeTab === "coupons" && isClient) {
      loadCoupons();
    }
  }, [activeTab, isClient]);

  const handleOpenAddCoupon = () => {
    setCouponForm({
      code: "",
      discount_type: "percentage",
      discount_value: 10,
      min_order_value: 0,
      max_discount: "",
      end_date: "",
      usage_limit: ""
    });
    setIsCouponModalOpen(true);
  };

  const handleCouponFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCouponForm(prev => ({
      ...prev,
      [name]: name === "discount_value" || name === "min_order_value"
        ? Number(value)
        : value
    }));
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const payload = {
        code: couponForm.code,
        discount_type: couponForm.discount_type,
        discount_value: couponForm.discount_value,
        min_order_value: couponForm.min_order_value,
        max_discount: couponForm.max_discount === "" ? null : Number(couponForm.max_discount),
        end_date: couponForm.end_date === "" ? null : couponForm.end_date,
        usage_limit: couponForm.usage_limit === "" ? null : Number(couponForm.usage_limit)
      };

      const res = await createCoupon(payload);
      if (res.success) {
        showNotification("success", `Tạo mã giảm giá "${couponForm.code}" thành công!`);
        setIsCouponModalOpen(false);
        loadCoupons();
      } else {
        showNotification("error", res.message || "Tạo mã giảm giá thất bại.");
      }
    } catch (err) {
      showNotification("error", "Lỗi hệ thống khi tạo mã giảm giá.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: number, code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mã giảm giá "${code}"?`)) return;
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await deleteCoupon(id);
      if (res.success) {
        showNotification("success", `Xóa mã giảm giá "${code}" thành công!`);
        loadCoupons();
      } else {
        showNotification("error", res.message || "Xóa thất bại.");
      }
    } catch (err) {
      showNotification("error", "Lỗi kết nối.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => c.code.toLowerCase().includes(couponSearch.toLowerCase()));
  }, [coupons, couponSearch]);

  // Check user is Admin
  const isAdmin = useMemo(() => {
    if (!user) return false;
    return user.role_id === 2 || 
           user.username?.toLowerCase() === "admin" || 
           user.email?.toLowerCase().includes("admin");
  }, [user]);

  // Handle form change
  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: name === "price" || name === "stock" || name === "category_id" || name === "is_customizable" 
        ? Number(value) 
        : name === "discount_price"
          ? (value === "" ? "" : Number(value))
          : value
    }));
  };

  // Handle product image upload to Cloudinary
  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setProductForm(prev => ({
          ...prev,
          image: data.imageUrl
        }));
        showNotification("success", "Tải ảnh sản phẩm lên Cloudinary thành công!");
      } else {
        showNotification("error", data.message || "Tải ảnh lên thất bại.");
      }
    } catch (error) {
      console.error("Lỗi khi upload ảnh:", error);
      showNotification("error", "Lỗi kết nối khi tải ảnh lên.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle product multiple images upload
  const handleProductMultipleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    const newImages = [...productForm.images];
    let loadedCount = 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("image", file);

        const response = await fetch(`${API_URL}/api/upload`, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          newImages.push(data.imageUrl);
          loadedCount++;
        }
      }
      setProductForm(prev => ({
        ...prev,
        images: newImages
      }));
      if (loadedCount > 0) {
        showNotification("success", `Tải thành công ${loadedCount} ảnh chi tiết!`);
      } else {
        showNotification("error", "Không tải được ảnh nào.");
      }
    } catch (error) {
      console.error("Lỗi khi upload nhiều ảnh:", error);
      showNotification("error", "Lỗi kết nối khi tải ảnh lên.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle removing a thumbnail image
  const handleRemoveImageThumbnail = (indexToRemove: number) => {
    setProductForm(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Handle sizes checkbox toggle
  const handleSizeToggle = (size: string) => {
    setProductForm(prev => {
      const exists = prev.sizes.includes(size);
      if (exists) {
        return { ...prev, sizes: prev.sizes.filter(s => s !== size) };
      } else {
        return { ...prev, sizes: [...prev.sizes, size] };
      }
    });
  };

  // Handle colors tag toggle
  const handleColorToggle = (color: string) => {
    setProductForm(prev => {
      const exists = prev.colors.includes(color);
      if (exists) {
        return { ...prev, colors: prev.colors.filter(c => c !== color) };
      } else {
        return { ...prev, colors: [...prev.colors, color] };
      }
    });
  };

  // Open modal for Add
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      description: "",
      price: 150000,
      discount_price: "",
      stock: 50,
      image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60",
      images: [],
      category_id: categories[0]?.id || 1,
      is_customizable: 0,
      sizes: ["S", "M", "L", "XL"],
      colors: ["White", "Black"]
    });
    setIsProductModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price,
      discount_price: product.discount_price !== undefined && product.discount_price !== null ? product.discount_price : "",
      stock: product.stock,
      image: product.image || "",
      images: product.images || [],
      category_id: product.category_id || 1,
      is_customizable: product.is_customizable || 0,
      sizes: product.sizes || [],
      colors: product.colors || []
    });
    setIsProductModalOpen(true);
  };

  // Submit Product Form
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    setActionMessage(null);

    const payload = {
      ...productForm,
      discount_price: productForm.discount_price === "" || productForm.discount_price === null ? null : Number(productForm.discount_price)
    };

    try {
      if (editingProduct) {
        const res = await updateProduct(editingProduct.id, payload);
        if (res.success) {
          showNotification("success", `Cập nhật sản phẩm "${productForm.name}" thành công!`);
          setIsProductModalOpen(false);
        } else {
          showNotification("error", res.message || "Cập nhật thất bại.");
        }
      } else {
        const res = await addProduct(payload);
        if (res.success) {
          showNotification("success", `Thêm sản phẩm "${productForm.name}" thành công!`);
          setIsProductModalOpen(false);
        } else {
          showNotification("error", res.message || "Thêm mới thất bại.");
        }
      }
    } catch (e) {
      showNotification("error", "Lỗi đường truyền máy chủ.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Delete product action
  const handleDeleteProduct = async (id: number, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}"?`)) return;
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await deleteProduct(id);
      if (res.success) {
        showNotification("success", `Xóa sản phẩm "${name}" thành công!`);
      } else {
        showNotification("error", res.message || "Xóa thất bại.");
      }
    } catch (e) {
      showNotification("error", "Lỗi kết nối.");
    } finally {
      setIsActionLoading(false);
    }
  };

  // Open Order details
  const handleOpenOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setNewOrderStatus(order.status_name);
    setIsOrderDetailModalOpen(true);
  };

  // Update order status action
  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return;
    setIsActionLoading(true);
    setActionMessage(null);
    try {
      const res = await updateOrderStatus(selectedOrder.id, newOrderStatus);
      if (res.success) {
        showNotification("success", `Cập nhật trạng thái Đơn hàng #${selectedOrder.id} thành " ${newOrderStatus} " thành công!`);
        setSelectedOrder(prev => prev ? { ...prev, status_name: newOrderStatus } : null);
        setIsOrderDetailModalOpen(false);
      } else {
        showNotification("error", res.message || "Cập nhật thất bại.");
      }
    } catch (e) {
      showNotification("error", "Lỗi kết nối.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", text: string) => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage(null);
    }, 4500);
  };

  // Calculations for Overview stats
  const stats = useMemo(() => {
    // Total revenue is the sum of all COMPLETED orders
    const completedOrders = orders.filter(o => o.status_name.toUpperCase() === "COMPLETED");
    const revenue = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
    
    // Total orders count
    const totalOrders = orders.length;

    // Total products count
    const totalProducts = products.length;

    // Low stock count
    const lowStock = products.filter(p => p.stock <= 5).length;

    // Order status summary counts
    const statusCounts = orders.reduce((acc, o) => {
      const status = o.status_name.toUpperCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Category product counts
    const categoryCounts = products.reduce((acc, p) => {
      const cat = p.category_name || "Uncategorized";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      revenue,
      totalOrders,
      totalProducts,
      lowStock,
      statusCounts,
      categoryCounts
    };
  }, [orders, products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
                          (p.description && p.description.toLowerCase().includes(productSearch.toLowerCase()));
      const matchCategory = productCategoryFilter === "all" || 
                            p.category_name?.toLowerCase() === productCategoryFilter.toLowerCase() ||
                            p.category_id?.toString() === productCategoryFilter;
      return matchSearch && matchCategory;
    });
  }, [products, productSearch, productCategoryFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchSearch = o.id.toString().includes(orderSearch) || 
                          o.shipping_address.toLowerCase().includes(orderSearch.toLowerCase()) ||
                          o.phone.includes(orderSearch);
      const matchStatus = orderStatusFilter === "all" || o.status_name.toUpperCase() === orderStatusFilter.toUpperCase();
      return matchSearch && matchStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // Formatted date string helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };

  const getStatusBadgeClass = (statusName: string) => {
    switch (statusName.toUpperCase()) {
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SHIPPING":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "COMPLETED":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "CANCELLED":
        return "bg-rose-100 text-rose-800 border-rose-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (!isClient || isAppLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-900 font-sans p-6">
        <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
          <Loader2 className="w-12 h-12 text-indigo-650 animate-spin" />
          <h3 className="text-lg font-bold">Đang Khởi Tạo Hệ Thống</h3>
          <p className="text-sm text-gray-500">Đang đồng bộ dữ liệu bảo mật và tải tài nguyên trang quản trị...</p>
        </div>
      </div>
    );
  }

  // RBAC Access Control Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 font-sans p-6 relative overflow-hidden">
        {/* Dynamic ambient background blur circles */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-rose-500/10 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse-slow" style={{ animationDelay: "5s" }} />

        <div className="relative z-10 w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl text-center flex flex-col items-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 mb-2 animate-bounce">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">403 - Từ Chối Truy Cập</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Bạn không có quyền truy cập vào bảng quản lý hệ thống. Trang này chỉ dành riêng cho Quản trị viên (Admin).
          </p>
          <div className="w-full pt-4 space-y-3 flex flex-col">
            <button
              onClick={() => setIsAuthOpen(true)}
              className="w-full bg-gradient-to-r from-indigo-650 to-cyan-600 hover:from-indigo-600 hover:to-cyan-550 text-white font-bold py-3 rounded-xl shadow-lg transition duration-200 text-sm cursor-pointer"
            >
              Đăng Nhập Quản Trị
            </button>
            <Link
              href="/"
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-3 rounded-xl transition duration-200 text-sm flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay Lại Trang Chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
      
      {/* Toast notifications */}
      {actionMessage && (
        <div className={`fixed bottom-5 right-5 z-[200] px-5 py-4 rounded-xl shadow-xl flex items-center gap-3 border animate-fade-up max-w-sm ${
          actionMessage.type === "success" 
            ? "bg-slate-900/95 border-emerald-500/30 text-emerald-400" 
            : "bg-slate-900/95 border-rose-500/30 text-rose-400"
        }`}>
          {actionMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
          <span className="text-xs font-semibold leading-normal">{actionMessage.text}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950 shrink-0 flex flex-col justify-between p-6">
        <div className="space-y-8">
          {/* Logo brand */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              M
            </div>
            <div>
              <h2 className="text-md font-extrabold tracking-wider bg-gradient-to-r from-cyan-450 to-indigo-400 bg-clip-text text-transparent">MOUSEEE</h2>
              <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-450">Admin Panel</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer ${
                activeTab === "overview" 
                  ? "bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-slate-700/50 text-cyan-400" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
              }`}
            >
              <LayoutDashboard className="w-4.5 h-4.5" />
              Tổng Quan
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer ${
                activeTab === "products" 
                  ? "bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-slate-700/50 text-cyan-400" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
              }`}
            >
              <Shirt className="w-4.5 h-4.5" />
              Sản Phẩm
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer ${
                activeTab === "orders" 
                  ? "bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-slate-700/50 text-cyan-400" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
              }`}
            >
              <ShoppingBag className="w-4.5 h-4.5" />
              Đơn Hàng
            </button>
            <button
              onClick={() => setActiveTab("coupons")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition duration-200 cursor-pointer ${
                activeTab === "coupons" 
                  ? "bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 border border-slate-700/50 text-cyan-400" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/40"
              }`}
            >
              <Sliders className="w-4.5 h-4.5" />
              Mã Giảm Giá
            </button>
          </nav>
        </div>

        {/* User Info footer and Logout */}
        <div className="border-t border-slate-850 pt-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-450 to-indigo-650 flex items-center justify-center text-white font-extrabold text-sm uppercase shadow">
              {user?.username?.charAt(0) || "A"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.username || "Admin"}</p>
              <p className="text-[10px] text-slate-550 truncate font-mono">{user?.email}</p>
            </div>
          </div>
          <Link
            href="/"
            className="w-full py-2.5 px-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-300 transition duration-150 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Về Trang Chủ Shop
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 overflow-y-auto h-screen bg-slate-900 p-8 space-y-8">
        
        {/* TOP ROW HEADER */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white capitalize">
              {activeTab === "overview" && "Bảng Thống Kê Tổng Quan"}
              {activeTab === "products" && "Danh Sách Sản Phẩm"}
              {activeTab === "orders" && "Quản Lý Đơn Hàng"}
              {activeTab === "coupons" && "Quản Lý Mã Giảm Giá"}
            </h1>
            <p className="text-xs text-slate-450 mt-1 font-medium">
              Chào mừng quay trở lại, {user?.username}! Hệ thống đang vận hành trực tuyến.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 bg-slate-950/60 border border-slate-800/80 rounded-full text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Chế độ Front-End
            </div>
          </div>
        </div>

        {/* TAB CONTENTS */}

        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-up">
            
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              
              {/* Card Revenue */}
              <div className="bg-slate-950/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-bl-full" />
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Doanh Thu (Hoàn Thành)</span>
                  <h3 className="text-xl font-extrabold text-white">{stats.revenue.toLocaleString("vi-VN")} đ</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              {/* Card Orders */}
              <div className="bg-slate-950/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-bl-full" />
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Tổng Đơn Hàng</span>
                  <h3 className="text-xl font-extrabold text-white">{stats.totalOrders} Đơn</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

              {/* Card Products */}
              <div className="bg-slate-950/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-bl-full" />
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Tổng Sản Phẩm</span>
                  <h3 className="text-xl font-extrabold text-white">{stats.totalProducts} mẫu</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Shirt className="w-5 h-5" />
                </div>
              </div>

              {/* Card Low Stock */}
              <div className="bg-slate-950/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-bl-full" />
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Sắp Hết Hàng (stock ≤ 5)</span>
                  <h3 className="text-xl font-extrabold text-white">{stats.lowStock} Sản Phẩm</h3>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  stats.lowStock > 0 
                    ? "bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse" 
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>

              {/* Card Visitors */}
              <div className="bg-slate-950/50 backdrop-blur-md border border-slate-800 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-bl-full" />
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Số Lượng Truy Cập</span>
                  <h3 className="text-xl font-extrabold text-white">{(Number(visitorCount) || 0).toLocaleString("vi-VN")} Lượt</h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Custom SVG Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Category Breakdown (Bar Chart) */}
              <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Sản Phẩm Theo Danh Mục</h3>
                </div>
                
                {/* SVG Bar Chart */}
                <div className="h-64 flex flex-col justify-between">
                  <div className="flex-1 flex items-end justify-around gap-2 px-4 pb-4 border-b border-slate-800">
                    {categories.length === 0 ? (
                      <p className="text-xs text-slate-500 pb-16">Không có danh mục nào.</p>
                    ) : (
                      categories.map((cat, idx) => {
                        const count = stats.categoryCounts[cat.name] || 0;
                        const maxCount = Math.max(...Object.values(stats.categoryCounts), 1);
                        const pct = (count / maxCount) * 80; // Scale to max 80% height
                        
                        return (
                          <div key={cat.id} className="group relative flex flex-col items-center w-full max-w-[45px]">
                            {/* Value tooltip */}
                            <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-transform bg-slate-950 text-slate-200 border border-slate-750 px-2 py-0.5 rounded text-[10px] font-bold z-10">
                              {count} SP
                            </span>
                            {/* Bar */}
                            <div 
                              style={{ height: `${pct}%`, minHeight: count > 0 ? "8px" : "1px" }}
                              className={`w-full rounded-t-md transition-all duration-500 ${
                                idx % 3 === 0 ? "bg-gradient-to-t from-indigo-650 to-indigo-500 shadow-[0_0_15px_-5px_rgba(99,102,241,0.5)]" :
                                idx % 3 === 1 ? "bg-gradient-to-t from-cyan-650 to-cyan-500 shadow-[0_0_15px_-5px_rgba(6,182,212,0.5)]" :
                                "bg-gradient-to-t from-violet-650 to-violet-500 shadow-[0_0_15px_-5px_rgba(139,92,246,0.5)]"
                              }`}
                            />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mt-2 truncate w-full text-center">
                              {cat.name}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl shadow-lg">
                <div className="flex items-center gap-2 mb-6">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Phân Bổ Đơn Hàng ({stats.totalOrders} Đơn)</h3>
                </div>

                <div className="space-y-4">
                  {["PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELLED"].map((status) => {
                    const count = stats.statusCounts[status] || 0;
                    const pct = stats.totalOrders > 0 ? Math.round((count / stats.totalOrders) * 100) : 0;
                    
                    let colorClass = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]";
                    if (status === "PROCESSING") colorClass = "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]";
                    if (status === "SHIPPING") colorClass = "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]";
                    if (status === "COMPLETED") colorClass = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]";
                    if (status === "CANCELLED") colorClass = "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.3)]";

                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-semibold text-slate-350">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${colorClass.split(" ")[0]}`} />
                            {status}
                          </span>
                          <span>{count} Đơn ({pct}%)</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${pct}%` }}
                            className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Row - Recent orders & low stock lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Recent Orders List (2/3 width) */}
              <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl shadow-lg lg:col-span-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  Đơn Hàng Gần Đây
                </h3>

                {orders.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">Không tìm thấy đơn hàng nào.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-slate-500 font-bold border-b border-slate-800/80 pb-2">
                          <th className="py-2.5">Mã Đơn</th>
                          <th className="py-2.5">Ngày Đặt</th>
                          <th className="py-2.5">Tổng Tiền</th>
                          <th className="py-2.5 text-right">Trạng Thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {orders.slice(0, 5).map((o) => (
                          <tr key={o.id} className="hover:bg-slate-800/25 transition">
                            <td className="py-3 font-mono font-bold text-indigo-400">#{o.id}</td>
                            <td className="py-3 text-slate-350">{formatDate(o.created_at)}</td>
                            <td className="py-3 font-semibold text-white">{o.total_price.toLocaleString("vi-VN")} đ</td>
                            <td className="py-3 text-right">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${getStatusBadgeClass(o.status_name)}`}>
                                {o.status_name}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Low Stock Warning List (1/3 width) */}
              <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl shadow-lg">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-5 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Cảnh Báo Hết Hàng
                </h3>

                {products.filter(p => p.stock <= 5).length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-xs text-slate-450 font-bold">Kho hàng ổn định!</p>
                    <p className="text-[10px] text-slate-550">Không có sản phẩm nào sắp hết hàng.</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                    {products.filter(p => p.stock <= 5).slice(0, 6).map((p) => (
                      <div key={p.id} className="flex justify-between items-center gap-3 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img 
                            src={p.image || "https://res.cloudinary.com/demo/image/upload/sample.jpg"} 
                            alt={p.name} 
                            className="w-8 h-8 rounded-lg object-cover border border-slate-800 flex-shrink-0 bg-slate-950" 
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate">{p.name}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-medium">{p.category_name}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs font-black ${p.stock === 0 ? "text-rose-500" : "text-amber-500"}`}>
                            {p.stock === 0 ? "Hết" : `Chỉ còn ${p.stock}`}
                          </span>
                          <p className="text-[9px] text-slate-500">Mã: #{p.id}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 2. PRODUCT MANAGEMENT TAB */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-fade-up">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-950/30 p-4 border border-slate-850 rounded-2xl">
              
              {/* Search and Category Filter */}
              <div className="flex flex-1 flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Tìm tên sản phẩm..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-500 transition duration-150"
                  />
                  <Search className="w-4 h-4 text-slate-550 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
                
                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-cyan-500 text-slate-350 cursor-pointer"
                >
                  <option value="all">Tất cả danh mục</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add Button */}
              <button
                onClick={handleOpenAddProduct}
                className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-450 hover:to-indigo-550 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow transition-all duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm Sản Phẩm
              </button>
            </div>

            {/* Products Table Card */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="px-5 py-3.5 w-12 text-center">ID</th>
                      <th className="px-5 py-3.5">Sản Phẩm</th>
                      <th className="px-5 py-3.5">Danh Mục</th>
                      <th className="px-5 py-3.5">Đơn Giá</th>
                      <th className="px-5 py-3.5">Kho Hàng</th>
                      <th className="px-5 py-3.5 text-center">Tùy Chỉnh 3D</th>
                      <th className="px-5 py-3.5 text-right w-28">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-slate-500">
                          Không tìm thấy sản phẩm nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/15 transition duration-150 group">
                          {/* ID */}
                          <td className="px-5 py-4 text-center font-mono font-bold text-slate-550">
                            #{p.id}
                          </td>
                          {/* Image and Name */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={p.image || "https://res.cloudinary.com/demo/image/upload/sample.jpg"} 
                                alt={p.name} 
                                className="w-11 h-11 rounded-lg object-cover bg-slate-900 border border-slate-800 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-100 truncate group-hover:text-cyan-400 transition">{p.name}</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                                  {p.description || "Không có mô tả"}
                                </p>
                              </div>
                            </div>
                          </td>
                          {/* Category */}
                          <td className="px-5 py-4 text-slate-300 font-semibold uppercase text-[10px] tracking-wider">
                            {p.category_name || "Mặc định"}
                          </td>
                          {/* Price */}
                          <td className="px-5 py-4 font-bold">
                            {p.discount_price !== null && p.discount_price !== undefined && p.discount_price < p.price ? (
                              <div className="flex flex-col">
                                <span className="text-red-400">{p.discount_price.toLocaleString("vi-VN")} đ</span>
                                <span className="text-[10px] text-slate-500 line-through font-normal">{p.price.toLocaleString("vi-VN")} đ</span>
                              </div>
                            ) : (
                              <span className="text-white">{p.price.toLocaleString("vi-VN")} đ</span>
                            )}
                          </td>
                          {/* Stock Status */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                p.stock === 0 ? "bg-rose-500" :
                                p.stock <= 5 ? "bg-amber-500 animate-pulse" :
                                "bg-emerald-500"
                              }`} />
                              <span className={`font-semibold ${
                                p.stock === 0 ? "text-rose-500" :
                                p.stock <= 5 ? "text-amber-500" :
                                "text-slate-350"
                              }`}>
                                {p.stock === 0 ? "Hết Hàng" : `${p.stock} Chiếc`}
                              </span>
                            </div>
                          </td>
                          {/* Customizable Flag */}
                          <td className="px-5 py-4 text-center">
                            {p.is_customizable === 1 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                <Sparkles className="w-2.5 h-2.5" />
                                Hỗ Trợ 3D
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-semibold bg-slate-800 border border-slate-750 text-slate-500">
                                Tĩnh
                              </span>
                            )}
                          </td>
                          {/* Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditProduct(p)}
                                className="p-1.5 text-slate-450 hover:text-cyan-400 bg-slate-900 border border-slate-800 hover:border-cyan-500/30 rounded-lg transition duration-150 cursor-pointer"
                                title="Chỉnh sửa sản phẩm"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 text-slate-450 hover:text-rose-400 bg-slate-900 border border-slate-800 hover:border-rose-500/30 rounded-lg transition duration-150 cursor-pointer"
                                title="Xóa sản phẩm"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 3. ORDER MANAGEMENT TAB */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-fade-up">
            
            {/* Search and filter row */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-slate-950/30 p-4 border border-slate-850 rounded-2xl">
              
              {/* Search */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Tìm theo Mã đơn, Địa chỉ, Số điện thoại..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-500 transition duration-150"
                />
                <Search className="w-4 h-4 text-slate-550 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Quick status tabs inside the filter row */}
              <div className="flex flex-wrap gap-1.5">
                {["all", "PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELLED"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition duration-150 cursor-pointer ${
                      orderStatusFilter === status
                        ? "bg-indigo-600 border border-indigo-500 text-white"
                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {status === "all" ? "Tất Cả" : status}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table Card */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="px-5 py-3.5 w-16 text-center">Đơn</th>
                      <th className="px-5 py-3.5">Khách Hàng</th>
                      <th className="px-5 py-3.5">Ngày Đặt</th>
                      <th className="px-5 py-3.5">Số Điện Thoại</th>
                      <th className="px-5 py-3.5">Địa Chỉ Giao Hàng</th>
                      <th className="px-5 py-3.5">Tổng Tiền</th>
                      <th className="px-5 py-3.5 text-center">Trạng Thái</th>
                      <th className="px-5 py-3.5 text-right w-24">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-slate-500">
                          Không có đơn đặt hàng nào được tìm thấy.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <tr key={o.id} className="hover:bg-slate-800/15 transition duration-150">
                          {/* Order ID */}
                          <td className="px-5 py-4 text-center font-mono font-bold text-indigo-400">
                            #{o.id}
                          </td>
                          {/* Customer info (Mock/user identifier) */}
                          <td className="px-5 py-4 font-bold text-slate-100">
                            {o.user_id === user?.id ? user.username : `Khách hàng #${o.user_id}`}
                          </td>
                          {/* Created at */}
                          <td className="px-5 py-4 text-slate-350">
                            {formatDate(o.created_at)}
                          </td>
                          {/* Phone */}
                          <td className="px-5 py-4 font-semibold text-slate-300">
                            {o.phone || "N/A"}
                          </td>
                          {/* Shipping address */}
                          <td className="px-5 py-4 text-slate-400 max-w-[200px] truncate" title={o.shipping_address}>
                            {o.shipping_address}
                          </td>
                          {/* Total Price */}
                          <td className="px-5 py-4 font-extrabold text-white">
                            {o.total_price.toLocaleString("vi-VN")} đ
                          </td>
                          {/* Status Badge */}
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${getStatusBadgeClass(o.status_name)}`}>
                              {o.status_name}
                            </span>
                          </td>
                          {/* Action view details */}
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleOpenOrderDetail(o)}
                              className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/30 text-[10px] font-bold text-slate-300 hover:text-cyan-400 rounded-lg transition duration-150 cursor-pointer flex items-center gap-1"
                            >
                              Xem
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 4. COUPON MANAGEMENT TAB */}
        {activeTab === "coupons" && (
          <div className="space-y-6 animate-fade-up">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-slate-950/30 p-4 border border-slate-850 rounded-2xl">
              
              {/* Search */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  placeholder="Tìm kiếm mã giảm giá..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-slate-100 placeholder-slate-500 transition duration-150"
                />
                <Search className="w-4 h-4 text-slate-550 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Add Button */}
              <button
                onClick={handleOpenAddCoupon}
                className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-450 hover:to-indigo-550 text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 shadow transition-all duration-150 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm Mã Giảm Giá
              </button>
            </div>

            {/* Coupons Table Card */}
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                      <th className="px-5 py-3.5 w-12 text-center">ID</th>
                      <th className="px-5 py-3.5">Mã Code</th>
                      <th className="px-5 py-3.5">Loại Giảm</th>
                      <th className="px-5 py-3.5">Giá Trị Giảm</th>
                      <th className="px-5 py-3.5">Đơn Hàng Tối Thiểu</th>
                      <th className="px-5 py-3.5">Mức Giảm Tối Đa</th>
                      <th className="px-5 py-3.5 text-center">Đã Dùng / Giới Hạn</th>
                      <th className="px-5 py-3.5">Ngày Hết Hạn</th>
                      <th className="px-5 py-3.5 text-right w-24">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {filteredCoupons.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-slate-500">
                          Không tìm thấy mã giảm giá nào phù hợp.
                        </td>
                      </tr>
                    ) : (
                      filteredCoupons.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/15 transition duration-150 group">
                          {/* ID */}
                          <td className="px-5 py-4 text-center font-mono font-bold text-slate-550">
                            #{c.id}
                          </td>
                          {/* Code */}
                          <td className="px-5 py-4 font-extrabold text-white tracking-wide uppercase">
                            {c.code}
                          </td>
                          {/* Type */}
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                              c.discount_type === 'percentage' 
                                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            }`}>
                              {c.discount_type === 'percentage' ? 'Phần trăm (%)' : 'Cố định (đ)'}
                            </span>
                          </td>
                          {/* Value */}
                          <td className="px-5 py-4 font-bold text-white">
                            {c.discount_type === 'percentage' ? `${c.discount_value}%` : `${c.discount_value.toLocaleString('vi-VN')} đ`}
                          </td>
                          {/* Min Order Value */}
                          <td className="px-5 py-4 text-slate-350">
                            {c.min_order_value.toLocaleString('vi-VN')} đ
                          </td>
                          {/* Max Discount */}
                          <td className="px-5 py-4 text-slate-350">
                            {c.max_discount ? `${c.max_discount.toLocaleString('vi-VN')} đ` : 'Không giới hạn'}
                          </td>
                          {/* Usage Count */}
                          <td className="px-5 py-4 text-center text-slate-350">
                            <span className="font-semibold text-white">{c.used_count}</span>
                            {c.usage_limit ? ` / ${c.usage_limit}` : ' / Không giới hạn'}
                          </td>
                          {/* Expiry Date */}
                          <td className="px-5 py-4 text-slate-400">
                            {c.end_date ? formatDate(c.end_date) : 'Vô thời hạn'}
                          </td>
                          {/* Action Delete */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleDeleteCoupon(c.id, c.code)}
                                className="p-1.5 text-slate-450 hover:text-rose-400 bg-slate-900 border border-slate-800 hover:border-rose-500/30 rounded-lg transition duration-150 cursor-pointer"
                                title="Xóa mã giảm giá"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      {/* 3. COUPON ADD MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 animate-fade-up text-left">
            
            {/* Top decorative gradient bar */}
            <div className="h-1 bg-gradient-to-r from-cyan-500 to-indigo-600" />
            
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-850 bg-slate-950/40">
              <h3 className="text-md font-extrabold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                Thêm Mã Giảm Giá Mới
              </h3>
              <button 
                onClick={() => setIsCouponModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCouponSubmit} className="p-6 space-y-4">
              
              <div className="space-y-4">
                
                {/* Code */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Mã Code Giảm Giá *</label>
                  <input
                    type="text"
                    name="code"
                    required
                    value={couponForm.code}
                    onChange={handleCouponFormChange}
                    placeholder="VÍ DỤ: WELCOME10"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition uppercase font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Discount Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Loại Giảm Giá</label>
                    <select
                      name="discount_type"
                      value={couponForm.discount_type}
                      onChange={handleCouponFormChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                    >
                      <option value="percentage">Phần trăm (%)</option>
                      <option value="fixed">Số tiền cố định (đ)</option>
                    </select>
                  </div>

                  {/* Discount Value */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Giá Trị Giảm *</label>
                    <input
                      type="number"
                      name="discount_value"
                      required
                      min={1}
                      value={couponForm.discount_value}
                      onChange={handleCouponFormChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Min Order Value */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Đơn Hàng Tối Thiểu (đ)</label>
                    <input
                      type="number"
                      name="min_order_value"
                      min={0}
                      value={couponForm.min_order_value}
                      onChange={handleCouponFormChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  {/* Max Discount */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Giảm Tối Đa (Dạng %)</label>
                    <input
                      type="number"
                      name="max_discount"
                      min={0}
                      placeholder="Không giới hạn"
                      value={couponForm.max_discount}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, max_discount: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Usage Limit */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Giới Hạn Lượt Dùng</label>
                    <input
                      type="number"
                      name="usage_limit"
                      min={1}
                      placeholder="Không giới hạn"
                      value={couponForm.usage_limit}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, usage_limit: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Ngày Hết Hạn</label>
                    <input
                      type="date"
                      name="end_date"
                      value={couponForm.end_date}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-350 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                    />
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-850 flex justify-end gap-3 bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-450 hover:to-indigo-550 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Tạo mã
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      </main>

      {/* MODALS */}

      {/* 1. PRODUCT ADD / EDIT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 animate-fade-up">
            
            {/* Top decorative gradient bar */}
            <form onSubmit={handleProductSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[70vh]">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Product Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Tên Sản Phẩm *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={productForm.name}
                    onChange={handleProductFormChange}
                    placeholder="Áo thun Classic Cotton"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Danh Mục Sản Phẩm</label>
                  <select
                    name="category_id"
                    value={productForm.category_id}
                    onChange={handleProductFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 transition cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Giá Bán Gốc (đ) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    min={0}
                    value={productForm.price}
                    onChange={handleProductFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                {/* Discount Price */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Giá Khuyến Mãi (đ) (Bỏ trống nếu không giảm)</label>
                  <input
                    type="number"
                    name="discount_price"
                    min={0}
                    value={productForm.discount_price}
                    onChange={handleProductFormChange}
                    placeholder="Không giảm giá"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                {/* Stock */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Số Lượng Trong Kho *</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    min={0}
                    value={productForm.stock}
                    onChange={handleProductFormChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>

                {/* Image URL and File Upload */}
                <div className="col-span-1 md:col-span-2 space-y-1.5 border-t border-slate-800 pt-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Hình Ảnh Chính Sản Phẩm (Bắt buộc) *</label>
                  <div className="flex gap-4 items-start">
                    {/* Preview Thumbnail */}
                    {productForm.image && (
                      <div className="w-16 h-16 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center">
                        <img src={productForm.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2">
                      <input
                        type="url"
                        name="image"
                        required
                        value={productForm.image}
                        onChange={handleProductFormChange}
                        placeholder="https://example.com/image.jpg"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition"
                      />
                      
                      <div className="flex items-center gap-2">
                        <label className="bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer transition flex items-center gap-1.5">
                          {isUploadingImage ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Đang tải lên...
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Tải ảnh từ máy tính
                            </>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProductImageUpload}
                            disabled={isUploadingImage}
                            className="hidden"
                          />
                        </label>
                        <span className="text-[10px] text-slate-550">Hỗ trợ PNG, JPG, WebP (Tải lên Cloudinary)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multiple Images Upload (Additional Gallery) */}
                <div className="col-span-1 md:col-span-2 space-y-1.5 border-t border-slate-800 pt-4">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Tải nhiều ảnh phụ (Bộ sưu tập sản phẩm)</label>
                  
                  {/* Thumbnail gallery preview with remove button */}
                  {productForm.images && productForm.images.length > 0 && (
                    <div className="flex flex-wrap gap-3 mb-3">
                      {productForm.images.map((imgUrl, idx) => (
                        <div key={idx} className="relative w-16 h-16 rounded-xl border border-slate-850 bg-slate-950 overflow-hidden group">
                          <img src={imgUrl} alt={`gallery-${idx}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImageThumbnail(idx)}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-150 text-rose-500 rounded-xl"
                            title="Xóa ảnh này"
                          >
                            <X className="w-5.5 h-5.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="bg-slate-850 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold cursor-pointer transition flex items-center gap-1.5">
                      {isUploadingImage ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Đang tải lên...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          Tải nhiều ảnh chi tiết
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleProductMultipleImagesUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[10px] text-slate-550">Chọn 1 hoặc nhiều ảnh phụ cùng lúc để tải lên</span>
                  </div>
                </div>

                {/* Description */}
                <div className="col-span-1 md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Mô Tả Sản Phẩm</label>
                  <textarea
                    name="description"
                    rows={3}
                    value={productForm.description}
                    onChange={handleProductFormChange}
                    placeholder="Mô tả chi tiết về sản phẩm..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 transition resize-none"
                  />
                </div>

                {/* Custom 3D design support */}
                <div className="col-span-1 md:col-span-2 flex items-center justify-between p-3 bg-slate-950/40 border border-slate-800 rounded-xl">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Cho phép thiết kế 3D tùy chỉnh
                    </h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Khách hàng có thể thay đổi thiết kế trên Canvas 3D</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={productForm.is_customizable === 1}
                      onChange={(e) => setProductForm(prev => ({ ...prev, is_customizable: e.target.checked ? 1 : 0 }))}
                      className="sr-only peer" 
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {/* Sizes selection */}
                <div className="col-span-1 md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Kích Cỡ Có Sẵn</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {sizePresets.map((size) => {
                      const active = productForm.sizes.includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => handleSizeToggle(size)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            active 
                              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400" 
                              : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Colors selection */}
                <div className="col-span-1 md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Màu Sắc Có Sẵn</label>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {colorPresets.map((color) => {
                      const active = productForm.colors.includes(color);
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorToggle(color)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            active 
                              ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" 
                              : "bg-slate-950 border-slate-850 text-slate-500 hover:text-slate-350"
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-850 flex justify-end gap-3 bg-slate-950/20">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-300 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading}
                  className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-450 hover:to-indigo-550 text-white px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg disabled:opacity-50 cursor-pointer"
                >
                  {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {editingProduct ? "Lưu thay đổi" : "Tạo sản phẩm"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. ORDER DETAIL & STATUS UPDATE MODAL */}
      {isOrderDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 animate-fade-up">
            
            {/* Top decorative gradient bar */}
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-cyan-500" />

            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-850 bg-slate-950/40">
              <div>
                <h3 className="text-md font-extrabold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-400" />
                  Đơn Hàng #{selectedOrder.id}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">Đặt ngày {formatDate(selectedOrder.created_at)}</p>
              </div>
              <button 
                onClick={() => setIsOrderDetailModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[70vh]">
              
              {/* Order Status & Update Action */}
              <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Trạng thái hiện tại</label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadgeClass(selectedOrder.status_name)}`}>
                      {selectedOrder.status_name}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cập nhật trạng thái mới</label>
                  <div className="flex gap-2">
                    <select
                      value={newOrderStatus}
                      onChange={(e) => setNewOrderStatus(e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 flex-1 cursor-pointer"
                    >
                      {["PENDING", "PROCESSING", "SHIPPING", "COMPLETED", "CANCELLED"].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleUpdateOrderStatus}
                      disabled={isActionLoading}
                      className="bg-indigo-600 hover:bg-indigo-550 disabled:opacity-50 text-white font-bold px-4 py-1.5 rounded-xl text-xs transition duration-150 cursor-pointer flex items-center gap-1.5"
                    >
                      {isActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Lưu
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Items List */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Sản phẩm trong đơn</h4>
                <div className="divide-y divide-slate-850 border border-slate-850 rounded-xl overflow-hidden bg-slate-950/20">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="p-4 flex gap-4 justify-between items-center hover:bg-slate-800/10 transition">
                      <div className="flex gap-3.5 items-center min-w-0">
                        {/* Item Thumbnail with hover-flip animation for front/back designs */}
                        {(() => {
                          const designImages = item.custom_design_image ? item.custom_design_image.split('|') : [];
                          const frontImage = designImages[0] || item.product_image || "https://res.cloudinary.com/demo/image/upload/sample.jpg";
                          const backImage = designImages[1];
                          return (
                            <div className="relative w-12 h-12 shrink-0 group overflow-hidden bg-slate-900 border border-slate-800 rounded-lg p-1 cursor-help" title={backImage ? "Rê chuột để xem mặt sau" : ""}>
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
                          <h5 className="text-xs font-bold text-white truncate">{item.product_name}</h5>
                          <p className="text-[10px] text-slate-550 mt-1 leading-relaxed">
                            Mã sản phẩm: <span className="font-semibold text-slate-400">#{item.product_id}</span>
                            <span className="mx-2">•</span>
                            Cỡ: <span className="font-semibold text-slate-350 uppercase">{item.size || "Mặc định"}</span>
                            <span className="mx-2">•</span>
                            Màu: <span className="font-semibold text-slate-350">{item.color || "Mặc định"}</span>
                          </p>
                          {item.custom_design_image && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-1.5">
                              <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                              Custom 3D Canvas {item.custom_design_image.includes('|') ? '(2 Mặt)' : '(1 Mặt)'}
                            </span>
                          )}
                          {item.custom_design_pdf && (
                            <a
                              href={item.custom_design_pdf}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-1.5 ml-1.5 hover:bg-emerald-500/20 transition cursor-pointer"
                            >
                              <FileText className="w-2.5 h-2.5" />
                              Print PDF Specs
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-white">{item.price.toLocaleString("vi-VN")} đ</p>
                        <p className="text-[10px] text-slate-550 mt-0.5">SL: x{item.quantity}</p>
                      </div>
                    </div>
                  ))
                  }
                </div>
              </div>

              {/* Shipping Address details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/20 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Thông tin giao hàng</span>
                  <p className="text-xs font-bold text-slate-200 mt-1">SĐT: {selectedOrder.phone || "N/A"}</p>
                  <p className="text-xs text-slate-400 leading-normal">{selectedOrder.shipping_address}</p>
                </div>

                <div className="p-4 bg-slate-950/20 border border-slate-850 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ghi chú từ khách hàng</span>
                  <p className="text-xs text-slate-400 leading-relaxed italic mt-1.5">
                    {selectedOrder.note ? `"${selectedOrder.note}"` : "Không có ghi chú"}
                  </p>
                </div>
              </div>

              {/* Order total cost */}
              <div className="flex justify-between items-center p-4 bg-indigo-550/10 border border-indigo-500/20 rounded-xl">
                <span className="text-xs font-bold text-indigo-300">Tổng Giá Trị Đơn Hàng</span>
                <span className="text-md font-extrabold text-white">{selectedOrder.total_price.toLocaleString("vi-VN")} đ</span>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-850 flex justify-end bg-slate-950/20">
              <button
                onClick={() => setIsOrderDetailModalOpen(false)}
                className="px-5 py-2 bg-slate-850 hover:bg-slate-800 text-xs font-bold text-slate-200 rounded-xl border border-slate-800 transition cursor-pointer"
              >
                Đóng lại
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
