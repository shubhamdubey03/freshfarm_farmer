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

const FarmerDashboardScreen = ({ onNavigateOrders, onNavigateStock, onNavigateProfile, onAddProduct, onLogout }) => {
    const [profile, setProfile] = useState(null);
    const [todaysOrders, setTodaysOrders] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [newOrdersCount, setNewOrdersCount] = useState(0);
    const [readyOrdersCount, setReadyOrdersCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch Profile
            const profileRes = await apiFunction(API_URLS.FARMER_PROFILE, [], {}, 'get', true);
            if (profileRes.data) {
                setProfile(profileRes.data);
            }

            // Fetch Orders
            const ordersRes = await apiFunction(API_URLS.FARMER_ORDERS, [], {}, 'get', true);
            if (ordersRes.data && ordersRes.data.results) {
                // Get ready states from AsyncStorage
                let readyIds = [];
                try {
                    const stored = await AsyncStorage.getItem('readyOrderIds');
                    if (stored) readyIds = JSON.parse(stored);
                } catch (e) {
                    console.error('Failed to load readyOrderIds', e);
                }

                const today = new Date().toISOString().split('T')[0];
                const tOrders = ordersRes.data.results.filter(o => o.batch_date === today).length;

                const rev = ordersRes.data.results.reduce((sum, o) => {
                    const price = parseFloat(o.price) || 0;
                    return sum + price;
                }, 0);

                let readyCount = 0;
                let newCount = 0;
                ordersRes.data.results.forEach(o => {
                    if (readyIds.includes(o.id.toString())) {
                        readyCount++;
                    } else {
                        newCount++;
                    }
                });

                setTodaysOrders(tOrders);
                setTotalRevenue(rev);
                setReadyOrdersCount(readyCount);
                setNewOrdersCount(newCount);
            }
        } catch (error) {
            console.error('Dashboard data fetch error:', error);
        } finally {
            setLoading(false);
        }
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
                                source={{ uri: profile?.image || 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400' }}
                                style={styles.avatar}
                            />
                            <View>
                                <Text style={styles.welcomeText}>Welcome back,</Text>
                                <Text style={styles.userName}>
                                    {profile
                                        ? ((profile.first_name && profile.last_name)
                                            ? `${profile.first_name} ${profile.last_name}`
                                            : profile.first_name || profile.farm_name || 'Green Valley Farm')
                                        : 'Green Valley Farm'}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.notificationButton}>
                            <Bell size={24} color="#FFF" />
                            <View style={styles.notificationDot} />
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
                <TouchableOpacity style={styles.navItem} onPress={onNavigateStock}>
                    <Package size={24} color="#94A3B8" />
                    <Text style={styles.navText}>STOCK</Text>
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
});

export default FarmerDashboardScreen;
