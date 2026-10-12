import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { gotvColors as B } from '@/constants/gotv-colors';
const GUIDES = [
  { title: 'Check your account', icon: 'person-circle-outline', description: 'Package, account status and renewal date', steps: ['Open Manage My Account from the GOtv page.', 'Enter the IUC number shown on your decoder label or GOtv account.', 'Choose Account Status. Once the service is connected, this will show the package and renewal details returned for your account.'], note: 'Account checks are not available in TopFlex yet.' },
  { title: 'Renew your subscription', icon: 'refresh-outline', description: 'Smartcard, package and payment', steps: ['Open Renew Subscription and enter your IUC number.', 'Your account must be verified before a live renewal can be processed.', 'Choose your package, check the account and amount, then choose a payment method when renewals become available.'], note: 'Verification and renewal payments are not live. TopFlex does not take payment or change your subscription.' },
  { title: 'Clear Error E16', icon: 'flash-outline', description: 'Scrambled channels after renewal', steps: ['Check that your subscription payment was successful and your decoder is powered on.', 'Open Manage My Account, enter your IUC number and choose Clear Error E16.', 'When connected, TopFlex can request a subscription authorization refresh. If the error remains, contact TopFlex support.'], note: 'TopFlex cannot send decoder commands yet. E16 can indicate that a channel is not included in your subscription.' },
  { title: 'Clear Error E30', icon: 'card-outline', description: 'Smartcard or subscription authorization', steps: ['Check the exact error displayed on your television and keep your decoder powered on.', 'Open Manage My Account, enter your IUC number and choose Clear Error E30.', 'When connected, TopFlex can request an authorization reset. If the error persists, contact TopFlex support with the error and decoder details.'], note: 'TopFlex cannot clear E30 yet. A reset does not fix every IUC or decoder fault.' },
  { title: 'Refresh your signal', icon: 'radio-outline', description: 'Refresh decoder authorization', steps: ['Keep the decoder powered on and check the cables are securely connected.', 'Open Manage My Account, enter your IUC number and choose Refresh Signal.', 'When connected, this can resend authorization to the decoder. If channels remain unavailable, contact TopFlex support.'], note: 'A refresh cannot repair an antenna, cabling or signal reception fault. No refresh is sent by TopFlex yet.' },
  { title: 'Compare packages', icon: 'albums-outline', description: 'Channels and monthly prices', steps: ['Open View Packages on the GOtv page.', 'Choose All Packages, Sports, Movies or Entertainment to narrow the list.', 'Select a package to review its monthly price. Check the final provider-confirmed price before a live payment.'], note: 'Browsing packages is available. Choosing one does not activate it.' },
] as const;
const FAQS = [
  ['Where do I find my IUC number?', 'Look on your decoder label or in your GOtv account information. Keep the number ready for any account request.'],
  ['Why can’t I verify or renew yet?', 'TopFlex’s GOtv account and payment services are not connected yet. No account is checked, payment taken or subscription changed.'],
  ['Will clearing an error renew my subscription?', 'No. An authorization reset is not a renewal and does not pay an outstanding balance.'],
  ['Why are channels still scrambled after payment?', 'The decoder may need an authorization refresh, or the channel may not belong to your package. Keep proof of payment and the error code ready for TopFlex support. Do not pay again without checking the first payment.'],
  ['Can a refresh fix “No signal”?', 'Not usually. No signal can be caused by reception, antenna position, coverage or cables. An authorization refresh does not repair these issues.'],
  ['Who handles my GOtv support?', 'TopFlex handles your support within the app. You will not be redirected to a third-party customer service channel.'],
] as const;
const CONTACTS = [
  { title: 'Live chat', icon: 'chatbubbles-outline', description: 'Chat with TopFlex GOtv support', message: 'Live chat is not available yet. No TopFlex agent is connected and no message has been sent.' },
  { title: 'Support ticket', icon: 'ticket-outline', description: 'Get help with a decoder or renewal issue', message: 'Support tickets are not available yet. No ticket has been created or sent to TopFlex.' },
  { title: 'Request a callback', icon: 'call-outline', description: 'Speak to a TopFlex support specialist', message: 'Callbacks are not available yet. No call has been requested and your phone number has not been shared.' },
] as const;

