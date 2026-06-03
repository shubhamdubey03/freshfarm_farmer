import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    Animated,
    Alert,
} from 'react-native';
import { Tractor, ShoppingBasket, ArrowRight, Warehouse } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const RoleSelectionScreen = ({ onContinue, onLogin }) => {
    const [selectedRole, setSelectedRole] = useState(null);

    const handleContinue = () => {
        if (!selectedRole) {
            Alert.alert('Selection Required', 'Please select a role to continue.');
            return;
        }
        onContinue(selectedRole);
    };

    const handleLogin = () => {
        if (!selectedRole) {
            Alert.alert('Selection Required', 'Please select a role to login.');
            return;
        }
        onLogin(selectedRole);
    };
    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    const roles = [
        {
            id: 'farmer',
            title: 'Farmer',
            description: 'Sell your fresh harvest directly',
            icon: Tractor,
        },
        {
            id: 'vendor',
            title: 'Vendor',
            description: 'Market and sell your products',
            icon: ShoppingBasket,
        },
        {
            id: 'collection_center',
            title: 'Collection Center',
            description: 'Manage produce collection',
            icon: Warehouse,
        },
    ];

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <LinearGradient
                colors={['#F0F9FF', '#FFFFFF']}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.title}>Choose Your Role</Text>
                            <Text style={styles.subtitle}>Join our farm-to-table community</Text>
                        </Animated.View>

                        <View style={styles.rolesList}>
                            {roles.map((role, index) => {
                                const Icon = role.icon;
                                const isSelected = selectedRole === role.id;

                                return (
                                    <View
                                        key={role.id}
                                    >
                                        <TouchableOpacity
                                            style={[
                                                styles.roleCard,
                                                isSelected && styles.roleCardActive
                                            ]}
                                            onPress={() => setSelectedRole(role.id)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={[styles.iconContainer, isSelected && styles.iconContainerActive]}>
                                                <Icon size={28} color={isSelected ? '#0EA5E9' : '#94A3B8'} strokeWidth={2} />
                                            </View>
                                            <View style={styles.roleInfo}>
                                                <Text style={styles.roleTitle}>{role.title}</Text>
                                                <Text style={styles.roleDescription}>{role.description}</Text>
                                            </View>
                                            <View style={[
                                                styles.radioButton,
                                                isSelected && styles.radioButtonActive
                                            ]}>
                                                {isSelected && <View style={styles.radioButtonInner} />}
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                );
                            })}
                        </View>

                        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                            <TouchableOpacity
                                style={styles.continueButton}
                                activeOpacity={0.8}
                                onPress={handleContinue}
                            >
                                <Text style={styles.continueButtonText}>Continue to Signup</Text>
                                <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.loginContainer} onPress={handleLogin}>
                                <Text style={styles.loginText}>
                                    Already have an account? <Text style={styles.loginLink}>Login</Text>
                                </Text>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        paddingBottom: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
        textAlign: 'center',
    },
    rolesList: {
        gap: 16,
    },
    roleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    roleCardActive: {
        borderColor: '#38BDF8',
        backgroundColor: '#FFFFFF',
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 4,
    },
    iconContainer: {
        width: 56,
        height: 56,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    iconContainerActive: {
        backgroundColor: '#F0F9FF',
    },
    roleInfo: {
        flex: 1,
    },
    roleTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 2,
    },
    roleDescription: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '400',
    },
    radioButton: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#CBD5E1',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    radioButtonActive: {
        borderColor: '#38BDF8',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#38BDF8',
    },
    footer: {
        marginTop: 'auto',
        alignItems: 'center',
        gap: 16,
        paddingBottom: 20,
    },
    continueButton: {
        width: '100%',
        height: 58,
        backgroundColor: '#38BDF8',
        borderRadius: 29,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 4,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    loginContainer: {
        paddingVertical: 8,
    },
    loginText: {
        fontSize: 15,
        color: '#64748B',
        fontWeight: '500',
    },
    loginLink: {
        color: '#38BDF8',
        fontWeight: '700',
    },
});

export default RoleSelectionScreen;
