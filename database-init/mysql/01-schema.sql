-- MySQL Schema for DPO

CREATE TABLE customers (
    customer_id     INT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    city            VARCHAR(50),
    signup_date     DATE NOT NULL,
    is_premium      BOOLEAN DEFAULT FALSE
);

CREATE TABLE products (
    product_id      INT PRIMARY KEY AUTO_INCREMENT,
    name            VARCHAR(200) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    stock_quantity  INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    order_id        INT PRIMARY KEY AUTO_INCREMENT,
    customer_id     INT NOT NULL,
    order_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('pending','confirmed','shipped','delivered','cancelled'),
    total_amount    DECIMAL(12,2),
    shipping_city   VARCHAR(50),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE order_items (
    item_id         INT PRIMARY KEY AUTO_INCREMENT,
    order_id        INT NOT NULL,
    product_id      INT NOT NULL,
    quantity        INT NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE reviews (
    review_id       INT PRIMARY KEY AUTO_INCREMENT,
    product_id      INT NOT NULL,
    customer_id     INT NOT NULL,
    rating          TINYINT CHECK (rating BETWEEN 1 AND 5),
    review_text     TEXT,
    review_date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Create read-only user for Query Executor
CREATE USER 'dpo_readonly'@'%' IDENTIFIED BY 'readonly_password';
GRANT SELECT ON dpo.* TO 'dpo_readonly'@'%';
FLUSH PRIVILEGES;