export function GotvHelp() {
  const [faq, setFaq] = useState<number | null>(null);
  const [guide, setGuide] = useState<(typeof GUIDES)[number] | null>(null);
  const [contact, setContact] = useState<(typeof CONTACTS)[number] | null>(null);
  const close = () => { setGuide(null); setContact(null); };
  return <>
    <View style={styles.heading}><Text style={styles.h1}>GOtv Help & Support</Text><Text style={styles.subtitle}>Guides, answers and TopFlex support</Text></View>
    <Text style={styles.section}>Tutorials</Text>
    {GUIDES.map((g) => <Pressable key={g.title} accessibilityRole="button" accessibilityLabel={`Read guide: ${g.title}`} onPress={() => setGuide(g)} style={styles.guide}>
      <View style={styles.thumbnail}><Ionicons name={g.icon} size={32} color={B.blue} /><Text style={styles.videoStatus}>Video coming soon</Text></View>
      <View style={styles.guideBody}><Text style={styles.title}>{g.title}</Text><Text style={styles.subtitle}>{g.description}</Text><Text style={styles.link}>Read guide <Ionicons name="arrow-forward" size={12} /></Text></View>
    </Pressable>)}
    <Text style={styles.section}>Frequently asked questions</Text>
    <View>{FAQS.map(([question, answer], i) => <View key={question} style={styles.faq}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: faq === i }} onPress={() => setFaq(faq === i ? null : i)} style={styles.faqQuestion}><Text style={[styles.title, { flex: 1 }]}>{question}</Text><Ionicons name={faq === i ? 'remove' : 'add'} size={20} color={B.blue} /></Pressable>
      {faq === i && <Text style={styles.answer}>{answer}</Text>}
    </View>)}</View>
    <Text style={styles.section}>Contact TopFlex</Text>
    {CONTACTS.map((c) => <Pressable key={c.title} accessibilityRole="button" onPress={() => setContact(c)} style={styles.contact}>
      <Ionicons name={c.icon} size={24} color={B.white} /><View style={{ flex: 1 }}><Text style={styles.contactTitle}>{c.title}</Text><Text style={styles.contactSub}>{c.description}</Text><Text style={styles.contactSub}>Not available yet</Text></View><Ionicons name="chevron-forward" size={20} color={B.white} />
    </Pressable>)}
    <Modal visible={guide !== null || contact !== null} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.overlay}><View style={styles.dialog} accessibilityViewIsModal>
        <View style={styles.dialogHead}><Text style={[styles.h1, { flex: 1 }]}>{guide?.title ?? contact?.title}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close help details" onPress={close} hitSlop={12}><Ionicons name="close" size={24} color={B.text} /></Pressable></View>
        <ScrollView contentContainerStyle={styles.dialogContent}>
          {guide && <><View style={styles.notice}><Ionicons name="videocam-outline" size={22} color={B.blue} /><Text style={styles.noticeText}>Video coming soon. Read the guide below.</Text></View>{guide.steps.map((text, i) => <View key={text} style={styles.step}><Text style={styles.number}>{i + 1}</Text><Text style={styles.stepText}>{text}</Text></View>)}<Text style={styles.answer}>{guide.note}</Text></>}
          {contact && <View style={styles.notice}><Ionicons name="information-circle-outline" size={24} color={B.blue} /><Text style={styles.noticeText}>{contact.message}</Text></View>}
        </ScrollView>
      </View></View>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  heading: { gap: 6, marginBottom: 6 }, h1: { color: B.text, fontFamily: 'Inter_700Bold', fontSize: 22 },
  subtitle: { color: B.muted, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
  section: { color: B.text, fontFamily: 'Inter_700Bold', fontSize: 17, marginTop: 12 },
  guide: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, borderColor: B.border, backgroundColor: B.white, overflow: 'hidden', minHeight: 112 },
  thumbnail: { width: 108, backgroundColor: B.light, justifyContent: 'center', alignItems: 'center', padding: 10, gap: 10 },
  videoStatus: { color: B.muted, fontFamily: 'Inter_500Medium', fontSize: 10, textAlign: 'center', lineHeight: 14 },
  guideBody: { flex: 1, padding: 14, gap: 5, justifyContent: 'center' }, title: { color: B.text, fontFamily: 'Inter_600SemiBold', fontSize: 14, lineHeight: 20 },
  link: { color: B.blue, fontFamily: 'Inter_600SemiBold', fontSize: 12, marginTop: 5 },
  faq: { borderBottomWidth: 1, borderBottomColor: B.border }, faqQuestion: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  answer: { color: B.muted, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 21, paddingBottom: 14 },
  contact: { backgroundColor: B.blue, borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
  contactTitle: { color: B.white, fontFamily: 'Inter_700Bold', fontSize: 15 }, contactSub: { color: B.light, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, marginTop: 3 },
  overlay: { flex: 1, backgroundColor: B.navy, padding: 20, justifyContent: 'center', alignItems: 'center' },
  dialog: { width: '100%', maxWidth: 560, maxHeight: '85%', backgroundColor: B.white, borderRadius: 8, overflow: 'hidden' },
  dialogHead: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderBottomWidth: 1, borderBottomColor: B.border }, dialogContent: { padding: 20, gap: 18 },
  notice: { padding: 14, backgroundColor: B.light, borderRadius: 8, flexDirection: 'row', gap: 10, alignItems: 'center' }, noticeText: { flex: 1, color: B.text, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  step: { flexDirection: 'row', gap: 12 }, number: { width: 24, color: B.blue, fontFamily: 'Inter_700Bold', fontSize: 18 }, stepText: { flex: 1, color: B.text, fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 21 },
});