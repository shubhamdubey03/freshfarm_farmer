import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  useColorScheme,
} from 'react-native';
import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';
import SplashScreen from './src/screens/SplashScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import VerifyOTPScreen from './src/screens/VerifyOTPScreen';
import VendorDashboardScreen from './src/screens/vendor/VendorDashboardScreen';
import VendorStockScreen from './src/screens/vendor/VendorStockScreen';
import VendorProfileScreen from './src/screens/vendor/VendorProfileScreen';
import FarmSettingsScreen from './src/screens/vendor/FarmSettingsScreen';
import PaymentSettingsScreen from './src/screens/vendor/PaymentSettingsScreen';
import DeliveryPreferencesScreen from './src/screens/vendor/DeliveryPreferencesScreen';
import PayoutHistoryScreen from './src/screens/vendor/PayoutHistoryScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import VendorOrdersScreen from './src/screens/vendor/VendorOrdersScreen';
import CollectionCenterDashboardScreen from './src/screens/CollectionCenter/CollectionCenterDashboardScreen';
import VendorEditProfileScreen from './src/screens/vendor/VendorEditProfileScreen';
import CollectionCenterProfileScreen from './src/screens/CollectionCenter/CollectionCenterProfileScreen';
import CollectionCenterEditProfileScreen from './src/screens/CollectionCenter/CollectionCenterEditProfileScreen';

// Farmer Screens
import FarmerDashboardScreen from './src/screens/farmer/FarmerDashboardScreen';
import FarmerOrdersScreen from './src/screens/farmer/FarmerOrdersScreen';
import FarmerStockScreen from './src/screens/farmer/FarmerStockScreen';
import FarmerProfileScreen from './src/screens/farmer/FarmerProfileScreen';
import FarmerEditProfileScreen from './src/screens/farmer/FarmerEditProfileScreen';

