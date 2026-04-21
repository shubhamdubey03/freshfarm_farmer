import React, { useState, useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  Alert
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
import VendorDashboardScreen from './src/screens/VendorDashboardScreen';
import VendorStockScreen from './src/screens/VendorStockScreen';
import VendorProfileScreen from './src/screens/VendorProfileScreen';
import FarmSettingsScreen from './src/screens/vendor/FarmSettingsScreen';
import PaymentSettingsScreen from './src/screens/vendor/PaymentSettingsScreen';
import DeliveryPreferencesScreen from './src/screens/vendor/DeliveryPreferencesScreen';
import PayoutHistoryScreen from './src/screens/vendor/PayoutHistoryScreen';
import AddProductScreen from './src/screens/AddProductScreen';
import VendorOrdersScreen from './src/screens/VendorOrdersScreen';
import CollectionCenterDashboardScreen from './src/screens/CollectionCenter/CollectionCenterDashboardScreen';

const RootNavigator = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const { user, isAppReady, logout } = useAuth();
  const [currentScreen, setCurrentScreen] = useState('role'); // Default initial screen
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userRole, setUserRole] = useState(''); // Default role
  const [initialized, setInitialized] = useState(false);

  const currentRole = user?.role || user?.user_role || userRole;

  // Update starting screen based on auth state when app is ready
  useEffect(() => {
    if (isAppReady && !initialized) {
      if (user) {
        const role = user.role || user.user_role || userRole;
        setUserRole(role);
        if (role === 'farmer' || role === 'vendor') {
          setCurrentScreen('vendor-dashboard');
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
            if (currentRole === 'farmer' || currentRole === 'vendor') {
              setCurrentScreen('vendor-dashboard');
            } else if (currentRole === 'collection_center') {
              setCurrentScreen('collection-center-dashboard');
            } else {
              setCurrentScreen('role');
            }
          }}
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
          onLogout={handleLogout}
          onNavigateProfile={() => setCurrentScreen('vendor-profile')}
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
          onLogout={handleLogout}
        />
      ) : currentScreen === 'vendor-farm-settings' ? (
        <FarmSettingsScreen
          onBack={() => setCurrentScreen('vendor-profile')}
        />
      ) : currentScreen === 'vendor-payment-settings' ? (
        <PaymentSettingsScreen
          onBack={() => setCurrentScreen('vendor-profile')}
        />
      ) : currentScreen === 'vendor-delivery-preferences' ? (
        <DeliveryPreferencesScreen
          onBack={() => setCurrentScreen('vendor-profile')}
        />
      ) : currentScreen === 'vendor-payout-history' ? (
        <PayoutHistoryScreen
          onBack={() => setCurrentScreen('vendor-profile')}
        />
      ) : (
        <AddProductScreen
          onBack={() => setCurrentScreen('vendor-dashboard')}
          onSave={() => {
            setCurrentScreen('vendor-stock');
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
