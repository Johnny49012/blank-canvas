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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import colors from '@/constants/colors';
import { formatGhs, loadHomeData, type HomeData } from '@/lib/topflex';
import {
  getWalletSandboxState,
  recordWalletSandboxMovement,
  WALLET_SANDBOX_CURRENCIES,
  WALLET_SANDBOX_NETWORKS,
  WALLET_SANDBOX_RECIPIENT,
  WALLET_SANDBOX_TRANSFER_FEE_RATE,
} from '@/lib/wallet-sandbox';

export type WalletMoneyFlowKind = 'add-money' | 'send-money';

type FlowStage =
  | 'funding'
  | 'choose-method'
  | 'recipient'
  | 'recipient-confirmation'
  | 'amount'
  | 'review'
  | 'request-sent'
  | 'processing'
  | 'success'
  | 'failure';

type TransferMethod = 'topflex' | 'bank' | 'mobile' | 'international';

const transferMethods: {
  id: TransferMethod;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: 'topflex', title: 'TopFlex User', description: 'Send to another TopFlex account', icon: 'person-circle-outline' },
  { id: 'bank', title: 'Bank Account', description: 'Send to a bank account', icon: 'business-outline' },
  { id: 'mobile', title: 'Mobile Money', description: 'Send to a mobile money number', icon: 'phone-portrait-outline' },
  { id: 'international', title: 'International Account', description: 'Send to an international account', icon: 'globe-outline' },
];

const cleanAmount = (value: string) => value.replace(/[^\d.]/g, '');
const parseAmount = (value: string) => Number(value.replace(/,/g, '').trim());
const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const phoneDigits = (value: string) => value.replace(/\D/g, '');

