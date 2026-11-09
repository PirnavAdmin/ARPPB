import axios from 'axios';

/**
 * Base Axios Client & Mock Async Service Adapter
 * Clearly separates mock local persistence from future production REST API endpoints.
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1/vendor',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function simulateDelay(ms = 180) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function readStorage(key, fallbackData) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      window.localStorage.setItem(key, JSON.stringify(fallbackData));
      return fallbackData;
    }
    return JSON.parse(raw);
  } catch {
    return fallbackData;
  }
}

export function writeStorage(key, data) {
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors in restricted environments
  }
  return data;
}

export function createCrudService(storageKey, initialData) {
  return {
    getAll: async () => {
      await simulateDelay(120);
      return readStorage(storageKey, initialData);
    },
    getById: async (id) => {
      await simulateDelay(100);
      const list = readStorage(storageKey, initialData);
      return list.find((item) => item.id === id) || null;
    },
    create: async (payload) => {
      await simulateDelay(180);
      const list = readStorage(storageKey, initialData);
      const updated = [payload, ...list];
      writeStorage(storageKey, updated);
      return payload;
    },
    update: async (id, payload) => {
      await simulateDelay(160);
      const list = readStorage(storageKey, initialData);
      let updatedItem = null;
      const updated = list.map((item) => {
        if (item.id === id) {
          updatedItem = { ...item, ...payload };
          return updatedItem;
        }
        return item;
      });
      writeStorage(storageKey, updated);
      return updatedItem;
    },
    delete: async (id) => {
      await simulateDelay(150);
      const list = readStorage(storageKey, initialData);
      const updated = list.filter((item) => item.id !== id);
      writeStorage(storageKey, updated);
      return true;
    },
    saveAll: async (items) => {
      writeStorage(storageKey, items);
      return items;
    },
  };
}

export default apiClient;