const RootNavigator = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const { user, isAppReady, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('role'); // Default initial screen
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userRole, setUserRole] = useState(''); // Default role
  const [initialized, setInitialized] = useState(false);
  const [ccDashboardRefreshKey, setCcDashboardRefreshKey] = useState(0);

  const currentRole = ['role', 'login', 'signup', 'verify-otp'].includes(currentScreen) ? userRole : (user?.role || user?.user_role || userRole);

  // Update starting screen based on auth state when app is ready
  useEffect(() => {
    if (isAppReady && !initialized) {
      if (user) {
        const role = user.role || user.user_role || userRole;
        setUserRole(role);
        if (role === 'vendor') {
          setCurrentScreen('vendor-dashboard');
        } else if (role === 'farmer') {
          setCurrentScreen('farmer-dashboard');
        } else if (role === 'collection_center') {
          setCurrentScreen('collection-center-dashboard');
        } else {
          setCurrentScreen('role');
        }
      }
      setInitialized(true);
    }
  }, [isAppReady, user, initialized, userRole]);

  if (!isAppReady || !initialized) {
    return <SplashScreen />;
  }

  const handleSendOtpSuccess = (phone: string, role: string) => {
    setPhoneNumber(phone);
    setUserRole(role);
    setCurrentScreen('verify-otp');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentScreen('role');
  };

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {currentScreen === 'role' ? (
        <RoleSelectionScreen
          onContinue={(role: string) => {
            setUserRole(role);
            setCurrentScreen('signup');
          }}
          onLogin={(role: string) => {
            setUserRole(role);
            setCurrentScreen('login');
          }}
        />
      ) : currentScreen === 'login' ? (
        <LoginScreen
          role={currentRole}
          onBack={() => setCurrentScreen('role')}
          onSignup={() => setCurrentScreen('signup')}
          onContinue={handleSendOtpSuccess}
          onLoginSuccess={(role: string) => {
            if (role === 'vendor') {
              setCurrentScreen('vendor-dashboard');
            } else if (role === 'farmer') {
              setCurrentScreen('farmer-dashboard');
            } else if (role === 'collection_center') {
              setCurrentScreen('collection-center-dashboard');
            } else {
              setCurrentScreen('role');
            }
          }}
        />
      ) : currentScreen === 'signup' ? (
        <SignupScreen
          role={currentRole}
          onBack={() => setCurrentScreen('role')}
          onLogin={() => setCurrentScreen('login')}
          onContinue={handleSendOtpSuccess}
        />
      ) : currentScreen === 'verify-otp' ? (
        <VerifyOTPScreen
          phoneNumber={phoneNumber}
          onBack={() => setCurrentScreen('login')}
          onSuccess={() => {
            if (currentRole === 'vendor') {
              setCurrentScreen('vendor-dashboard');
            } else if (currentRole === 'farmer') {
              setCurrentScreen('farmer-dashboard');
            } else if (currentRole === 'collection_center') {
              setCurrentScreen('collection-center-dashboard');
            } else {
              setCurrentScreen('role');
            }
          }}
        />
      ) : currentScreen === 'farmer-dashboard' ? (
        <FarmerDashboardScreen
          onNavigateOrders={() => setCurrentScreen('farmer-orders')}
          onNavigateStock={() => setCurrentScreen('farmer-stock')}
          onNavigateProfile={() => setCurrentScreen('farmer-profile')}
          onAddProduct={() => setCurrentScreen('add-product')}
          onLogout={handleLogout}
        />
      ) : currentScreen === 'farmer-orders' ? (
        <FarmerOrdersScreen
          onNavigateDashboard={() => setCurrentScreen('farmer-dashboard')}
          onNavigateStock={() => setCurrentScreen('farmer-stock')}
          onNavigateProfile={() => setCurrentScreen('farmer-profile')}
          onAddProduct={() => setCurrentScreen('add-product')}
          onLogout={handleLogout}
        />
      ) : currentScreen === 'farmer-stock' ? (
        <FarmerStockScreen
          onNavigateDashboard={() => setCurrentScreen('farmer-dashboard')}
          onNavigateOrders={() => setCurrentScreen('farmer-orders')}
          onNavigateProfile={() => setCurrentScreen('farmer-profile')}
          onAddProduct={() => setCurrentScreen('add-product')}
          onLogout={handleLogout}
        />
      ) : currentScreen === 'farmer-profile' ? (
        <FarmerProfileScreen
          onNavigateDashboard={() => setCurrentScreen('farmer-dashboard')}
          onNavigateOrders={() => setCurrentScreen('farmer-orders')}
          onNavigateStock={() => setCurrentScreen('farmer-stock')}
          onNavigateFarmSettings={() => setCurrentScreen('vendor-farm-settings')}
          onNavigatePaymentSettings={() => setCurrentScreen('vendor-payment-settings')}
          onNavigateDeliveryPreferences={() => setCurrentScreen('vendor-delivery-preferences')}
          onNavigatePayoutHistory={() => setCurrentScreen('vendor-payout-history')}
          onNavigateEditProfile={() => setCurrentScreen('farmer-edit-profile')}
          onLogout={handleLogout}
        />
      ) : currentScreen === 'farmer-edit-profile' ? (
        <FarmerEditProfileScreen
          onBack={() => setCurrentScreen('farmer-profile')}
        />
      ) : currentScreen === 'vendor-dashboard' ? (
        <VendorDashboardScreen
          onNavigateOrders={() => setCurrentScreen('vendor-orders')}
          onNavigateStock={() => setCurrentScreen('vendor-stock')}
          onNavigateProfile={() => setCurrentScreen('vendor-profile')}
          onAddProduct={() => setCurrentScreen('add-product')}
          onLogout={handleLogout}
        />
      ) : currentScreen === 'collection-center-dashboard' ? (
        <CollectionCenterDashboardScreen
          key={ccDashboardRefreshKey}
          onLogout={handleLogout}
          onNavigateProfile={() => setCurrentScreen('collection-center-profile')}
        />
      ) : currentScreen === 'collection-center-profile' ? (
        <CollectionCenterProfileScreen
          onNavigateDashboard={() => {
            setCcDashboardRefreshKey(k => k + 1);
            setCurrentScreen('collection-center-dashboard');
          }}
          onNavigateEditProfile={() => setCurrentScreen('collection-center-edit-profile')}
          onLogout={handleLogout}
        />
      ) : currentScreen === 'collection-center-edit-profile' ? (
        <CollectionCenterEditProfileScreen
          onBack={() => setCurrentScreen('collection-center-profile')}
        />
      ) : currentScreen === 'vendor-orders' ? (
        <VendorOrdersScreen
          onNavigateDashboard={() => setCurrentScreen('vendor-dashboard')}
          onNavigateStock={() => setCurrentScreen('vendor-stock')}
          onNavigateProfile={() => setCurrentScreen('vendor-profile')}
          onAddProduct={() => setCurrentScreen('add-product')}
          onLogout={handleLogout}
        />
      ) : currentScreen === 'vendor-stock' ? (
        <VendorStockScreen
          onNavigateDashboard={() => setCurrentScreen('vendor-dashboard')}
          onNavigateOrders={() => setCurrentScreen('vendor-orders')}
          onNavigateProfile={() => setCurrentScreen('vendor-profile')}
          onAddProduct={() => setCurrentScreen('add-product')}
          onLogout={handleLogout}
        />
      ) : currentScreen === 'vendor-profile' ? (
        <VendorProfileScreen
          onNavigateDashboard={() => setCurrentScreen('vendor-dashboard')}
          onNavigateOrders={() => setCurrentScreen('vendor-orders')}
          onNavigateStock={() => setCurrentScreen('vendor-stock')}
          onNavigateFarmSettings={() => setCurrentScreen('vendor-farm-settings')}
          onNavigatePaymentSettings={() => setCurrentScreen('vendor-payment-settings')}
          onNavigateDeliveryPreferences={() => setCurrentScreen('vendor-delivery-preferences')}
          onNavigatePayoutHistory={() => setCurrentScreen('vendor-payout-history')}
          onNavigateEditProfile={() => setCurrentScreen('vendor-edit-profile')}
          onLogout={handleLogout}
        />
      ) : currentScreen === 'vendor-farm-settings' ? (
        <FarmSettingsScreen
          role={currentRole}
          onBack={() => setCurrentScreen(currentRole === 'farmer' ? 'farmer-profile' : 'vendor-profile')}
        />
      ) : currentScreen === 'vendor-payment-settings' ? (
        <PaymentSettingsScreen
          role={currentRole}
          onBack={() => setCurrentScreen(currentRole === 'farmer' ? 'farmer-profile' : 'vendor-profile')}
        />
      ) : currentScreen === 'vendor-delivery-preferences' ? (
        <DeliveryPreferencesScreen
          role={currentRole}
          onBack={() => setCurrentScreen(currentRole === 'farmer' ? 'farmer-profile' : 'vendor-profile')}
        />
      ) : currentScreen === 'vendor-payout-history' ? (
        <PayoutHistoryScreen
          role={currentRole}
          onBack={() => setCurrentScreen(currentRole === 'farmer' ? 'farmer-profile' : 'vendor-profile')}
        />
      ) : currentScreen === 'vendor-edit-profile' ? (
        <VendorEditProfileScreen
          onBack={() => setCurrentScreen('vendor-profile')}
        />
      ) : (
        <AddProductScreen
          onBack={() => setCurrentScreen(currentRole === 'farmer' ? 'farmer-dashboard' : 'vendor-dashboard')}
          onSave={() => {
            setCurrentScreen(currentRole === 'farmer' ? 'farmer-stock' : 'vendor-stock');
          }}
        />
      )}
    </>
  );
};

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
