import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import colors from '@/constants/colors';
import { formatGhs, formatTransactionTime, loadHomeData, type HomeData } from '@/lib/topflex';
import {
  recordWalletSandboxMovement,
  WALLET_SANDBOX_NETWORKS,
  WALLET_SANDBOX_SENDER,
  type WalletFundingMethod,
} from '@/lib/wallet-sandbox';

type Stage =
  | 'details'
  | 'sender-confirmation'
  | 'review'
  | 'authentication'
  | 'request-sent'
  | 'pending'
  | 'processing'
  | 'success'
  | 'failure';

const methodDetails: Record<WalletFundingMethod, { title: string; icon: keyof typeof Ionicons.glyphMap }> = {
  'mobile-money': { title: 'Mobile Money', icon: 'phone-portrait-outline' },
  'bank-transfer': { title: 'Bank Account', icon: 'business-outline' },
  card: { title: 'Debit/Credit Card', icon: 'card-outline' },
  topflex: { title: 'TopFlex User', icon: 'person-circle-outline' },
};

const quickAmounts = [50, 100, 200, 500];
const bankAccountDetails = {
  bankName: 'TopFlex Partner Bank',
  accountName: 'TopFlex Wallet',
  accountNumber: '1234567890',
  branchCode: 'XXXXXX',
};

const stripPhone = (value: string) => value.replace(/\D/g, '');
const cleanAmount = (value: string) => value.replace(/[^\d.]/g, '');
const parseAmount = (value: string) => Number(value.replace(/,/g, '').trim());
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const isGhanaPhone = (value: string) => /^(?:0\d{9}|233\d{9})$/.test(stripPhone(value));
const maskPhone = (value: string) => {
  const digits = stripPhone(value);
  return digits.length >= 7 ? `${digits.slice(0, 3)} ••• ${digits.slice(-4)}` : value;
};

