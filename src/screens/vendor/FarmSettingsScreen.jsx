import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StatusBar,
    Image,
    Dimensions,
    ActivityIndicator,
    Alert,
    PermissionsAndroid,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    Camera,
    MapPin,
    Clock,
    Info,
    Save,
    Map
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { apiFunction } from '../../config/apifunction';
import { API_URLS } from '../../config/api';
import Geolocation from '@react-native-community/geolocation';

const { width } = Dimensions.get('window');

const InputField = ({ label, value, onChangeText, placeholder, icon: Icon, multiline = false, ...rest }) => (
    <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputWrapper, multiline && styles.multilineWrapper]}>
            {Icon && <Icon size={20} color="#94A3B8" style={styles.inputIcon} />}
            <TextInput
                style={[styles.input, multiline && styles.multilineInput]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                multiline={multiline}
                textAlignVertical={multiline ? 'top' : 'center'}
                {...rest}
            />
        </View>
    </View>
);

const FarmSettingsScreen = ({ onBack, role }) => {
    const { user } = useAuth();
    const [fetching, setFetching] = useState(true);
    const [loading, setLoading] = useState(false);
    const [farmName, setFarmName] = useState('');
    const [category, setCategory] = useState('Organic Vegetables & Fruits');
    const [location, setLocation] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [openingHours, setOpeningHours] = useState('08:00 AM - 06:00 PM');
    const [description, setDescription] = useState('Pioneering organic farming in the valley for over 15 years. We specialize in pesticide-free, home-grown produce delivered fresh to your doorstep.');

    const [isLoadingLocation, setIsLoadingLocation] = useState(false);

    useEffect(() => {
        fetchFarmProfile();
    }, []);

    const getProfileUrl = () => {
        const actualRole = role || user?.role || user?.user_role;
        return actualRole === 'farmer' ? API_URLS.FARMER_PROFILE : API_URLS.VENDOR_PROFILE;
    };

    const fetchFarmProfile = async () => {
        setFetching(true);
        try {
            const url = getProfileUrl();
            const response = await apiFunction(url, [], {}, 'get', true);
            console.log('Profile response data:', response.data);
            if (response.data) {
                const data = response.data;
                setFarmName(data.farm_name || '');
                setLocation(data.farm_location || '');
                setLatitude(data.latitude ? String(parseFloat(data.latitude).toFixed(6)) : '');
                setLongitude(data.longitude ? String(parseFloat(data.longitude).toFixed(6)) : '');
            }
        } catch (error) {
            console.error('Fetch vendor profile error:', error);
            Alert.alert('Error', 'Failed to load vendor settings.');
        } finally {
            setFetching(false);
        }
    };

    const requestLocationPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission',
                        message: 'We need access to your location to set your farm coordinates.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const handleFetchCurrentLocation = async () => {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
            Alert.alert("Permission Denied", "Cannot access location");
            return;
        }

        setIsLoadingLocation(true);
        Geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLatitude(latitude.toFixed(6));
                setLongitude(longitude.toFixed(6));
                setIsLoadingLocation(false);
                Alert.alert("Success", "Coordinates fetched successfully!");
            },
            (error) => {
                setIsLoadingLocation(false);
                Alert.alert("Location Error", error.message);
            },
            { enableHighAccuracy: false, timeout: 30000, maximumAge: 60000 }
        );
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const data = {
                farm_name: farmName,
                farm_location: location,
            };
            if (latitude) data.latitude = parseFloat(parseFloat(latitude).toFixed(6));
            if (longitude) data.longitude = parseFloat(parseFloat(longitude).toFixed(6));

            console.log('Saving profile:', data);
            const url = getProfileUrl();
            const response = await apiFunction(url, [], data, 'patch', true);
            console.log('Save response:', response);

            if (response.status === 200 || response.status === 201) {
                if (response.data) {
                    setLatitude(response.data.latitude ? String(parseFloat(response.data.latitude).toFixed(6)) : '');
                    setLongitude(response.data.longitude ? String(parseFloat(response.data.longitude).toFixed(6)) : '');
                }
                Alert.alert('Success', 'Vendor settings updated successfully!', [
                    { text: 'OK', onPress: onBack }
                ]);
            } else {
                Alert.alert('Error', response.error || 'Failed to update vendor settings.');
            }
        } catch (error) {
            console.error('Save profile error:', error);
            Alert.alert('Error', 'An error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#38BDF8" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <ChevronLeft size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Vendor Settings</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Cover Photo */}
                    <View style={styles.coverPhotoContainer}>
                        <Image
                            source={{ uri: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800' }}
                            style={styles.coverPhoto}
                        />
                        <TouchableOpacity style={styles.changeCoverButton}>
                            <Camera size={20} color="#FFF" />
                            <Text style={styles.changeCoverText}>Change Cover</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Inputs */}
                    <View style={styles.formContainer}>
                        <InputField
                            label="Farm Name"
                            value={farmName}
                            onChangeText={setFarmName}
                            placeholder="Enter farm name"
                        />
                        <InputField
                            label="Category"
                            value={category}
                            onChangeText={setCategory}
                            placeholder="e.g., Organic Dairy"
                            icon={Info}
                        />
                        <InputField
                            label="Location"
                            value={location}
                            onChangeText={setLocation}
                            placeholder="Enter farm address"
                            icon={MapPin}
                        />
                        <InputField
                            label="Latitude"
                            value={latitude}
                            onChangeText={setLatitude}
                            placeholder="Latitude (resolved automatically from address)"
                            icon={Map}
                            keyboardType="numeric"
                        />
                        <InputField
                            label="Longitude"
                            value={longitude}
                            onChangeText={setLongitude}
                            placeholder="Longitude (resolved automatically from address)"
                            icon={Map}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity
                            style={styles.locationButton}
                            onPress={handleFetchCurrentLocation}
                            disabled={isLoadingLocation}
                        >
                            {isLoadingLocation ? (
                                <ActivityIndicator color="#0EA5E9" size="small" />
                            ) : (
                                <>
                                    <Map size={18} color="#0EA5E9" />
                                    <Text style={styles.locationButtonText}>Use Current Location</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <InputField
                            label="Opening Hours"
                            value={openingHours}
                            onChangeText={setOpeningHours}
                            placeholder="e.g., 09:00 - 18:00"
                            icon={Clock}
                        />
                        <InputField
                            label="Description"
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Describe your farm..."
                            multiline={true}
                        />
                    </View>

                    {/* Farm Statistics/Badges Section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>vendor Verification</Text>
                    </View>
                    <View style={styles.verificationCard}>
                        <View style={styles.verifiedBadge}>
                            <Save size={20} color="#38BDF8" />
                        </View>
                        <View style={styles.verificationInfo}>
                            <Text style={styles.verificationTitle}>Verified Seller</Text>
                            <Text style={styles.verificationText}>Your documents are verified and updated on March 15, 2026.</Text>
                        </View>
                    </View>

                    {/* Action Button */}
                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    coverPhotoContainer: {
        width: '100%',
        height: 200,
        position: 'relative',
    },
    coverPhoto: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F1F5F9',
    },
    changeCoverButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
    },
    changeCoverText: {
        color: '#FFF',
        fontSize: 13,
        fontWeight: '700',
    },
    formContainer: {
        paddingHorizontal: 24,
        paddingTop: 30,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        paddingHorizontal: 16,
        height: 56,
    },
    multilineWrapper: {
        height: 120,
        paddingTop: 12,
        alignItems: 'flex-start',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '600',
    },
    multilineInput: {
        height: '100%',
    },
    sectionHeader: {
        paddingHorizontal: 24,
        marginTop: 10,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    verificationCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F9FF',
        marginHorizontal: 24,
        padding: 20,
        borderRadius: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    verifiedBadge: {
        width: 50,
        height: 50,
        backgroundColor: '#FFF',
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 2,
    },
    verificationInfo: {
        flex: 1,
    },
    verificationTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
        marginBottom: 2,
    },
    verificationText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
        lineHeight: 18,
    },
    saveButton: {
        backgroundColor: '#38BDF8',
        marginHorizontal: 24,
        height: 60,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 10,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
    saveButtonDisabled: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F9FF',
        borderWidth: 1.5,
        borderColor: '#E0F2FE',
        borderRadius: 16,
        paddingVertical: 14,
        marginTop: 5,
        marginBottom: 20,
        gap: 8,
    },
    locationButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0EA5E9',
    },
});

export default FarmSettingsScreen;
