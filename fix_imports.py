import os
files = ['src/screens/vendor/VendorDashboardScreen.jsx', 'src/screens/farmer/FarmerDashboardScreen.jsx', 'src/screens/vendor/VendorOrdersScreen.jsx', 'src/screens/farmer/FarmerOrdersScreen.jsx', 'src/screens/vendor/VendorStockScreen.jsx', 'src/screens/farmer/FarmerStockScreen.jsx', 'src/screens/vendor/VendorProfileScreen.jsx', 'src/screens/farmer/FarmerProfileScreen.jsx']
for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            c = file.read()
        c = c.replace("'../context/", "'../../context/")
        c = c.replace("'../config/", "'../../config/")
        with open(f, 'w', encoding='utf-8') as file:
            file.write(c)
print('Done')