function WalletAddMoneyFlow({ method }: { method: WalletFundingMethod }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['topflex-home'],
    queryFn: loadHomeData,
    retry: 1,
  });
  const [stage, setStage] = useState<Stage>('details');
  const [network, setNetwork] = useState<(typeof WALLET_SANDBOX_NETWORKS)[number] | null>(null);
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [formAttempted, setFormAttempted] = useState(false);
  const [instructionsConfirmed, setInstructionsConfirmed] = useState(false);
  const [senderId, setSenderId] = useState(WALLET_SANDBOX_SENDER.walletId);
  const [senderFound, setSenderFound] = useState(false);
  const [copied, setCopied] = useState('');
  const [message, setMessage] = useState('');
  const [failureReason, setFailureReason] = useState('');
  const [receiptId, setReceiptId] = useState('');
  const [updatedBalance, setUpdatedBalance] = useState<number | null>(null);
  const [transferReference] = useState(() => `TFX-${Date.now().toString().slice(-6)}`);

  const methodInfo = methodDetails[method];
  const walletBalance = query.data?.wallet?.balance ?? 599_048;
  const amountValue = parseAmount(amount);
  const amountValid = Number.isFinite(amountValue) && amountValue >= 1 && amountValue <= 10_000;
  const feeRate = method === 'mobile-money' ? 0.015 : method === 'card' ? 0.029 : 0;
  const fee = amountValid ? roundMoney(amountValue * feeRate) : 0;
  const total = amountValid ? roundMoney(amountValue + fee) : 0;
  const isBusy = stage === 'processing';
  const phoneValid = isGhanaPhone(phone);
  const detailsValid = method === 'mobile-money'
    ? network !== null && phoneValid && amountValid
    : method === 'bank-transfer'
      ? amountValid && instructionsConfirmed
      : method === 'card'
        ? amountValid
        : senderFound && amountValid;

  const goBack = () => {
    if (isBusy) return;
    if (stage === 'sender-confirmation') {
      setStage('details');
      return;
    }
    if (stage === 'review') {
      setStage(method === 'topflex' ? 'sender-confirmation' : 'details');
      return;
    }
    if (stage === 'authentication') {
      setStage('review');
      return;
    }
    if (stage === 'request-sent') {
      setStage('authentication');
      return;
    }
    if (stage === 'pending') {
      setStage('review');
      return;
    }
    if (stage === 'success' || stage === 'failure') {
      router.back();
      return;
    }
    router.back();
  };

  const copyText = async (value: string, label: string) => {
    try {
      await Clipboard.setStringAsync(value);
      setCopied(label);
      setTimeout(() => setCopied(''), 1600);
    } catch {
      setMessage('Could not copy that value on this device.');
    }
  };

  const findSender = () => {
    setFormAttempted(true);
    setMessage('');
    if (senderId.trim().toUpperCase() !== WALLET_SANDBOX_SENDER.walletId) {
      setMessage(`No demo sender found. Try ${WALLET_SANDBOX_SENDER.walletId}.`);
      setSenderFound(false);
      return;
    }
    setSenderFound(true);
    setStage('sender-confirmation');
  };

  const continueFromDetails = () => {
    setFormAttempted(true);
    setMessage('');
    if (!amountValid) {
      setMessage('Enter an amount between GH₵ 1.00 and GH₵ 10,000.00.');
      return;
    }
    if (method === 'mobile-money' && (!network || !phoneValid)) {
      setMessage(!network ? 'Select a mobile money network.' : 'Enter a valid Ghana mobile money number.');
      return;
    }
    if (method === 'bank-transfer' && !instructionsConfirmed) {
      setMessage('Confirm that you understand these are simulated bank details.');
      return;
    }
    if (method === 'topflex' && !senderFound) {
      setMessage('Find and confirm the demo sender before continuing.');
      return;
    }
    setStage('review');
  };

  const recordSuccessfulFunding = async () => {
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setFailureReason('Enter a valid amount before continuing.');
      setStage('failure');
      return;
    }
    setMessage('');
    setStage('processing');
    await new Promise<void>((resolve) => setTimeout(resolve, 850));
    try {
      const result = recordWalletSandboxMovement({
        kind: 'funding',
        amount: amountValue,
        detail: method === 'mobile-money'
          ? `${network} Mobile Money · ${maskPhone(phone)}`
          : method === 'bank-transfer'
            ? `Bank Transfer · ${transferReference}`
            : method === 'card'
              ? 'Demo Visa · •••• 4242'
              : `${WALLET_SANDBOX_SENDER.fullName} · ${WALLET_SANDBOX_SENDER.walletId}`,
      });
      const currentHome = queryClient.getQueryData<HomeData>(['topflex-home']) ?? query.data;
      if (currentHome) {
        queryClient.setQueryData<HomeData>(['topflex-home'], {
          ...currentHome,
          wallet: currentHome.wallet
            ? { ...currentHome.wallet, balance: result.balance, demoMode: true }
            : currentHome.wallet,
          transactions: [result.transaction, ...currentHome.transactions]
            .filter((transaction, index, transactions) =>
              transactions.findIndex((candidate) => candidate.id === transaction.id) === index)
            .slice(0, 4),
        });
      }
      setUpdatedBalance(result.balance);
      setReceiptId(result.transaction.id.toUpperCase());
      setStage('success');
    } catch (error) {
      setFailureReason(error instanceof Error ? error.message : 'The sandbox funding simulation failed.');
      setStage('failure');
    }
  };

  const simulateAuthentication = () => {
    setMessage('');
    if (method === 'mobile-money') {
      setStage('request-sent');
      return;
    }
    void recordSuccessfulFunding();
  };

  const beginAuthenticationOrPending = () => {
    if (method === 'bank-transfer') {
      setStage('pending');
      return;
    }
    setStage('authentication');
  };

  const renderButton = (
    label: string,
    onPress: () => void,
    options: { secondary?: boolean; disabled?: boolean; testID?: string } = {},
  ) => (
    <Pressable
      testID={options.testID}
      accessibilityRole="button"
      disabled={options.disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        options.secondary ? styles.secondaryButton : styles.primaryButton,
        pressed && styles.pressed,
        options.disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={options.secondary ? styles.secondaryButtonText : styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );

  const renderAmountEntry = () => (
    <>
      <Text style={styles.inputLabel}>Amount</Text>
      <View style={styles.amountInputWrap}>
        <Text style={styles.amountCurrency}>GH₵</Text>
        <TextInput
          testID="add-money-amount"
          accessibilityLabel="Amount in Ghana cedis"
          value={amount}
          onBlur={() => setFormAttempted(true)}
          onChangeText={(value) => {
            setAmount(cleanAmount(value));
            setMessage('');
          }}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.light.mutedForeground}
          style={styles.amountInput}
        />
      </View>
      <Text style={styles.fieldHint}>Sandbox amount limits: GH₵ 1.00 – GH₵ 10,000.00</Text>
      {formAttempted && !amountValid ? (
        <Text style={styles.fieldError}>Enter an amount between GH₵ 1.00 and GH₵ 10,000.00.</Text>
      ) : null}
      <View style={styles.quickAmountRow}>
        {quickAmounts.map((value) => (
          <Pressable
            key={value}
            testID={`add-money-quick-${value}`}
            accessibilityRole="button"
            onPress={() => {
              setAmount(value.toFixed(2));
              setMessage('');
            }}
            style={({ pressed }) => [styles.quickAmount, pressed && styles.quickAmountPressed]}
          >
            <Text style={styles.quickAmountText}>GH₵ {value}</Text>
          </Pressable>
        ))}
      </View>
      {amountValid ? (
        <View style={styles.feeSummary}>
          <SummaryRow label="Amount" value={formatGhs(amountValue)} />
          <SummaryRow label="Transaction Fee" value={formatGhs(fee)} />
          <View style={styles.totalDivider} />
          <SummaryRow label="Total" value={formatGhs(total)} strong />
        </View>
      ) : null}
    </>
  );

  const renderMobileMoneyDetails = () => (
    <>
      <View style={styles.pageIntro}>
        <Text style={styles.pageTitle}>Add money with Mobile Money</Text>
        <Text style={styles.pageSubtitle}>Enter your mobile money details to add funds to your TopFlex Wallet.</Text>
      </View>
      <Text style={styles.inputLabel}>Select Mobile Money Network</Text>
      <View style={styles.networkRow}>
        {WALLET_SANDBOX_NETWORKS.map((item) => {
          const isSelected = network === item;
          const provider = item === 'MTN' ? 'Mobile Money' : item === 'Telecel' ? 'Cash' : 'Money';
          return (
            <Pressable
              key={item}
              testID={`add-money-network-${item.toLowerCase()}`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              onPress={() => {
                setNetwork(item);
                setMessage('');
              }}
              style={[styles.networkCard, isSelected && styles.networkCardSelected]}
            >
              <View style={[styles.networkIcon, isSelected && styles.networkIconSelected]}>
                <Ionicons name="phone-portrait-outline" size={17} color={isSelected ? colors.light.white : colors.light.primary} />
              </View>
              <Text style={[styles.networkName, isSelected && styles.networkNameSelected]}>{item}</Text>
              <Text style={styles.networkProvider}>{provider}</Text>
              {isSelected ? <Ionicons name="checkmark-circle" size={13} color={colors.light.primary} style={styles.networkCheck} /> : null}
            </Pressable>
          );
        })}
      </View>
      {!network ? <Text style={styles.fieldHint}>Select a network to continue.</Text> : null}

      <Text style={styles.inputLabel}>Mobile Money Number</Text>
      <TextInput
        testID="add-money-phone"
        accessibilityLabel="Mobile money number"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          setMessage('');
        }}
        onBlur={() => setFormAttempted(true)}
        keyboardType="phone-pad"
        placeholder="Enter mobile money number"
        placeholderTextColor={colors.light.mutedForeground}
        style={styles.input}
      />
      <Text style={styles.fieldHint}>Use the number registered with your selected Mobile Money provider. Example: 024 123 4567</Text>
      {formAttempted && !phoneValid ? (
        <Text style={styles.fieldError}>Enter a valid Ghana number with 10 digits, or a number beginning with +233.</Text>
      ) : null}

      {renderAmountEntry()}
      {renderButton('Continue', continueFromDetails, {
        testID: 'add-money-mobile-continue',
        disabled: !detailsValid,
      })}
      <Text style={styles.secureFootnote}>This is a test flow. No mobile money request is sent.</Text>
    </>
  );

  const renderCopyRow = (label: string, value: string, copyKey: string) => (
    <View style={styles.copyRow}>
      <View style={styles.copyValueWrap}>
        <Text style={styles.copyLabel}>{label}</Text>
        <Text style={[styles.copyValue, copyKey === 'account' && styles.copyValueEmphasis]}>{value}</Text>
      </View>
      <Pressable
        testID={`add-money-copy-${copyKey}`}
        accessibilityRole="button"
        accessibilityLabel={`Copy ${label.toLowerCase()}`}
        onPress={() => void copyText(value, copyKey)}
        style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}
      >
        <Ionicons name={copied === copyKey ? 'checkmark' : 'copy-outline'} size={16} color={colors.light.primary} />
      </Pressable>
    </View>
  );

  const renderBankDetails = () => (
    <>
      <View style={styles.pageIntro}>
        <Text style={styles.pageTitle}>Add money via Bank Transfer</Text>
        <Text style={styles.pageSubtitle}>Transfer money from your bank account to your TopFlex Wallet.</Text>
      </View>
      <View style={styles.bankDetailsCard}>
        <View style={styles.cardHeadingRow}>
          <View style={styles.cardHeadingIcon}><Ionicons name="business-outline" size={18} color={colors.light.primary} /></View>
          <View style={styles.cardHeadingCopy}>
            <Text style={styles.cardHeading}>TopFlex Bank Account</Text>
            <Text style={styles.testOnlyCaption}>DEMO DETAILS · NOT A LIVE DEPOSIT ACCOUNT</Text>
          </View>
        </View>
        {renderCopyRow('Bank Name', bankAccountDetails.bankName, 'bank')}
        {renderCopyRow('Account Name', bankAccountDetails.accountName, 'name')}
        {renderCopyRow('Account Number', bankAccountDetails.accountNumber, 'account')}
        {renderCopyRow('Sort Code / Branch Code', bankAccountDetails.branchCode, 'branch')}
        {copied ? <Text style={styles.copiedHint}>{copied === 'account' ? 'Account number copied' : 'Details copied'}</Text> : null}
        <Text style={styles.cardFootnote}>These sample details are for preview only. Do not send real money to them.</Text>
      </View>

      <View style={styles.referenceCard}>
        <View style={styles.referenceCopy}>
          <Text style={styles.inputLabel}>Your transfer reference</Text>
          <Text style={styles.referenceValue}>{transferReference}</Text>
          <Text style={styles.fieldHint}>Use this sample reference to identify the test payment.</Text>
        </View>
        <Pressable
          testID="add-money-copy-reference"
          accessibilityRole="button"
          accessibilityLabel="Copy transfer reference"
          onPress={() => void copyText(transferReference, 'reference')}
          style={({ pressed }) => [styles.copyButton, pressed && styles.pressed]}
        >
          <Ionicons name={copied === 'reference' ? 'checkmark' : 'copy-outline'} size={16} color={colors.light.primary} />
        </Pressable>
      </View>

      {renderAmountEntry()}

      <View style={styles.instructionsCard}>
        <Text style={styles.cardHeading}>How to add money</Text>
        {[
          'Open your bank’s mobile app or online banking.',
          'Select “Bank Transfer” or “Send Money”.',
          'Enter the sample TopFlex bank details shown above.',
          'Enter the amount you want to add.',
          'Enter the transfer reference shown above.',
          'Confirm only in your test flow; do not send a real transfer.',
          'Return here to simulate the payment status.',
        ].map((step, index) => (
          <View key={step} style={styles.instructionRow}>
            <View style={styles.instructionNumber}><Text style={styles.instructionNumberText}>{index + 1}</Text></View>
            <Text style={styles.instructionText}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={17} color={colors.light.primary} />
        <Text style={styles.infoText}>Bank transfers may take time in a live service. This preview does not monitor or receive bank payments.</Text>
      </View>
      <Pressable
        testID="bank-instructions-confirm"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: instructionsConfirmed }}
        onPress={() => {
          setInstructionsConfirmed((value) => !value);
          setMessage('');
        }}
        style={styles.checkboxRow}
      >
        <View style={[styles.checkbox, instructionsConfirmed && styles.checkboxChecked]}>
          {instructionsConfirmed ? <Ionicons name="checkmark" size={14} color={colors.light.white} /> : null}
        </View>
        <Text style={styles.checkboxText}>I understand these are simulated test details.</Text>
      </Pressable>
      {renderButton('Review transfer', continueFromDetails, {
        testID: 'add-money-bank-review',
        disabled: !amountValid || !instructionsConfirmed,
      })}
    </>
  );

  const renderCardDetails = () => (
    <>
      <View style={styles.pageIntro}>
        <Text style={styles.pageTitle}>Add money with a bank card</Text>
        <Text style={styles.pageSubtitle}>Select the sample card to preview a secure card-funding flow.</Text>
      </View>
      <Text style={styles.inputLabel}>Select card</Text>
      <View
        testID="add-money-demo-card"
        accessibilityRole="radio"
        accessibilityState={{ selected: true }}
        style={styles.demoCard}
      >
        <View style={styles.cardHeadingIcon}><Ionicons name="card-outline" size={19} color={colors.light.primary} /></View>
        <View style={styles.cardHeadingCopy}>
          <Text style={styles.cardHeading}>Demo Visa</Text>
          <Text style={styles.fieldHint}>•••• •••• •••• 4242 · Test card only</Text>
        </View>
        <Ionicons name="checkmark-circle" size={20} color={colors.light.primary} />
      </View>
      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark-outline" size={17} color={colors.light.primary} />
        <Text style={styles.infoText}>Do not enter real card details. This preview uses a masked sample card and sends no payment.</Text>
      </View>
      {renderAmountEntry()}
      {renderButton('Continue', continueFromDetails, {
        testID: 'add-money-card-continue',
        disabled: !amountValid,
      })}
    </>
  );

  const renderTopFlexDetails = () => (
    <>
      <View style={styles.pageIntro}>
        <Text style={styles.pageTitle}>Receive from a TopFlex user</Text>
        <Text style={styles.pageSubtitle}>Enter the sender’s TopFlex ID to confirm who the test payment is from.</Text>
      </View>
      <Text style={styles.inputLabel}>Sender TopFlex ID</Text>
      <TextInput
        testID="add-money-sender-id"
        accessibilityLabel="Sender TopFlex ID"
        value={senderId}
        onChangeText={(value) => {
          setSenderId(value.toUpperCase());
          setSenderFound(false);
          setMessage('');
        }}
        autoCapitalize="characters"
        placeholder="Enter TopFlex ID"
        placeholderTextColor={colors.light.mutedForeground}
        style={styles.input}
      />
      <Text style={styles.fieldHint}>Demo sender: {WALLET_SANDBOX_SENDER.walletId}</Text>
      {renderButton('Find Sender', findSender, { testID: 'add-money-find-sender' })}
    </>
  );

  const renderSenderConfirmation = () => (
    <>
      <View style={styles.pageIntro}>
        <Text style={styles.pageTitle}>Confirm sender</Text>
        <Text style={styles.pageSubtitle}>Check the demo sender before continuing.</Text>
      </View>
      <View style={styles.senderCard}>
        <View style={styles.senderAvatar}><Ionicons name="person-outline" size={23} color={colors.light.primary} /></View>
        <View style={styles.cardHeadingCopy}>
          <Text style={styles.cardHeading}>{WALLET_SANDBOX_SENDER.fullName}</Text>
          <Text style={styles.fieldHint}>{WALLET_SANDBOX_SENDER.walletId}</Text>
          <Text style={styles.demoVerified}>SANDBOX SENDER · NOT A LIVE DIRECTORY LOOKUP</Text>
        </View>
      </View>
      {renderAmountEntry()}
      {renderButton('Continue to review', continueFromDetails, {
        testID: 'add-money-topflex-review',
        disabled: !amountValid,
      })}
    </>
  );

  const renderReview = () => {
    const fromValue = method === 'mobile-money'
      ? `${network ?? 'Mobile Money'} · ${maskPhone(phone)}`
      : method === 'bank-transfer'
        ? `Bank transfer · ${transferReference}`
        : method === 'card'
          ? 'Demo Visa · •••• 4242'
          : `${WALLET_SANDBOX_SENDER.fullName} · ${WALLET_SANDBOX_SENDER.walletId}`;
    return (
      <>
        <View style={styles.pageIntro}>
          <Text style={styles.pageTitle}>Review Add Money</Text>
          <Text style={styles.pageSubtitle}>Check the test transaction details before continuing.</Text>
        </View>
        <View style={styles.reviewCard}>
          <SummaryRow label="From" value={fromValue} />
          <SummaryRow label="To" value="TopFlex Wallet · GHS" />
          <SummaryRow label="Amount" value={formatGhs(amountValue)} />
          <SummaryRow label="Transaction fee" value={formatGhs(fee)} />
          <View style={styles.totalDivider} />
          <SummaryRow label="Total" value={formatGhs(total)} strong />
          <SummaryRow
            label="Expected time"
            value={method === 'bank-transfer' ? 'Manual test confirmation' : 'Simulated instantly'}
          />
          <SummaryRow label="Test reference" value={transferReference} />
        </View>
        <View style={styles.infoCard}>
          <Ionicons name="flask-outline" size={17} color={colors.light.primary} />
          <Text style={styles.infoText}>This preview does not send a payment request or use a real provider.</Text>
        </View>
        {renderButton(
          method === 'bank-transfer' ? 'I’ve Made the Transfer' : 'Confirm Add Money',
          beginAuthenticationOrPending,
          { testID: 'add-money-confirm' },
        )}
        {renderButton('Edit details', goBack, { secondary: true, testID: 'add-money-edit' })}
      </>
    );
  };

  const renderAuthentication = () => (
    <View style={styles.statusContent}>
      <View style={styles.statusIllustration}><Ionicons name="lock-closed-outline" size={27} color={colors.light.primary} /></View>
      <Text style={styles.statusTitle}>Confirm your identity</Text>
      <Text style={styles.statusDescription}>In a live wallet, this step protects your transaction. Here, the buttons only simulate authentication.</Text>
      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark-outline" size={17} color={colors.light.primary} />
        <Text style={styles.infoText}>No PIN, password, or biometric data is collected in this preview.</Text>
      </View>
      {renderButton(
        'Simulate PIN confirmation',
        simulateAuthentication,
        { testID: 'add-money-auth-pin' },
      )}
      {renderButton(
        'Simulate biometric confirmation',
        simulateAuthentication,
        { secondary: true, testID: 'add-money-auth-biometric' },
      )}
      {renderButton(
        'Simulate authentication failure',
        () => {
          setFailureReason('Test authentication was declined.');
          setStage('failure');
        },
        { secondary: true, testID: 'add-money-auth-fail' },
      )}
    </View>
  );

  const renderRequestSent = () => (
    <View style={styles.statusContent}>
      <View style={styles.statusIllustration}><Ionicons name="phone-portrait-outline" size={26} color={colors.light.primary} /></View>
      <Text style={styles.statusTitle}>Confirmation Request Sent</Text>
      <Text style={styles.statusDescription}>Approve the simulated payment request on your mobile money number using your MoMo PIN.</Text>
      <View style={styles.reviewCard}>
        <SummaryRow label="Network" value={network ?? '—'} />
        <SummaryRow label="Phone number" value={maskPhone(phone)} />
        <SummaryRow label="Amount" value={formatGhs(amountValue)} />
        <SummaryRow label="Transaction ID" value={transferReference} />
        <SummaryRow label="Request expires in" value="02:00 (demo countdown)" />
      </View>
      <Text style={styles.fieldHint}>Do not close this preview while testing. No provider request was actually sent.</Text>
      {renderButton('Simulate provider approval', () => void recordSuccessfulFunding(), { testID: 'add-money-simulate-approval' })}
      {renderButton(
        'Simulate provider decline',
        () => {
          setFailureReason('The sandbox mobile money request was declined.');
          setStage('failure');
        },
        { secondary: true, testID: 'add-money-simulate-decline' },
      )}
    </View>
  );

  const renderPending = () => (
    <View style={styles.statusContent}>
      <View style={styles.statusIllustration}><Ionicons name="time-outline" size={27} color={colors.light.primary} /></View>
      <Text style={styles.statusTitle}>Transfer Pending</Text>
      <Text style={styles.statusDescription}>Waiting for your test bank transfer. The preview cannot detect a real payment.</Text>
      <View style={styles.reviewCard}>
        <SummaryRow label="Status" value="Pending · Test only" />
        <SummaryRow label="Amount" value={formatGhs(amountValue)} />
        <SummaryRow label="Reference" value={transferReference} />
        <SummaryRow label="Test transaction ID" value={transferReference} />
      </View>
      {renderButton('Simulate transfer detected', () => void recordSuccessfulFunding(), { testID: 'bank-simulate-detected' })}
      {renderButton(
        'Simulate transfer not found',
        () => {
          setFailureReason('Transfer not detected. This test flow does not receive bank notifications.');
          setStage('failure');
        },
        { secondary: true, testID: 'bank-simulate-not-found' },
      )}
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.statusContent}>
      <View style={styles.statusIllustration}><ActivityIndicator size="large" color={colors.light.primary} /></View>
      <Text style={styles.statusTitle}>Payment Processing</Text>
      <Text style={styles.statusDescription}>Running a local test simulation. No payment provider is being contacted.</Text>
      <View style={styles.reviewCard}>
        <SummaryRow label="Funding method" value={methodInfo.title} />
        <SummaryRow label="Amount" value={formatGhs(amountValue)} />
        <SummaryRow label="Fee" value={formatGhs(fee)} />
        <SummaryRow label="Transaction ID" value={transferReference} />
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.statusContent}>
      <View style={styles.successIcon}><Ionicons name="checkmark" size={35} color={colors.light.white} /></View>
      <Text style={styles.statusTitle}>Money Added Successfully</Text>
      <Text style={styles.statusDescription}>{formatGhs(amountValue)} was added to the local TopFlex preview wallet.</Text>
      <View style={styles.reviewCard}>
        <SummaryRow label="Amount added" value={formatGhs(amountValue)} />
        <SummaryRow label="Funding method" value={methodInfo.title} />
        {method === 'mobile-money' ? <SummaryRow label="Network" value={network ?? '—'} /> : null}
        {method === 'mobile-money' ? <SummaryRow label="Phone number" value={maskPhone(phone)} /> : null}
        <SummaryRow label="Transaction fee" value={formatGhs(fee)} />
        <SummaryRow label="Total" value={formatGhs(total)} strong />
        <SummaryRow label="Transaction ID" value={receiptId || transferReference} />
        <SummaryRow label="Date and time" value={formatTransactionTime(new Date().toISOString())} />
        <SummaryRow label="Updated wallet balance" value={formatGhs(updatedBalance ?? walletBalance + amountValue)} strong />
      </View>
      <View style={styles.testNotice}>
        <Ionicons name="flask-outline" size={15} color={colors.light.primary} />
        <Text style={styles.testNoticeText}>SIMULATED SUCCESS · No real funds moved.</Text>
      </View>
      {renderButton('Back to Wallet', () => router.back(), { testID: 'add-money-back-wallet' })}
      {renderButton('View Transaction', () => router.push('/transactions'), { secondary: true, testID: 'add-money-view-transaction' })}
    </View>
  );

  const renderFailure = () => (
    <View style={styles.statusContent}>
      <View style={styles.failureIcon}><Ionicons name="close" size={31} color={colors.light.white} /></View>
      <Text style={styles.statusTitle}>Add Money Failed</Text>
      <Text style={styles.statusDescription}>We couldn’t complete this simulated transaction. Please try again.</Text>
      <View style={styles.failureCard}>
        <Text style={styles.failureLabel}>Reason</Text>
        <Text style={styles.failureText}>{failureReason || 'The sandbox flow could not complete.'}</Text>
      </View>
      <View style={styles.testNotice}>
        <Ionicons name="flask-outline" size={15} color={colors.light.primary} />
        <Text style={styles.testNoticeText}>TEST RESULT · No real funds moved.</Text>
      </View>
      {renderButton('Try Again', () => {
        setFailureReason('');
        setMessage('');
        setStage(method === 'bank-transfer' ? 'details' : 'review');
      }, { testID: 'add-money-try-again' })}
      {renderButton('Back to Wallet', () => router.back(), { secondary: true, testID: 'add-money-failure-back' })}
    </View>
  );

  const renderDetails = () => {
    if (method === 'mobile-money') return renderMobileMoneyDetails();
    if (method === 'bank-transfer') return renderBankDetails();
    if (method === 'card') return renderCardDetails();
    return renderTopFlexDetails();
  };

  const renderStage = () => {
    if (query.isLoading) {
      return <View style={styles.centerState}><ActivityIndicator color={colors.light.primary} /><Text style={styles.fieldHint}>Loading preview wallet…</Text></View>;
    }
    if (query.isError) {
      return <View style={styles.centerState}><Text style={styles.pageTitle}>Preview unavailable</Text><Text style={styles.fieldHint}>Reload the local wallet preview to continue.</Text></View>;
    }
    if (stage === 'details') return renderDetails();
    if (stage === 'sender-confirmation') return renderSenderConfirmation();
    if (stage === 'review') return renderReview();
    if (stage === 'authentication') return renderAuthentication();
    if (stage === 'request-sent') return renderRequestSent();
    if (stage === 'pending') return renderPending();
    if (stage === 'processing') return renderProcessing();
    if (stage === 'success') return renderSuccess();
    return renderFailure();
  };

  return (
    <View style={styles.screen}>
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 22 },
        ]}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            testID="add-money-back"
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={goBack}
            hitSlop={10}
            style={styles.headerButton}
          >
            <Ionicons name="arrow-back" size={20} color={colors.light.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Add Money</Text>
          <Pressable
            testID="add-money-close"
            accessibilityRole="button"
            accessibilityLabel="Close Add Money"
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={20} color={colors.light.foreground} />
          </Pressable>
        </View>

        <View style={styles.sandboxBanner}>
          <Ionicons name="flask-outline" size={15} color={colors.light.primary} />
          <View style={styles.bannerCopy}>
            <Text style={styles.bannerTitle}>TEST MODE · SIMULATED PROVIDER</Text>
            <Text style={styles.bannerText}>No live deposit account or payment provider is connected.</Text>
          </View>
        </View>

        {message ? (
          <View style={styles.inlineError}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.light.destructive} />
            <Text style={styles.inlineErrorText}>{message}</Text>
          </View>
        ) : null}

        {stage === 'details' || stage === 'sender-confirmation' ? (
          <View style={styles.methodHeading}>
            <View style={styles.methodHeadingIcon}><Ionicons name={methodInfo.icon} size={17} color={colors.light.primary} /></View>
            <View style={styles.bannerCopy}>
              <Text style={styles.methodHeadingTitle}>{methodInfo.title}</Text>
              <Text style={styles.methodHeadingSubtitle}>TopFlex Wallet · Ghana Cedis</Text>
            </View>
          </View>
        ) : null}

        {renderStage()}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, strong && styles.summaryStrong]}>{label}</Text>
      <Text style={[styles.summaryValue, strong && styles.summaryStrong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.light.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 13 },
  header: { minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 34, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 },
  sandboxBanner: { minHeight: 47, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12, backgroundColor: colors.light.softMint, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerCopy: { flex: 1 },
  bannerTitle: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.35 },
  bannerText: { color: colors.light.foreground, fontFamily: 'Inter_400Regular', fontSize: 8, lineHeight: 12, marginTop: 3 },
  methodHeading: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 9 },
  methodHeadingIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
  methodHeadingTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 11 },
  methodHeadingSubtitle: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8, marginTop: 2 },
  pageIntro: { gap: 5, marginBottom: 1 },
  pageTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 19, lineHeight: 25 },
  pageSubtitle: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15 },
  inputLabel: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 10, marginBottom: -6 },
  input: { minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.light.border, borderRadius: 11, backgroundColor: colors.light.white, color: colors.light.foreground, fontFamily: 'Inter_500Medium', fontSize: 11 },
  fieldHint: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8, lineHeight: 12, marginTop: -5 },
  fieldError: { color: colors.light.destructive, fontFamily: 'Inter_500Medium', fontSize: 8, lineHeight: 12, marginTop: -5 },
  networkRow: { flexDirection: 'row', gap: 7 },
  networkCard: { flex: 1, minHeight: 90, paddingHorizontal: 4, paddingVertical: 8, borderWidth: 1, borderColor: colors.light.border, borderRadius: 12, backgroundColor: colors.light.white, alignItems: 'center', justifyContent: 'center', gap: 3 },
  networkCardSelected: { borderWidth: 1.5, borderColor: colors.light.primary, backgroundColor: colors.light.secondary },
  networkIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  networkIconSelected: { backgroundColor: colors.light.primary },
  networkName: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 8 },
  networkNameSelected: { color: colors.light.primary },
  networkProvider: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 6, textAlign: 'center' },
  networkCheck: { position: 'absolute', top: 5, right: 5 },
  amountInputWrap: { minHeight: 50, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.light.border, borderRadius: 11, backgroundColor: colors.light.white, flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountCurrency: { color: colors.light.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  amountInput: { flex: 1, color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 15, textAlign: 'right', paddingVertical: 8 },
  quickAmountRow: { flexDirection: 'row', gap: 7 },
  quickAmount: { flex: 1, minHeight: 38, paddingHorizontal: 3, borderRadius: 10, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.white, alignItems: 'center', justifyContent: 'center' },
  quickAmountPressed: { backgroundColor: colors.light.secondary, borderColor: colors.light.primary },
  quickAmountText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 8 },
  feeSummary: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.white, gap: 9 },
  totalDivider: { height: 1, backgroundColor: colors.light.border, marginVertical: 1 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  summaryLabel: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9, flex: 1 },
  summaryValue: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 9, textAlign: 'right', flexShrink: 1 },
  summaryStrong: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 10 },
  button: { minHeight: 46, paddingHorizontal: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { backgroundColor: colors.light.primary },
  secondaryButton: { backgroundColor: colors.light.white, borderWidth: 1, borderColor: colors.light.primary },
  primaryButtonText: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 10 },
  secondaryButtonText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  buttonDisabled: { opacity: 0.43 },
  pressed: { opacity: 0.75 },
  secureFootnote: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8, lineHeight: 12, textAlign: 'center' },
  bankDetailsCard: { padding: 13, borderRadius: 15, borderWidth: 1, borderColor: colors.light.primary, backgroundColor: colors.light.white, gap: 7 },
  cardHeadingRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 4 },
  cardHeadingIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
  cardHeadingCopy: { flex: 1 },
  cardHeading: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 11 },
  testOnlyCaption: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 6, letterSpacing: 0.3, marginTop: 3 },
  copyRow: { minHeight: 42, borderTopWidth: 1, borderTopColor: colors.light.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  copyValueWrap: { flex: 1, gap: 3 },
  copyLabel: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 7 },
  copyValue: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 9 },
  copyValueEmphasis: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 15, letterSpacing: 0.6 },
  copyButton: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
  copiedHint: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 8, marginTop: -3 },
  cardFootnote: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 7, lineHeight: 11, marginTop: 2 },
  referenceCard: { padding: 11, borderRadius: 12, backgroundColor: colors.light.white, borderWidth: 1, borderColor: colors.light.border, flexDirection: 'row', alignItems: 'center', gap: 8 },
  referenceCopy: { flex: 1, gap: 7 },
  referenceValue: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 15, letterSpacing: 0.5 },
  instructionsCard: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.white, gap: 9 },
  instructionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  instructionNumber: { width: 19, height: 19, borderRadius: 10, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
  instructionNumberText: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 8 },
  instructionText: { color: colors.light.foreground, fontFamily: 'Inter_400Regular', fontSize: 8, lineHeight: 13, flex: 1, paddingTop: 2 },
  infoCard: { padding: 10, borderRadius: 11, backgroundColor: colors.light.softMint, flexDirection: 'row', alignItems: 'center', gap: 7 },
  infoText: { color: colors.light.foreground, fontFamily: 'Inter_400Regular', fontSize: 8, lineHeight: 12, flex: 1 },
  checkboxRow: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1, borderColor: colors.light.primary, backgroundColor: colors.light.white, alignItems: 'center', justifyContent: 'center' },
  checkboxChecked: { backgroundColor: colors.light.primary },
  checkboxText: { color: colors.light.foreground, fontFamily: 'Inter_500Medium', fontSize: 8, flex: 1 },
  demoCard: { minHeight: 62, padding: 11, borderRadius: 13, borderWidth: 1, borderColor: colors.light.primary, backgroundColor: colors.light.secondary, flexDirection: 'row', alignItems: 'center', gap: 9 },
  senderCard: { minHeight: 74, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.white, flexDirection: 'row', alignItems: 'center', gap: 10 },
  senderAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
  demoVerified: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 6, letterSpacing: 0.25, marginTop: 4 },
  reviewCard: { padding: 13, borderRadius: 14, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.white, gap: 11 },
  statusContent: { alignItems: 'center', gap: 14 },
  statusIllustration: { width: 66, height: 66, borderRadius: 33, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center', marginTop: 15 },
  statusTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 17, textAlign: 'center' },
  statusDescription: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 16, textAlign: 'center', paddingHorizontal: 14 },
  successIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.light.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  failureIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.light.destructive, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  testNotice: { width: '100%', minHeight: 36, paddingHorizontal: 9, borderRadius: 10, backgroundColor: colors.light.softMint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  testNoticeText: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 8 },
  failureCard: { width: '100%', padding: 12, borderRadius: 12, backgroundColor: colors.light.destructiveForeground, gap: 5 },
  failureLabel: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8 },
  failureText: { color: colors.light.destructive, fontFamily: 'Inter_600SemiBold', fontSize: 9, lineHeight: 14 },
  inlineError: { padding: 10, borderRadius: 10, backgroundColor: colors.light.destructiveForeground, flexDirection: 'row', alignItems: 'center', gap: 7 },
  inlineErrorText: { color: colors.light.destructive, fontFamily: 'Inter_500Medium', fontSize: 8, flex: 1 },
  centerState: { minHeight: 230, alignItems: 'center', justifyContent: 'center', gap: 12 },
});

export { WalletAddMoneyFlow };
