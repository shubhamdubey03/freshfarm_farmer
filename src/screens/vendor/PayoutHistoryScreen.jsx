import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { API_URLS } from '../../config/api';
import { apiFunction } from '../../config/apifunction';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    ChevronLeft,
    History,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    Clock,
    AlertCircle,
    Download
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const PayoutItem = ({ amount, date, status, id }) => {
    const getStatusStyles = (status) => {
        switch (status) {
            case 'Processed':
                return { color: '#10B981', bg: '#D1FAE5', icon: CheckCircle2 };
            case 'Pending':
                return { color: '#F59E0B', bg: '#FEF3C7', icon: Clock };
            case 'Failed':
                return { color: '#EF4444', bg: '#FEE2E2', icon: AlertCircle };
            default:
                return { color: '#94A3B8', bg: '#F1F5F9', icon: Clock };
        }
    };

    const statusStyle = getStatusStyles(status);
    const StatusIcon = statusStyle.icon;

    return (
        <View style={styles.payoutCard}>
            <View style={styles.payoutTop}>
                <View>
                    <Text style={styles.payoutLabel}>AMOUNT</Text>
                    <Text style={styles.payoutAmount}>₹{amount}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <StatusIcon size={12} color={statusStyle.color} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: statusStyle.color }]}>{status}</Text>
                </View>
            </View>

            <View style={styles.payoutBottom}>
                <View style={styles.metaRow}>
                    <Calendar size={14} color="#94A3B8" />
                    <Text style={styles.metaText}>{date}</Text>
                </View>
                <View style={styles.metaRow}>
                    <Text style={styles.refLabel}>REF: </Text>
                    <Text style={styles.refText}>#{id}</Text>
                </View>
            </View>
        </View>
    );
};

