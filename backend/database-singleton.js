import Database from './database.js';

class DatabaseSingleton {
  constructor() {
    this.instance = null;
    this.initPromise = null;
  }

  async getInstance() {
    if (this.instance) {
      return this.instance;
    }

    // If initialization is in progress, wait for it
    if (this.initPromise) {
      await this.initPromise;
      return this.instance;
    }

    // Start initialization
    this.initPromise = this.init();
    await this.initPromise;
    return this.instance;
  }

  async init() {
    try {
      const db = new Database();
      await db.init();
      this.instance = db.getDb();
      console.log('Database connection initialized');
      return this.instance;
    } catch (error) {
      console.error('Failed to initialize database:', error);
      this.initPromise = null;
      throw error;
    }
  }

  async close() {
    if (this.instance) {
      if (this.instance.close) {
        await this.instance.close();
      }
      this.instance = null;
      this.initPromise = null;
    }
  }
}

// Create a single instance to be shared across the app
const dbSingleton = new DatabaseSingleton();

export default dbSingleton;