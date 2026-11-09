import { createCrudService, readStorage, writeStorage, simulateDelay } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_PRODUCTS, INITIAL_PRODUCT_BATCHES } from '../data/mockProducts';

export const productService = {
  ...createCrudService(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
  getBatches: async () => {
    await simulateDelay(100);
    return readStorage(STORAGE_KEYS.PRODUCT_BATCHES, INITIAL_PRODUCT_BATCHES);
  },
  saveBatches: async (batches) => {
    return writeStorage(STORAGE_KEYS.PRODUCT_BATCHES, batches);
  },
};

export default productService;

