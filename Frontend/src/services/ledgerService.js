import { createCrudService } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_LEDGER } from '../data/mockSales';

export const ledgerService = {
  ...createCrudService(STORAGE_KEYS.LEDGER, INITIAL_LEDGER),
};

export default ledgerService;

