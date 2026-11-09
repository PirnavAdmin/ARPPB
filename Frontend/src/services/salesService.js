import { createCrudService } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_SALES } from '../data/mockSales';

export const salesService = {
  ...createCrudService(STORAGE_KEYS.SALES, INITIAL_SALES),
};

export default salesService;

