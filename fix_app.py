import sys

with open('App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update initial screen
content = content.replace(
    \"if (role === 'farmer' || role === 'vendor') {\",
    \"if (role === 'vendor') {\n          setCurrentScreen('vendor-dashboard');\n        } else if (role === 'farmer') {\n          setCurrentScreen('farmer-dashboard');\n        } else if (False) {\"
)

# 2. Update VerifyOTP success
content = content.replace(
    \"if (currentRole === 'farmer' || currentRole === 'vendor') {\n              setCurrentScreen('vendor-dashboard');\",
    \"if (currentRole === 'vendor') {\n              setCurrentScreen('vendor-dashboard');\n            } else if (currentRole === 'farmer') {\n              setCurrentScreen('farmer-dashboard');\"
)

# 3. Add Farmer screens
vendor_dashboard_idx = content.find(\"      ) : currentScreen === 'vendor-dashboard' ? (\")

farmer_screens = \"\"\"      ) : currentScreen === 'farmer-dashboard' ? (
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
        />\n\"\"\"

if vendor_dashboard_idx != -1 and 'FarmerDashboardScreen' not in content:
    content = content[:vendor_dashboard_idx] + farmer_screens + content[vendor_dashboard_idx:]

# 4. Change vendor-edit-profile usage
content = content.replace(\") : currentScreen === 'edit-profile' ? (\", \") : currentScreen === 'vendor-edit-profile' ? (\")
content = content.replace(\"<EditProfileScreen\", \"<VendorEditProfileScreen\")
content = content.replace(\"setCurrentScreen('edit-profile')\", \"setCurrentScreen('vendor-edit-profile')\")

with open('App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('App.tsx updated!')
