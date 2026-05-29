CREATE DATABASE tshirt_shop;
GO

USE tshirt_shop;
GO

-- =====================================================
-- TABLE: roles
-- =====================================================
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) NOT NULL
);
GO

-- =====================================================
-- TABLE: users
-- =====================================================
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,

    username NVARCHAR(100) NOT NULL,

    email NVARCHAR(100) UNIQUE NOT NULL,

    password NVARCHAR(255) NOT NULL,

    avatar NVARCHAR(1000),

    phone NVARCHAR(20),

    address NVARCHAR(255),

    role_id INT,

    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_users_roles
    FOREIGN KEY (role_id)
    REFERENCES roles(id)
);
GO

-- =====================================================
-- TABLE: categories
-- =====================================================
CREATE TABLE categories (
    id INT IDENTITY(1,1) PRIMARY KEY,

    name NVARCHAR(100) NOT NULL,

    description NVARCHAR(MAX)
);
GO

-- =====================================================
-- TABLE: products
-- =====================================================
CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,

    name NVARCHAR(255) NOT NULL,

    description NVARCHAR(MAX),

    price DECIMAL(10,2) NOT NULL,

    stock INT DEFAULT 0,

    image NVARCHAR(1000),
    -- URL ảnh Cloudinary

    category_id INT,

    is_customizable BIT DEFAULT 0,

    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_products_categories
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
);
GO

-- =====================================================
-- TABLE: product_sizes
-- =====================================================
CREATE TABLE product_sizes (
    id INT IDENTITY(1,1) PRIMARY KEY,

    product_id INT,

    size_name NVARCHAR(20),

    CONSTRAINT FK_product_sizes_products
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);
GO

-- =====================================================
-- TABLE: product_colors
-- =====================================================
CREATE TABLE product_colors (
    id INT IDENTITY(1,1) PRIMARY KEY,

    product_id INT,

    color_name NVARCHAR(50),

    CONSTRAINT FK_product_colors_products
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);
GO

-- =====================================================
-- TABLE: carts
-- =====================================================
CREATE TABLE carts (
    id INT IDENTITY(1,1) PRIMARY KEY,

    user_id INT,

    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_carts_users
    FOREIGN KEY (user_id)
    REFERENCES users(id)
);
GO

-- =====================================================
-- TABLE: cart_items
-- =====================================================
CREATE TABLE cart_items (
    id INT IDENTITY(1,1) PRIMARY KEY,

    cart_id INT,

    product_id INT,

    quantity INT DEFAULT 1,

    size NVARCHAR(20),

    color NVARCHAR(50),

    CONSTRAINT FK_cart_items_carts
    FOREIGN KEY (cart_id)
    REFERENCES carts(id)
    ON DELETE CASCADE,

    CONSTRAINT FK_cart_items_products
    FOREIGN KEY (product_id)
    REFERENCES products(id)
);
GO

-- =====================================================
-- TABLE: order_status
-- =====================================================
CREATE TABLE order_status (
    id INT IDENTITY(1,1) PRIMARY KEY,

    name NVARCHAR(50) NOT NULL
);
GO

-- =====================================================
-- TABLE: orders
-- =====================================================
CREATE TABLE orders (
    id INT IDENTITY(1,1) PRIMARY KEY,

    user_id INT NOT NULL,

    total_price DECIMAL(10,2),

    status_id INT,

    shipping_address NVARCHAR(255),

    phone NVARCHAR(20),

    note NVARCHAR(MAX),

    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_orders_users
    FOREIGN KEY (user_id)
    REFERENCES users(id),

    CONSTRAINT FK_orders_status
    FOREIGN KEY (status_id)
    REFERENCES order_status(id)
);
GO

-- =====================================================
-- TABLE: order_items
-- =====================================================
CREATE TABLE order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,

    order_id INT,

    product_id INT,

    quantity INT,

    price DECIMAL(10,2),

    size NVARCHAR(20),

    color NVARCHAR(50),

    custom_design_image NVARCHAR(1000),

    CONSTRAINT FK_order_items_orders
    FOREIGN KEY (order_id)
    REFERENCES orders(id)
    ON DELETE CASCADE,

    CONSTRAINT FK_order_items_products
    FOREIGN KEY (product_id)
    REFERENCES products(id)
);
GO

-- =====================================================
-- TABLE: reviews
-- =====================================================
CREATE TABLE reviews (
    id INT IDENTITY(1,1) PRIMARY KEY,

    user_id INT,

    product_id INT,

    rating INT CHECK (rating BETWEEN 1 AND 5),

    comment NVARCHAR(MAX),

    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT FK_reviews_users
    FOREIGN KEY (user_id)
    REFERENCES users(id),

    CONSTRAINT FK_reviews_products
    FOREIGN KEY (product_id)
    REFERENCES products(id)
    ON DELETE CASCADE
);
GO

-- =====================================================
-- INSERT ROLES
-- =====================================================
INSERT INTO roles(name)
VALUES
('USER'),
('ADMIN');
GO

-- =====================================================
-- INSERT ORDER STATUS
-- =====================================================
INSERT INTO order_status(name)
VALUES
('PENDING'),
('PROCESSING'),
('SHIPPING'),
('COMPLETED'),
('CANCELLED');
GO

-- =====================================================
-- INSERT CATEGORIES
-- =====================================================
INSERT INTO categories(name, description)
VALUES
('Oversize', 'Oversize T-Shirt'),
('Basic', 'Basic Cotton T-Shirt'),
('Polo', 'Polo T-Shirt'),
('Custom', 'Custom Design T-Shirt');
GO

-- =====================================================
-- TEST ADMIN ACCOUNT
-- =====================================================
INSERT INTO users
(
    username,
    email,
    password,
    role_id
)
VALUES
(
    'admin',
    'admin@gmail.com',
    '123456',
    2
);
GO

-- =====================================================
-- SAMPLE PRODUCTS
-- =====================================================
INSERT INTO products
(
    name,
    description,
    price,
    stock,
    image,
    category_id,
    is_customizable
)
VALUES
(
    'Black Oversize T-Shirt',
    'Premium cotton oversize t-shirt',
    19.99,
    100,
    'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    1,
    1
),
(
    'White Basic T-Shirt',
    'Simple white basic shirt',
    14.99,
    50,
    'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    2,
    0
);
GO

-- =====================================================
-- PRODUCT SIZES
-- =====================================================
INSERT INTO product_sizes(product_id, size_name)
VALUES
(1, 'S'),
(1, 'M'),
(1, 'L'),
(1, 'XL'),
(2, 'M'),
(2, 'L');
GO

-- =====================================================
-- PRODUCT COLORS
-- =====================================================
INSERT INTO product_colors(product_id, color_name)
VALUES
(1, 'Black'),
(1, 'White'),
(2, 'White');
GO