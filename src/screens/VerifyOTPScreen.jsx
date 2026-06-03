import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    Alert,
} from 'react-native';
import { ChevronLeft, MessageSquare } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Path, Circle, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const OtpIllustration = () => (
    <View style={styles.illustrationContainer}>
        <Svg width="200" height="240" viewBox="0 0 200 240">
            {/* Phone Shadow */}
            <Circle cx="100" cy="210" r="40" fill="#E2E8F0" opacity="0.4" />

            {/* Phone Body */}
            <Rect x="50" y="20" width="100" height="180" rx="20" fill="#1E293B" />
            <Rect x="55" y="25" width="90" height="170" rx="16" fill="#F8FAFC" />

            {/* Screen Elements */}
            <Rect x="70" y="40" width="60" height="8" rx="4" fill="#E2E8F0" />
            <Rect x="85" y="60" width="60" height="24" rx="12" fill="#38BDF8" opacity="0.2" />
            <Rect x="100" y="68" width="30" height="8" rx="4" fill="#38BDF8" opacity="0.4" />

            {/* Message Bubble */}
            <G transform="translate(130, 80)">
                <Circle cx="25" cy="25" r="30" fill="#38BDF8" />
                <MessageSquare x="13" y="13" size={24} color="#FFFFFF" strokeWidth={2.5} />
                {/* Dots in bubble */}
                <Circle cx="20" cy="25" r="1.5" fill="white" />
                <Circle cx="25" cy="25" r="1.5" fill="white" />
                <Circle cx="30" cy="25" r="1.5" fill="white" />
            </G>
        </Svg>
    </View>
);

const VerifyOTPScreen = ({ phoneNumber, onBack, onSuccess }) => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(59);
    const inputs = useRef([]);
    const { verifyOtp, sendOtp, resendOtp, loading } = useAuth();
    const [error, setError] = useState(null);
    const [resending, setResending] = useState(false);

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
    }, []);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else {
            setError('OTP expired. Please resend the code.');
        }

        return () => clearInterval(interval);
    }, [timer]);

    const handleChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 5) {
            inputs.current[index + 1].focus();
        }
    };

    const handleKeyPress = (e, index) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1].focus();
        }
    };

    const handleVerify = async () => {
        const otpString = otp.join('');


        if (!phoneNumber) {
            Alert.alert('Error', 'Phone number is missing');
            return;
        }

        if (otpString.length < 6) {
            setError('Please enter all 6 digits');
            return;
        }

        const result = await verifyOtp(phoneNumber, otpString);
        console.log("result", result);
        if (result.success) {
            Alert.alert("Success", "OTP verified successfully");
            onSuccess();
        } else {
            setError(result.error || 'Invalid OTP');
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError(null);
        setOtp(['', '', '', '', '', '']);

        const result = await resendOtp(phoneNumber);
        setResending(false);

        if (result.success) {
            setTimer(59);
            Alert.alert('Success', 'A new OTP has been sent to your phone.');
        } else {
            setError(result.error || 'Failed to resend OTP');
            Alert.alert('Error', result.error || 'Failed to resend OTP');
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    {/* Header with Back Button */}
                    <View style={styles.headerNav}>
                        <TouchableOpacity style={styles.backButton} onPress={onBack}>
                            <ChevronLeft size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Illustration */}
                        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: fadeAnim }] }}>
                            <OtpIllustration />
                        </Animated.View>

                        {/* Title & Subtitle */}
                        <Animated.View style={[styles.textContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <Text style={styles.title}>Verify Your Number</Text>
                            <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
                            <Text style={styles.phoneNumber}>{phoneNumber}</Text>
                        </Animated.View>

                        {/* OTP Inputs */}
                        <Animated.View style={[styles.otpContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            {otp.map((digit, index) => (
                                <View key={index} style={styles.otpInputWrapper}>
                                    {!digit && <View style={styles.dotPlaceholder} />}
                                    <TextInput
                                        ref={(ref) => (inputs.current[index] = ref)}
                                        style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                                        maxLength={1}
                                        keyboardType="number-pad"
                                        value={digit}
                                        onChangeText={(text) => handleChange(text, index)}
                                        onKeyPress={(e) => handleKeyPress(e, index)}
                                        selectionColor="#38BDF8"
                                    />
                                </View>
                            ))}
                        </Animated.View>

                        {error && <Text style={styles.errorText}>{error}</Text>}

                        {/* Action Button */}
                        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                            <TouchableOpacity
                                style={[styles.verifyButton, (otp.join('').length < 6 || loading) && styles.disabledButton]}
                                onPress={handleVerify}
                                disabled={loading || otp.join('').length < 6}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.verifyButtonText}>
                                    {loading ? 'Verifying...' : 'Verify & Proceed'}
                                </Text>
                            </TouchableOpacity>

                            {/* Resend Section */}
                            <View style={styles.resendContainer}>
                                <Text style={styles.resendText}>Didn't receive code?</Text>
                                <View style={styles.resendActionRow}>
                                    <TouchableOpacity
                                        disabled={timer > 0 || resending}
                                        onPress={handleResend}
                                    >
                                        <Text style={[styles.resendLink, (timer > 0 || resending) && styles.resendLinkDisabled]}>
                                            {resending ? 'Sending...' : 'Resend Code'}
                                        </Text>
                                    </TouchableOpacity>
                                    <View style={styles.divider} />
                                    <Text style={styles.timerText}>{formatTime(timer)}</Text>
                                </View>
                            </View>
                        </Animated.View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    safeArea: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    headerNav: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        backgroundColor: '#F8FAFC',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 30,
        paddingTop: 20,
    },
    illustrationContainer: {
        height: 220,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        lineHeight: 24,
    },
    phoneNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginTop: 2,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 40,
    },
    otpInputWrapper: {
        width: 48,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    otpInput: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
        color: '#1E293B',
    },
    otpInputFilled: {
        borderColor: '#38BDF8',
        backgroundColor: '#FFFFFF',
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
    },
    dotPlaceholder: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#94A3B8',
        zIndex: -1,
    },
    errorText: {
        color: '#EF4444',
        marginBottom: 24,
        fontWeight: '600',
    },
    buttonContainer: {
        width: '100%',
        alignItems: 'center',
    },
    verifyButton: {
        width: '100%',
        backgroundColor: '#38BDF8',
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 6,
    },
    disabledButton: {
        backgroundColor: '#BAE6FD',
        shadowOpacity: 0,
        elevation: 0,
    },
    verifyButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    resendContainer: {
        marginTop: 32,
        alignItems: 'center',
    },
    resendText: {
        fontSize: 15,
        color: '#94A3B8',
        marginBottom: 10,
    },
    resendActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    resendLink: {
        fontSize: 16,
        fontWeight: '700',
        color: '#38BDF8',
    },
    resendLinkDisabled: {
        color: '#BAE6FD',
    },
    divider: {
        width: 1,
        height: 16,
        backgroundColor: '#E2E8F0',
        marginHorizontal: 15,
    },
    timerText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#64748B',
    },
});

export default VerifyOTPScreen;
