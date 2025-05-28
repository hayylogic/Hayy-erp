import Dexie, { Table } from 'dexie';
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for all tables
export interface User {
  id?: string;
  name: string;
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  active: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id?: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id?: string;
  name: string;
  price: number;
  stock: number;
  categoryId: string;
  categoryName: string;
  barcode: string;
  lowStockAlert: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Supplier {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Sale {
  id?: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'bank';
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Purchase {
  id?: string;
  supplierId: string;
  supplierName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Settings {
  id?: number;
  companyName: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number;
  currency: string;
  currencySymbol: string;
  createdAt: Date;
  updatedAt: Date;
}

class AppDatabase extends Dexie {
  users!: Table<User, string>;
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  customers!: Table<Customer, string>;
  suppliers!: Table<Supplier, string>;
  sales!: Table<Sale, string>;
  purchases!: Table<Purchase, string>;
  settings!: Table<Settings, number>;

  constructor() {
    super('hayyERPDatabase');
    
    this.version(2).stores({
      users: 'id, username, email, role, active',
      categories: 'id, name, active',
      products: 'id, name, categoryId, barcode, active',
      customers: 'id, name, email, phone',
      suppliers: 'id, name, email, phone',
      sales: 'id, customerId, status, createdAt',
      purchases: 'id, supplierId, status, createdAt',
      settings: '++id'
    });
  }

  async initializeDefaultData() {
    try {
      // Only initialize if database is empty
      const userCount = await this.users.count();
      if (userCount > 0) return;

      // Create default admin user
      await this.users.add({
        id: uuidv4(),
        name: 'Admin',
        username: 'admin',
        password: 'admin123', // In production, use proper password hashing
        email: 'admin@example.com',
        role: 'admin',
        active: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Initialize default settings
      await this.settings.add({
        companyName: 'HAYY ERP',
        address: '123 Business Street',
        phone: '+91 98765 43210',
        email: 'info@hayy-erp.com',
        taxRate: 18, // Default GST rate
        currency: 'INR',
        currencySymbol: '₹',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Add default categories
      const defaultCategories = [
        'Electronics',
        'Clothing',
        'Groceries',
        'Stationery',
        'Home Appliances'
      ];

      for (const categoryName of defaultCategories) {
        await this.categories.add({
          id: uuidv4(),
          name: categoryName,
          description: `${categoryName} category`,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }
}

// Create and export database instance
export const db = new AppDatabase();

// Export async initialization function
export async function initDB() {
  try {
    await db.open();
    await db.initializeDefaultData();
    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    
    // If upgrade error, delete and recreate
    if (error.name === 'UpgradeError') {
      await db.delete();
      await db.open();
      await db.initializeDefaultData();
      return db;
    }
    
    throw error;
  }
}