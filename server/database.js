import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'ocean_freight.sqlite');

export const db = new sqlite3.Database(dbPath);

// Helper wrapper for async sqlite queries
export const query = {
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

export async function initDatabase() {
  // Create tables
  await query.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'User',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query.run(`
    CREATE TABLE IF NOT EXISTS carrier_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      carrier TEXT NOT NULL,
      origin_port TEXT NOT NULL,
      destination_port TEXT NOT NULL,
      container_type TEXT NOT NULL,
      rate_usd REAL NOT NULL,
      transit_days INTEGER NOT NULL,
      last_updated_by TEXT DEFAULT 'system_seed',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query.run(`
    CREATE TABLE IF NOT EXISTS shipments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shipment_id TEXT UNIQUE NOT NULL,
      carrier TEXT NOT NULL,
      origin_port TEXT NOT NULL,
      destination_port TEXT NOT NULL,
      container_type TEXT NOT NULL,
      departure_date TEXT NOT NULL,
      expected_arrival TEXT NOT NULL,
      delivered_date TEXT,
      invoice_amount_usd REAL,
      status TEXT NOT NULL,
      status_reason TEXT,
      notes TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query.run(`
    CREATE TABLE IF NOT EXISTS email_inbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email_index INTEGER,
      sender TEXT,
      subject TEXT,
      date TEXT,
      body TEXT,
      parsed_type TEXT, -- 'RATE_UPDATE', 'SHIPMENT_STATUS', 'IRRELEVANT', 'MALFORMED'
      parsed_data TEXT, -- JSON
      status TEXT DEFAULT 'pending', -- 'pending', 'applied', 'skipped', 'failed'
      reason TEXT,
      applied_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      entity TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      source TEXT DEFAULT 'Manual',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      user TEXT DEFAULT 'System'
    )
  `);

  // Seed default users if none exist
  const existingAdmin = await query.get("SELECT id FROM users WHERE email = 'admin@oceanfreight.com'");
  if (!existingAdmin) {
    const adminHash = bcrypt.hashSync('admin123', 10);
    await query.run(
      "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
      ['admin', 'admin@oceanfreight.com', adminHash, 'Admin']
    );
  }

  const existingUser = await query.get("SELECT id FROM users WHERE email = 'user@oceanfreight.com'");
  if (!existingUser) {
    const userHash = bcrypt.hashSync('user123', 10);
    await query.run(
      "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
      ['user', 'user@oceanfreight.com', userHash, 'User']
    );
  }

  console.log('✅ SQLite Database Initialized Successfully.');
}
