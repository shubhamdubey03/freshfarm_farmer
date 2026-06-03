import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar,
    Switch,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    LayoutDashboard,
    ClipboardList,
    Package,
    User,
    LogOut,
    ChevronRight,
    Power,
    Sprout,
    CreditCard,
    Truck,
    History,
    Globe,
    Star,
    CheckCircle2
} from 'lucide-react-native';
import { API_URLS } from '../../config/api';
import { apiFunction } from '../../config/apifunction';
import { ActivityIndicator } from 'react-native';

const { width } = Dimensions.get('window');

const MenuItem = ({ icon: Icon, title, extra, isLast, onPress }) => (
    <TouchableOpacity style={[styles.menuItem, !isLast && styles.menuItemBorder]} onPress={onPress}>
        <View style={styles.menuItemLeft}>
            <View style={styles.iconWrapper}>
                <Icon size={20} color="#38BDF8" />
            </View>
            <Text style={styles.menuItemTitle}>{title}</Text>
        </View>
        <View style={styles.menuItemRight}>
            {extra && <Text style={styles.extraText}>{extra}</Text>}
            <ChevronRight size={18} color="#CBD5E1" />
        </View>
    </TouchableOpacity>
);

const VendorProfileScreen = ({ onNavigateDashboard, onNavigateOrders, onNavigateStock, onNavigateFarmSettings, onNavigatePaymentSettings, onNavigateDeliveryPreferences, onNavigatePayoutHistory, onNavigateEditProfile, onLogout }) => {
    const { user } = useAuth();
    const [isAcceptingOrders, setIsAcceptingOrders] = useState(true);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await apiFunction(API_URLS.VENDOR_PROFILE, [], {}, 'get', true);
            console.log("profile data", response.data);
            if (response.data) {
                setProfile(response.data);
            }
        } catch (error) {
            console.error('Profile fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Header/Profile Info */}
                    <TouchableOpacity style={styles.profileHeader} onPress={onNavigateEditProfile} activeOpacity={0.7}>
                        {loading ? (
                            <ActivityIndicator color="#38BDF8" style={{ height: 120 }} />
                        ) : (
                            <>
                                <View style={styles.avatarContainer}>
                                    <Image
                                        source={{ uri: profile?.profile_image }}
                                        style={styles.avatar}
                                    />
                                    <View style={styles.verifiedBadge}>
                                        <Text style={styles.verifiedText}>VERIFIED</Text>
                                    </View>
                                </View>
                                <Text style={styles.farmName}>{profile?.first_name + ' ' + profile?.last_name}</Text>
                                {/* <View style={styles.ratingRow}>
                                    <Star size={14} color="#F59E0B" fill="#F59E0B" /> */}
                                {/* <Text style={styles.ratingText}>4.9</Text>
                                    <Text style={styles.reviewText}>(128 reviews)</Text> */}
                                {/* </View> */}
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Accepting Orders Toggle */}
                    <View style={styles.toggleCard}>
                        <View style={styles.toggleRow}>
                            <View style={styles.toggleInfo}>
                                <View style={styles.powerIconWrapper}>
                                    <Power size={20} color="#94A3B8" />
                                </View>
                                <View>
                                    <Text style={styles.toggleTitle}>Accepting Orders</Text>
                                    <Text style={styles.toggleSubtext}>Switch off to stop receiving orders</Text>
                                </View>
                            </View>
                            <Switch
                                trackColor={{ false: '#E2E8F0', true: '#38BDF8' }}
                                thumbColor={isAcceptingOrders ? '#FFFFFF' : '#F8FAFC'}
                                ios_backgroundColor="#E2E8F0"
                                onValueChange={setIsAcceptingOrders}
                                value={isAcceptingOrders}
                            />
                        </View>
                    </View>

                    {/* Menu Options Group */}
                    <View style={styles.menuGroup}>
                        <MenuItem icon={Sprout} title="Vendor Settings" onPress={onNavigateFarmSettings} />
                        <MenuItem icon={CreditCard} title="Payment Settings" onPress={onNavigatePaymentSettings} />
                        <MenuItem icon={Truck} title="Delivery Preferences" onPress={onNavigateDeliveryPreferences} />
                        <MenuItem icon={History} title="Payout History" onPress={onNavigatePayoutHistory} />
                        <MenuItem icon={Globe} title="Language" extra="English" isLast={true} />
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                        <LogOut size={20} color="#EF4444" />
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>

                </ScrollView>
            </SafeAreaView>

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
                    <User size={24} color="#38BDF8" />
                    <Text style={[styles.navText, styles.activeNavText]}>PROFILE</Text>
                </TouchableOpacity>
            </View>
        </View >
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
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 120,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: '#FFF',
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E0F2FE',
        borderWidth: 4,
        borderColor: '#E0F2FE',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: -5,
        alignSelf: 'center',
        backgroundColor: '#38BDF8',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    verifiedText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    farmName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 8,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E293B',
        marginLeft: 4,
    },
    reviewText: {
        fontSize: 14,
        color: '#94A3B8',
        marginLeft: 4,
        fontWeight: '500',
    },
    toggleCard: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 24,
        borderRadius: 24,
        padding: 20,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    },
    toggleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    powerIconWrapper: {
        width: 44,
        height: 44,
        backgroundColor: '#F1F5F9',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    toggleSubtext: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    },
    menuGroup: {
        backgroundColor: '#FFF',
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 24,
        paddingHorizontal: 16,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 10,
        elevation: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    iconWrapper: {
        width: 40,
        height: 40,
        backgroundColor: '#E0F2FE',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuItemTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#334155',
    },
    menuItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    extraText: {
        fontSize: 14,
        color: '#94A3B8',
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 30,
        marginBottom: 20,
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#EF4444',
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
        width: '100%',
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

export default VendorProfileScreen;
