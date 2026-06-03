import { Platform } from 'react-native';

// const BASE_URL = Platform.OS === 'android' ? 'http://192.168.1.42:8000' : 'http://192.168.1.42:8000';

const BASE_URL = 'http://192.168.1.41:8000';
export const API_URLS = {
    BASE_URL,
    GOOGLE_LOGIN: `${BASE_URL}/api/auth/google/`,
    REGISTER: `${BASE_URL}/api/auth/register/`,
    SEND_OTP: `${BASE_URL}/api/auth/send-otp/`,
    VERIFY_OTP: `${BASE_URL}/api/auth/verify-otp/`,
    LOGIN: `${BASE_URL}/api/auth/login/`,
    FARMER_PROFILE: `${BASE_URL}/farmer/profile/`,
    FARMER_PRODUCTS: `${BASE_URL}/farmer/products/`,
    NOTIFY_ADMIN: `${BASE_URL}/farmer/notify-admin/`,
    FARMER_ORDERS: `${BASE_URL}/farmer/orders/`,
    FARMER_ORDER_READY: (id) => `${BASE_URL}/farmer/orders/${id}/ready/`,
    FARMER_SALARY: `${BASE_URL}/farmer/salary/`,
    VENDOR_ORDERS: `${BASE_URL}/vendor/orders/`,
    VENDOR_ORDER_ACCEPT: (id) => `${BASE_URL}/vendor/orders/${id}/accept/`,
    VENDOR_ORDER_PACKED: (id) => `${BASE_URL}/vendor/orders/${id}/packed/`,
    VENDOR_ORDER_READY: (id) => `${BASE_URL}/vendor/orders/${id}/ready/`,
    VENDOR_PROFILE: `${BASE_URL}/vendor/profile/`,
    VENDOR_EARNINGS_SUMMARY: `${BASE_URL}/vendor/earnings/summary/`,
    VENDOR_PAYOUTS: `${BASE_URL}/vendor/payouts/`,
    COLLECTION_PROFILE: `${BASE_URL}/collection/profile/`,
    COLLECTION_ORDERS: `${BASE_URL}/collection/orders/`,
    COLLECTION_ORDER_DETAIL: (id) => `${BASE_URL}/collection/orders/${id}/`,
    COLLECTION_ORDER_RECEIVED: (id) => `${BASE_URL}/collection/orders/${id}/received/`,
    COLLECTION_ORDER_READY: (id) => `${BASE_URL}/collection/orders/${id}/ready/`,
    COLLECTION_DELIVERIES: `${BASE_URL}/collection/deliveries/`,
    COLLECTION_DELIVERY_VERIFY_OTP: (id) => `${BASE_URL}/collection/deliveries/${id}/verify-otp/`,
    COLLECTION_PENDING_ORDERS: `${BASE_URL}/collection/orders/pending/`,
    COLLECTION_ORDER_RECEIVE_OFFLINE: (id) => `${BASE_URL}/collection/orders/${id}/receive-offline/`,
};

export default API_URLS;
