"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount_price?: number | null;
  stock: number;
  image: string;
  images?: string[];
  category_id: number;
  category_name?: string;
  is_customizable: number;
  sizes: string[];
  colors: string[];
  reviews?: Review[];
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  username: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface CartItem {
  id: number | string; // number from backend, string for local storage
  product_id: number;
  quantity: number;
  size: string | null;
  color: string | null;
  name: string;
  price: number;
  image: string;
  is_customizable?: number;
}

export interface Cart {
  items: CartItem[];
  total_price: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string;
  address?: string;
  role_id: number;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  size: string | null;
  color: string | null;
  custom_design_image: string | null;
  custom_design_pdf: string | null;
  product_name: string;
  product_image: string;
}

export interface Order {
  id: number;
  user_id: number;
  total_price: number;
  status_id: number;
  status_name: string;
  shipping_address: string;
  phone: string;
  note: string | null;
  created_at: string;
  items: OrderItem[];
  coupon_code?: string | null;
  discount_amount?: number;
}

export interface Coupon {
  id: number;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_value: number;
  max_discount: number | null;
  start_date?: string;
  end_date: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: number;
}

interface AppContextType {
  user: User | null;
  token: string | null;
  cart: Cart;
  products: Product[];
  categories: Category[];
  orders: Order[];
  isLoading: boolean;
  isCartOpen: boolean;
  isAuthOpen: boolean;
  isProfileOpen: boolean;
  activeProductDetail: Product | null;
  setIsCartOpen: (open: boolean) => void;
  setIsAuthOpen: (open: boolean) => void;
  setIsProfileOpen: (open: boolean) => void;
  setActiveProductDetail: (product: Product | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, email: string, password: string, phone: string, address: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  addToCart: (productId: number, quantity: number, size: string | null, color: string | null) => Promise<void>;
  updateCartItem: (itemId: number | string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: number | string) => Promise<void>;
  checkout: (shipping_address: string, phone: string, note: string, coupon_code?: string) => Promise<{ success: boolean; message?: string; order?: Order }>;
  checkoutDirect: (shipping_address: string, phone: string, note: string, items: { product_id: number; quantity: number; size: string | null; color: string | null; custom_design_image: string | null }[], coupon_code?: string) => Promise<{ success: boolean; message?: string; order?: Order }>;
  fetchProducts: () => Promise<void>;
  fetchProductById: (id: number) => Promise<Product | null>;
  fetchOrders: () => Promise<void>;
  submitReview: (productId: number, rating: number, comment: string) => Promise<{ success: boolean; message?: string }>;
  addProduct: (productData: Omit<Product, "id" | "category_name"> & { category_id: number }) => Promise<{ success: boolean; message?: string; product?: Product }>;
  updateProduct: (id: number, productData: Partial<Product>) => Promise<{ success: boolean; message?: string; product?: Product }>;
  deleteProduct: (id: number) => Promise<{ success: boolean; message?: string }>;
  updateOrderStatus: (id: number, statusName: string) => Promise<{ success: boolean; message?: string }>;
  fetchCouponsAdmin: () => Promise<Coupon[]>;
  createCoupon: (couponData: Omit<Coupon, "id" | "used_count" | "is_active">) => Promise<{ success: boolean; message?: string; coupon?: Coupon }>;
  deleteCoupon: (id: number) => Promise<{ success: boolean; message?: string }>;
  validateCoupon: (code: string, totalPrice: number) => Promise<{ success: boolean; message?: string; coupon?: { code: string; discount_type: string; discount_value: number; discount_amount: number } }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart>({ items: [], total_price: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal toggle states
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [activeProductDetail, setActiveProductDetail] = useState<Product | null>(null);

  // Initialize: Load token and products
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const storedToken = localStorage.getItem("token");

      // Product data is independent from authentication. Load it in the
      // background so pages such as Daily do not wait for the entire catalog.
      void Promise.all([fetchProductsInternal(), fetchCategoriesInternal()]);

      if (storedToken) {
        // Publish the token immediately. Authenticated feature pages can start
        // their own request while the profile is being verified in parallel.
        setToken(storedToken);
        const meSuccess = await fetchMe(storedToken);
        if (meSuccess) {
          void Promise.all([
            fetchCartInternal(storedToken),
            fetchOrdersInternal(storedToken),
          ]);
        } else {
          // Token expired or invalid
          localStorage.removeItem("token");
          setToken(null);
          loadLocalCart();
        }
      } else {
        loadLocalCart();
      }
      setIsLoading(false);

      // Track session visitor
      if (typeof window !== "undefined" && !sessionStorage.getItem("visited")) {
        try {
          const res = await fetch(`${API_URL}/api/visitors/increment`, { method: "POST" });
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              sessionStorage.setItem("visited", "true");
            }
          }
        } catch (e) {
          console.error("Increment visitor error:", e);
        }
      }
    }
    void init();
  }, []);

  // Fetch me profile
  async function fetchMe(authToken: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Fetch me error:", e);
      return false;
    }
  }

  // Load local cart from localStorage (if not logged in)
  function loadLocalCart() {
    try {
      const storedCart = localStorage.getItem("local_cart");
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        setCart(parsed);
      } else {
        setCart({ items: [], total_price: 0 });
      }
    } catch (e) {
      console.error("Load local cart error:", e);
      setCart({ items: [], total_price: 0 });
    }
  }

  // Save local cart to localStorage
  function saveLocalCart(newCart: Cart) {
    localStorage.setItem("local_cart", JSON.stringify(newCart));
    setCart(newCart);
  }

  // Internal: Fetch products
  async function fetchProductsInternal() {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
      }
    } catch (e) {
      console.error("Fetch products error:", e);
    }
  }

  // Internal: Fetch categories
  async function fetchCategoriesInternal() {
    try {
      const res = await fetch(`${API_URL}/api/products/categories`);
      const data = await res.json();
      if (data.success && data.categories) {
        setCategories(data.categories);
      }
    } catch (e) {
      console.error("Fetch categories error:", e);
    }
  }

  // Internal: Fetch cart
  async function fetchCartInternal(authToken: string) {
    try {
      const res = await fetch(`${API_URL}/api/cart`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.cart) {
        setCart({
          items: data.cart.items,
          total_price: data.cart.total_price
        });
      } else {
        loadLocalCart();
      }
    } catch (e) {
      console.error("Fetch cart error:", e);
      loadLocalCart();
    }
  }

  // Helper to sync localStorage guest cart to database upon login/register
  async function syncLocalCartToDatabase(authToken: string) {
    try {
      const storedCart = localStorage.getItem("local_cart");
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        if (parsed && Array.isArray(parsed.items) && parsed.items.length > 0) {
          for (const item of parsed.items) {
            await fetch(`${API_URL}/api/cart/items`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
              },
              body: JSON.stringify({
                product_id: item.product_id,
                quantity: item.quantity,
                size: item.size,
                color: item.color
              }),
            });
          }
          localStorage.removeItem("local_cart");
        }
      }
    } catch (e) {
      console.error("Sync local cart to database error:", e);
    }
  }

  // Internal: Fetch orders
  async function fetchOrdersInternal(authToken: string) {
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await res.json();
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (e) {
      console.error("Fetch orders error:", e);
    }
  }

  // Public: Refresh products
  async function fetchProducts() {
    await fetchProductsInternal();
  }

  // Public: Fetch product details including reviews
  async function fetchProductById(id: number): Promise<Product | null> {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`);
      const data = await res.json();
      if (data.success && data.product) {
        return data.product;
      }
    } catch (e) {
      console.error(`Fetch product #${id} error:`, e);
    }
    return null;
  }

  // Public: Fetch user orders
  async function fetchOrders() {
    if (token) {
      await fetchOrdersInternal(token);
    }
  }

  // Public: Login
  async function login(email: string, password: string) {
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);

        // Sync cart
        await syncLocalCartToDatabase(data.token);
        await fetchCartInternal(data.token);
        fetchOrdersInternal(data.token);
        return { success: true };
      }
      return { success: false, message: data.message || "Login failed" };
    } catch (e) {
      console.error("Login error:", e);
      return { success: false, message: "Server connection failed" };
    }
  }

  // Public: Register
  async function register(username: string, email: string, password: string, phone: string, address: string) {
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, phone, address }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        setToken(data.token);
        setUser(data.user);

        // Sync cart
        await syncLocalCartToDatabase(data.token);
        await fetchCartInternal(data.token);
        setOrders([]);
        return { success: true };
      }
      return { success: false, message: data.message || "Registration failed" };
    } catch (e) {
      console.error("Register error:", e);
      return { success: false, message: "Server connection failed" };
    }
  }

  // Public: Logout
  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setCart({ items: [], total_price: 0 });
    setOrders([]);
    loadLocalCart();
  }

  // Public: Add Item to Cart
  async function addToCart(productId: number, quantity: number, size: string | null, color: string | null) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    if (token) {
      try {
        const res = await fetch(`${API_URL}/api/cart/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ product_id: productId, quantity, size, color }),
        });
        const data = await res.json();
        if (data.success && data.cart) {
          setCart({
            items: data.cart.items,
            total_price: data.cart.total_price
          });
          return;
        }
      } catch (e) {
        console.error("Add to cart database error, falling back to local:", e);
      }
    }

    // Local Storage Cart fallback (guest cart or network error fallback)
    const currentItems = [...cart.items];
    const existingIdx = currentItems.findIndex(
      (item) =>
        item.product_id === productId &&
        item.size === size &&
        item.color === color
    );

    if (existingIdx > -1) {
      currentItems[existingIdx].quantity += quantity;
    } else {
      const activePrice = (product.discount_price !== null && product.discount_price !== undefined && product.discount_price < product.price)
        ? product.discount_price
        : product.price;

      currentItems.push({
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        product_id: productId,
        quantity,
        size,
        color,
        name: product.name,
        price: activePrice,
        image: product.image,
        is_customizable: product.is_customizable,
      });
    }

    const total = currentItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    saveLocalCart({
      items: currentItems,
      total_price: parseFloat(total.toFixed(2)),
    });
  }

  // Public: Update Quantity
  async function updateCartItem(itemId: number | string, quantity: number) {
    if (token && (typeof itemId === "number" || (typeof itemId === "string" && !itemId.startsWith("local-")))) {
      try {
        const res = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ quantity }),
        });
        const data = await res.json();
        if (data.success && data.cart) {
          setCart({
            items: data.cart.items,
            total_price: data.cart.total_price
          });
          return;
        }
      } catch (e) {
        console.error("Update cart item database error, falling back to local:", e);
      }
    }

    // Local Storage Cart fallback
    let currentItems = [...cart.items];
    const idx = currentItems.findIndex((item) => item.id === itemId);
    if (idx > -1) {
      if (quantity <= 0) {
        currentItems.splice(idx, 1);
      } else {
        currentItems[idx].quantity = quantity;
      }
    }
    const total = currentItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    saveLocalCart({
      items: currentItems,
      total_price: parseFloat(total.toFixed(2)),
    });
  }

  // Public: Remove Item
  async function removeCartItem(itemId: number | string) {
    if (token && (typeof itemId === "number" || (typeof itemId === "string" && !itemId.startsWith("local-")))) {
      try {
        const res = await fetch(`${API_URL}/api/cart/items/${itemId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success) {
          await fetchCartInternal(token);
          return;
        }
      } catch (e) {
        console.error("Remove cart item database error, falling back to local:", e);
      }
    }

    // Local Storage Cart fallback
    const currentItems = cart.items.filter((item) => item.id !== itemId);
    const total = currentItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    saveLocalCart({
      items: currentItems,
      total_price: parseFloat(total.toFixed(2)),
    });
  }

  // Public: Checkout Cart
  async function checkout(shipping_address: string, phone: string, note: string, coupon_code?: string) {
    if (!token) return { success: false, message: "Please log in to checkout" };

    try {
      const formattedItems = cart.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        custom_design_image: null
      }));

      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shipping_address,
          phone,
          note,
          coupon_code,
          items: formattedItems
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCart({ items: [], total_price: 0 });
        localStorage.removeItem("local_cart");

        // Clear database cart if logged in
        if (token) {
          try {
            await fetch(`${API_URL}/api/cart`, {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (e) {
            console.error("Clear database cart error after checkout:", e);
          }
        }

        await fetchOrdersInternal(token);
        fetchProductsInternal(); // Refresh stock counts
        return { success: true, order: data.order };
      }
      return { success: false, message: data.message || "Checkout failed" };
    } catch (e) {
      console.error("Checkout error:", e);
      return { success: false, message: "Server error during checkout" };
    }
  }

  // Public: Direct purchase checkout (e.g. for customizable canvas design)
  async function checkoutDirect(
    shipping_address: string,
    phone: string,
    note: string,
    items: { product_id: number; quantity: number; size: string | null; color: string | null; custom_design_image: string | null }[],
    coupon_code?: string
  ) {
    if (!token) return { success: false, message: "Please log in to purchase" };

    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shipping_address, phone, note, items, coupon_code }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchOrdersInternal(token);
        fetchProductsInternal(); // Refresh stock counts
        return { success: true, order: data.order };
      }
      return { success: false, message: data.message || "Purchase failed" };
    } catch (e) {
      console.error("Direct checkout error:", e);
      return { success: false, message: "Server error during purchase" };
    }
  }

  // Public: Validate Coupon
  async function validateCoupon(code: string, totalPrice: number): Promise<{ success: boolean; message?: string; coupon?: { code: string; discount_type: string; discount_value: number; discount_amount: number } }> {
    if (!token) return { success: false, message: "Vui lòng đăng nhập để áp dụng mã giảm giá" };

    try {
      const res = await fetch(`${API_URL}/api/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code, total_price: totalPrice }),
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        return { success: true, coupon: data.coupon, message: data.message };
      }
      return { success: false, message: data.message || "Mã giảm giá không hợp lệ" };
    } catch (e) {
      console.error("Validate coupon error:", e);
      return { success: false, message: "Lỗi kết nối máy chủ khi kiểm tra mã giảm giá" };
    }
  }

  // Admin: Get all coupons
  async function fetchCouponsAdmin(): Promise<Coupon[]> {
    if (!token) return [];
    try {
      const res = await fetch(`${API_URL}/api/coupons/admin`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.coupons) {
        return data.coupons;
      }
      return [];
    } catch (e) {
      console.error("Fetch coupons admin error:", e);
      return [];
    }
  }

  // Admin: Create Coupon
  async function createCoupon(couponData: Omit<Coupon, "id" | "used_count" | "is_active">): Promise<{ success: boolean; message?: string; coupon?: Coupon }> {
    if (!token) return { success: false, message: "Unauthorized" };
    try {
      const res = await fetch(`${API_URL}/api/coupons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(couponData),
      });
      const data = await res.json();
      if (data.success && data.coupon) {
        return { success: true, coupon: data.coupon };
      }
      return { success: false, message: data.message || "Failed to create coupon" };
    } catch (e) {
      console.error("Create coupon error:", e);
      return { success: false, message: "Server error creating coupon" };
    }
  }

  // Admin: Delete Coupon
  async function deleteCoupon(id: number): Promise<{ success: boolean; message?: string }> {
    if (!token) return { success: false, message: "Unauthorized" };
    try {
      const res = await fetch(`${API_URL}/api/coupons/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        return { success: true };
      }
      return { success: false, message: data.message || "Failed to delete coupon" };
    } catch (e) {
      console.error("Delete coupon error:", e);
      return { success: false, message: "Server error deleting coupon" };
    }
  }

  // Public: Submit Review
  async function submitReview(productId: number, rating: number, comment: string) {
    if (!token) return { success: false, message: "Please log in to write a review" };

    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ product_id: productId, rating, comment }),
      });
      const data = await res.json();
      if (data.success) {
        // Refresh products list to update reviews
        await fetchProductsInternal();
        return { success: true };
      }
      return { success: false, message: data.message || "Failed to submit review" };
    } catch (e) {
      console.error("Submit review error:", e);
      return { success: false, message: "Server connection failed" };
    }
  }

  // Admin CRUD: Add Product
  async function addProduct(productData: Omit<Product, "id" | "category_name"> & { category_id: number }): Promise<{ success: boolean; message?: string; product?: Product }> {
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts(prev => [data.product, ...prev]);
        return { success: true, product: data.product };
      }
      return { success: false, message: data.message || "Thêm sản phẩm thất bại" };
    } catch (e) {
      console.error("Add product error:", e);
      return { success: false, message: "Lỗi kết nối máy chủ hoặc lỗi cơ sở dữ liệu" };
    }
  }

  // Admin CRUD: Update Product
  async function updateProduct(id: number, productData: Partial<Product>): Promise<{ success: boolean; message?: string; product?: Product }> {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts(prev => prev.map(p => p.id === id ? data.product : p));
        return { success: true, product: data.product };
      }
      return { success: false, message: data.message || "Cập nhật sản phẩm thất bại" };
    } catch (e) {
      console.error("Update product error:", e);
      return { success: false, message: "Lỗi kết nối máy chủ hoặc lỗi cơ sở dữ liệu" };
    }
  }

  // Admin CRUD: Delete Product
  async function deleteProduct(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch(`${API_URL}/api/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.filter(p => p.id !== id));
        return { success: true };
      }
      return { success: false, message: data.message || "Xóa sản phẩm thất bại" };
    } catch (e) {
      console.error("Delete product error:", e);
      return { success: false, message: "Lỗi kết nối máy chủ hoặc lỗi cơ sở dữ liệu" };
    }
  }

  // Admin: Update Order Status
  async function updateOrderStatus(id: number, statusName: string): Promise<{ success: boolean; message?: string }> {
    try {
      const statusId = getStatusIdByName(statusName);
      const res = await fetch(`${API_URL}/api/orders/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status_id: statusId }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status_name: statusName, status_id: statusId } : o));
        return { success: true };
      }
      return { success: false, message: data.message || "Cập nhật trạng thái đơn hàng thất bại" };
    } catch (e) {
      console.error("Update order status error:", e);
      return { success: false, message: "Lỗi kết nối máy chủ hoặc lỗi cơ sở dữ liệu" };
    }
  }

  function getStatusIdByName(name: string): number {
    switch (name.toUpperCase()) {
      case "PENDING": return 1;
      case "PROCESSING": return 2;
      case "SHIPPING": return 3;
      case "COMPLETED": return 4;
      case "CANCELLED": return 5;
      default: return 1;
    }
  }

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        cart,
        products,
        categories,
        orders,
        isLoading,
        isCartOpen,
        isAuthOpen,
        isProfileOpen,
        activeProductDetail,
        setIsCartOpen,
        setIsAuthOpen,
        setIsProfileOpen,
        setActiveProductDetail,
        login,
        register,
        logout,
        addToCart,
        updateCartItem,
        removeCartItem,
        checkout,
        checkoutDirect,
        fetchProducts,
        fetchProductById,
        fetchOrders,
        submitReview,
        addProduct,
        updateProduct,
        deleteProduct,
        updateOrderStatus,
        fetchCouponsAdmin,
        createCoupon,
        deleteCoupon,
        validateCoupon,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
