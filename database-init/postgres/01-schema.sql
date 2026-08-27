-- PostgreSQL Schema for DPO

CREATE TABLE customers (
    customer_id     SERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) UNIQUE NOT NULL,
    city            VARCHAR(50),
    signup_date     DATE NOT NULL,
    is_premium      BOOLEAN DEFAULT FALSE
);

CREATE TABLE products (
    product_id      SERIAL PRIMARY KEY,
    name            VARCHAR(200) NOT NULL,
    category        VARCHAR(50) NOT NULL,
    price           DECIMAL(10,2) NOT NULL,
    stock_quantity  INT DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

CREATE TABLE orders (
    order_id        SERIAL PRIMARY KEY,
    customer_id     INT NOT NULL,
    order_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status          order_status,
    total_amount    DECIMAL(12,2),
    shipping_city   VARCHAR(50),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE order_items (
    item_id         SERIAL PRIMARY KEY,
    order_id        INT NOT NULL,
    product_id      INT NOT NULL,
    quantity        INT NOT NULL,
    unit_price      DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(product_id)
);

CREATE TABLE reviews (
    review_id       SERIAL PRIMARY KEY,
    product_id      INT NOT NULL,
    customer_id     INT NOT NULL,
    rating          SMALLINT CHECK (rating BETWEEN 1 AND 5),
    review_text     TEXT,
    review_date     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

-- Create read-only user for Query Executor
CREATE USER dpo_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE dpo TO dpo_readonly;
GRANT USAGE ON SCHEMA public TO dpo_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO dpo_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO dpo_readonly;
