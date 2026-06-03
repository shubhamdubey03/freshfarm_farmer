import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StatusBar,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronDown, Camera, CheckCircle2, Calendar, X } from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import DatePicker from 'react-native-date-picker';
import { API_URLS } from '../config/api';
import { apiFunction } from '../config/apifunction';
import { Alert, ActivityIndicator, Image } from 'react-native';

const AddProductScreen = ({ onBack, onSave }) => {
    const [productName, setProductName] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [unit, setUnit] = useState('kg');
    const [stock, setStock] = useState('');
    const [harvestDate, setHarvestDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [productImages, setProductImages] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            if (!API_URLS.GET_CATEGORIES) {
                // Fallback to hardcoded categories if API is missing
                const fallbackCats = [
                    { id: 1, name: 'VEGETABLES', category_type: 'vegetable' },
                    { id: 2, name: 'FRUITS', category_type: 'vegetable' },
                ];
                setCategories(fallbackCats);
                setCategory(fallbackCats[0].id);
                return;
            }
            const response = await apiFunction(API_URLS.GET_CATEGORIES, [], {}, 'get', true);
            if (response.data) {
                const vegetableCats = response.data.filter(cat => cat.category_type === 'vegetable');
                setCategories(vegetableCats);
                if (vegetableCats.length > 0) {
                    setCategory(vegetableCats[0].id);
                }
            }
        } catch (error) {
            console.error('Fetch categories error:', error);
            // Fallback on error
            setCategories([
                { id: 1, name: 'VEGETABLES', category_type: 'vegetable' },
                { id: 2, name: 'FRUITS', category_type: 'vegetable' },
            ]);
        }
    };

    const handleDateConfirm = (date) => {
        setShowDatePicker(false);
        setHarvestDate(date);
    };

    const handleImagePick = () => {
        const options = {
            mediaType: 'photo',
            selectionLimit: 5 - productImages.length,
            includeBase64: false,
        };

        launchImageLibrary(options, (response) => {
            if (response.didCancel) return;
            if (response.errorCode) {
                Alert.alert('Error', response.errorMessage);
                return;
            }
            if (response.assets) {
                const newImages = response.assets.map(asset => asset.uri);
                setProductImages([...productImages, ...newImages]);
            }
        });
    };

    const removeImage = (index) => {
        const updatedImages = productImages.filter((_, i) => i !== index);
        setProductImages(updatedImages);
    };

    const handleListProduct = async () => {
        if (!productName || !category || !stock) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('name', productName);
            formData.append('category', category);
            formData.append('description', description);
            formData.append('unit', unit);
            formData.append('stock', stock);
            formData.append('harvest_date', harvestDate.toISOString().split('T')[0]);

            if (productImages.length > 0) {
                const uri = productImages[0];
                const fileName = uri.split('/').pop();
                const fileType = fileName.split('.').pop();
                formData.append('image', {
                    uri: uri,
                    name: fileName || `photo.jpg`,
                    type: fileType === 'png' ? 'image/png' : 'image/jpeg',
                });
            }

            console.log('Listing product with data:', formData);
            const response = await apiFunction(API_URLS.FARMER_PRODUCTS, [], formData, 'post', true);
            console.log('Add product response:', response);

            if (response.status === 200 || response.status === 201) {
                Alert.alert('Success', 'Product listed successfully!', [
                    { text: 'OK', onPress: onBack }
                ]);
            } else {
                Alert.alert('Error', response.error || 'Failed to list product');
            }
        } catch (error) {
            console.error('List product error:', error);
            Alert.alert('Error', 'An error occurred while listing the product.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <ChevronLeft size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.title}>Add New Product</Text>
                        <Text style={styles.subtitle}>FARMER HARVEST ENTRY</Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        {/* Product Name */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Product Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Organic Red Tomatoes"
                                placeholderTextColor="#94A3B8"
                                value={productName}
                                onChangeText={setProductName}
                            />
                        </View>

                        {/* Category */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Category</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryList}>
                                {categories.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[styles.categoryChip, category === cat.id && styles.activeCategoryChip]}
                                        onPress={() => setCategory(cat.id)}
                                    >
                                        <Text style={[styles.categoryChipText, category === cat.id && styles.activeCategoryChipText]}>
                                            {cat.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Description */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe the freshness, farm origin, or growing method..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>

                        {/* Harvest Date & Stock Row */}
                        <View style={styles.row}>
                            <TouchableOpacity
                                style={[styles.inputGroup, { flex: 1, marginRight: 12 }]}
                                onPress={() => {
                                    console.log('Opening date picker...');
                                    setShowDatePicker(true);
                                }}
                            >
                                <Text style={styles.label}>Harvest Date</Text>
                                <View style={styles.datePickerButton}>
                                    <Calendar size={20} color="#64748B" />
                                    <Text style={styles.dateText}>
                                        {harvestDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Current Stock</Text>
                                <View style={styles.stockInputContainer}>
                                    <TextInput
                                        style={styles.stockInput}
                                        placeholder="0"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="numeric"
                                        value={stock}
                                        onChangeText={setStock}
                                    />
                                    <Text style={styles.unitsLabel}>KG</Text>
                                </View>
                            </View>
                        </View>

                        {/* Photo Upload */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Upload Product Photos ({productImages.length}/5)</Text>

                            <View style={styles.imagesRow}>
                                {productImages.map((uri, index) => (
                                    <View key={index} style={styles.imagePreviewContainer}>
                                        <Image source={{ uri }} style={styles.imagePreview} />
                                        <TouchableOpacity
                                            style={styles.removeImageButton}
                                            onPress={() => removeImage(index)}
                                        >
                                            <X size={12} color="#FFF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}

                                {productImages.length < 5 && (
                                    <TouchableOpacity
                                        style={styles.uploadBox}
                                        onPress={handleImagePick}
                                    >
                                        <Camera size={24} color="#38BDF8" />
                                        <Text style={styles.uploadBoxText}>Add</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Footer Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.listButton, loading && styles.listButtonDisabled]}
                        onPress={handleListProduct}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#FFF" />
                        ) : (
                            <>
                                <Text style={styles.listButtonText}>List Product</Text>
                                <CheckCircle2 size={24} color="#FFF" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <DatePicker
                    modal
                    open={showDatePicker}
                    date={harvestDate}
                    mode="date"
                    androidVariant="nativeAndroid"
                    onConfirm={handleDateConfirm}
                    onCancel={() => setShowDatePicker(false)}
                    maximumDate={new Date()}
                />
            </SafeAreaView>
        </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        backgroundColor: '#FFF',
    },
    backButton: {
        width: 44,
        height: 44,
        backgroundColor: '#F1F5F9',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        marginLeft: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
    },
    subtitle: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
    },
    keyboardView: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 40,
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#475569',
        marginBottom: 10,
        marginLeft: 4,
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '600',
    },
    textArea: {
        height: 120,
        paddingTop: 16,
        paddingBottom: 16,
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    dropdownText: {
        fontSize: 16,
        color: '#1E293B',
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    priceInputContainer: {
        flexDirection: 'column',
        gap: 8,
    },
    priceField: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    currency: {
        fontSize: 18,
        color: '#94A3B8',
        fontWeight: '700',
        marginRight: 8,
    },
    priceInput: {
        flex: 1,
        fontSize: 18,
        color: '#1E293B',
        fontWeight: '800',
    },
    unitDropdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAFC',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        gap: 6,
        alignSelf: 'flex-start',
    },
    unitText: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '700',
    },
    stockInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    stockInput: {
        flex: 1,
        fontSize: 18,
        color: '#1E293B',
        fontWeight: '800',
    },
    unitsLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#94A3B8',
    },
    uploadArea: {
        backgroundColor: '#F0F9FF',
        borderWidth: 2,
        borderColor: '#BAE6FD',
        borderStyle: 'dashed',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        gap: 8,
    },
    cameraIconContainer: {
        width: 64,
        height: 64,
        backgroundColor: '#FFF',
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    plusOverlay: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: '#38BDF8',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    plusText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '800',
        lineHeight: 14,
    },
    uploadTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#1E293B',
    },
    uploadSubtitle: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '500',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        paddingHorizontal: 12,
        height: 56,
        gap: 6,
    },
    dateText: {
        fontSize: 14,
        color: '#1E293B',
        fontWeight: '600',
    },
    categoryList: {
        flexDirection: 'row',
        paddingVertical: 4,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 12,
        marginRight: 8,
    },
    activeCategoryChip: {
        backgroundColor: '#F0F9FF',
        borderColor: '#38BDF8',
    },
    categoryChipText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748B',
    },
    activeCategoryChipText: {
        color: '#38BDF8',
    },
    imagesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 4,
    },
    imagePreviewContainer: {
        position: 'relative',
    },
    imagePreview: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#F1F5F9',
    },
    removeImageButton: {
        position: 'absolute',
        top: -6,
        right: -6,
        backgroundColor: '#EF4444',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    uploadBox: {
        width: 80,
        height: 80,
        backgroundColor: '#F0F9FF',
        borderWidth: 1.5,
        borderColor: '#BAE6FD',
        borderStyle: 'dashed',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    uploadBoxText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#38BDF8',
    },
    listButtonDisabled: {
        backgroundColor: '#94A3B8',
        shadowOpacity: 0,
        elevation: 0,
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 20 : 30,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    listButton: {
        backgroundColor: '#38BDF8',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 6,
    },
    listButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '800',
    },
});

export default AddProductScreen;
