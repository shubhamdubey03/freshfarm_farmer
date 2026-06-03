import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    Modal,
    Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Bell,
    ShoppingBasket,
    DollarSign,
    TrendingUp,
    LayoutDashboard,
    ClipboardList,
    Package,
    User,
    Plus,
    CheckCircle2
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, percentage, icon: Icon, color }) => (
    <View style={styles.statCard}>
        <View style={styles.statHeader}>
            <Text style={styles.statTitle}>{title}</Text>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Icon size={20} color={color} />
            </View>
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <View style={styles.statFooter}>
            <TrendingUp size={16} color="#10B981" />
            <Text style={styles.statPercentage}>{percentage}</Text>
        </View>
    </View>
);

import { API_URLS } from '../../config/api';
import { apiFunction } from '../../config/apifunction';
import { useAuth } from '../../context/AuthContext';

const ProductItem = ({ name, category, sales, image, unit, harvest }) => (
    <View style={styles.productItem}>
        <Image
            source={{ uri: image }}
            style={styles.productImage}
        />
        <View style={styles.productInfo}>
            <Text style={styles.productName}>{name}</Text>
            <Text style={styles.productCategory}>{category || 'Fresh Harvest'}</Text>
            {harvest && (
                <Text style={styles.harvestDate}>
                    Harvest date: {new Date(harvest).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                </Text>
            )}
        </View>
        <View style={styles.productSales}>
            <Text style={styles.salesCount}>{sales}</Text>
            <Text style={styles.salesLabel}>{unit || 'KG'}</Text>
        </View>
    </View>
);

const VendorDashboardScreen = ({ onNavigateOrders, onNavigateStock, onNavigateProfile, onAddProduct, onLogout }) => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [todaysOrders, setTodaysOrders] = useState(0);
    const [newOrdersCount, setNewOrdersCount] = useState(0);
    const [readyOrdersCount, setReadyOrdersCount] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [loading, setLoading] = useState(true);

    // New order notification & countdown states
    const [incomingOrder, setIncomingOrder] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isAccepting, setIsAccepting] = useState(false);

    useEffect(() => {
        // Initial fetch
        fetchDashboardData();

        // Setup polling interval every 5 seconds
        const pollInterval = setInterval(() => {
            fetchDashboardData();
        }, 5000);

        return () => clearInterval(pollInterval);
    }, []);

    // Countdown Timer logic
    useEffect(() => {
        if (!incomingOrder) return;
        if (timeLeft <= 0) {
            setIncomingOrder(null);
            return;
        }
        const timer = setTimeout(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [incomingOrder, timeLeft]);

    const fetchDashboardData = async () => {
        try {
            // Fetch Profile
            const profileRes = await apiFunction(`${API_URLS.VENDOR_PROFILE}`, [], {}, 'get', true);
            if (profileRes.data && !profileRes.data.detail) {
                setProfile(profileRes.data);
            }

            // Fetch Orders
            const ordersRes = await apiFunction(API_URLS.VENDOR_ORDERS, [], {}, 'get', true);
            if (ordersRes.data && ordersRes.data.results) {
                let readyIds = [];
                try {
                    const stored = await AsyncStorage.getItem('readyOrderIds');
                    if (stored) readyIds = JSON.parse(stored);
                } catch (e) {
                    console.error('Failed to load readyOrderIds', e);
                }

                let rev = 0;

                // Fetch vendor earnings summary
                try {
                    const earningsRes = await apiFunction(API_URLS.VENDOR_EARNINGS_SUMMARY, [], {}, 'get', true);
                    if (earningsRes.data) {
                        rev = parseFloat(earningsRes.data.total_earned) || 0;
                    }
                } catch (e) {
                    console.error('Failed to load vendor earnings summary', e);
                }

                let readyCount = 0;
                let newCount = 0;
                let tOrders = 0;
                const today = new Date().toISOString().split('T')[0];

                const newNotifs = [];

                ordersRes.data.results.forEach(o => {
                    if (readyIds.includes(o.id.toString())) {
                        readyCount++;
                    } else {
                        newCount++;
                    }
                    if (o.batch_date === today) {
                        tOrders++;
                    }

                    // Dynamically populate notifications based on order status
                    if (o.status === 'assigned') {
                        newNotifs.push({
                            id: `notif_assigned_${o.id}`,
                            title: '🛒 Incoming Order Request!',
                            body: `Order #${o.order_id} for ₹${o.total_price} is waiting for acceptance.`,
                            time: 'Just now',
                            type: 'assigned',
                            orderId: o.id
                        });
                    } else if (o.status === 'accepted') {
                        newNotifs.push({
                            id: `notif_accepted_${o.id}`,
                            title: '📦 Order In Progress',
                            body: `Order #${o.order_id} has been accepted. Please pack it.`,
                            time: 'Today',
                            type: 'accepted',
                        });
                    }
                });

                setNotifications(newNotifs);
                setTodaysOrders(tOrders);
                setTotalRevenue(rev);
                setReadyOrdersCount(readyCount);
                setNewOrdersCount(newCount);

                // Auto-trigger Incoming Order Popup if there is an assigned order
                const assignedOrder = ordersRes.data.results.find(o => o.status === 'assigned');
                if (assignedOrder) {
                    if (!incomingOrder || incomingOrder.id.toString() !== assignedOrder.id.toString()) {
                        setIncomingOrder({
                            id: assignedOrder.id,
                            order_id: assignedOrder.order_id,
                            total_price: assignedOrder.total_price,
                            customer_name: assignedOrder.customer_name || 'Customer',
                            items: assignedOrder.items || [],
                        });
                        setTimeLeft(30);
                    }
                } else {
                    setIncomingOrder(null);
                }
            }
        } catch (error) {
            console.error('Dashboard data fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptOrder = async (orderId) => {
        setIsAccepting(true);
        try {
            const res = await apiFunction(API_URLS.VENDOR_ORDER_ACCEPT(orderId), [], {}, 'post', true);
            if (res.status === 200 || res.status === 201) {
                Alert.alert('Success', 'Order accepted successfully!');
                setIncomingOrder(null);
                fetchDashboardData();
            } else {
                Alert.alert('Error', res.data?.error || 'Failed to accept order.');
            }
        } catch (e) {
            console.error('Error accepting order:', e);
            Alert.alert('Error', 'An error occurred while accepting order.');
        } finally {
            setIsAccepting(false);
        }
    };

    const handleDeclineOrder = () => {
        setIncomingOrder(null);
    };
    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Header Section */}
            <LinearGradient
                colors={['#38BDF8', '#0EA5E9']}
                style={styles.header}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
                        <View style={styles.userInfo}>
                            <Image
                                source={{ uri: profile?.profile_image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400' }}
                                style={styles.avatar}
                            />
                            <View>
                                <Text style={styles.welcomeText}>Welcome back,</Text>
                                <Text style={styles.userName}>
                                    {profile
                                        ? ((profile.first_name && profile.last_name)
                                            ? `${profile.first_name} ${profile.last_name}`
                                            : profile.first_name || profile.farm_name || profile.username || 'FreshFarm Vendor')
                                        : 'FreshFarm Vendor'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.notificationButton} onPress={() => setShowNotifications(true)}>
                            <Bell size={24} color="#FFF" />
                            {notifications.length > 0 && <View style={styles.notificationDot} />}
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </LinearGradient>

            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Stats Row 1 */}
                <View style={styles.statsRow}>
                    <StatCard
                        title="TODAY'S ORDERS"
                        value={todaysOrders.toString()}
                        percentage="Today"
                        icon={ShoppingBasket}
                        color="#38BDF8"
                    />
                    <StatCard
                        title="REVENUE"
                        value={`₹${totalRevenue.toFixed(0)}`}
                        percentage="Total"
                        icon={DollarSign}
                        color="#10B981"
                    />
                </View>

                {/* Stats Row 2 */}
                <View style={styles.statsRow}>
                    <StatCard
                        title="NEW ORDERS"
                        value={newOrdersCount.toString()}
                        percentage="Pending"
                        icon={Package}
                        color="#F59E0B"
                    />
                    <StatCard
                        title="READY ORDERS"
                        value={readyOrdersCount.toString()}
                        percentage="Ready"
                        icon={CheckCircle2}
                        color="#8B5CF6"
                    />
                </View>

                {/* Performance Chart Placeholder */}
                <View style={styles.performanceCard}>
                    <View style={styles.performanceHeader}>
                        <Text style={styles.performanceTitle}>Weekly Performance</Text>
                        <TouchableOpacity>
                            <Text style={styles.detailsLink}>Details</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.chartPlaceholder}>
                        {/* Mock Chart using SVG */}
                        <Svg height="120" width={width - 80}>
                            <Path
                                d="M0,80 Q40,60 80,100 T160,40 T240,60 T320,20"
                                fill="none"
                                stroke="#38BDF8"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </Svg>
                        <View style={styles.chartLabels}>
                            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                                <Text key={day} style={styles.dayLabel}>{day}</Text>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom Navigation */}
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <LayoutDashboard size={24} color="#38BDF8" />
                    <Text style={[styles.navText, styles.activeNavText]}>DASHBOARD</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={onNavigateOrders}>
                    <ClipboardList size={24} color="#94A3B8" />
                    <Text style={styles.navText}>ORDERS</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={onNavigateProfile}>
                    <User size={24} color="#94A3B8" />
                    <Text style={styles.navText}>PROFILE</Text>
                </TouchableOpacity>
            </View>

            {/* INCOMING ORDER MODAL (30s COUNTDOWN) */}
            <Modal
                visible={incomingOrder !== null}
                transparent={true}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.incomingOrderContainer}>
                        <LinearGradient
                            colors={['#EF4444', '#F59E0B']}
                            style={styles.incomingHeader}
                        >
                            <Text style={styles.incomingAlertTitle}>INCOMING ORDER REQUEST</Text>
                            <Text style={styles.incomingTimerText}>{timeLeft}s remaining</Text>
                        </LinearGradient>

                        <View style={styles.incomingBody}>
                            <View style={styles.timerCircleContainer}>
                                <View style={styles.timerCircle}>
                                    <Text style={styles.timerNumber}>{timeLeft}</Text>
                                    <Text style={styles.timerSec}>SEC</Text>
                                </View>
                            </View>

                            <View style={styles.incomingDetails}>
                                <Text style={styles.incomingLabel}>CUSTOMER</Text>
                                <Text style={styles.incomingValue}>{incomingOrder?.customer_name}</Text>

                                <Text style={styles.incomingLabel}>TOTAL EARNINGS (90%)</Text>
                                <Text style={styles.incomingPrice}>
                                    ₹{(parseFloat(incomingOrder?.total_price || 0) * 0.9).toFixed(2)}
                                </Text>

                                <Text style={styles.incomingLabel}>ITEMS</Text>
                                <ScrollView style={styles.modalItemsScroll} nestedScrollEnabled={true}>
                                    {(incomingOrder?.items || []).map((item, idx) => (
                                        <Text key={idx} style={styles.modalItemRow}>
                                            • {item.product_name} x {item.quantity} {item.unit || 'units'}
                                        </Text>
                                    ))}
                                </ScrollView>
                            </View>

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.modalButton, styles.declineButton]}
                                    onPress={handleDeclineOrder}
                                >
                                    <Text style={styles.declineButtonText}>Decline</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalButton, styles.acceptButton]}
                                    onPress={() => handleAcceptOrder(incomingOrder.id)}
                                    disabled={isAccepting}
                                >
                                    {isAccepting ? (
                                        <ActivityIndicator size="small" color="#FFF" />
                                    ) : (
                                        <Text style={styles.acceptButtonText}>Accept Order</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* NOTIFICATIONS LIST MODAL */}
            <Modal
                visible={showNotifications}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowNotifications(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.notificationsContainer}>
                        <View style={styles.notifHeader}>
                            <Text style={styles.notifHeaderTitle}>Notifications</Text>
                            <TouchableOpacity onPress={() => setShowNotifications(false)}>
                                <Text style={styles.closeNotifText}>Close</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.notifList}>
                            {notifications.length === 0 ? (
                                <View style={styles.emptyNotifContainer}>
                                    <Text style={styles.emptyNotifText}>No notifications at the moment.</Text>
                                </View>
                            ) : (
                                notifications.map((notif) => (
                                    <TouchableOpacity
                                        key={notif.id}
                                        style={styles.notifItem}
                                        onPress={() => {
                                            if (notif.type === 'assigned') {
                                                setShowNotifications(false);
                                                fetchDashboardData();
                                            }
                                        }}
                                    >
                                        <View style={styles.notifRow}>
                                            <Text style={styles.notifTitleText}>{notif.title}</Text>
                                            <Text style={styles.notifTimeText}>{notif.time}</Text>
                                        </View>
                                        <Text style={styles.notifBodyText}>{notif.body}</Text>
                                    </TouchableOpacity>
                                ))
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    welcomeText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '500',
    },
    userName: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '800',
    },
    notificationButton: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 8,
        height: 8,
        backgroundColor: '#FF4B4B',
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: '#38BDF8',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 100,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    statTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
        maxWidth: '70%',
    },
    iconBox: {
        padding: 8,
        borderRadius: 12,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
    },
    statFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statPercentage: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10B981',
    },
    performanceCard: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        marginBottom: 24,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    performanceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    performanceTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    detailsLink: {
        fontSize: 14,
        fontWeight: '700',
        color: '#38BDF8',
    },
    chartPlaceholder: {
        alignItems: 'center',
    },
    chartLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    dayLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
    },
    productsSection: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    viewAllLink: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    productItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        padding: 12,
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    productImage: {
        width: 56,
        height: 56,
        borderRadius: 16,
    },
    productInfo: {
        flex: 1,
        marginLeft: 16,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
    },
    productCategory: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
    harvestDate: {
        fontSize: 11,
        color: '#38BDF8',
        fontWeight: '600',
        marginTop: 2,
    },
    productSales: {
        alignItems: 'flex-end',
        paddingRight: 8,
    },
    salesCount: {
        fontSize: 16,
        fontWeight: '800',
        color: '#38BDF8',
    },
    salesLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
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
    emptyState: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#FFF',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    emptyText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '500',
    },
    addLink: {
        fontSize: 14,
        color: '#38BDF8',
        fontWeight: '700',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    incomingOrderContainer: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    incomingHeader: {
        paddingVertical: 20,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    incomingAlertTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 1,
    },
    incomingTimerText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '600',
        marginTop: 4,
        opacity: 0.9,
    },
    incomingBody: {
        padding: 24,
        alignItems: 'center',
    },
    timerCircleContainer: {
        marginBottom: 20,
    },
    timerCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#EF4444',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FEF2F2',
    },
    timerNumber: {
        fontSize: 28,
        fontWeight: '900',
        color: '#EF4444',
    },
    timerSec: {
        fontSize: 10,
        fontWeight: '800',
        color: '#EF4444',
        marginTop: -2,
    },
    incomingDetails: {
        width: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    incomingLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    incomingValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
    },
    incomingPrice: {
        fontSize: 24,
        fontWeight: '900',
        color: '#10B981',
        marginBottom: 12,
    },
    modalItemsScroll: {
        maxHeight: 100,
        marginTop: 4,
    },
    modalItemRow: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '600',
        marginVertical: 2,
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineButton: {
        backgroundColor: '#F1F5F9',
    },
    declineButtonText: {
        color: '#475569',
        fontSize: 15,
        fontWeight: '700',
    },
    acceptButton: {
        backgroundColor: '#10B981',
    },
    acceptButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '800',
    },
    notificationsContainer: {
        width: '100%',
        maxHeight: '80%',
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
    },
    notifHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        paddingBottom: 12,
    },
    notifHeaderTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#1E293B',
    },
    closeNotifText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#38BDF8',
    },
    notifList: {
        width: '100%',
    },
    emptyNotifContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyNotifText: {
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '600',
    },
    notifItem: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    notifRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    notifTitleText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1E293B',
        flex: 1,
    },
    notifTimeText: {
        fontSize: 11,
        color: '#94A3B8',
        fontWeight: '600',
    },
    notifBodyText: {
        fontSize: 13,
        color: '#475569',
        fontWeight: '500',
        lineHeight: 18,
    },
});

export default VendorDashboardScreen;
