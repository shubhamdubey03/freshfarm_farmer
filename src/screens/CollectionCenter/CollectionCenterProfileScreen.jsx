import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Image,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    LayoutDashboard,
    User,
    LogOut,
    ChevronRight,
    Globe,
    MapPin,
    Phone,
    User as UserIcon
} from 'lucide-react-native';
import { API_URLS } from '../../config/api';
import { apiFunction } from '../../config/apifunction';
import { ActivityIndicator } from 'react-native';


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

const CollectionCenterProfileScreen = ({ onNavigateDashboard, onNavigateEditProfile, onLogout }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await apiFunction(API_URLS.COLLECTION_PROFILE, [], {}, 'get', true);
            console.log("Collection Center profile data:", response.data);
            if (response.data) {
                setProfile(response.data);
            }
        } catch (error) {
            console.error('Collection Center Profile fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const defaultAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop';

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
                                        source={{ uri: profile?.image || defaultAvatar }}
                                        style={styles.avatar}
                                    />
                                    {profile?.is_verified && (
                                        <View style={styles.verifiedBadge}>
                                            <Text style={styles.verifiedText}>VERIFIED</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.centerNameText}>{profile?.center_name || 'Collection Center'}</Text>
                                <Text style={styles.ownerNameText}>
                                    {(profile?.first_name || profile?.last_name) 
                                        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
                                        : profile?.username || 'Owner'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Profile Information Card */}
                    {!loading && profile && (
                        <View style={styles.infoCard}>
                            <Text style={styles.cardTitle}>Center Details</Text>
                            
                            <View style={styles.infoRow}>
                                <Phone size={18} color="#64748B" />
                                <Text style={styles.infoText}>{profile.phone || 'No phone number'}</Text>
                            </View>

                            <View style={styles.infoRow}>
                                <MapPin size={18} color="#64748B" />
                                <Text style={styles.infoText}>
                                    {profile.address ? `${profile.address}, ` : ''}
                                    {profile.city ? `${profile.city}, ` : ''}
                                    {profile.state || ''}
                                </Text>
                            </View>

                            {(profile.latitude && profile.longitude) && (
                                <View style={styles.infoRow}>
                                    <MapPin size={18} color="#64748B" />
                                    <Text style={styles.infoText}>
                                        Coordinates: {parseFloat(profile.latitude).toFixed(4)}, {parseFloat(profile.longitude).toFixed(4)}
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Menu Options Group */}
                    <View style={styles.menuGroup}>
                        <MenuItem icon={UserIcon} title="Edit Profile Details" onPress={onNavigateEditProfile} />
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
    centerNameText: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 4,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    ownerNameText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
    infoCard: {
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
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    infoText: {
        fontSize: 14,
        color: '#475569',
        fontWeight: '500',
        flex: 1,
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

export default CollectionCenterProfileScreen;
