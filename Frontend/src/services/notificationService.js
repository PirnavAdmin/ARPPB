import { createCrudService } from './api';
import { STORAGE_KEYS } from '../utils/constants';
import { INITIAL_NOTIFICATIONS } from '../data/mockNotifications';

export const notificationService = {
  ...createCrudService(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
};

export default notificationService;

