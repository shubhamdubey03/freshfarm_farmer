import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    StatusBar,
    Image,
    Dimensions,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Modal,
    TextInput
} from 'react-native';
import {
    Warehouse,
    TrendingUp,
    Package,
    Users,
    ArrowRight,
    Plus,
    Bell,
    Settings,
    Grid,
    BarChart2,
    LogOut
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { API_URLS } from '../../config/api';
import { apiFunction } from '../../config/apifunction';

const { width } = Dimensions.get('window');

const CollectionCenterDashboardScreen = ({ onLogout, onNavigateProfile }) => {
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [receivingId, setReceivingId] = useState(null);

    // New states for deliveries and details integration
    const [activeTab, setActiveTab] = useState('collections');
    const [deliveries, setDeliveries] = useState([]);
    const [loadingDeliveries, setLoadingDeliveries] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [otpInput, setOtpInput] = useState('');
    const [verifyingOtp, setVerifyingOtp] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            // 1. Fetch profile
            const profileRes = await apiFunction(API_URLS.COLLECTION_PROFILE, [], {}, 'get', true);
            if (profileRes.status === 200) {
                setProfile(profileRes.data);
            }

            // 2. Fetch orders
            const ordersRes = await apiFunction(API_URLS.COLLECTION_ORDERS, [], {}, 'get', true);
            if (ordersRes.status === 200 && ordersRes.data && ordersRes.data.results) {
                setOrders(ordersRes.data.results);
            }

            // 3. Fetch deliveries
            const deliveriesRes = await apiFunction(API_URLS.COLLECTION_DELIVERIES, [], {}, 'get', true);
            if (deliveriesRes.status === 200 && deliveriesRes.data && deliveriesRes.data.results) {
                setDeliveries(deliveriesRes.data.results);
            }
        } catch (error) {
            console.error('Error fetching collection center dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDashboardData();
    };

    const fetchPendingOrders = async () => {
        setLoadingPending(true);
        try {
            const res = await apiFunction(API_URLS.COLLECTION_PENDING_ORDERS, [], {}, 'get', true);
            console.log('[PendingOrders] raw response:', JSON.stringify(res));

            // apiFunction returns Axios response {status, data} on success
            // or plain error object on failure
            const statusCode = res?.status;
            const body = res?.data ?? res; // fallback for error shape

            if (statusCode === 200 && Array.isArray(body?.results)) {
                setPendingOrders(body.results);
            } else if (Array.isArray(body)) {
                // Some backends return plain array
                setPendingOrders(body);
            } else {
                console.warn('[PendingOrders] unexpected shape:', body);
                setPendingOrders([]);
            }
        } catch (e) {
            console.error('[PendingOrders] fetch error:', e);
            setPendingOrders([]);
        } finally {
            setLoadingPending(false);
        }
    };

    const openNewCollectionModal = () => {
        setModalVisible(true);
        fetchPendingOrders();
    };

    const handleReceiveOffline = async (orderId) => {
        setReceivingId(orderId);
        try {
            const res = await apiFunction(
                API_URLS.COLLECTION_ORDER_RECEIVE_OFFLINE(orderId),
                [], {}, 'post', true
            );
            console.log('[ReceiveOffline] raw response:', JSON.stringify(res));

            const statusCode = res?.status;
            const body = res?.data ?? res;

            if (statusCode === 200 || statusCode === 201) {
                Alert.alert('✅ Received', 'Produce marked as received. Buyer & farmer notified!');
                setModalVisible(false);
                fetchDashboardData();
            } else {
                const msg = body?.error || body?.detail || 'Failed to mark order as received.';
                Alert.alert('Error', msg);
            }
        } catch (e) {
            console.error('[ReceiveOffline] error:', e);
            Alert.alert('Error', 'Something went wrong.');
        } finally {
            setReceivingId(null);
        }
    };

    const handleReceiveOrder = async (orderId) => {
        try {
            const res = await apiFunction(API_URLS.COLLECTION_ORDER_RECEIVED(orderId), [], {}, 'post', true);
            if (res.status === 200 || res.status === 201) {
                Alert.alert("Success", "Produce received. Farmer and buyer notified!");
                fetchDashboardData();
            } else {
                Alert.alert("Error", res.data?.error || "Failed to mark order as received.");
            }
        } catch (error) {
            console.error("Receive order error:", error);
            Alert.alert("Error", "Something went wrong.");
        }
    };

    const handleMarkOrderReady = async (orderId) => {
        try {
            const res = await apiFunction(API_URLS.COLLECTION_ORDER_READY(orderId), [], {}, 'post', true);
            if (res.status === 200 || res.status === 201) {
                Alert.alert("Success", "Order marked ready! Delivery boy assigned automatically.");
                fetchDashboardData();
            } else {
                Alert.alert("Error", res.data?.error || "Failed to mark order ready.");
            }
        } catch (error) {
            console.error("Mark ready error:", error);
            Alert.alert("Error", "Something went wrong.");
        }
    };

    const handleViewOrderDetail = async (collectionOrderId) => {
        setLoadingDetail(true);
        setDetailModalVisible(true);
        try {
            const res = await apiFunction(API_URLS.COLLECTION_ORDER_DETAIL(collectionOrderId), [], {}, 'get', true);
            if (res.status === 200) {
                setSelectedOrder(res.data);
            } else {
                Alert.alert('Error', 'Failed to fetch order details.');
                setDetailModalVisible(false);
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
            Alert.alert('Error', 'Something went wrong.');
            setDetailModalVisible(false);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otpInput.trim() || otpInput.trim().length !== 6) {
            Alert.alert('Validation', 'Please enter a valid 6-digit OTP.');
            return;
        }
        setVerifyingOtp(true);
        try {
            const res = await apiFunction(
                API_URLS.COLLECTION_DELIVERY_VERIFY_OTP(selectedDelivery.id),
                [],
                { otp: otpInput.trim() },
                'post',
                true
            );
            if (res.status === 200 || res.status === 201) {
                Alert.alert('Success', 'OTP verified. Handover complete!');
                setOtpModalVisible(false);
                setOtpInput('');
                fetchDashboardData();
            } else {
                Alert.alert('Error', res.data?.error || 'Invalid OTP. Please try again.');
            }
        } catch (error) {
            console.error('Error verifying OTP:', error);
            Alert.alert('Error', 'Something went wrong.');
        } finally {
            setVerifyingOtp(false);
        }
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#38BDF8" />
            </SafeAreaView>
        );
    }

    // Calculate dynamic stats
    const totalCollected = orders
        .filter(o => o.order_status && o.order_status !== 'sent_to_collection' && o.order_status !== 'placed' && o.order_status !== 'farmer_assigned' && o.order_status !== 'cancelled')
        .reduce((total, order) => {
            const orderWeight = (order.items || []).reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);
            return total + orderWeight;
        }, 0);

    const activeFarmers = new Set(
        orders
            .filter(o => o.farmer && o.farmer.farm_name)
            .map(o => o.farmer.farm_name)
    ).size;

    const pendingPickup = orders.filter(o => o.status === 'ready' || o.status === 'assigned' || (o.order_status === 'at_collection_center' && o.status === 'pending')).length;
    const centerStatus = profile?.is_verified ? 'Open' : 'Pending';

    const stats = [
        { id: 1, title: 'Total Collected', value: `${totalCollected.toFixed(1)} kg`, icon: Package, color: '#0EA5E9' },
        { id: 2, title: 'Active Farmers', value: activeFarmers.toString(), icon: Users, color: '#10B981' },
        { id: 3, title: 'Pending Pickup', value: pendingPickup.toString(), icon: TrendingUp, color: '#F59E0B' },
        { id: 4, title: 'Center Status', value: centerStatus, icon: Warehouse, color: '#6366F1' },
    ];

    return (
        <>
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Welcome back,</Text>
                    <Text style={styles.centerName}>
                        {profile
                            ? (profile.first_name && profile.last_name
                                ? `${profile.first_name} ${profile.last_name}`
                                : profile.first_name || profile.center_name || profile.username || 'Collection Center')
                            : 'Collection Center'}
                    </Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Bell size={24} color="#64748B" />
                        <View style={styles.notificationBadge} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileToggle} onPress={onNavigateProfile}>
                        <Image
                            source={{ uri: profile?.image || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop' }}
                            style={styles.avatar}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#38BDF8']} />
                }
            >
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    {stats.map((stat) => (
                        <View key={stat.id} style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: stat.color + '15' }]}>
                                <stat.icon size={24} color={stat.color} />
                            </View>
                            <Text style={styles.statValue}>{stat.value}</Text>
                            <Text style={styles.statTitle}>{stat.title}</Text>
                        </View>
                    ))}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.actionCard, { backgroundColor: '#F0F9FF' }]}
                            onPress={openNewCollectionModal}
                        >
                            <View style={[styles.actionIcon, { backgroundColor: '#38BDF8' }]}>
                                <Plus size={24} color="#fff" />
                            </View>
                            <Text style={styles.actionLabel}>New Collection</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionCard, { backgroundColor: '#F0FDF4' }]}>
                            <View style={[styles.actionIcon, { backgroundColor: '#10B981' }]}>
                                <BarChart2 size={24} color="#fff" />
                            </View>
                            <Text style={styles.actionLabel}>View Reports</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Segmented Control / Tabs */}
                <View style={styles.tabsContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'collections' && styles.activeTabButton]}
                        onPress={() => setActiveTab('collections')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'collections' && styles.activeTabButtonText]}>Collections</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'deliveries' && styles.activeTabButton]}
                        onPress={() => setActiveTab('deliveries')}
                    >
                        <Text style={[styles.tabButtonText, activeTab === 'deliveries' && styles.activeTabButtonText]}>Deliveries / Handover</Text>
                    </TouchableOpacity>
                </View>

                {activeTab === 'collections' ? (
                    /* Recent Collections */
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Recent Collections</Text>
                            <TouchableOpacity>
                                <Text style={styles.seeAll}>See All</Text>
                            </TouchableOpacity>
                        </View>

                        {orders.slice(0, 10).map((order) => {
                            const farmName = order.farmer?.farm_name || 'Farmer';
                            const initials = farmName
                                .split(' ')
                                .map(n => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase();

                            const productsStr = (order.items || [])
                                .map(item => item.product_name)
                                .join(', ');

                            const dateStr = order.created_at
                                ? new Date(order.created_at).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })
                                : 'Recently';

                            const totalWeight = (order.items || [])
                                .reduce((sum, item) => sum + parseFloat(item.quantity || 0), 0);

                            return (
                                <TouchableOpacity
                                    key={order.id}
                                    style={styles.collectionCard}
                                    onPress={() => handleViewOrderDetail(order.id)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <Text style={styles.orderLabel}>ORDER ID</Text>
                                            <Text style={styles.orderId}>#{order.order_id}</Text>
                                        </View>
                                        <View style={styles.statusBadgeWrapper}>
                                            <Text style={[
                                                styles.statusBadgeText,
                                                order.order_status === 'sent_to_collection' && styles.statusTransit,
                                                order.order_status === 'at_collection_center' && order.status === 'pending' && styles.statusReceived,
                                                order.status === 'ready' && styles.statusReady,
                                                order.status === 'assigned' && styles.statusAssigned,
                                            ]}>
                                                {order.order_status === 'sent_to_collection' ? 'In Transit' :
                                                    order.status === 'assigned' ? 'Delivery Assigned' :
                                                        order.status === 'ready' ? 'Ready' :
                                                            order.order_status === 'at_collection_center' ? 'Received' : order.status}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardBody}>
                                        <View style={styles.farmerRow}>
                                            <View style={styles.farmerAvatar}>
                                                <Text style={styles.avatarText}>{initials}</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.farmerName}>{farmName}</Text>
                                                <Text style={styles.farmerPhone}>{order.farmer?.phone || 'No phone'}</Text>
                                            </View>
                                        </View>

                                        <View style={styles.produceDetails}>
                                            <Text style={styles.detailsLabel}>Produce Items:</Text>
                                            <Text style={styles.productsText}>{productsStr}</Text>
                                            <Text style={styles.weightDetailText}>Total Weight: {totalWeight.toFixed(1)} kg</Text>
                                        </View>
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={styles.cardActions}>
                                        {order.order_status === 'sent_to_collection' ? (
                                            <TouchableOpacity
                                                style={styles.receiveButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleReceiveOrder(order.id);
                                                }}
                                            >
                                                <Text style={styles.actionButtonText}>Mark Received</Text>
                                            </TouchableOpacity>
                                        ) : (order.order_status === 'at_collection_center' && order.status === 'pending') ? (
                                            <TouchableOpacity
                                                style={styles.readyButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkOrderReady(order.id);
                                                }}
                                            >
                                                <Text style={styles.actionButtonText}>Mark Ready for Delivery</Text>
                                            </TouchableOpacity>
                                        ) : (order.status === 'ready' && order.order_status !== 'delivered' && order.order_status !== 'out_for_delivery' && order.order_status !== 'cancelled') ? (
                                            <TouchableOpacity
                                                style={styles.readyButton}
                                                onPress={(e) => {
                                                    e.stopPropagation();
                                                    handleMarkOrderReady(order.id);
                                                }}
                                            >
                                                <Text style={styles.actionButtonText}>Assign Delivery Boy (Retry)</Text>
                                            </TouchableOpacity>
                                        ) : order.status === 'assigned' ? (
                                            <View style={styles.assignedContainer}>
                                                <Text style={styles.assignedText}>✓ Dispatched & Assigned to Courier</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {orders.length === 0 && (
                            <View style={{ alignItems: 'center', marginVertical: 30 }}>
                                <Text style={{ color: '#64748B', fontWeight: '500' }}>No recent collections found</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    /* Active Deliveries / Handover */
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Active Deliveries</Text>
                        </View>

                        {deliveries.map((delivery) => {
                            return (
                                <View key={delivery.id} style={styles.collectionCard}>
                                    <View style={styles.cardHeader}>
                                        <View>
                                            <Text style={styles.orderLabel}>DELIVERY ID</Text>
                                            <Text style={styles.orderId}>#{delivery.id}</Text>
                                            <Text style={[styles.orderLabel, { marginTop: 4 }]}>ORDER ID: #{delivery.order_id}</Text>
                                        </View>
                                        <View style={styles.statusBadgeWrapper}>
                                            <Text style={[
                                                styles.statusBadgeText,
                                                delivery.status === 'picked_up' && styles.statusAssigned,
                                                (delivery.status === 'assigned' || delivery.status === 'accepted') && styles.statusTransit,
                                            ]}>
                                                {delivery.status === 'picked_up' ? 'Picked Up' : 
                                                 delivery.status === 'accepted' ? 'Accepted' : 'Courier Assigned'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.cardBody}>
                                        <View style={styles.farmerRow}>
                                            <View style={styles.farmerAvatar}>
                                                <Text style={styles.avatarText}>🚴</Text>
                                            </View>
                                            <View>
                                                <Text style={styles.farmerName}>{delivery.delivery_boy?.name || 'Rider'}</Text>
                                                <Text style={styles.farmerPhone}>{delivery.delivery_boy?.phone || 'No phone'}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {(delivery.status === 'assigned' || delivery.status === 'accepted') ? (
                                        <TouchableOpacity
                                            style={styles.readyButton}
                                            onPress={() => {
                                                setSelectedDelivery(delivery);
                                                setOtpModalVisible(true);
                                            }}
                                        >
                                            <Text style={styles.actionButtonText}>Handover (Verify OTP)</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={styles.assignedContainer}>
                                            <Text style={styles.assignedText}>✓ Dispatched & Handed Over</Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        {deliveries.length === 0 && (
                            <View style={{ alignItems: 'center', marginVertical: 30 }}>
                                <Text style={{ color: '#64748B', fontWeight: '500' }}>No active deliveries found</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                    <LogOut size={20} color="#EF4444" />
                    <Text style={styles.logoutText}>Logout Session</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>

        {/* ── New Collection Modal ───────────────────────── */}
        <Modal
            visible={modalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => setModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>New Collection</Text>
                            <Text style={styles.modalSubTitle}>Farmers who delivered offline</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={{ fontSize: 18, color: '#64748B', fontWeight: '700' }}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Body */}
                    <ScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.modalScrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {loadingPending ? (
                            <ActivityIndicator size="large" color="#38BDF8" style={{ marginTop: 40 }} />
                        ) : pendingOrders.length === 0 ? (
                            <View style={styles.emptyModal}>
                                <Text style={styles.emptyModalIcon}>📦</Text>
                                <Text style={styles.emptyModalTitle}>No Pending Orders</Text>
                                <Text style={styles.emptyModalText}>
                                    All farmer deliveries have been accounted for.
                                </Text>
                            </View>
                        ) : (
                            pendingOrders.map((order) => {
                                const farmName = order.farmer?.farm_name || 'Farmer';
                                const customerName = order.customer?.name || 'Customer';
                                const phone = order.farmer?.phone || '';
                                const productsStr = (order.items || [])
                                    .map(i => i.product_name)
                                    .join(', ') || 'No items';
                                const totalWeight = (order.items || [])
                                    .reduce((s, i) => s + parseFloat(i.quantity || 0), 0);
                                const isReceiving = receivingId === order.id;

                                return (
                                    <View key={order.id} style={styles.pendingCard}>
                                        {/* Order ID & Status */}
                                        <View style={styles.pendingCardHeader}>
                                            <View>
                                                <Text style={styles.pendingOrderLabel}>ORDER</Text>
                                                <Text style={styles.pendingOrderId}>#{order.id}</Text>
                                            </View>
                                            <View style={styles.pendingStatusBadge}>
                                                <Text style={styles.pendingStatusText}>
                                                    {order.status?.replace(/_/g, ' ').toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Farmer */}
                                        <View style={styles.pendingInfoRow}>
                                            <Text style={styles.pendingInfoLabel}>🌾 Farmer</Text>
                                            <Text style={styles.pendingInfoValue}>{farmName}</Text>
                                        </View>
                                        {phone ? (
                                            <View style={styles.pendingInfoRow}>
                                                <Text style={styles.pendingInfoLabel}>📞 Phone</Text>
                                                <Text style={styles.pendingInfoValue}>{phone}</Text>
                                            </View>
                                        ) : null}

                                        {/* Buyer */}
                                        <View style={styles.pendingInfoRow}>
                                            <Text style={styles.pendingInfoLabel}>🛒 Buyer</Text>
                                            <Text style={styles.pendingInfoValue}>{customerName}</Text>
                                        </View>

                                        {/* Produce */}
                                        <View style={styles.pendingProduceBox}>
                                            <Text style={styles.pendingProduceLabel}>Produce</Text>
                                            <Text style={styles.pendingProduceText}>{productsStr}</Text>
                                            <Text style={styles.pendingWeightText}>
                                                Total: {totalWeight.toFixed(1)} kg
                                            </Text>
                                        </View>

                                        {/* CTA */}
                                        <TouchableOpacity
                                            style={[styles.markReceivedBtn, isReceiving && { opacity: 0.6 }]}
                                            onPress={() => handleReceiveOffline(order.id)}
                                            disabled={isReceiving}
                                        >
                                            {isReceiving ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Text style={styles.markReceivedText}>✓ Mark as Received</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>

        {/* ── Order Detail Modal ─────────────────────────── */}
        <Modal
            visible={detailModalVisible}
            animationType="slide"
            transparent
            onRequestClose={() => {
                setDetailModalVisible(false);
                setSelectedOrder(null);
            }}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                        <View>
                            <Text style={styles.modalTitle}>Order Details</Text>
                            <Text style={styles.modalSubTitle}>Order ID: #{selectedOrder?.order_id || ''}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => {
                                setDetailModalVisible(false);
                                setSelectedOrder(null);
                            }}
                        >
                            <Text style={{ fontSize: 18, color: '#64748B', fontWeight: '700' }}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Modal Body */}
                    {loadingDetail ? (
                        <ActivityIndicator size="large" color="#38BDF8" style={{ marginTop: 40, marginBottom: 40 }} />
                    ) : !selectedOrder ? (
                        <View style={styles.emptyModal}>
                            <Text style={styles.emptyModalTitle}>No Details Available</Text>
                        </View>
                    ) : (
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.modalScrollContent} showsVerticalScrollIndicator={false}>
                            {/* Status Section */}
                            <View style={styles.detailSection}>
                                <Text style={styles.detailSectionTitle}>Status</Text>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabelText}>Order Status:</Text>
                                    <Text style={[styles.detailValueText, { fontWeight: '700' }]}>{selectedOrder.order_status?.toUpperCase()}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabelText}>Collection Status:</Text>
                                    <Text style={[styles.detailValueText, { fontWeight: '700' }]}>{selectedOrder.status?.toUpperCase()}</Text>
                                </View>
                            </View>

                            {/* Farmer Section */}
                            <View style={styles.detailSection}>
                                <Text style={styles.detailSectionTitle}>Farmer Information</Text>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabelText}>Farm Name:</Text>
                                    <Text style={styles.detailValueText}>{selectedOrder.farmer?.farm_name}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabelText}>Phone:</Text>
                                    <Text style={styles.detailValueText}>{selectedOrder.farmer?.phone}</Text>
                                </View>
                            </View>

                            {/* Customer Section */}
                            <View style={styles.detailSection}>
                                <Text style={styles.detailSectionTitle}>Customer & Delivery</Text>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabelText}>Customer Name:</Text>
                                    <Text style={styles.detailValueText}>{selectedOrder.customer?.name}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabelText}>Phone:</Text>
                                    <Text style={styles.detailValueText}>{selectedOrder.customer?.phone}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabelText}>Delivery Address:</Text>
                                    <Text style={[styles.detailValueText, { flex: 1, textAlign: 'right' }]}>{selectedOrder.customer?.address}</Text>
                                </View>
                            </View>

                            {/* Items Section */}
                            <View style={styles.detailSection}>
                                <Text style={styles.detailSectionTitle}>Produce Items</Text>
                                {(selectedOrder.items || []).map((item, index) => (
                                    <View key={item.id || index} style={styles.detailItemRow}>
                                        <View style={{ flex: 2 }}>
                                            <Text style={styles.detailItemName}>{item.product_name}</Text>
                                            <Text style={styles.detailItemQty}>{item.quantity} {item.unit}</Text>
                                        </View>
                                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                                            <Text style={styles.detailItemPrice}>₹{item.price}</Text>
                                            <Text style={styles.detailItemTotal}>₹{(item.quantity * item.price).toFixed(2)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>

                            {/* Action Buttons in Modal */}
                            <View style={{ marginTop: 24 }}>
                                {selectedOrder.order_status === 'sent_to_collection' ? (
                                    <TouchableOpacity
                                        style={styles.detailActionButtonReceived}
                                        onPress={() => {
                                            setDetailModalVisible(false);
                                            handleReceiveOrder(selectedOrder.id);
                                        }}
                                    >
                                        <Text style={styles.detailActionButtonText}>Mark Received from Farmer</Text>
                                    </TouchableOpacity>
                                ) : (selectedOrder.order_status === 'at_collection_center' && selectedOrder.status === 'pending') ? (
                                    <TouchableOpacity
                                        style={styles.detailActionButtonReady}
                                        onPress={() => {
                                            setDetailModalVisible(false);
                                            handleMarkOrderReady(selectedOrder.id);
                                        }}
                                    >
                                        <Text style={styles.detailActionButtonText}>Mark Ready for Delivery</Text>
                                    </TouchableOpacity>
                                ) : (selectedOrder.status === 'ready' && selectedOrder.order_status !== 'delivered' && selectedOrder.order_status !== 'out_for_delivery' && selectedOrder.order_status !== 'cancelled') ? (
                                    <TouchableOpacity
                                        style={styles.detailActionButtonReady}
                                        onPress={() => {
                                            setDetailModalVisible(false);
                                            handleMarkOrderReady(selectedOrder.id);
                                        }}
                                    >
                                        <Text style={styles.detailActionButtonText}>Assign Delivery Boy (Retry)</Text>
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </ScrollView>
                    )}
                </View>
            </View>
        </Modal>

        {/* ── OTP Verification Modal ─────────────────────── */}
        <Modal
            visible={otpModalVisible}
            animationType="fade"
            transparent
            onRequestClose={() => setOtpModalVisible(false)}
        >
            <View style={styles.otpOverlay}>
                <View style={styles.otpModalContent}>
                    <View style={styles.otpHeader}>
                        <Text style={styles.otpTitle}>Verify Handover OTP</Text>
                        <TouchableOpacity onPress={() => setOtpModalVisible(false)}>
                            <Text style={styles.otpCloseBtn}>✕</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.otpBody}>
                        <Text style={styles.otpInstructions}>
                            Enter the 6-digit OTP provided by {selectedDelivery?.delivery_boy?.name || 'the courier boy'} for Order #{selectedDelivery?.order_id}.
                        </Text>
                        
                        <TextInput
                            style={styles.otpInput}
                            placeholder="0 0 0 0 0 0"
                            placeholderTextColor="#94A3B8"
                            keyboardType="numeric"
                            maxLength={6}
                            value={otpInput}
                            onChangeText={setOtpInput}
                        />

                        <TouchableOpacity
                            style={styles.otpVerifyBtn}
                            onPress={handleVerifyOtp}
                            disabled={verifyingOtp}
                        >
                            {verifyingOtp ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.otpVerifyBtnText}>Verify & Complete Handover</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 40,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    greeting: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    centerName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileToggle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#F1F5F9',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
    },
    statCard: {
        width: (width - 44) / 2,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    },
    statIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    section: {
        paddingHorizontal: 24,
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 16,
    },
    seeAll: {
        fontSize: 14,
        color: '#38BDF8',
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 16,
    },
    actionCard: {
        flex: 1,
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    actionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    collectionCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 12,
        marginBottom: 12,
    },
    orderLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    statusBadgeWrapper: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        overflow: 'hidden',
        textAlign: 'center',
        backgroundColor: '#F1F5F9',
        color: '#64748B',
    },
    statusTransit: {
        backgroundColor: '#FEF3C7',
        color: '#D97706',
    },
    statusReceived: {
        backgroundColor: '#E0F2FE',
        color: '#0369A1',
    },
    statusReady: {
        backgroundColor: '#EEF2F6',
        color: '#475569',
    },
    statusAssigned: {
        backgroundColor: '#DCFCE7',
        color: '#15803D',
    },
    cardBody: {
        marginBottom: 16,
    },
    farmerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    farmerPhone: {
        fontSize: 12,
        color: '#64748B',
    },
    produceDetails: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 12,
    },
    detailsLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94A3B8',
        marginBottom: 4,
    },
    productsText: {
        fontSize: 14,
        color: '#334155',
        fontWeight: '600',
        marginBottom: 4,
    },
    weightDetailText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0EA5E9',
    },
    cardActions: {
        marginTop: 4,
    },
    receiveButton: {
        backgroundColor: '#D97706',
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
    },
    readyButton: {
        backgroundColor: '#0EA5E9',
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    assignedContainer: {
        backgroundColor: '#DCFCE7',
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
    },
    assignedText: {
        color: '#15803D',
        fontSize: 14,
        fontWeight: '700',
    },
    farmerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0F9FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#38BDF8',
        fontWeight: '700',
        fontSize: 14,
    },
    farmerName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 24,
        marginTop: 32,
        padding: 16,
        borderRadius: 20,
        backgroundColor: '#FEF2F2',
        gap: 8,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#EF4444',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#F8FAFC',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        maxHeight: '90%',
        minHeight: '60%',
        paddingBottom: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 16,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderBottomWidth: 1,
        borderBottomColor: '#E2E8F0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    closeModalButton: {
        padding: 6,
        borderRadius: 50,
        backgroundColor: '#F1F5F9',
    },
    modalSubTitle: {
        fontSize: 13,
        color: '#64748B',
        marginHorizontal: 24,
        marginTop: 16,
        marginBottom: 16,
        lineHeight: 18,
        fontWeight: '500',
    },
    modalScrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40,
    },
    emptyModal: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 24,
    },
    emptyModalIcon: {
        fontSize: 52,
        marginBottom: 16,
    },
    emptyModalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
    },
    emptyModalText: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
    },
    pendingCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2,
    },
    pendingCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    pendingOrderLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.8,
    },
    pendingOrderId: {
        fontSize: 17,
        fontWeight: '800',
        color: '#0F172A',
        marginTop: 2,
    },
    pendingStatusBadge: {
        backgroundColor: '#FEF3C7',
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    pendingStatusText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#D97706',
    },
    pendingInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    pendingInfoLabel: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    pendingInfoValue: {
        fontSize: 13,
        color: '#1E293B',
        fontWeight: '600',
        flex: 1,
        textAlign: 'right',
    },
    pendingProduceBox: {
        backgroundColor: '#F0F9FF',
        borderRadius: 14,
        padding: 12,
        marginTop: 8,
        marginBottom: 14,
    },
    pendingProduceLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#0EA5E9',
        marginBottom: 4,
        letterSpacing: 0.5,
    },
    pendingProduceText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 4,
    },
    pendingWeightText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0369A1',
    },
    markReceivedBtn: {
        backgroundColor: '#10B981',
        borderRadius: 14,
        paddingVertical: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    markReceivedText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        marginTop: 20,
        gap: 12,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    activeTabButton: {
        backgroundColor: '#38BDF8',
        borderColor: '#38BDF8',
    },
    tabButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    activeTabButtonText: {
        color: '#FFFFFF',
    },
    detailSection: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    detailSectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#0F172A',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 6,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    detailLabelText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    detailValueText: {
        fontSize: 13,
        color: '#1E293B',
        fontWeight: '600',
    },
    detailItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
    },
    detailItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
    },
    detailItemQty: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    detailItemPrice: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '500',
    },
    detailItemTotal: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0EA5E9',
    },
    detailActionButtonReceived: {
        backgroundColor: '#D97706',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    detailActionButtonReady: {
        backgroundColor: '#0EA5E9',
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
    },
    detailActionButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
    otpOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    otpModalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 28,
        width: '100%',
        padding: 24,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    otpHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    otpTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#0F172A',
    },
    otpCloseBtn: {
        fontSize: 18,
        fontWeight: '700',
        color: '#64748B',
        padding: 4,
    },
    otpBody: {
        alignItems: 'center',
        width: '100%',
    },
    otpInstructions: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 20,
    },
    otpInput: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingVertical: 14,
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        textAlign: 'center',
        letterSpacing: 8,
        marginBottom: 20,
    },
    otpVerifyBtn: {
        backgroundColor: '#10B981',
        borderRadius: 16,
        paddingVertical: 14,
        width: '100%',
        alignItems: 'center',
    },
    otpVerifyBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default CollectionCenterDashboardScreen;
