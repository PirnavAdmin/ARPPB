import { createCrudService } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_ORDERS } from '../data/mockSales';

export const orderService = {
  ...createCrudService(STORAGE_KEYS.ORDERS, INITIAL_ORDERS),
};

export default orderService;

