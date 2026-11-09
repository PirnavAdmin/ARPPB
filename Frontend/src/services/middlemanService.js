import { createCrudService } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_MIDDLEMEN } from '../data/mockMiddlemen';

export const middlemanService = {
  ...createCrudService(STORAGE_KEYS.MIDDLEMEN, INITIAL_MIDDLEMEN),
};

export default middlemanService;