const PayoutHistoryScreen = ({ onBack }) => {
    const [payouts, setPayouts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPaidOut, setTotalPaidOut] = useState(0);
    const [pendingSettlement, setPendingSettlement] = useState(0);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    useEffect(() => {
        fetchPayouts();
    }, []);

    const fetchPayouts = async () => {
        setLoading(true);
        try {
            // 1. Fetch payouts list
            const res = await apiFunction(API_URLS.VENDOR_PAYOUTS, [], {}, 'get', true);
            let formattedPayouts = [];
            if (res.data && res.data.results) {
                formattedPayouts = res.data.results.map(item => {
                    return {
                        id: `PAY-${item.id.toString().padStart(5, '0')}`,
                        amount: parseFloat(item.total_amount).toFixed(2),
                        date: item.paid_at 
                            ? new Date(item.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
                            : `${new Date(item.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${new Date(item.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
                        status: item.is_paid ? 'Processed' : 'Pending',
                    };
                });
                setPayouts(formattedPayouts);
            }

            // 2. Fetch earnings summary
            const summaryRes = await apiFunction(API_URLS.VENDOR_EARNINGS_SUMMARY, [], {}, 'get', true);
            if (summaryRes.status === 200 && summaryRes.data) {
                setTotalPaidOut(parseFloat(summaryRes.data.total_settled || 0));
                setPendingSettlement(parseFloat(summaryRes.data.pending_settlement || 0));
            } else {
                const total = formattedPayouts
                    .filter(p => p.status === 'Processed')
                    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
                setTotalPaidOut(total);
            }
        } catch (error) {
            console.error('Error fetching payouts/summary:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (pendingSettlement <= 0) {
            Alert.alert('No Balance', 'You do not have any pending earnings to withdraw.');
            return;
        }

        setIsWithdrawing(true);
        try {
            const res = await apiFunction(API_URLS.VENDOR_PAYOUTS, [], {}, 'post', true);
            if (res.status === 200 || res.status === 201) {
                Alert.alert(
                    'Success', 
                    `Your withdrawal of ₹${pendingSettlement.toFixed(2)} has been successfully processed to your registered bank account!`
                );
                fetchPayouts();
            } else {
                Alert.alert('Error', res.data?.error || 'Failed to process withdrawal.');
            }
        } catch (error) {
            console.error('Error processing withdrawal:', error);
            Alert.alert('Error', 'An error occurred during withdrawal.');
        } finally {
            setIsWithdrawing(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={onBack}>
                        <ChevronLeft size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Payout History</Text>
                    <TouchableOpacity style={styles.downloadButton}>
                        <Download size={20} color="#38BDF8" />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Summary Card */}
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryTop}>
                            <View>
                                <Text style={styles.summaryLabel}>Total Paid Out</Text>
                                <Text style={styles.summaryValue}>₹{totalPaidOut.toFixed(2)}</Text>
                            </View>
                            <View style={styles.summaryIconBox}>
                                <ArrowUpRight size={24} color="#FFF" />
                            </View>
                        </View>
                        <View style={styles.summaryFooter}>
                            <Text style={styles.footerText}>Updated: Just Now</Text>
                        </View>
                    </View>

                    {/* Pending Settlement Card */}
                    <View style={styles.pendingCard}>
                        <View style={styles.pendingTop}>
                            <View>
                                <Text style={styles.pendingLabel}>Pending Settlement</Text>
                                <Text style={styles.pendingValue}>₹{pendingSettlement.toFixed(2)}</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.withdrawButton,
                                pendingSettlement <= 0 && styles.withdrawButtonDisabled
                            ]}
                            onPress={handleWithdraw}
                            disabled={pendingSettlement <= 0 || isWithdrawing}
                        >
                            {isWithdrawing ? (
                                <ActivityIndicator size="small" color="#FFF" />
                            ) : (
                                <Text style={styles.withdrawButtonText}>
                                    {pendingSettlement > 0 ? 'Withdraw to Bank Account' : 'No Earnings to Withdraw'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Filter Tabs */}
                    <View style={styles.filterSection}>
                        <Text style={styles.sectionTitle}>Recent Payouts</Text>
                        <TouchableOpacity>
                            <Text style={styles.filterText}>Last 30 Days</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Payout List */}
                    <View style={styles.listContainer}>
                        {loading ? (
                            <ActivityIndicator color="#38BDF8" style={{ marginTop: 20 }} />
                        ) : payouts.length > 0 ? (
                            payouts.map((item) => (
                                <PayoutItem
                                    key={item.id}
                                    id={item.id}
                                    amount={item.amount}
                                    date={item.date}
                                    status={item.status}
                                />
                            ))
                        ) : (
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Text style={{ color: '#64748B' }}>No payouts found.</Text>
                            </View>
                        )}
                    </View>

                    {/* Load More */}
                    <TouchableOpacity style={styles.loadMoreButton}>
                        <Text style={styles.loadMoreText}>View Older Payouts</Text>
                    </TouchableOpacity>
                </ScrollView>
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
    downloadButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0F9FF',
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
        paddingHorizontal: 20,
        paddingTop: 24,
    },
    summaryCard: {
        backgroundColor: '#38BDF8',
        borderRadius: 28,
        padding: 24,
        marginBottom: 30,
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    pendingCard: {
        backgroundColor: '#FFF',
        borderRadius: 28,
        padding: 24,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },
    pendingTop: {
        marginBottom: 16,
    },
    pendingLabel: {
        fontSize: 14,
        color: '#64748B',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    pendingValue: {
        fontSize: 32,
        color: '#1E293B',
        fontWeight: '900',
        marginTop: 4,
    },
    withdrawButton: {
        backgroundColor: '#10B981',
        borderRadius: 18,
        paddingVertical: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    withdrawButtonDisabled: {
        backgroundColor: '#E2E8F0',
    },
    withdrawButtonText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '800',
    },
    summaryTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    summaryValue: {
        fontSize: 32,
        color: '#FFF',
        fontWeight: '900',
        marginTop: 4,
    },
    summaryIconBox: {
        width: 52,
        height: 52,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryFooter: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    footerText: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '600',
    },
    filterSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1E293B',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#38BDF8',
    },
    listContainer: {
        gap: 16,
    },
    payoutCard: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 5,
        elevation: 1,
    },
    payoutTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    payoutLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#94A3B8',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    payoutAmount: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1E293B',
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '800',
    },
    payoutBottom: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#F8FAFC',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: '#94A3B8',
        fontWeight: '600',
    },
    refLabel: {
        fontSize: 13,
        color: '#CBD5E1',
        fontWeight: '600',
    },
    refText: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: '700',
    },
    loadMoreButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        marginTop: 10,
    },
    loadMoreText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#94A3B8',
    },
});

export default PayoutHistoryScreen;