export function WalletMoneyFlow({ kind }: { kind: WalletMoneyFlowKind }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['topflex-home'],
    queryFn: loadHomeData,
    retry: 1,
  });
  const [stage, setStage] = useState<FlowStage>(kind === 'add-money' ? 'funding' : 'choose-method');
  const [method, setMethod] = useState<TransferMethod>('topflex');
  const [network, setNetwork] = useState<(typeof WALLET_SANDBOX_NETWORKS)[number]>('MTN');
  const [recipientId, setRecipientId] = useState(WALLET_SANDBOX_RECIPIENT.walletId);
  const [recipientFound, setRecipientFound] = useState(false);
  const [phone, setPhone] = useState(WALLET_SANDBOX_RECIPIENT.phone);
  const [bankName, setBankName] = useState('Demo Bank');
  const [bankAccount, setBankAccount] = useState('0012345678');
  const [currency, setCurrency] = useState<(typeof WALLET_SANDBOX_CURRENCIES)[number]['code']>('USD');
  const [amount, setAmount] = useState(kind === 'add-money' ? '50.00' : '100.00');
  const [message, setMessage] = useState('');
  const [receiptId, setReceiptId] = useState('');

  const wallet = query.data?.wallet ?? null;
  const walletBalance = wallet?.balance ?? getWalletSandboxState().balance;
  const amountValue = parseAmount(amount);
  const fee = kind === 'send-money' ? roundMoney(amountValue * WALLET_SANDBOX_TRANSFER_FEE_RATE) : 0;
  const total = kind === 'send-money' ? roundMoney(amountValue + fee) : amountValue;
  const title = kind === 'add-money' ? 'Mobile Money' : 'Transfer Money';
  const isBusy = stage === 'processing';

  const previousStages: Partial<Record<FlowStage, FlowStage>> = {
    recipient: 'choose-method',
    'recipient-confirmation': 'recipient',
    amount: 'recipient-confirmation',
    review: kind === 'add-money' ? 'funding' : 'amount',
    'request-sent': 'review',
    success: kind === 'add-money' ? 'funding' : 'choose-method',
    failure: 'review',
  };

  const goBack = () => {
    if (isBusy) return;
    const previousStage = previousStages[stage];
    if (previousStage) {
      setMessage('');
      setStage(previousStage);
      return;
    }
    router.back();
  };

  const showFailure = (reason: string) => {
    setMessage(reason);
    setStage('failure');
  };

  const updateSandboxBalance = (movementKind: 'funding' | 'transfer', detail: string) => {
    const result = recordWalletSandboxMovement({
      kind: movementKind,
      amount: amountValue,
      fee: movementKind === 'transfer' ? fee : 0,
      detail,
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
    setReceiptId(result.transaction.id.toUpperCase());
    return result;
  };

  const simulateProcessing = async (
    movementKind: 'funding' | 'transfer',
    detail: string,
  ) => {
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      showFailure('Enter a valid amount before continuing.');
      return;
    }
    if (movementKind === 'transfer' && total > walletBalance) {
      showFailure('Insufficient balance.');
      return;
    }

    setMessage('');
    setStage('processing');
    await new Promise<void>((resolve) => setTimeout(resolve, 900));
    try {
      updateSandboxBalance(movementKind, detail);
      setStage('success');
    } catch (error) {
      showFailure(error instanceof Error ? error.message : 'The simulated transaction failed.');
    }
  };

  const recipientTitle = () => {
    if (method === 'topflex') return WALLET_SANDBOX_RECIPIENT.fullName;
    if (method === 'mobile') return `${network} Mobile Money`;
    if (method === 'bank') return bankName || 'Bank Account';
    return `${currency} International Account`;
  };

  const recipientDetail = () => {
    if (method === 'topflex') return `Wallet ID ${WALLET_SANDBOX_RECIPIENT.walletId}`;
    if (method === 'mobile') return `${network} · ${phone}`;
    if (method === 'bank') return `${bankName} · ••••${bankAccount.slice(-4)}`;
    return WALLET_SANDBOX_CURRENCIES.find((account) => account.code === currency)?.name ?? currency;
  };

  const continueFromRecipient = () => {
    setMessage('');
    if (method === 'topflex') {
      if (recipientId.trim().toUpperCase() !== WALLET_SANDBOX_RECIPIENT.walletId) {
        setMessage('No sandbox recipient found for that ID. Try TF12345678.');
        return;
      }
      setRecipientFound(true);
      setStage('recipient-confirmation');
      return;
    }
    if (method === 'mobile' && phoneDigits(phone).length < 10) {
      setMessage('Enter a valid mobile money number.');
      return;
    }
    if (method === 'bank' && bankAccount.trim().length < 6) {
      setMessage('Enter a valid demo bank account number.');
      return;
    }
    setStage('recipient-confirmation');
  };

  const continueToReview = () => {
    setMessage('');
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setMessage('Enter an amount greater than zero.');
      return;
    }
    setStage('review');
  };

  const simulateFundingRequest = () => {
    if (!Number.isFinite(amountValue) || amountValue <= 0 || phoneDigits(phone).length < 10) {
      setMessage('Enter a valid phone number and amount.');
      return;
    }
    setMessage('');
    setStage('request-sent');
  };

  const currentStep = () => {
    if (kind === 'add-money') {
      if (stage === 'funding' || stage === 'review' || stage === 'request-sent') return 1;
      if (stage === 'processing') return 2;
      return 3;
    }
    if (stage === 'choose-method') return 1;
    if (stage === 'recipient' || stage === 'recipient-confirmation') return 2;
    if (stage === 'amount') return 3;
    if (stage === 'review') return 4;
    if (stage === 'processing') return 5;
    return 6;
  };

  const renderButton = (
    label: string,
    onPress: () => void,
    options: { secondary?: boolean; testID?: string; disabled?: boolean } = {},
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
      <Text style={options.secondary ? styles.secondaryButtonText : styles.primaryButtonText}>
        {label}
      </Text>
    </Pressable>
  );

  const renderNetworkSelector = () => (
    <View style={styles.networkRow}>
      {WALLET_SANDBOX_NETWORKS.map((item) => (
        <Pressable
          key={item}
          accessibilityRole="button"
          accessibilityState={{ selected: network === item }}
          onPress={() => setNetwork(item)}
          style={[styles.networkCard, network === item && styles.networkCardSelected]}
        >
          <View style={[styles.networkIcon, network === item && styles.networkIconSelected]}>
            <Ionicons name="phone-portrait-outline" size={17} color={network === item ? colors.light.white : colors.light.primary} />
          </View>
          <Text style={[styles.networkName, network === item && styles.networkNameSelected]}>{item}</Text>
        </Pressable>
      ))}
    </View>
  );

  const renderWalletCard = () => (
    <View style={styles.walletSourceCard}>
      <View style={styles.walletSourceLeft}>
        <View style={styles.flagCircle}><Text style={styles.ghanaFlag}>🇬🇭</Text></View>
        <View>
          <Text style={styles.walletSourceTitle}>TopFlex Wallet</Text>
          <Text style={styles.walletSourceSubtitle}>Ghana Cedis (GHS)</Text>
        </View>
      </View>
      <View style={styles.walletSourceRight}>
        <Text style={styles.walletSourceBalance}>{formatGhs(walletBalance)}</Text>
        {wallet?.walletId ? <Text style={styles.walletSourceId}>{wallet.walletId}</Text> : null}
      </View>
    </View>
  );

  const renderMethodSelection = () => (
    <>
      <Text style={styles.sectionTitle}>Choose transfer option</Text>
      <Text style={styles.sectionHint}>Where do you want to send money?</Text>
      <View style={styles.methodList}>
        {transferMethods.map((item) => (
          <Pressable
            key={item.id}
            testID={`transfer-method-${item.id}`}
            accessibilityRole="button"
            onPress={() => {
              setMethod(item.id);
              setMessage('');
              setStage('recipient');
            }}
            style={({ pressed }) => [styles.methodRow, pressed && styles.pressed]}
          >
            <View style={styles.methodIcon}>
              <Ionicons name={item.icon} size={20} color={colors.light.primary} />
            </View>
            <View style={styles.methodCopy}>
              <Text style={styles.methodTitle}>{item.title}</Text>
              <Text style={styles.methodDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.light.mutedForeground} />
          </Pressable>
        ))}
      </View>
    </>
  );

  const renderRecipientForm = () => (
    <>
      <Text style={styles.sectionTitle}>
        {method === 'topflex' ? 'Enter recipient TopFlex ID' : `Enter ${recipientTitle()} details`}
      </Text>
      <Text style={styles.sectionHint}>Sandbox details are used only for this test flow.</Text>
      {method === 'topflex' ? (
        <>
          <Text style={styles.inputLabel}>Recipient TopFlex ID</Text>
          <TextInput
            testID="transfer-recipient-id"
            accessibilityLabel="Recipient TopFlex ID"
            value={recipientId}
            onChangeText={(value) => {
              setRecipientId(value.toUpperCase());
              setRecipientFound(false);
              setMessage('');
            }}
            autoCapitalize="characters"
            placeholder="Enter wallet ID"
            placeholderTextColor={colors.light.mutedForeground}
            style={styles.input}
          />
          {renderButton('Find Recipient', continueFromRecipient, { testID: 'transfer-find-recipient' })}
          <Text style={styles.securityHint}>
            Demo directory record: TF12345678 · John Frimpong. No real lookup is performed.
          </Text>
        </>
      ) : null}
      {method === 'mobile' ? (
        <>
          <Text style={styles.inputLabel}>Select network</Text>
          {renderNetworkSelector()}
          <Text style={styles.inputLabel}>Phone number</Text>
          <TextInput
            testID="transfer-mobile-phone"
            accessibilityLabel="Mobile money phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="024 123 4567"
            placeholderTextColor={colors.light.mutedForeground}
            style={styles.input}
          />
          {renderButton('Continue', continueFromRecipient, { testID: 'transfer-mobile-continue' })}
        </>
      ) : null}
      {method === 'bank' ? (
        <>
          <Text style={styles.inputLabel}>Bank name</Text>
          <TextInput
            testID="transfer-bank-name"
            accessibilityLabel="Bank name"
            value={bankName}
            onChangeText={setBankName}
            placeholder="Demo Bank"
            placeholderTextColor={colors.light.mutedForeground}
            style={styles.input}
          />
          <Text style={styles.inputLabel}>Account number</Text>
          <TextInput
            testID="transfer-bank-account"
            accessibilityLabel="Bank account number"
            value={bankAccount}
            onChangeText={setBankAccount}
            keyboardType="number-pad"
            placeholder="Enter account number"
            placeholderTextColor={colors.light.mutedForeground}
            style={styles.input}
          />
          {renderButton('Continue', continueFromRecipient, { testID: 'transfer-bank-continue' })}
        </>
      ) : null}
      {method === 'international' ? (
        <>
          <Text style={styles.inputLabel}>Choose an international account</Text>
          <View style={styles.internationalOptions}>
            {WALLET_SANDBOX_CURRENCIES.map((item) => (
              <Pressable
                key={item.code}
                testID={`transfer-currency-${item.code.toLowerCase()}`}
                accessibilityRole="button"
                accessibilityState={{ selected: currency === item.code }}
                onPress={() => setCurrency(item.code)}
                style={[styles.internationalOption, currency === item.code && styles.internationalOptionSelected]}
              >
                <Text style={styles.optionFlag}>{item.flag}</Text>
                <Text style={styles.optionCode}>{item.code}</Text>
              </Pressable>
            ))}
          </View>
          {renderButton('Continue', continueFromRecipient, { testID: 'transfer-international-continue' })}
          <Text style={styles.securityHint}>FX conversion is not simulated. The test transfer stays in GHS.</Text>
        </>
      ) : null}
    </>
  );

  const renderRecipientConfirmation = () => (
    <>
      <Text style={styles.sectionTitle}>Confirm recipient</Text>
      <View style={styles.recipientCard}>
        <View style={styles.recipientAvatar}>
          <Ionicons
            name={method === 'topflex' ? 'person' : method === 'mobile' ? 'phone-portrait-outline' : method === 'bank' ? 'business-outline' : 'globe-outline'}
            size={22}
            color={colors.light.primary}
          />
        </View>
        <View style={styles.recipientCopy}>
          <Text style={styles.recipientName}>{recipientTitle()}</Text>
          <Text style={styles.recipientDetail}>{recipientDetail()}</Text>
          <View style={styles.demoVerified}>
            <Ionicons name="checkmark-circle" size={12} color={colors.light.primary} />
            <Text style={styles.demoVerifiedText}>{recipientFound ? 'Sandbox recipient' : 'Test details'}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.confirmNote}>
        You’re reviewing simulated recipient details. No real recipient identity was verified.
      </Text>
      {renderButton('Continue to amount', () => setStage('amount'), { testID: 'transfer-recipient-confirm' })}
      {renderButton('Change recipient', () => setStage('recipient'), { secondary: true, testID: 'transfer-change-recipient' })}
    </>
  );

  const renderAmountEntry = () => (
    <>
      <Text style={styles.sectionTitle}>Enter amount</Text>
      <View style={styles.compactRecipient}>
        <Text style={styles.summaryLabel}>To</Text>
        <View style={styles.compactRecipientRow}>
          <View style={styles.smallRecipientAvatar}><Ionicons name="person" size={15} color={colors.light.primary} /></View>
          <View style={styles.recipientCopy}>
            <Text style={styles.methodTitle}>{recipientTitle()}</Text>
            <Text style={styles.methodDescription}>{recipientDetail()}</Text>
          </View>
        </View>
      </View>
      <Text style={styles.inputLabel}>Amount (GHS)</Text>
      <View style={styles.amountInputWrap}>
        <Text style={styles.amountCurrency}>GH₵</Text>
        <TextInput
          testID="transfer-amount"
          accessibilityLabel="Transfer amount in Ghana cedis"
          value={amount}
          onChangeText={(value) => {
            setAmount(cleanAmount(value));
            setMessage('');
          }}
          keyboardType="decimal-pad"
          placeholder="100.00"
          placeholderTextColor={colors.light.mutedForeground}
          style={styles.amountInput}
        />
      </View>
      <View style={styles.availableBalance}>
        <Text style={styles.summaryLabel}>Available balance</Text>
        <Text style={styles.summaryValue}>{formatGhs(walletBalance)}</Text>
      </View>
      <Text style={styles.securityHint}>Sandbox transfer fee: 1.5% of the amount.</Text>
      {renderButton('Continue', continueToReview, { testID: 'transfer-amount-continue' })}
    </>
  );

  const renderReview = () => {
    const isFunding = kind === 'add-money';
    const wouldOverdraw = !isFunding && total > walletBalance;
    const detail = isFunding
      ? `${network} Mobile Money · ${phone}`
      : `${recipientTitle()} · ${recipientDetail()}`;

    return (
      <>
        <Text style={styles.sectionTitle}>{isFunding ? 'Review Add Money' : 'Confirm Transfer'}</Text>
        {renderWalletCard()}
        <View style={styles.reviewCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{isFunding ? 'From' : 'To'}</Text>
            <Text style={styles.summaryValueRight} numberOfLines={2}>{detail}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount</Text>
            <Text style={styles.summaryValue}>{formatGhs(amountValue)}</Text>
          </View>
          {!isFunding ? (
            <>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Transfer fee (1.5%)</Text>
                <Text style={styles.summaryValue}>{formatGhs(fee)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatGhs(total)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remaining balance</Text>
                <Text style={styles.summaryValue}>{formatGhs(Math.max(0, walletBalance - total))}</Text>
              </View>
            </>
          ) : null}
        </View>
        {wouldOverdraw ? (
          <View style={styles.errorNotice}>
            <Ionicons name="alert-circle-outline" size={17} color={colors.light.destructive} />
            <Text style={styles.errorNoticeText}>Insufficient balance for amount and fee.</Text>
          </View>
        ) : null}
        <Text style={styles.securityHint}>
          Demo only · This review uses sample fee rules and will not send a payment.
        </Text>
        {isFunding
          ? renderButton('Simulate payment request', simulateFundingRequest, { testID: 'funding-simulate-request' })
          : renderButton(
              'Confirm transfer',
              () => void simulateProcessing('transfer', detail),
              { testID: 'transfer-confirm', disabled: wouldOverdraw },
            )}
        {!isFunding
          ? renderButton(
              'Simulate insufficient-balance error',
              () => showFailure('Insufficient balance.'),
              { secondary: true, testID: 'transfer-simulate-failure' },
            )
          : null}
      </>
    );
  };

  const renderFundingForm = () => (
    <>
      <Text style={styles.sectionTitle}>Mobile Money · Select network</Text>
      {renderWalletCard()}
      <Text style={styles.inputLabel}>Select network</Text>
      {renderNetworkSelector()}
      <Text style={styles.inputLabel}>Phone number</Text>
      <TextInput
        testID="funding-phone"
        accessibilityLabel="Mobile money phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        placeholder="024 123 4567"
        placeholderTextColor={colors.light.mutedForeground}
        style={styles.input}
      />
      <Text style={styles.inputLabel}>Amount</Text>
      <View style={styles.amountInputWrap}>
        <Text style={styles.amountCurrency}>GH₵</Text>
        <TextInput
          testID="funding-amount"
          accessibilityLabel="Funding amount in Ghana cedis"
          value={amount}
          onChangeText={(value) => {
            setAmount(cleanAmount(value));
            setMessage('');
          }}
          keyboardType="decimal-pad"
          placeholder="50.00"
          placeholderTextColor={colors.light.mutedForeground}
          style={styles.amountInput}
        />
      </View>
      <Text style={styles.securityHint}>A simulated provider request is used in this test flow.</Text>
      {renderButton('Continue', continueToReview, { testID: 'funding-continue' })}
    </>
  );

  const renderRequestSent = () => (
    <View style={styles.statusContent}>
      <View style={styles.statusIcon}><Ionicons name="phone-portrait-outline" size={27} color={colors.light.primary} /></View>
      <Text style={styles.statusTitle}>Confirmation Request Simulated</Text>
      <Text style={styles.statusDescription}>
        No mobile money request was sent. Use the sandbox controls below to test approval or failure.
      </Text>
      <View style={styles.reviewCard}>
        <SummaryRow label="Network" value={network} />
        <SummaryRow label="Phone number" value={phone} />
        <SummaryRow label="Amount" value={formatGhs(amountValue)} />
      </View>
      {renderButton(
        'Simulate provider approval',
        () => void simulateProcessing('funding', `${network} Mobile Money · ${phone}`),
        { testID: 'funding-simulate-approval' },
      )}
      {renderButton(
        'Simulate provider decline',
        () => showFailure('The sandbox provider declined this test request.'),
        { secondary: true, testID: 'funding-simulate-decline' },
      )}
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.statusContent}>
      <View style={styles.processingIcon}><ActivityIndicator size="large" color={colors.light.primary} /></View>
      <Text style={styles.statusTitle}>{kind === 'add-money' ? 'Payment Processing' : 'Processing Transfer'}</Text>
      <Text style={styles.statusDescription}>Running a local sandbox simulation. No provider request is being sent.</Text>
      <View style={styles.reviewCard}>
        <SummaryRow label="Amount" value={formatGhs(amountValue)} />
        {kind === 'send-money' ? <SummaryRow label="Fee" value={formatGhs(fee)} /> : null}
        {kind === 'send-money' ? <SummaryRow label="Total" value={formatGhs(total)} /> : null}
      </View>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.statusContent}>
      <View style={styles.successIcon}><Ionicons name="checkmark" size={34} color={colors.light.white} /></View>
      <Text style={styles.statusTitle}>{kind === 'add-money' ? 'Payment Successful' : 'Transfer Successful'}</Text>
      <Text style={styles.statusDescription}>
        {kind === 'add-money'
          ? `${formatGhs(amountValue)} was added to the sandbox wallet.`
          : `The sandbox transfer was recorded for ${recipientTitle()}.`}
      </Text>
      <View style={styles.reviewCard}>
        <SummaryRow label="Amount" value={formatGhs(amountValue)} />
        {kind === 'send-money' ? <SummaryRow label="Fee" value={formatGhs(fee)} /> : null}
        {kind === 'send-money' ? <SummaryRow label="Total" value={formatGhs(total)} /> : null}
        <SummaryRow label="Test transaction ID" value={receiptId || 'TEST'} />
      </View>
      <View style={styles.sandboxInlineNotice}>
        <Ionicons name="flask-outline" size={15} color={colors.light.primary} />
        <Text style={styles.sandboxInlineText}>SIMULATED ONLY · No real funds moved.</Text>
      </View>
      {renderButton('Back to Wallet', () => router.back(), { testID: 'money-flow-back-to-wallet' })}
    </View>
  );

  const renderFailure = () => (
    <View style={styles.statusContent}>
      <View style={styles.failureIcon}><Ionicons name="alert" size={29} color={colors.light.white} /></View>
      <Text style={styles.statusTitle}>{kind === 'add-money' ? 'Payment Failed' : 'Transfer Failed'}</Text>
      <Text style={styles.statusDescription}>We could not complete this sandbox test.</Text>
      <View style={styles.failureCard}>
        <Text style={styles.failureLabel}>Reason</Text>
        <Text style={styles.failureReason}>{message || 'The test transaction could not be completed.'}</Text>
      </View>
      <View style={styles.sandboxInlineNotice}>
        <Ionicons name="flask-outline" size={15} color={colors.light.primary} />
        <Text style={styles.sandboxInlineText}>TEST RESULT · No real funds moved.</Text>
      </View>
      {renderButton('Try Again', () => {
        setMessage('');
        setStage(kind === 'add-money' ? 'review' : 'review');
      }, { testID: 'money-flow-try-again' })}
      {renderButton('Back to Wallet', () => router.back(), { secondary: true, testID: 'money-flow-failure-back' })}
    </View>
  );

  const renderMainContent = () => {
    if (query.isLoading) {
      return <View style={styles.centerState}><ActivityIndicator color={colors.light.primary} /><Text style={styles.sectionHint}>Loading test wallet…</Text></View>;
    }
    if (query.isError) {
      return (
        <View style={styles.centerState}>
          <Text style={styles.sectionTitle}>Wallet data unavailable</Text>
          <Text style={styles.sectionHint}>The test flow needs the signed-in wallet profile.</Text>
          {renderButton('Try again', () => void query.refetch(), { testID: 'money-flow-retry' })}
        </View>
      );
    }
    return (
      <>
        {kind === 'add-money' && stage === 'funding' ? renderFundingForm() : null}
        {kind === 'send-money' && stage === 'choose-method' ? renderMethodSelection() : null}
        {stage === 'recipient' ? renderRecipientForm() : null}
        {stage === 'recipient-confirmation' ? renderRecipientConfirmation() : null}
        {stage === 'amount' ? renderAmountEntry() : null}
        {stage === 'review' ? renderReview() : null}
        {stage === 'request-sent' ? renderRequestSent() : null}
        {stage === 'processing' ? renderProcessing() : null}
        {stage === 'success' ? renderSuccess() : null}
        {stage === 'failure' ? renderFailure() : null}
      </>
    );
  };

  return (
    <View style={styles.screen}>
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 },
        ]}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Pressable
            testID="money-flow-back"
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={goBack}
            hitSlop={10}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color={colors.light.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.sandboxBanner}>
          <Ionicons name="flask-outline" size={15} color={colors.light.primary} />
          <View style={styles.sandboxCopy}>
            <Text style={styles.sandboxTitle}>SANDBOX · SIMULATED PROVIDER</Text>
            <Text style={styles.sandboxDescription}>Test only. No real payment request or transfer is sent.</Text>
          </View>
        </View>

        <View style={styles.stepLabel}>
          <Text style={styles.stepLabelText}>
            {kind === 'add-money' ? 'ADD MONEY' : 'TRANSFER'} · STEP {currentStep()}
          </Text>
        </View>

        {message && stage !== 'failure' ? (
          <View style={styles.inlineError}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.light.destructive} />
            <Text style={styles.inlineErrorText}>{message}</Text>
          </View>
        ) : null}

        {renderMainContent()}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValueRight}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.light.background },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, gap: 13 },
  header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  backButton: { width: 32, height: 32, justifyContent: 'center' },
  headerTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 },
  headerSpacer: { width: 32 },
  sandboxBanner: { padding: 11, borderRadius: 13, backgroundColor: colors.light.softMint, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sandboxCopy: { flex: 1 },
  sandboxTitle: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 0.3 },
  sandboxDescription: { color: colors.light.foreground, fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 13, marginTop: 3 },
  stepLabel: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.light.secondary },
  stepLabelText: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 8, letterSpacing: 0.4 },
  sectionTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 15 },
  sectionHint: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 15, marginTop: -7 },
  walletSourceCard: { padding: 12, minHeight: 62, borderRadius: 14, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  walletSourceLeft: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  flagCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
  ghanaFlag: { fontSize: 17 },
  walletSourceTitle: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  walletSourceSubtitle: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8, marginTop: 3 },
  walletSourceRight: { alignItems: 'flex-end', maxWidth: '54%' },
  walletSourceBalance: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 11 },
  walletSourceId: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 7, marginTop: 3 },
  methodList: { gap: 8 },
  methodRow: { minHeight: 65, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: colors.light.border, borderRadius: 13, backgroundColor: colors.light.white, flexDirection: 'row', alignItems: 'center', gap: 10 },
  methodIcon: { width: 37, height: 37, borderRadius: 12, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
  methodCopy: { flex: 1 },
  methodTitle: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  methodDescription: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8, lineHeight: 12, marginTop: 3 },
  inputLabel: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 10, marginBottom: -6 },
  input: { minHeight: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.light.border, borderRadius: 11, backgroundColor: colors.light.white, color: colors.light.foreground, fontFamily: 'Inter_500Medium', fontSize: 11 },
  networkRow: { flexDirection: 'row', gap: 8 },
  networkCard: { flex: 1, minHeight: 64, paddingVertical: 8, borderWidth: 1, borderColor: colors.light.border, borderRadius: 11, backgroundColor: colors.light.white, alignItems: 'center', justifyContent: 'center', gap: 4 },
  networkCardSelected: { borderColor: colors.light.primary, backgroundColor: colors.light.secondary },
  networkIcon: { width: 27, height: 27, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  networkIconSelected: { backgroundColor: colors.light.primary },
  networkName: { color: colors.light.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 8 },
  networkNameSelected: { color: colors.light.primary },
  amountInputWrap: { minHeight: 50, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.light.border, borderRadius: 11, backgroundColor: colors.light.white, flexDirection: 'row', alignItems: 'center', gap: 8 },
  amountCurrency: { color: colors.light.mutedForeground, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  amountInput: { flex: 1, color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 15, textAlign: 'right', paddingVertical: 8 },
  availableBalance: { minHeight: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9 },
  summaryValue: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  summaryValueRight: { color: colors.light.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 9, textAlign: 'right', flexShrink: 1, maxWidth: '62%' },
  reviewCard: { padding: 13, borderRadius: 14, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.white, gap: 11 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  totalRow: { paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.light.border },
  totalLabel: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 11 },
  totalValue: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 12 },
  securityHint: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8, lineHeight: 13 },
  button: { minHeight: 45, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  primaryButton: { backgroundColor: colors.light.primary },
  secondaryButton: { backgroundColor: colors.light.white, borderWidth: 1, borderColor: colors.light.primary },
  primaryButtonText: { color: colors.light.white, fontFamily: 'Inter_700Bold', fontSize: 10 },
  secondaryButtonText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  buttonDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.75 },
  internationalOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  internationalOption: { minWidth: 73, minHeight: 52, paddingHorizontal: 9, borderWidth: 1, borderColor: colors.light.border, borderRadius: 10, backgroundColor: colors.light.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  internationalOptionSelected: { borderColor: colors.light.primary, backgroundColor: colors.light.secondary },
  optionFlag: { fontSize: 14 },
  optionCode: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 9 },
  recipientCard: { padding: 14, borderWidth: 1, borderColor: colors.light.border, borderRadius: 14, backgroundColor: colors.light.white, flexDirection: 'row', alignItems: 'center', gap: 12 },
  recipientAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
  recipientCopy: { flex: 1 },
  recipientName: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 11 },
  recipientDetail: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 4 },
  demoVerified: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  demoVerifiedText: { color: colors.light.primary, fontFamily: 'Inter_600SemiBold', fontSize: 8 },
  confirmNote: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 8 },
  compactRecipient: { padding: 11, backgroundColor: colors.light.white, borderWidth: 1, borderColor: colors.light.border, borderRadius: 12, gap: 7 },
  compactRecipientRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  smallRecipientAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
  errorNotice: { padding: 10, borderRadius: 10, backgroundColor: colors.light.destructiveForeground, flexDirection: 'row', alignItems: 'center', gap: 7 },
  errorNoticeText: { color: colors.light.destructive, fontFamily: 'Inter_600SemiBold', fontSize: 9, flex: 1 },
  inlineError: { padding: 10, borderRadius: 10, backgroundColor: colors.light.destructiveForeground, flexDirection: 'row', alignItems: 'center', gap: 7 },
  inlineErrorText: { color: colors.light.destructive, fontFamily: 'Inter_500Medium', fontSize: 9, flex: 1 },
  statusContent: { alignItems: 'center', gap: 14 },
  statusIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  processingIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.light.secondary, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  successIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.light.primary, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  failureIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.light.destructive, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  statusTitle: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center' },
  statusDescription: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 16, textAlign: 'center', paddingHorizontal: 12 },
  failureCard: { width: '100%', padding: 12, borderRadius: 12, backgroundColor: colors.light.destructiveForeground, gap: 5 },
  failureLabel: { color: colors.light.mutedForeground, fontFamily: 'Inter_400Regular', fontSize: 8 },
  failureReason: { color: colors.light.destructive, fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  sandboxInlineNotice: { width: '100%', padding: 10, borderRadius: 10, backgroundColor: colors.light.softMint, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  sandboxInlineText: { color: colors.light.primary, fontFamily: 'Inter_700Bold', fontSize: 8 },
  centerState: { minHeight: 230, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 18 },
  gateCard: { padding: 18, borderWidth: 1, borderColor: colors.light.border, borderRadius: 16, backgroundColor: colors.light.white, alignItems: 'center', gap: 13 },
  gateIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.light.softMint, alignItems: 'center', justifyContent: 'center' },
});