import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Animated,
    Image,
    Alert,
} from 'react-native';
import { Sprout, ChevronDown } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../context/AuthContext';
import API_URLS from '../config/api';

const LoginScreen = ({ onBack, onSignup, onContinue, onLoginSuccess, role }) => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const { sendOtp, loading, error, googleLogin } = useAuth();
    const [countryCode, setCountryCode] = useState('+91');
    const [countryCodeError, setCountryCodeError] = useState('');

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '543499255135-sp6gmbeb2l46dnu41lmjhg854r9dttd2.apps.googleusercontent.com',
            offlineAccess: true,
        });

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

    const handlePhoneChange = (text) => {
        const cleaned = text.replace(/[^0-9]/g, '');
        setPhoneNumber(cleaned);
        if (phoneError) {
            if (cleaned.length === 10) {
                setPhoneError('');
            } else if (cleaned.length === 0) {
                setPhoneError('Phone number is required');
            } else {
                setPhoneError('Please enter a valid 10-digit phone number');
            }
        }
    };

    const handleCountryCodeChange = (text) => {
        setCountryCode(text);
        if (countryCodeError) {
            if (/^\+\d{1,4}$/.test(text)) {
                setCountryCodeError('');
            } else if (text.length === 0) {
                setCountryCodeError('Country code is required');
            } else {
                setCountryCodeError('Invalid code (e.g. +91)');
            }
        }
    };

    const handleSendOTP = async () => {
        let valid = true;
        setPhoneError('');
        setCountryCodeError('');

        if (!countryCode) {
            setCountryCodeError('Country code is required');
            valid = false;
        } else if (!/^\+\d{1,4}$/.test(countryCode)) {
            setCountryCodeError('Invalid code (e.g. +91)');
            valid = false;
        }

        if (!phoneNumber) {
            setPhoneError('Phone number is required');
            valid = false;
        } else if (!/^\d{10}$/.test(phoneNumber)) {
            setPhoneError('Please enter a valid 10-digit phone number');
            valid = false;
        }

        if (!valid) {
            return;
        }

        const result = await sendOtp(phoneNumber, countryCode);
        console.log("111111111111222222222222", result);
        if (result.success) {
            if (
                result.data.role === "vendor" ||
                result.data.role === "farmer" ||
                result.data.role === "user" ||
                result.data.role === "customer" ||
                result.data.role === "collection_center" ||
                result.data.role === "delivery"
            ) {
                Alert.alert('Success', 'OTP sent successfully!');
                setTimeout(() => {
                    onContinue(phoneNumber, result.data.role);
                }, 300);
            } else {
                Alert.alert('Access Denied', 'There is no account associated with this phone number for the selected role.');
            }
        } else {
            Alert.alert('Error', result.error || 'Failed to send OTP');
        }
    };

    const handleGoogleLogin = async () => {
        try {
            console.log("*********start**********************");
            await GoogleSignin.hasPlayServices();
            const userInfo = await GoogleSignin.signIn();
            const idToken = userInfo.data ? userInfo.data.idToken : userInfo.idToken;
            console.log("*******************mid************");
            console.log("idToken", idToken);

            const result = await googleLogin(idToken, role);
            if (result.success) {
                Alert.alert('Success', 'Login Successful!');
                const loggedInUser = result.data.user;
                if (onLoginSuccess) {
                    onLoginSuccess(loggedInUser.role);
                }
            } else {
                Alert.alert('Error', result.error || 'Login failed');
            }
        } catch (err) {
            if (err.code === statusCodes.SIGN_IN_CANCELLED) {
                console.log('User cancelled sign in');
            } else if (err.code === statusCodes.IN_PROGRESS) {
                console.log('Sign in in progress');
            } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Play services not available');
            } else {
                console.error('Google Sign-In Error:', err);
                Alert.alert('Error', 'An error occurred during Google Sign-In');
            }
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <LinearGradient
                colors={['#F0F9FF', '#FFFFFF']}
                style={styles.gradient}
            >
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.content}>
                        {/* Logo Section */}
                        <Animated.View style={[styles.logoContainer, { opacity: fadeAnim, transform: [{ scale: fadeAnim }] }]}>
                            <View style={styles.logoBox}>
                                <Sprout size={40} color="#38BDF8" fill="#38BDF8" />
                            </View>
                        </Animated.View>

                        {/* Header Section */}
                        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.title}>Welcome Back!</Text>
                            <Text style={styles.subtitle}>Your fresh harvest awaits</Text>
                        </Animated.View>

                        {/* Form Card */}
                        <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={[
                                        styles.input,
                                        { maxWidth: 80 },
                                        countryCodeError ? styles.inputError : null
                                    ]}
                                    value={countryCode}
                                    onChangeText={handleCountryCodeChange}
                                    keyboardType="phone-pad"
                                    maxLength={5}
                                />
                                <TextInput
                                    style={[
                                        styles.input,
                                        phoneError ? styles.inputError : null
                                    ]}
                                    placeholder="Enter phone number"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="phone-pad"
                                    value={phoneNumber}
                                    onChangeText={handlePhoneChange}
                                    maxLength={10}
                                />
                            </View>
                            {(countryCodeError || phoneError) && (
                                <View style={styles.errorContainer}>
                                    {countryCodeError ? (
                                        <Text style={styles.errorText}>• {countryCodeError}</Text>
                                    ) : null}
                                    {phoneError ? (
                                        <Text style={styles.errorText}>• {phoneError}</Text>
                                    ) : null}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[styles.otpButton, loading && styles.disabledButton]}
                                activeOpacity={0.8}
                                onPress={handleSendOTP}
                                disabled={loading}
                            >
                                <Text style={styles.otpButtonText}>{loading ? 'Sending...' : 'Send OTP'}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelButton}
                                activeOpacity={0.7}
                                onPress={onBack}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Social Login Divider */}
                        <Animated.View style={[styles.socialDivider, { opacity: fadeAnim }]}>
                            <View style={styles.line} />
                            <Text style={styles.socialText}>Login with Social</Text>
                            <View style={styles.line} />
                        </Animated.View>

                        {/* Social Buttons */}
                        <Animated.View style={[styles.socialButtonsRow, { opacity: fadeAnim }]}>
                            <TouchableOpacity style={styles.socialButton} onPress={handleGoogleLogin}>
                                <Image
                                    source={{ uri: 'https://img.icons8.com/color/72/google-logo.png' }}
                                    style={styles.socialIcon}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.socialButton}>
                                <FontAwesome name="apple" size={28} color="#000" />
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Footer */}
                        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                            <Text style={styles.footerText}>
                                New to FarmFresh? <Text style={styles.linkText} onPress={onSignup}>Create an Account</Text>
                            </Text>
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
        alignItems: 'center',
        paddingTop: 60,
    },
    logoContainer: {
        marginBottom: 32,
    },
    logoBox: {
        width: 80,
        height: 80,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 5,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 36,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 18,
        color: '#64748B',
        fontWeight: '500',
    },
    formCard: {
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 32,
        padding: 32,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 4,
        marginBottom: 40,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 12,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        gap: 12,
    },
    countryPicker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 12,
        height: 56,
        gap: 4,
    },
    countryCode: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    input: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1E293B',
        height: 56,
    },
    otpButton: {
        backgroundColor: '#38BDF8',
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 5,
    },
    otpButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    cancelButton: {
        marginTop: 16,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#64748B',
        fontSize: 16,
        fontWeight: '600',
    },
    socialDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 32,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    socialText: {
        marginHorizontal: 16,
        color: '#94A3B8',
        fontSize: 14,
        fontWeight: '500',
    },
    socialButtonsRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 48,
    },
    socialButton: {
        width: 160,
        height: 56,
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 1,
    },
    socialIcon: {
        width: 30,
        height: 30,
        resizeMode: 'contain',
    },
    footer: {
        marginTop: 'auto',
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '500',
    },
    linkText: {
        color: '#38BDF8',
        fontWeight: '700',
    },
    disabledButton: {
        backgroundColor: '#CBD5E1',
        shadowOpacity: 0,
        elevation: 0,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    errorContainer: {
        marginTop: -16,
        marginBottom: 20,
        gap: 4,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
    },
});

export default LoginScreen;
