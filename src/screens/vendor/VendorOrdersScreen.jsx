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
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URLS } from '../../config/api';
import { apiFunction } from '../../config/apifunction';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Search,
    SlidersHorizontal,
    Clock,
    LayoutDashboard,
    ClipboardList,
    Package,
    User,
    Plus,
    ChevronDown
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const OrderCard = ({ order, onUpdateStatus, loadingId }) => {
    const isTransitioning = loadingId === order.id;

    const renderActionButton = () => {
        if (isTransitioning) {
            return (
                <View style={styles.actionLoaderContainer}>
                    <ActivityIndicator size="small" color="#38BDF8" />
                </View>
            );
        }

        switch (order.status) {
            case 'assigned':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#10B981', shadowColor: '#10B981' }]}
                        onPress={() => onUpdateStatus(order.id, 'accept')}
                    >
                        <Text style={styles.actionButtonText}>Accept Order</Text>
                    </TouchableOpacity>
                );
            case 'accepted':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#F59E0B', shadowColor: '#F59E0B' }]}
                        onPress={() => onUpdateStatus(order.id, 'packed')}
                    >
                        <Text style={styles.actionButtonText}>Mark Packed</Text>
                    </TouchableOpacity>
                );
            case 'packed':
                return (
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#38BDF8', shadowColor: '#38BDF8' }]}
                        onPress={() => onUpdateStatus(order.id, 'ready')}
                    >
                        <Text style={styles.actionButtonText}>Mark Ready</Text>
                    </TouchableOpacity>
                );
            case 'ready':
                return (
                    <View style={styles.statusBadgeReady}>
                        <Text style={styles.statusBadgeReadyText}>Ready for Pickup</Text>
                    </View>
                );
            default:
                return (
                    <View style={styles.statusBadgeDelivered}>
                        <Text style={styles.statusBadgeDeliveredText}>
                            {order.status.toUpperCase()}
                        </Text>
                    </View>
                );
        }
    };

    return (
        <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderLabel}>ORDER ID</Text>
                    <Text style={styles.orderId}>#{order.order_id}</Text>
                </View>
                <View style={styles.pickupInfo}>
                    <Text style={styles.pickupLabel}>CREATED AT</Text>
                    <View style={styles.timeRow}>
                        <Clock size={16} color="#94A3B8" style={{ marginRight: 4 }} />
                        <Text style={styles.pickupTime}>{order.pickupTime}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.buyerInfo}>
                <Image source={{ uri: order.buyer.avatar }} style={styles.buyerAvatar} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.buyerLabel}>Buyer</Text>
                    <Text style={styles.buyerName}>{order.buyer.name}</Text>
                    {order.buyer.phone ? <Text style={styles.buyerPhone}>{order.buyer.phone}</Text> : null}
                </View>
                <View style={styles.paymentBadge}>
                    <Text style={styles.paymentBadgeText}>{order.payment_type}</Text>
                </View>
            </View>

            <View style={styles.itemsList}>
                {order.items.map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            {item.image && (
                                <Image
                                    source={{ uri: item.image }}
                                    style={{ width: 40, height: 40, borderRadius: 8, marginRight: 12 }}
                                />
                            )}
                            <Text style={styles.itemName}>{item.name}</Text>
                        </View>
                        <Text style={styles.itemQuantity}>{item.quantity}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Total Earnings (90%):</Text>
                <Text style={styles.priceValue}>₹{(parseFloat(order.total_price) * 0.9).toFixed(2)}</Text>
            </View>

            {renderActionButton()}
        </View>
    );
};

