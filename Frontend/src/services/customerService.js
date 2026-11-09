import { createCrudService } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_CUSTOMERS } from '../data/mockCustomers';

export const customerService = {
  ...createCrudService(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
};

export default customerService;

