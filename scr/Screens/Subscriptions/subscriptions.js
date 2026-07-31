import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  useWindowDimensions,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView } from 'react-native-tab-view';
import Colors, { Spacing, Shadows, BorderRadius } from '../../Helper/Colors';
import { useNavigation } from '@react-navigation/native';
import { Fonts } from '../../Helper/Fonts';
import Purchases from 'react-native-purchases';
import { useDispatch, useSelector } from 'react-redux';
import { checkSubscriptionRequest, checkSubscriptionSuccess, setActiveSubscriptions, updateActiveSubscriptions } from '../../redux/slices/subcriptionsSlice';
import Header from '../../Components/Header';
import { saveSubscriptionAPI, fetchUserDetails } from '../../redux/api';
import Config from 'react-native-config';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const wp = v => (SCREEN_W * v) / 100;
const hp = v => (SCREEN_H * v) / 100;

const SCRAP_FEATURES = [
  '7 Days Free Trial',
  'Access cukljlrated scrap car listings',
  'Real-time vehicle updates',
  'Direct seller contact',
  'Unlimited enquiries',
];

const SALVAGE_FEATURES = [
  '7 Days Free Trial',
  'Unlimited enquiries',
  'Browse salvage car listings',
  'Connect with offload sellers',
  'Expand your inventory',
  'Unlimited enquiries',
];

