import { createCrudService } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_FARMERS } from '../data/mockFarmers';

export const farmerService = {
  ...createCrudService(STORAGE_KEYS.FARMERS, INITIAL_FARMERS),
};

export default farmerService;