const VendorOrdersScreen = ({ onNavigateDashboard, onNavigateStock, onNavigateProfile, onAddProduct, onLogout }) => {
    const [activeTab, setActiveTab] = useState('New');
    const [searchQuery, setSearchQuery] = useState('');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await apiFunction(API_URLS.VENDOR_ORDERS, [], {}, 'get', true);
            if (res.data && res.data.results) {
                const formattedOrders = res.data.results.map(o => {
                    const createdDate = o.created_at ? new Date(o.created_at) : new Date();
                    const timeString = createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return {
                        id: o.id.toString(),
                        order_id: o.order_id,
                        status: o.status,
                        total_price: o.total_price,
                        payment_type: o.payment_type,
                        pickupTime: timeString,
                        buyer: {
                            name: o.customer_name || 'Customer',
                            phone: o.customer_phone || '',
                            avatar: 'https://images.unsplash.com/photo-1595858223961-00fb8a396e98?w=200',
                        },
                        items: (o.items || []).map(item => ({
                            name: item.product_name || 'Product',
                            quantity: `${item.quantity} ${item.unit || 'units'}`,
                            price: item.price,
                            image: null
                        }))
                    };
                });
                setOrders(formattedOrders);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (orderId, action) => {
        setActionLoadingId(orderId);
        let apiUrl = '';
        if (action === 'accept') {
            apiUrl = API_URLS.VENDOR_ORDER_ACCEPT(orderId);
        } else if (action === 'packed') {
            apiUrl = API_URLS.VENDOR_ORDER_PACKED(orderId);
        } else if (action === 'ready') {
            apiUrl = API_URLS.VENDOR_ORDER_READY(orderId);
        }

        try {
            const res = await apiFunction(apiUrl, [], {}, 'post', true);
            console.log(`Update status (${action}) response:`, res);
            
            if (res.status === 200 || res.status === 201) {
                await fetchOrders();
                Alert.alert(
                    "Success",
                    res.data?.message || `Order status updated!`,
                    [{ text: "OK" }]
                );
            } else {
                Alert.alert("Error", res.error || "Failed to update order status.");
            }
        } catch (error) {
            console.error(`Error updating order status (${action}):`, error);
            Alert.alert("Error", "An unexpected error occurred.");
        } finally {
            setActionLoadingId(null);
        }
    };

    const newOrders = orders.filter(o => ['assigned', 'accepted', 'packed'].includes(o.status));
    const readyOrders = orders.filter(o => o.status === 'ready');
    const historyOrders = orders.filter(o => !['assigned', 'accepted', 'packed', 'ready'].includes(o.status));

    let displayOrders = [];
    if (activeTab === 'New') {
        displayOrders = newOrders;
    } else if (activeTab === 'Ready') {
        displayOrders = readyOrders;
    } else if (activeTab === 'History') {
        displayOrders = historyOrders;
    }

    const filteredDisplayOrders = displayOrders.filter(o =>
        o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.buyer.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Orders Management</Text>
                    <TouchableOpacity style={styles.filterButton}>
                        <SlidersHorizontal size={20} color="#1E293B" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchInputWrapper}>
                        <Search size={20} color="#94A3B8" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search order numbers..."
                            placeholderTextColor="#94A3B8"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    {[`New (${newOrders.length})`, `Ready (${readyOrders.length})`, `History (${historyOrders.length})`].map((tab) => {
                        const tabKey = tab.split(' ')[0];
                        const isActive = activeTab === tabKey;
                        return (
                            <TouchableOpacity
                                key={tab}
                                style={[styles.tab, isActive && styles.activeTab]}
                                onPress={() => setActiveTab(tabKey)}
                            >
                                <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                                    {tab}
                                </Text>
                                {isActive && <View style={styles.activeTabIndicator} />}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Orders List */}
                <ScrollView
                    style={styles.ordersList}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {loading ? (
                        <ActivityIndicator color="#38BDF8" style={{ marginTop: 20 }} />
                    ) : filteredDisplayOrders.length > 0 ? (
                        filteredDisplayOrders.map((order) => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onUpdateStatus={handleUpdateStatus}
                                loadingId={actionLoadingId}
                            />
                        ))
                    ) : (
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Text style={{ color: '#64748B' }}>No orders found.</Text>
                        </View>
                    )}

                </ScrollView>
            </SafeAreaView>

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
                <TouchableOpacity style={styles.navItem}>
                    <ClipboardList size={24} color="#38BDF8" />
                    <Text style={[styles.navText, styles.activeNavText]}>ORDERS</Text>
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
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
    },
    filterButton: {
        width: 44,
        height: 44,
        backgroundColor: '#F1F5F9',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchContainer: {
        paddingHorizontal: 24,
        marginTop: 16,
    },
    searchInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 52,
    },
    searchIcon: {
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '500',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingBottom: 12,
    },
    activeTab: {
        // No specific style needed for the tab container when active
    },
    tabText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94A3B8',
    },
    activeTabText: {
        color: '#38BDF8',
    },
    activeTabIndicator: {
        position: 'absolute',
        bottom: -1,
        width: '100%',
        height: 2,
        backgroundColor: '#38BDF8',
    },
    ordersList: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 100,
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    orderLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#38BDF8',
        marginBottom: 4,
    },
    orderId: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
    },
    pickupInfo: {
        alignItems: 'flex-end',
    },
    pickupLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        marginBottom: 4,
    },
    timeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    pickupTime: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    buyerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        marginBottom: 16,
    },
    buyerAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    buyerLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#94A3B8',
    },
    buyerName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    itemsList: {
        marginBottom: 20,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#64748B',
    },
    itemQuantity: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
    },
    buyerPhone: {
        fontSize: 12,
        color: '#64748B',
        marginTop: 2,
    },
    paymentBadge: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    paymentBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#475569',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    priceLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
    },
    priceValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#10B981',
    },
    actionButton: {
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '700',
    },
    actionLoaderContainer: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    statusBadgeReady: {
        backgroundColor: '#D1FAE5',
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A7F3D0',
    },
    statusBadgeReadyText: {
        color: '#065F46',
        fontSize: 14,
        fontWeight: '800',
    },
    statusBadgeDelivered: {
        backgroundColor: '#F1F5F9',
        paddingVertical: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    statusBadgeDeliveredText: {
        color: '#475569',
        fontSize: 14,
        fontWeight: '800',
    },
    infoCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        borderStyle: 'dashed',
    },
    infoCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoCardLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
        marginBottom: 4,
    },
    infoCardId: {
        fontSize: 18,
        fontWeight: '800',
        color: '#64748B',
    },
    packageBadge: {
        backgroundColor: '#D1FAE5',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    packageBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#10B981',
    },
    infoCardSubtext: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
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
});

export default VendorOrdersScreen;
