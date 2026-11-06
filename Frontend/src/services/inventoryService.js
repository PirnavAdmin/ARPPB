import { createCrudService, readStorage, writeStorage, simulateDelay } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_INVENTORY, INITIAL_STOCK_MOVEMENTS } from '../data/mockInventory';

export const inventoryService = {
  ...createCrudService(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY),
  getMovements: async () => {
    await simulateDelay(100);
    return readStorage(STORAGE_KEYS.STOCK_MOVEMENTS, INITIAL_STOCK_MOVEMENTS);
  },
  saveMovements: async (movements) => {
    return writeStorage(STORAGE_KEYS.STOCK_MOVEMENTS, movements);
  },
};

export default inventoryService;

