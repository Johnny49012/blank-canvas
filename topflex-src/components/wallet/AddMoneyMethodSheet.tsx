import React, { useMemo } from 'react';
import {
  Dimensions,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import type { WalletFundingMethod } from '@/lib/wallet-sandbox';

const fundingMethods: {
  id: WalletFundingMethod;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    id: 'mobile-money',
    title: 'Mobile Money',
    description: 'Add money from your MTN, Telecel or AirtelTigo account',
    icon: 'phone-portrait-outline',
  },
  {
    id: 'bank-transfer',
    title: 'Bank Account',
    description: 'Transfer money from your bank account',
    icon: 'business-outline',
  },
  {
    id: 'card',
    title: 'Debit/Credit Card',
    description: 'Add money using a demo bank card',
    icon: 'card-outline',
  },
  {
    id: 'topflex',
    title: 'TopFlex User',
    description: 'Receive money from another TopFlex account',
    icon: 'person-circle-outline',
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (method: WalletFundingMethod) => void;
};

export function AddMoneyMethodSheet({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8,
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 65) onClose();
      },
    }),
    [onClose],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close Add Money options"
          onPress={onClose}
          style={styles.backdrop}
        />
        <View
          style={[
            styles.sheet,
            {
              height: Math.min(Dimensions.get('window').height * 0.66, 600),
              paddingBottom: Math.max(insets.bottom, 14),
            },
          ]}
        >
          <View style={styles.dragArea} {...panResponder.panHandlers}>
            <View style={styles.dragHandle} />
          </View>
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Add Money</Text>
              <Text style={styles.subtitle}>Choose how you want to add money</Text>
            </View>
            <Pressable
              testID="add-money-sheet-close"
              accessibilityRole="button"
              accessibilityLabel="Close Add Money options"
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={19} color={colors.light.foreground} />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.methodList}
          >
            {fundingMethods.map((method, index) => (
              <Pressable
                key={method.id}
                testID={`add-money-method-${method.id}`}
                accessibilityRole="button"
                onPress={() => onSelect(method.id)}
                style={({ pressed }) => [
                  styles.methodRow,
                  index === 0 && styles.recommendedRow,
                  pressed && styles.methodPressed,
                ]}
              >
                <View style={[styles.methodIcon, index === 0 && styles.recommendedIcon]}>
                  <Ionicons
                    name={method.icon}
                    size={20}
                    color={colors.light.primary}
                  />
                </View>
                <View style={styles.methodCopy}>
                  <View style={styles.methodTitleRow}>
                    <Text style={styles.methodTitle}>{method.title}</Text>
                    {index === 0 ? <Text style={styles.recommendedLabel}>RECOMMENDED</Text> : null}
                  </View>
                  <Text style={styles.methodDescription}>{method.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.light.mutedForeground} />
              </Pressable>
            ))}
            <View style={styles.sandboxNote}>
              <Ionicons name="flask-outline" size={14} color={colors.light.primary} />
              <Text style={styles.sandboxText}>TEST MODE · No real money will move.</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0, 24, 19, 0.46)' },
  sheet: { width: '100%', paddingHorizontal: 18, paddingTop: 8, backgroundColor: colors.light.background, borderTopLeftRadius: 25, borderTopRightRadius: 25, overflow: 'hidden' },
  dragArea: { height: 20, alignItems: 'center', justifyContent: 'flex-start' },
  dragHandle: { width: 38, height: 4, borderRadius: 3, backgroundColor: colors.light.border },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 6, paddingBottom: 12 },
  headerCopy: { flex: 1 },
  title: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 20 },
  subtitle: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  closeButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.light.white, borderWidth: 1, borderColor: colors.light.border, alignItems: 'center', justifyContent: 'center', marginLeft: 12 },
  methodList: { gap: 8, paddingBottom: 10 },
  methodRow: { minHeight: 72, paddingHorizontal: 11, paddingVertical: 10, borderRadius: 15, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.white, flexDirection: 'row', alignItems: 'center', gap: 10 },
  recommendedRow: { borderColor: colors.light.primary, backgroundColor: colors.light.secondary },
  methodPressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
  methodIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.softMint },
  recommendedIcon: { backgroundColor: colors.light.white },
  methodCopy: { flex: 1 },
  methodTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  methodTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 11 },
  recommendedLabel: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 6, letterSpacing: 0.35 },
  methodDescription: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8, lineHeight: 12, marginTop: 4 },
  sandboxNote: { minHeight: 34, borderRadius: 10, backgroundColor: colors.light.softMint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  sandboxText: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 8 },
  pressed: { opacity: 0.72 },
});
