// In-memory local storage service for development
// Stores data in JSON format, simulating a database

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const STORAGE_FILE = path.join(DATA_DIR, 'local-storage.json');

// Initialize data directory
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load initial data or create empty structure
let storage = {
  Users: [],
  Agents: [],
  Payments: [],
  Subscriptions: [],
  Executions: [],
  Reviews: [],
};

function loadStorage() {
  if (fs.existsSync(STORAGE_FILE)) {
    try {
      storage = JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8'));
    } catch (error) {
      console.warn('Failed to load storage file, using empty storage');
    }
  }
}

let saveTimer = null;

function saveStorage() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));
    } catch (error) {
      console.error('Failed to save storage:', error.message);
    }
  }, 400);
}

function saveStorageSync() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(storage, null, 2));
  } catch (error) {
    console.error('Failed to save storage:', error.message);
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const LocalStore = {
  // Create
  create(model, data) {
    const record = {
      ...data,
      id: data.id || generateUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    if (!storage[model]) storage[model] = [];
    storage[model].push(record);
    saveStorage();
    return { ...record };
  },

  // Read one
  findOne(model, where) {
    if (!storage[model]) return null;
    return storage[model].find(item => {
      return Object.keys(where).every(key => item[key] === where[key]);
    }) || null;
  },

  // Read many
  findAll(model, where = {}, limit = null) {
    if (!storage[model]) return [];
    let results = storage[model];
    
    if (Object.keys(where).length > 0) {
      results = results.filter(item => {
        return Object.keys(where).every(key => item[key] === where[key]);
      });
    }
    
    if (limit) results = results.slice(0, limit);
    return results;
  },

  // Read by ID
  findByPk(model, id) {
    if (!storage[model]) return null;
    return storage[model].find(item => item.id === id) || null;
  },

  // Update
  update(model, data, where) {
    if (!storage[model]) return 0;
    
    let updated = 0;
    storage[model] = storage[model].map(item => {
      const matches = Object.keys(where).every(key => item[key] === where[key]);
      if (matches) {
        updated++;
        return {
          ...item,
          ...data,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });
    
    saveStorage();
    return updated;
  },

  // Delete
  destroy(model, where) {
    if (!storage[model]) return 0;
    
    const beforeLength = storage[model].length;
    storage[model] = storage[model].filter(item => {
      return !Object.keys(where).every(key => item[key] === where[key]);
    });
    
    const deleted = beforeLength - storage[model].length;
    saveStorage();
    return deleted;
  },

  // Clear all
  clear() {
    storage = {
      Users: [],
      Agents: [],
      Payments: [],
      Subscriptions: [],
      Executions: [],
      Reviews: [],
    };
    saveStorage();
  },

  // Get all storage
  getStorage() {
    return { ...storage };
  },

  // Reset storage
  resetStorage() {
    this.clear();
  },
};

// Load storage on startup
loadStorage();

module.exports = LocalStore;
