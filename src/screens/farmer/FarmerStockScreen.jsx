import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar,
    TextInput,
    Switch,
    Alert,
    ActivityIndicator,
    Modal
} from 'react-native';
import { API_URLS } from '../../config/api';
import { apiFunction } from '../../config/apifunction';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
    Search, 
    Plus, 
    LayoutDashboard, 
    ClipboardList, 
    Package, 
    User, 
    Edit3, 
    RefreshCcw 
} from 'lucide-react-native';

const ProductCard = ({ id, name, category, price, unit, stock, status, image, onNotifyAdmin, onEditStock, showPrice = true }) => {
    const [isActive, setIsActive] = useState(status === 'Active');

    return (
        <View style={styles.productCard}>
            <Image source={{ uri: image }} style={styles.productImage} />
            <View style={styles.productDetails}>
                <View style={styles.cardHeader}>
                    <Text style={styles.categoryText}>{category}</Text>
                    <View style={styles.statusRow}>
                        <Text style={[styles.statusLabel, !isActive && styles.statusLabelInactive]}>
                            {isActive ? 'Active' : 'Inactive'}
                        </Text>
                        <Switch
                            value={isActive}
                            onValueChange={setIsActive}
                            trackColor={{ false: '#E2E8F0', true: '#38BDF8' }}
                            thumbColor="#FFF"
                            ios_backgroundColor="#E2E8F0"
                            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                        />
                    </View>
                </View>

                <Text style={styles.productName}>{name}</Text>
                {showPrice && (
                    <Text style={styles.priceText}>
                        <Text style={styles.priceSymbol}>$</Text>{price} <Text style={styles.unitText}>/ {unit}</Text>
                    </Text>
                )}

                <View style={styles.cardFooter}>
                    <View>
                        {stock > 0 ? (
                            <Text style={styles.stockText}>In Stock: <Text style={styles.stockBold}>{stock} {unit}</Text></Text>
                        ) : (
                            <Text style={styles.outOfStockText}>Out of Stock</Text>
                        )}
                    </View>
                    <TouchableOpacity 
                        style={[styles.actionButton, stock === 0 && styles.restockButton]}
                        onPress={() => stock === 0 ? onNotifyAdmin(id) : onEditStock(id, stock)}
                    >
                        {stock > 0 ? (
                            <>
                                <Edit3 size={14} color="#38BDF8" style={styles.actionIcon} />
                                <Text style={styles.actionButtonText}>Edit Stock</Text>
                            </>
                        ) : (
                            <>
                                <RefreshCcw size={14} color="#38BDF8" style={styles.actionIcon} />
                                <Text style={styles.actionButtonText}>Notify Admin</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const FarmerStockScreen = ({ onNavigateDashboard, onNavigateOrders, onNavigateProfile, onAddProduct, onLogout }) => {
    const [activeTab, setActiveTab] = useState('active');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [newStock, setNewStock] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await apiFunction(API_URLS.FARMER_PRODUCTS, [], {}, 'get', true);
            if (res.data) {
                setProducts(res.data.results || []);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotifyAdmin = async (productId) => {
        try {
            // Using placeholder endpoint for NOTIFY_ADMIN
            const response = await apiFunction(`${API_URLS.NOTIFY_ADMIN}${productId}/`, [], {}, 'post', true);
            Alert.alert("Success", "Admin has been notified that this product is out of stock.");
        } catch (error) {
            Alert.alert("Error", "Failed to notify admin. Please try again.");
        }
    };

    const handleEditStock = (id, currentStock) => {
        setEditingProduct(id);
        setNewStock(currentStock.toString());
        setIsEditModalVisible(true);
    };

    const submitStockUpdate = async () => {
        if (!editingProduct) return;
        try {
            const payload = { stock: parseInt(newStock) };
            const response = await apiFunction(`${API_URLS.FARMER_PRODUCTS}${editingProduct}/`, [], payload, 'patch', true);
            
            if (response && response.error) {
                Alert.alert('Error', response.error || 'Failed to update stock');
                return;
            }

            // Update local state
            setProducts(products.map(p => {
                if (p.id === editingProduct) {
                    const updatedP = { ...p };
                    if (updatedP.variants && updatedP.variants.length > 0) {
                        updatedP.variants[0].stock = parseInt(newStock);
                    }
                    return updatedP;
                }
                return p;
            }));
            Alert.alert('Success', 'Stock updated successfully!');
            setIsEditModalVisible(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update stock');
        }
    };

    // Filter products based on activeTab
    const filteredProducts = products.filter(p => {
        const stock = p.variants?.[0]?.stock || 0;
        if (activeTab === 'active') return stock > 0;
        return stock === 0;
    });

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Products</Text>
                    <TouchableOpacity style={styles.searchButton}>
                        <Search size={22} color="#1E293B" />
                    </TouchableOpacity>
                </View>

                {/* Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                        onPress={() => setActiveTab('active')}
                    >
                        <Text style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>
                            Active Listings
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.tab, activeTab === 'out' && styles.activeTab]}
                        onPress={() => setActiveTab('out')}
                    >
                        <Text style={[styles.tabText, activeTab === 'out' && styles.activeTabText]}>
                            Out of Stock
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    style={styles.scrollView} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {loading ? (
                        <ActivityIndicator color="#38BDF8" style={{ marginTop: 20 }} />
                    ) : filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <ProductCard 
                                key={product.id}
                                id={product.id}
                                name={product.name} 
                                category={product.category_name || 'General'} 
                                price={product.variants?.[0]?.price || '0.00'} 
                                unit={product.variants?.[0]?.unit || 'kg'} 
                                stock={product.variants?.[0]?.stock || 0} 
                                status={product.is_active ? 'Active' : 'Inactive'} 
                                image={product.image || "https://images.unsplash.com/photo-1546473427-e1e6666ba379?w=200"}
                                onNotifyAdmin={handleNotifyAdmin}
                                onEditStock={handleEditStock}
                                showPrice={activeTab !== 'active'}
                            />
                        ))
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Text style={{ color: '#64748B' }}>No products found in this category.</Text>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>

            {/* Edit Stock Modal */}
            <Modal
                visible={isEditModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Update Stock</Text>
                        <TextInput
                            style={styles.modalInput}
                            keyboardType="numeric"
                            value={newStock}
                            onChangeText={setNewStock}
                            placeholder="Enter new stock quantity"
                        />
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalCancelButton]} 
                                onPress={() => setIsEditModalVisible(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalButton, styles.modalSaveButton]} 
                                onPress={submitStockUpdate}
                            >
                                <Text style={styles.modalSaveText}>Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Fab Button */}
            <TouchableOpacity style={styles.fab} onPress={onAddProduct}>
                <Plus size={32} color="#FFF" />
            </TouchableOpacity>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={onNavigateDashboard}>
                    <LayoutDashboard size={24} color="#94A3B8" />
                    <Text style={styles.navText}>DASHBOARD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={onNavigateOrders}>
                    <ClipboardList size={24} color="#94A3B8" />
                    <Text style={styles.navText}>ORDERS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem}>
                    <Package size={24} color="#38BDF8" />
                    <Text style={[styles.navText, styles.activeNavText]}>STOCK</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={onNavigateProfile}>
                    <User size={24} color="#94A3B8" />
                    <Text style={styles.navText}>PROFILE</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: '#FFF',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
    },
    searchButton: {
        width: 44,
        height: 44,
        backgroundColor: '#F1F5F9',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#F1F5F9',
        marginHorizontal: 24,
        padding: 6,
        borderRadius: 20,
        marginBottom: 24,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 16,
    },
    activeTab: {
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    activeTabText: {
        color: '#38BDF8',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    productCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 16,
        flexDirection: 'row',
        marginBottom: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 2,
    },
    productImage: {
        width: 90,
        height: 90,
        borderRadius: 20,
    },
    productDetails: {
        flex: 1,
        marginLeft: 16,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#38BDF8',
        letterSpacing: 0.5,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statusLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#10B981',
    },
    statusLabelInactive: {
        color: '#94A3B8',
    },
    productName: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 6,
    },
    priceText: {
        fontSize: 18,
        fontWeight: '800',
        color: '#38BDF8',
        marginBottom: 12,
    },
    priceSymbol: {
        fontSize: 14,
    },
    unitText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stockText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    stockBold: {
        fontWeight: '800',
        color: '#1E293B',
    },
    outOfStockText: {
        fontSize: 13,
        color: '#EF4444',
        fontWeight: '800',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 12,
        gap: 6,
    },
    restockButton: {
        backgroundColor: '#F1F5F9',
    },
    actionIcon: {
        marginTop: 1,
    },
    actionButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#38BDF8',
    },
    fab: {
        position: 'absolute',
        right: 24,
        bottom: 84,
        width: 64,
        height: 64,
        backgroundColor: '#38BDF8',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    bottomNav: {
        position: 'absolute',
        bottom: 0,
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingTop: 12,
        paddingBottom: 24,
        paddingHorizontal: 12,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 20,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    navText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        marginTop: 4,
    },
    activeNavText: {
        color: '#38BDF8',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 16,
    },
    modalInput: {
        width: '100%',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelButton: {
        backgroundColor: '#F1F5F9',
        marginRight: 8,
    },
    modalSaveButton: {
        backgroundColor: '#38BDF8',
        marginLeft: 8,
    },
    modalCancelText: {
        color: '#64748B',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalSaveText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default FarmerStockScreen;