const SubscriptionScreen = () => {
  const navigation = useNavigation();
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);
  const token = useSelector((state) => state.auth?.token);

  const routes = [
    { key: 'scrap', title: 'Scrap' },
    { key: 'salvage', title: 'Salvage' },
  ];

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [salvagePackages, setSalvagePackages] = useState([]);
  const [scrapPackages, setScrapPackages] = useState([]);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const { userData } = useSelector((state) => state.user);
  const { cancelSuccess, updateSuccess } = useSelector(
    state => state?.cancelSubscription || {},
  );
  const activeSubscriptions = useSelector(
    state => state?.subscription?.activeSubscriptions || [],
  );
  const dispatch = useDispatch();

  useEffect(() => {
    if (userData) setEmail(userData.email);
  }, [userData]);

  useEffect(() => {
    if (userData?.email) {
      dispatch(checkSubscriptionRequest({ email: userData.email }));
    }
  }, [userData?.email, cancelSuccess, updateSuccess]);

  const refreshActiveSubscriptions = async () => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const activeSubs = (customerInfo.activeSubscriptions || []).filter(
        id => id.toLowerCase().includes('scrap') || id.toLowerCase().includes('salvage')
      );
      dispatch(setActiveSubscriptions(activeSubs));
    } catch (error) {
      console.log('❌ Error refreshing active subscriptions:', error);
    }
  };

  useEffect(() => {
    const checkActiveSubscriptions = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const activeSubs = (customerInfo.activeSubscriptions || []).filter(
          id => id.toLowerCase().includes('scrap') || id.toLowerCase().includes('salvage')
        );
        dispatch(setActiveSubscriptions(activeSubs));
        if (activeSubs.length === 0) return;
        const userDetails = await fetchUserDetails(token);
        const backendSubs = userDetails?.is_subscribed || [];
        const isSynced = activeSubs.every(id => backendSubs.includes(id));
        if (!isSynced) {
          const response = await saveSubscriptionAPI(token, { is_subscribed: activeSubs });
          if (response?.message === 'Subscription saved successfully') {
            dispatch(checkSubscriptionSuccess(response));
          }
        }
      } catch (error) {
        console.log('❌ Error checking active subscriptions:', error);
      }
    };
    if (token) checkActiveSubscriptions();
  }, [dispatch, token]);

  useEffect(() => {
    const fetchRevenueCatProducts = async () => {
      try {
        const allOfferings = await Purchases.getOfferings();
        const scrap = allOfferings.all['scrap']?.availablePackages || [];
        const salvage = allOfferings.all['salvage']?.availablePackages || [];
        setSalvagePackages(salvage);
        setScrapPackages(scrap);
      } catch (error) {
        console.log('❌ Error fetching offerings:', error);
      }
    };
    fetchRevenueCatProducts();
  }, [dispatch]);

  const handlePurchase = async (selectedIdentifier) => {
    try {
      setIsPurchasing(true);
      if (userData?.email) await Purchases.logIn(userData.email);
      const allOfferings = await Purchases.getOfferings();
      const allPackages = [
        ...(allOfferings.all['scrap']?.availablePackages || []),
        ...(allOfferings.all['salvage']?.availablePackages || []),
        ...(allOfferings.current?.availablePackages || []),
      ];
      const selectedPackage = allPackages.find(
        pkg => pkg.product.identifier === selectedIdentifier
      );
      if (!selectedPackage) {
        Alert.alert('Error', 'Package not found. Please try again.');
        return;
      }
      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);
      dispatch(updateActiveSubscriptions(customerInfo.activeSubscriptions || []));
      await saveSubscriptionAPI(token, { is_subscribed: customerInfo.activeSubscriptions || [] });
      setTimeout(async () => { await refreshActiveSubscriptions(); }, 1000);
      Alert.alert(
        '🎉 Subscription Activated',
        'Welcome to premium! You now have full access to all listings.',
        [{ text: 'Continue', onPress: () => { dispatch(checkSubscriptionRequest({ email: userData.email })); navigation.goBack(); } }],
        { cancelable: false },
      );
    } catch (error) {
      if (!error.userCancelled) {
        Alert.alert('Purchase Failed', error.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsPurchasing(false);
    }
  };

  const renderScene = ({ route }) => {
    const sharedProps = {
      onSelectSubscription: handlePurchase,
      activeSubscriptions,
      isPurchasing,
    };
    switch (route.key) {
      case 'scrap':
        return <PlanRoute {...sharedProps} products={scrapPackages} type="scrap" features={SCRAP_FEATURES} />;
      case 'salvage':
        return <PlanRoute {...sharedProps} products={salvagePackages} type="salvage" features={SALVAGE_FEATURES} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header
        textData="Choose a Plan"
        navigation={navigation}
        showBackButton={true}
        textColor={Colors.primary}
      />

      {/* Tab Switcher */}
      <View style={styles.tabSwitcher}>
        {routes.map((route, i) => {
          const isActive = index === i;
          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.tabPill, isActive && styles.tabPillActive]}
              onPress={() => setIndex(i)}
              activeOpacity={0.8}>
              <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                {route.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={() => null}
      />

      {isPurchasing && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>Processing...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const PlanRoute = ({ onSelectSubscription, activeSubscriptions, isPurchasing, products = [], features = [] }) => {
  const isActive = (id) => activeSubscriptions.includes(id);

  const filtered = products
    .filter(pkg =>
      !pkg.product.identifier.toLowerCase().includes('corporate') &&
      !pkg.product.title.toLowerCase().includes('corporate') &&
      !pkg.product.identifier.toLowerCase().includes('test') &&
      !pkg.product.title.toLowerCase().includes('test'),
    )
    .sort((a, b) => {
      const aWeekly = a.product.identifier.toLowerCase().includes('weekly');
      const bWeekly = b.product.identifier.toLowerCase().includes('weekly');
      if (aWeekly && !bWeekly) return -1;
      if (!aWeekly && bWeekly) return 1;
      return 0;
    });

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Features Card */}
      <View style={styles.featuresCard}>
        <Text style={styles.featuresTitle}>What's included</Text>
        {features.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={styles.checkCircle}>
              <Text style={styles.checkMark}>✓</Text>
            </View>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* Plan Cards */}
      <Text style={styles.plansLabel}>Select a plan</Text>
      {filtered.map((pkg, i) => {
        const active = isActive(pkg.product.identifier);
        const isWeekly = pkg.product.identifier.toLowerCase().includes('weekly');
        return (
          <TouchableOpacity
            key={`pkg-${pkg.product.identifier}-${i}`}
            style={[styles.planCard, active && styles.planCardActive]}
            onPress={() => !active && onSelectSubscription(pkg.product.identifier)}
            activeOpacity={active ? 1 : 0.85}
            disabled={isPurchasing}>
            {/* Popular badge for weekly */}
            {isWeekly && !active && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>TRIAL</Text>
              </View>
            )}
            {active && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>● Active</Text>
              </View>
            )}

            <View style={styles.planCardInner}>
              <View style={styles.planLeft}>
                <Text style={styles.planTitle}>{pkg.product.title}</Text>
                <Text style={styles.planDuration}>
                  {isWeekly ? '7-day access' : '30-day access'}
                </Text>
                <View style={styles.freeTrialBadge}>
                  <Text style={styles.freeTrialText}>7 Days Free Trial</Text>
                </View>
                <View style={styles.linkRow}>
                  <Text style={styles.linkText} onPress={() => Linking.openURL(`${Config.API_BASE_URL}/terms`)}>
                    Terms
                  </Text>
                  <Text style={styles.linkSep}> · </Text>
                  <Text style={styles.linkText} onPress={() => Linking.openURL(`${Config.API_BASE_URL}/privacy-policy`)}>
                    Privacy
                  </Text>
                </View>
              </View>
              <View style={styles.planRight}>
                <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
                <Text style={styles.planPer}>{isWeekly ? '/ week' : '/ month'}</Text>
                {!active && (
                  <View style={styles.selectButton}>
                    <Text style={styles.selectButtonText}>Select</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      {filtered.length === 0 && (
        <View style={styles.emptyState}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.emptyText}>Loading plans...</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F6FA',
  },
  loaderOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loaderCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.large,
  },
  loaderText: {
    fontSize: wp(4),
    fontFamily: Fonts.medium,
    color: Colors.textSecondary,
  },

  // Tab switcher
  tabSwitcher: {
    flexDirection: 'row',
    marginHorizontal: wp(5),
    marginTop: hp(1.5),
    marginBottom: hp(0.5),
    backgroundColor: '#E8EAEF',
    borderRadius: BorderRadius.round,
    padding: 4,
  },
  tabPill: {
    flex: 1,
    paddingVertical: hp(1.2),
    borderRadius: BorderRadius.round,
    alignItems: 'center',
  },
  tabPillActive: {
    backgroundColor: Colors.white,
    ...Shadows.small,
  },
  tabPillText: {
    fontSize: wp(4),
    fontFamily: Fonts.semiBold,
    color: Colors.textSecondary,
  },
  tabPillTextActive: {
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(4),
  },

  // Features card
  featuresCard: {
    backgroundColor: Colors.primaryDark,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: hp(2.5),
  },
  featuresTitle: {
    fontSize: wp(4),
    fontFamily: Fonts.bold,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  checkCircle: {
    width: wp(5.5),
    height: wp(5.5),
    borderRadius: wp(3),
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: Colors.white,
    fontSize: wp(3),
    fontFamily: Fonts.bold,
    fontWeight: '700',
  },
  featureText: {
    fontSize: wp(3.8),
    fontFamily: Fonts.regular,
    color: Colors.white,
    flex: 1,
  },

  // Plans
  plansLabel: {
    fontSize: wp(3.5),
    fontFamily: Fonts.bold,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: hp(1.5),
  },
  planCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    marginBottom: hp(1.5),
    borderWidth: 1.5,
    borderColor: Colors.lightGray,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  planCardActive: {
    borderColor: Colors.success,
    borderWidth: 2,
  },
  planCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
    paddingVertical: hp(2),
  },
  planLeft: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  planTitle: {
    fontSize: wp(4.2),
    fontFamily: Fonts.bold,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  planDuration: {
    fontSize: wp(3.3),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  freeTrialBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 6,
  },
  freeTrialText: {
    fontSize: wp(3),
    fontFamily: Fonts.semiBold,
    color: '#2E7D32',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: wp(3),
    fontFamily: Fonts.regular,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  linkSep: {
    fontSize: wp(3),
    color: Colors.textSecondary,
  },
  planRight: {
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: wp(6),
    fontFamily: Fonts.bold,
    fontWeight: '800',
    color: Colors.primary,
  },
  planPer: {
    fontSize: wp(3.2),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  selectButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.round,
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.8),
  },
  selectButtonText: {
    fontSize: wp(3.3),
    fontFamily: Fonts.bold,
    color: Colors.white,
  },

  // Badges
  popularBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderBottomRightRadius: BorderRadius.md,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: wp(2.8),
    fontFamily: Fonts.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },
  activeBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderBottomLeftRadius: BorderRadius.md,
    zIndex: 1,
  },
  activeBadgeText: {
    fontSize: wp(2.8),
    fontFamily: Fonts.bold,
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: hp(4),
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: wp(4),
    fontFamily: Fonts.regular,
    color: Colors.textSecondary,
  },
});

export default SubscriptionScreen;
