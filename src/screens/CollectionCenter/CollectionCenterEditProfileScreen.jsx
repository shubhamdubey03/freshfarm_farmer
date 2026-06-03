import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Camera, User, Save, Building2, MapPin } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../../context/AuthContext';
import { apiFunction } from '../../config/apifunction';
import { API_URLS } from '../../config/api';

const CollectionCenterEditProfileScreen = ({ onBack }) => {
    const { user, updateUserData } = useAuth();
    const [loading, setLoading] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [centerName, setCenterName] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [profileImage, setProfileImage] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const response = await apiFunction(API_URLS.COLLECTION_PROFILE, [], {}, 'get', true);
            if (response.data) {
                const data = response.data;
                setFirstName(data.first_name || '');
                setLastName(data.last_name || '');
                setCenterName(data.center_name || '');
                setAddress(data.address || '');
                setCity(data.city || '');
                setState(data.state || '');
                setLatitude(data.latitude ? String(data.latitude) : '');
                setLongitude(data.longitude ? String(data.longitude) : '');
                setProfileImage(data.image);
            }
        } catch (error) {
            console.error('Collection Center Profile fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImagePick = () => {
        const options = {
            mediaType: 'photo',
            includeBase64: false,
            maxHeight: 1000,
            maxWidth: 1000,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                console.log('ImagePicker Error: ', response.errorMessage);
                return;
            }
            if (response.assets && response.assets.length > 0) {
                setProfileImage(response.assets[0].uri);
            }
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const formData = new FormData();

            formData.append('first_name', firstName);
            formData.append('last_name', lastName);
            formData.append('center_name', centerName);
            formData.append('address', address);
            formData.append('city', city);
            formData.append('state', state);
            if (latitude) formData.append('latitude', latitude);
            if (longitude) formData.append('longitude', longitude);

            if (profileImage && !profileImage.startsWith('http')) {
                const fileName = profileImage.split('/').pop();
                const fileType = fileName.split('.').pop();

                formData.append('profile_image', {
                    uri: profileImage,
                    name: fileName || `photo.${fileType}`,
                    type: fileType === 'png' ? 'image/png' : 'image/jpeg',
                });
            }

            console.log('Saving Collection Center profile with data:', formData);
            const response = await apiFunction(API_URLS.COLLECTION_PROFILE, [], formData, 'patch', true);
            console.log('Collection Center profile update response:', response);

            if (response.status === 200 || response.status === 201) {
                if (response.data) {
                    // Update auth context user details
                    await updateUserData({
                        first_name: response.data.first_name,
                        last_name: response.data.last_name,
                        profile_image: response.data.image,
                    });
                }
                Alert.alert('Success', 'Profile updated successfully!', [
                    { text: 'OK', onPress: onBack }
                ]);
            } else {
                Alert.alert('Error', response.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Save Collection Center profile error:', error);
            Alert.alert('Error', 'An error occurred while saving.');
        } finally {
            setLoading(false);
        }
    };

    const defaultAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop';

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <ChevronLeft size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Edit Profile</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Avatar Section */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePick}>
                            <Image source={{ uri: profileImage || defaultAvatar }} style={styles.avatar} />
                            <View style={styles.cameraBadge}>
                                <Camera size={20} color="#FFF" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>First Name</Text>
                            <View style={styles.inputWrapper}>
                                <User size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="Enter first name"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Last Name</Text>
                            <View style={styles.inputWrapper}>
                                <User size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Enter last name"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Center Name</Text>
                            <View style={styles.inputWrapper}>
                                <Building2 size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={centerName}
                                    onChangeText={setCenterName}
                                    placeholder="Enter center name"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Address</Text>
                            <View style={styles.inputWrapper}>
                                <MapPin size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={address}
                                    onChangeText={setAddress}
                                    placeholder="Enter street address"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>City</Text>
                            <View style={styles.inputWrapper}>
                                <MapPin size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={city}
                                    onChangeText={setCity}
                                    placeholder="Enter city"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>State</Text>
                            <View style={styles.inputWrapper}>
                                <MapPin size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={state}
                                    onChangeText={setState}
                                    placeholder="Enter state"
                                    placeholderTextColor="#94A3B8"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Latitude</Text>
                            <View style={styles.inputWrapper}>
                                <MapPin size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={latitude}
                                    onChangeText={setLatitude}
                                    placeholder="e.g. 12.9716"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Longitude</Text>
                            <View style={styles.inputWrapper}>
                                <MapPin size={20} color="#94A3B8" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={longitude}
                                    onChangeText={setLongitude}
                                    placeholder="e.g. 77.5946"
                                    placeholderTextColor="#94A3B8"
                                    keyboardType="numeric"
                                />
                            </View>
                        </View>

                        {/* Read-only info for reference */}
                        <View style={styles.infoGroup}>
                            <Text style={styles.label}>Phone Number</Text>
                            <View style={[styles.inputWrapper, styles.disabledInput]}>
                                <Text style={styles.disabledText}>{user?.phone || 'Not available'}</Text>
                            </View>
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
                            <>
                                <Save size={20} color="#FFF" style={{ marginRight: 8 }} />
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            </>
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
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: '#E0F2FE',
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 5,
        right: 5,
        backgroundColor: '#38BDF8',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    changePhotoText: {
        marginTop: 16,
        color: '#38BDF8',
        fontSize: 14,
        fontWeight: '700',
    },
    formContainer: {
        paddingHorizontal: 24,
        gap: 24,
    },
    inputGroup: {
        gap: 8,
    },
    infoGroup: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
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
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '600',
    },
    disabledInput: {
        backgroundColor: '#F1F5F9',
        borderColor: '#E2E8F0',
    },
    disabledText: {
        fontSize: 16,
        color: '#94A3B8',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#38BDF8',
        marginHorizontal: 24,
        height: 60,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 15,
        elevation: 8,
    },
    saveButtonDisabled: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
});

export default CollectionCenterEditProfileScreen;
