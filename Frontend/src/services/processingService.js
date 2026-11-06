import { createCrudService } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_PROCESSING } from '../data/mockProcessing';

export const processingService = {
  ...createCrudService(STORAGE_KEYS.PROCESSING, INITIAL_PROCESSING),
};

export default processingService;

