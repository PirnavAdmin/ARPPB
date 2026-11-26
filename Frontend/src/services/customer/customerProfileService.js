/**
 * Customer Profile API Service
 * Re-exports profile & delivery address functions from the centralized profile service.
 */

export {
  fetchCustomerProfile,
  updateCustomerProfileApi,
  createCustomerAddressApi,
  updateCustomerAddressApi,
  setDefaultCustomerAddressApi,
  deleteCustomerAddressApi,
  sendCustomerMobileChangeOtp,
  verifyCustomerMobileChangeOtp,
  mapCustomerDtoToProfile,
} from '../profileService';

