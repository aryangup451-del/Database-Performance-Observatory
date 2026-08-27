require('dotenv').config();
const mysql = require('mysql2/promise'); // Also using for MariaDB
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const sql = require('mssql');
const { faker } = require('@faker-js/faker');
const { promisify } = require('util');

const NUM_PRODUCTS = 5000;
const categories = ['Electronics', 'Books', 'Clothing', 'Home', 'Toys', 'Sports'];

async function seedData() {
    console.log('Connecting to databases...');
    
    // SQLite Init
    const sqliteDb = new sqlite3.Database('../backend/sqlite.db');
    const sqliteRun = promisify(sqliteDb.run.bind(sqliteDb));
    
    // Create SQLite tables
    await sqliteRun(`CREATE TABLE IF NOT EXISTS products (
        product_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        price REAL NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    await sqliteRun(`DELETE FROM products`); // Clear if exists

    // MSSQL Init
    const mssqlConfig = {
        user: 'sa', password: 'SuperStrongP@ssw0rd!',
        server: '127.0.0.1', port: 1433, database: 'master',
        options: { encrypt: false, trustServerCertificate: true }
    };
    let mssqlPool;

    try {
        mssqlPool = await new sql.ConnectionPool(mssqlConfig).connect();
        // Create MSSQL table
        await mssqlPool.request().query(`
            IF OBJECT_ID('products', 'U') IS NOT NULL DROP TABLE products;
            CREATE TABLE products (
                product_id INT IDENTITY(1,1) PRIMARY KEY,
                name NVARCHAR(255) NOT NULL,
                category NVARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                stock_quantity INT DEFAULT 0,
                created_at DATETIME DEFAULT GETDATE()
            );
        `);
    } catch (e) {
        console.error('MSSQL Init error (skipping):', e.message);
    }

    // MariaDB Init
    let mariadbConn;
    try {
        mariadbConn = await mysql.createConnection({
            host: '127.0.0.1', port: 3308, user: 'root', password: 'root_password'
        });
        await mariadbConn.query('CREATE DATABASE IF NOT EXISTS dpo;');
        await mariadbConn.query('USE dpo;');
        await mariadbConn.query(`
            CREATE TABLE IF NOT EXISTS products (
                product_id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                category VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                stock_quantity INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        await mariadbConn.query(`TRUNCATE TABLE products;`);
    } catch (e) {
        console.error('MariaDB Init error (skipping):', e.message);
    }

    console.log('Generating Products...');
    const products = [];
    for (let i = 0; i < NUM_PRODUCTS; i++) {
        products.push([
            faker.commerce.productName() + ' ' + i,
            faker.helpers.arrayElement(categories),
            parseFloat(faker.commerce.price()),
            faker.number.int({ min: 0, max: 1000 })
        ]);
    }
    
    // SQLite Seed
    console.log(`Inserting ${NUM_PRODUCTS} products into SQLite...`);
    const sqliteStmt = sqliteDb.prepare('INSERT INTO products (name, category, price, stock_quantity) VALUES (?, ?, ?, ?)');
    for (const p of products) {
        sqliteStmt.run(p);
    }
    sqliteStmt.finalize();

    // MSSQL Seed
    if (mssqlPool) {
        console.log(`Inserting ${NUM_PRODUCTS} products into MSSQL...`);
        for (const p of products) {
            await mssqlPool.request()
                .input('name', sql.NVarChar, p[0])
                .input('category', sql.NVarChar, p[1])
                .input('price', sql.Decimal(10,2), p[2])
                .input('stock_quantity', sql.Int, p[3])
                .query(`INSERT INTO products (name, category, price, stock_quantity) VALUES (@name, @category, @price, @stock_quantity)`);
        }
    }

    // MariaDB Seed
    if (mariadbConn) {
        console.log(`Inserting ${NUM_PRODUCTS} products into MariaDB...`);
        const mariaProductQuery = 'INSERT INTO products (name, category, price, stock_quantity) VALUES ?';
        for (let i = 0; i < products.length; i += 1000) {
            const batch = products.slice(i, i + 1000);
            await mariadbConn.query(mariaProductQuery, [batch]);
        }
    }

    console.log('Seeding completed successfully!');
    if (mariadbConn) await mariadbConn.end();
    if (mssqlPool) await mssqlPool.close();
    sqliteDb.close();
}

seedData();
