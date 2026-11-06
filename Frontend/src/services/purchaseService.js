import { createCrudService } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_PURCHASES } from '../data/mockPurchases';

export const purchaseService = {
  ...createCrudService(STORAGE_KEYS.PURCHASES, INITIAL_PURCHASES),
};

export default purchaseService;

