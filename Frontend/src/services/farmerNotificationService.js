import api from '../API/Config';
import Endpoints from '../API/Endpoints';

const unwrap = (response) => response?.data?.data ?? response?.data ?? response;

export const fetchFarmerNotifications = async () => unwrap(await api.get(Endpoints.FarmerNotifications.getAll));
export const fetchFarmerNotificationStats = async () => unwrap(await api.get(Endpoints.FarmerNotifications.stats));
export const createFarmerNotification = async (payload) => unwrap(await api.post(Endpoints.FarmerNotifications.create, payload));
export const markFarmerNotificationRead = async (id) => unwrap(await api.patch(Endpoints.FarmerNotifications.markRead(id)));
export const markAllFarmerNotificationsRead = async () => unwrap(await api.patch(Endpoints.FarmerNotifications.markAllRead));
export const deleteFarmerNotification = async (id) => unwrap(await api.delete(Endpoints.FarmerNotifications.delete(id)));
