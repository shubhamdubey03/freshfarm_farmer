import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Animated,
    ScrollView,
    Dimensions,
    Alert,
} from 'react-native';
import { User, Phone, Mail, ChevronLeft, Check } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';

import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const SignupScreen = ({ onBack, onLogin, onContinue, role }) => {
    const [fullName, setFullName] = useState('');
    const [fullNameError, setFullNameError] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [agree, setAgree] = useState(false);
    const { register, loading, error } = useAuth();

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

    const handleNameChange = (text) => {
        setFullName(text);
        if (fullNameError) {
            if (text.trim().length >= 3) {
                setFullNameError('');
            } else if (text.trim().length === 0) {
                setFullNameError('Full name is required');
            } else {
                setFullNameError('Name must be at least 3 characters');
            }
        }
    };

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

    const handleEmailChange = (text) => {
        setEmail(text);
        if (emailError) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(text.trim())) {
                setEmailError('');
            } else if (text.trim().length === 0) {
                setEmailError('Email address is required');
            } else {
                setEmailError('Please enter a valid email address');
            }
        }
    };

    const handleSignup = async () => {
        let valid = true;
        setFullNameError('');
        setPhoneError('');
        setEmailError('');

        // Full Name validation
        if (!fullName.trim()) {
            setFullNameError('Full name is required');
            valid = false;
        } else if (fullName.trim().length < 3) {
            setFullNameError('Name must be at least 3 characters');
            valid = false;
        }

        // Phone Number validation
        if (!phoneNumber) {
            setPhoneError('Phone number is required');
            valid = false;
        } else if (!/^\d{10}$/.test(phoneNumber)) {
            setPhoneError('Please enter a valid 10-digit phone number');
            valid = false;
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) {
            setEmailError('Email address is required');
            valid = false;
        } else if (!emailRegex.test(email.trim())) {
            setEmailError('Please enter a valid email address');
            valid = false;
        }

        if (!valid) {
            return;
        }

        const userData = {
            username: fullName.trim(),
            email: email.trim(),
            phone: phoneNumber,
            role: role,
            country_code: "+91",
        };
        console.log("userData", userData);

        const result = await register(userData);
        console.log("result", result);
        if (result.success) {
            Alert.alert("Success", "Registration successful", [
                {
                    text: "OK",
                    onPress: () => onLogin()
                }
            ]);
        } else {
            Alert.alert("Error", result.error || 'Registration failed');
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <LinearGradient
                colors={['#F0F9FF', '#FFFFFF']}
                style={styles.gradient}
            >
                {/* Background Decoration - Leaf SVG */}
                <View style={styles.bgDecoration}>
                    <Svg height="300" width="300" viewBox="0 0 100 100">
                        <Path
                            d="M80,20 C60,20 40,40 20,80 C40,80 60,60 80,20 Z"
                            fill="#0EA5E9"
                            fillOpacity="0.05"
                        />
                        <Path
                            d="M20,80 Q50,50 80,20"
                            stroke="#0EA5E9"
                            strokeWidth="0.5"
                            strokeOpacity="0.1"
                        />
                    </Svg>
                </View>

                <SafeAreaView style={styles.safeArea}>
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Back Button */}
                        <Animated.View style={[styles.backButtonContainer, { opacity: fadeAnim }]}>
                            <TouchableOpacity style={styles.backButton} onPress={onBack}>
                                <ChevronLeft size={28} color="#0F172A" />
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Header Section */}
                        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.title}>Join FarmFresh</Text>
                            <Text style={styles.subtitle}>Start your journey to fresher produce today.</Text>
                        </Animated.View>

                        {/* Form Section */}
                        <Animated.View style={[styles.form, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Full Name</Text>
                                <View style={[styles.inputContainer, fullNameError ? styles.inputError : null]}>
                                    <View style={styles.iconBox}>
                                        <User size={20} color={fullNameError ? "#EF4444" : "#94A3B8"} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="John Doe"
                                        placeholderTextColor="#94A3B8"
                                        value={fullName}
                                        onChangeText={handleNameChange}
                                    />
                                </View>
                                {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Phone Number</Text>
                                <View style={[styles.inputContainer, phoneError ? styles.inputError : null]}>
                                    <View style={styles.iconBox}>
                                        <Phone size={20} color={phoneError ? "#EF4444" : "#94A3B8"} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="10-digit phone number"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="phone-pad"
                                        value={phoneNumber}
                                        onChangeText={handlePhoneChange}
                                        maxLength={10}
                                    />
                                </View>
                                {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email Address</Text>
                                <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
                                    <View style={styles.iconBox}>
                                        <Mail size={20} color={emailError ? "#EF4444" : "#94A3B8"} />
                                    </View>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="john@example.com"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={handleEmailChange}
                                    />
                                </View>
                                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
                            </View>

                            <TouchableOpacity
                                style={styles.termsContainer}
                                onPress={() => setAgree(!agree)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.checkbox, agree && styles.checkboxActive]}>
                                    {agree && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                                </View>
                                <Text style={styles.termsText}>
                                    I agree to the <Text style={styles.linkText}>Terms & Conditions</Text> and <Text style={styles.linkText}>Privacy Policy</Text>.
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.createButton, (!agree || loading) && styles.createButtonDisabled]}
                                activeOpacity={0.8}
                                disabled={!agree || loading}
                                onPress={handleSignup}
                            >
                                <Text style={styles.createButtonText}>{loading ? 'Creating...' : 'Create Account'}</Text>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* Footer */}
                        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
                            <Text style={styles.footerText}>
                                Already have an account? <Text style={styles.linkText} onPress={onLogin}>Login</Text>
                            </Text>
                        </Animated.View>
                    </ScrollView>
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    gradient: {
        flex: 1,
    },
    bgDecoration: {
        position: 'absolute',
        top: -50,
        right: -50,
        zIndex: 0,
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 28,
        paddingBottom: 40,
    },
    backButtonContainer: {
        marginTop: 12,
        marginBottom: 24,
    },
    backButton: {
        width: 54,
        height: 54,
        backgroundColor: '#FFFFFF',
        borderRadius: 27,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 3,
    },
    header: {
        marginBottom: 44,
    },
    title: {
        fontSize: 38,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 10,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 18,
        color: '#64748B',
        fontWeight: '500',
        lineHeight: 26,
    },
    form: {
        gap: 24,
        marginBottom: 44,
    },
    inputGroup: {
        gap: 10,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#475569',
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 64,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 8,
        elevation: 1,
    },
    iconBox: {
        width: 24,
        alignItems: 'center',
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '600',
    },
    termsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginTop: 8,
        paddingRight: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    checkboxActive: {
        borderColor: '#0EA5E9',
        backgroundColor: '#0EA5E9',
    },
    termsText: {
        flex: 1,
        fontSize: 15,
        color: '#64748B',
        fontWeight: '500',
        lineHeight: 22,
    },
    createButton: {
        backgroundColor: '#38BDF8',
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 16,
        shadowColor: '#0EA5E9',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 6,
    },
    createButtonDisabled: {
        backgroundColor: '#CBD5E1',
        shadowOpacity: 0,
        elevation: 0,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 20,
    },
    footerText: {
        fontSize: 16,
        color: '#64748B',
        fontWeight: '600',
    },
    linkText: {
        color: '#0EA5E9',
        fontWeight: '800',
    },
    inputError: {
        borderColor: '#EF4444',
        borderWidth: 1.5,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '600',
        marginLeft: 4,
        marginTop: 4,
    },
});

export default SignupScreen;
