/**
 * MainApp.jsx — PromoEarn
 * 5 Tabs: Home | PromoSpace | Wallet | Referral | Profile
 * Fully connected to backend API
 */
// import { PanResponder } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Clipboard from 'expo-clipboard';
import PromoSpaceScreen from "./PromoSpaceScreen"
import NotificationsListScreen from "./NotificationsListScreen";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { loadSavedAccounts } from "./PayoutMethodsscreen";
import PayoutMethodsScreen   from "./PayoutMethodsscreen";
import NotificationsScreen   from "./NotificationsScreen";
import AccountSettingsScreen from "./AccountSettingsScreen";
import { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, TextInput, Modal, Platform, Alert, RefreshControl,
  ActivityIndicator, Linking,
} from "react-native";
import Svg, { Path, Circle, Rect, Line, Polyline, G } from "react-native-svg";
import { WebView } from "react-native-webview";
import { fonts } from "../utils/typography";
import AuthService from "../services/authService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LIGHT, DARK, LANGUAGES } from "./AccountSettingsScreen";
import { Share } from "react-native";

const { width, height } = Dimensions.get("window");
const AUTH_URL = "https://promoearn-backend.onrender.com/api/v1/auth"
const BASE_URL = "https://promoearn-backend.onrender.com/api/v1"
const C = {
  blue:      "#1A56DB",
  blueSoft:  "#EEF4FF",
  dark:      "#0F172A",
  white:     "#FFFFFF",
  green:     "#10B981",
  greenSoft: "#F0FDF4",
  gold:      "#F59E0B",
  goldSoft:  "#FFFBEB",
  red:       "#EF4444",
  purple:    "#8B5CF6",
  purpleSoft:"#F5F3FF",
  orange:    "#F97316",
  light:     "#F8FAFF",
  muted:     "#64748B",
  border:    "#E2E8F0",
  slate:     "#94A3B8",
};
// ── Translations ───────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    // Navigation
    home: "Home", promoSpace: "PromoSpace", wallet: "Wallet",
    referral: "Referral", profile: "Profile",
    // Home Screen
    availableBalance: "Available Balance", totalEarned: "Total earned",
    withdraw: "Withdraw", history: "History", tasksDone: "Tasks Done",
    referrals: "Referrals", rank: "Rank", latestTasks: "Latest Tasks",
    topEarners: "Top Earners", activateAccount: "Activate Your Account",
    activateSubtitle: "One-time $3.00 · Unlock 5 earning tasks instantly",
    // PromoSpace
    earn: "Earn", advertise: "Advertise", marketplace: "Marketplace",
    todayPotential: "Today's Potential", earnUpTo: "Earn up to",
    completing: "completing all tasks", done: "done", loadingTasks: "Loading tasks...",
    noTasksFound: "No tasks found", checkBackLater: "Check back later for new tasks",
    unlockAllTasks: "Unlock All Tasks",
    unlockSubtitle: "Activate your account with a one-time $3.00 fee to access all earning tasks.",
    activate: "Activate · $3.00", oneTimeFee: "One-time · 5 tasks unlocked instantly",
    start: "Start", completed: "Completed",
    // Wallet
    totalBalance: "Total Balance", withdrawn: "Withdrawn",
    transactionHistory: "Transaction History", noTransactions: "No transactions yet",
    withdrawFunds: "Withdraw Funds", allAmountsUSD: "All amounts in USD · Min. $3.50",
    amount: "Amount ($)", accountNumber: "Account Number", bankName: "Bank Name",
    requestWithdrawal: "Request Withdrawal", submitting: "Submitting...",
    howWithdrawalsWork: "How Withdrawals Work", feesInfo: "Fees, conversion rate & payout info",
    withdrawalFeeNotice: "Withdrawal Fee Notice",
    withdrawalFeeDetail: "A flat $0.13 processing fee is deducted from every withdrawal.",
    dollarConversion: "Dollar Conversion Rate",
    dollarConversionDetail: "All balances shown in US Dollars. When we send your payout to a Local bank account, we convert at",
    stepByStep: "Step-by-Step Process",
    step1Title: "Request Withdrawal", step1Desc: "Enter your amount (min $3.50), bank name and account number.",
    step2Title: "$0.13 Fee Deducted", step2Desc: "A $0.13 processing fee is taken from your requested amount.",
    step3Title: "We Convert to Naira", step3Desc: "The remaining balance is converted at $1 = ₦1,500.",
    step4Title: "Payout Within 24hrs", step4Desc: "Funds are sent directly to your Local bank account account.",
    youWithdraw: "You withdraw", processingFee: "Processing fee",
    youReceiveUSD: "You receive (USD)", nairaEquivalent: "Naira equivalent",
    referAndEarn: "Refer & Earn",
    // Referral
    inviteFriends: "Invite friends, earn together",
    yourReferralCode: "Your Referral Code", copyCode: "Copy Code",
    copied: "Copied!", share: "Share", totalReferrals: "Total Referrals",
    refEarnings: "Ref. Earnings", perReferral: "Per Referral",
    howItWorks: "How It Works", yourReferrals: "Your Referrals",
    noReferrals: "No referrals yet. Share your code!",
    ref1: "Share your unique referral code or link",
    ref2: "Your friend signs up using your code",
    ref3: "They activate their account ($3.00 fee)",
    ref4: "You earn $1.33 referral bonus instantly!",
    // Profile
    payoutMethods: "Payout Methods", notifications: "Notifications",
    accountSettings: "Account Settings", helpFeedback: "Help & Feedback",
    sharePromoEarn: "Share PromoEarn", logOut: "Log Out",
    tasks: "Tasks", earned: "Earned", balance: "Balance",
    activeAccount: "Active Account", activateAccountBtn: "Activate Account",
    // Task card
    taskComplete: "Task Complete!", addedToBalance: "added to your balance!",
    // General
    noTasksYet: "No tasks available yet", noDataYet: "No data yet",
    today: "Today", yesterday: "Yesterday", daysAgo: "days ago", weeksAgo: "weeks ago",
    week: "week",
    // Help
    helpFeedbackTitle: "Help & Feedback", helpFaq: "❓ Help / FAQ",
    sendFeedback: "💬 Send Feedback", rateExperience: "Rate your experience",
    yourMessage: "Your message *", sendFeedbackBtn: "Send Feedback 🚀",
    sending: "Sending…", thanksFeedback: "Thanks for your feedback!",
    sendAnother: "Send Another",
    needSupport: "Need direct support?",
    supportEmail: "Email us at contact.promoearn@gmail.com · We reply within 24hrs",
    // Logout
    logOutQuestion: "Log Out?", logOutDesc: "You'll be signed out of your PromoEarn account. Your balance and data are safe.",
    yesLogOut: "Yes, Log Out", cancelStayIn: "Cancel, Stay In",
  },

  yo: {
    home: "Ile", promoSpace: "PromoSpace", wallet: "Apamọ",
    referral: "Itọkasi", profile: "Profaili",
    availableBalance: "Owo Ti O Wa", totalEarned: "Apapọ ti a Gba",
    withdraw: "Yọ Owo", history: "Itan", tasksDone: "Awọn Iṣẹ Ti Pari",
    referrals: "Awọn Itọkasi", rank: "Ipo", latestTasks: "Awọn Iṣẹ Tuntun",
    topEarners: "Awọn Olugba Oke", activateAccount: "Mu Akọọlẹ Rẹ Ṣiṣẹ",
    activateSubtitle: "Ẹẹkan $3.00 · Gba afikun $0.33",
    earn: "Gba Owo", advertise: "Polongo", marketplace: "Ọja",
    todayPotential: "Agbara Oni", earnUpTo: "Gba to",
    completing: "ti o pari gbogbo iṣẹ", done: "ti pari",
    loadingTasks: "Npo awọn iṣẹ...", noTasksFound: "Ko si iṣẹ",
    checkBackLater: "Pada wo nigbamii fun awọn iṣẹ tuntun",
    unlockAllTasks: "Ṣii Gbogbo Awọn Iṣẹ",
    unlockSubtitle: "Mu akọọlẹ rẹ ṣiṣẹ pẹlu owo ẹẹkan $3.00 lati wọle si gbogbo awọn iṣẹ.",
    activate: "Mu Ṣiṣẹ · $3.00", oneTimeFee: "Ẹẹkan · Afikun $0.33",
    start: "Bẹrẹ", completed: "Ti Pari",
    totalBalance: "Apapọ Owo", withdrawn: "Ti Yọ",
    transactionHistory: "Itan Iṣowo", noTransactions: "Ko si iṣowo sibẹ",
    withdrawFunds: "Yọ Owo", allAmountsUSD: "Gbogbo owo ni USD · O kere $3.50",
    amount: "Iye ($)", accountNumber: "Nọmba Akọọlẹ", bankName: "Orukọ Banki",
    requestWithdrawal: "Beere Yiyọ Owo", submitting: "Firanṣẹ...",
    howWithdrawalsWork: "Bii Yiyọ Owo Ṣe N Ṣiṣẹ", feesInfo: "Awọn owo, oṣuwọn, ati alaye sisanwo",
    withdrawalFeeNotice: "Akiyesi Owo Yiyọ",
    withdrawalFeeDetail: "Owo sisẹ $0.13 ni a yọ kuro ninu gbogbo yiyọ.",
    dollarConversion: "Oṣuwọn Iyipada Dọla",
    dollarConversionDetail: "Gbogbo iye ni a fihan ni Dọla Amẹrika. A ṣe iyipada si",
    stepByStep: "Ilana Igbesẹ-Nipasẹ-Igbesẹ",
    step1Title: "Beere Yiyọ Owo", step1Desc: "Tẹ iye rẹ (o kere $3.50), orukọ banki ati nọmba akọọlẹ.",
    step2Title: "Owo $0.13 Yọ", step2Desc: "Owo sisẹ $0.13 ni a gba lati iye ti o beere.",
    step3Title: "A Ṣe Iyipada si Naira", step3Desc: "Iyokù ni a ṣe iyipada ni $1 = ₦1,500.",
    step4Title: "Sisanwo Laarin 24hrs", step4Desc: "Owo ranṣẹ si akọọlẹ banki Naijiriya rẹ taara.",
    youWithdraw: "O Yọ", processingFee: "Owo Sisẹ",
    youReceiveUSD: "O Gba (USD)", nairaEquivalent: "Iye Naira",
    referAndEarn: "Tọka & Gba Owo",
    inviteFriends: "Pe awọn ọrẹ, gba owo papọ",
    yourReferralCode: "Koodu Itọkasi Rẹ", copyCode: "Daakọ Koodu",
    copied: "Ti Daakọ!", share: "Pin", totalReferrals: "Apapọ Awọn Itọkasi",
    refEarnings: "Owo Itọkasi", perReferral: "Fun Itọkasi Kọọkan",
    howItWorks: "Bii O Ṣe N Ṣiṣẹ", yourReferrals: "Awọn Itọkasi Rẹ",
    noReferrals: "Ko si itọkasi sibẹ. Pin koodu rẹ!",
    ref1: "Pin koodu tabi ọna asopọ itọkasi alailẹgbẹ rẹ",
    ref2: "Ọrẹ rẹ forukọsilẹ nipa lilo koodu rẹ",
    ref3: "Wọn mu akọọlẹ wọn ṣiṣẹ (owo $3.00)",
    ref4: "O gba afikun itọkasi $1.00 lẹsẹkẹsẹ!",
    payoutMethods: "Awọn Ọna Sisanwo", notifications: "Awọn Iwifunni",
    accountSettings: "Eto Akọọlẹ", helpFeedback: "Iranlọwọ & Esi",
    sharePromoEarn: "Pin PromoEarn", logOut: "Jade",
    tasks: "Awọn Iṣẹ", earned: "Ti Gba", balance: "Iyokù", activeAccount: "Akọọlẹ Ṣiṣẹ",
    activateAccountBtn: "Mu Akọọlẹ Ṣiṣẹ", taskComplete: "Iṣẹ Pari!",
    addedToBalance: "ti ṣafikun si iye rẹ!", noTasksYet: "Ko si iṣẹ sibẹ",
    noDataYet: "Ko si data sibẹ", today: "Oni", yesterday: "Ana",
    daysAgo: "ọjọ sẹhin", weeksAgo: "ọsẹ sẹhin", week: "ọsẹ",
    helpFeedbackTitle: "Iranlọwọ & Esi", helpFaq: "❓ Iranlọwọ / FAQ",
    sendFeedback: "💬 Firanṣẹ Esi", rateExperience: "Ṣe iwọn iriri rẹ",
    yourMessage: "Ifiranṣẹ rẹ *", sendFeedbackBtn: "Firanṣẹ Esi 🚀",
    sending: "Firanṣẹ…", thanksFeedback: "E dupe fun esi rẹ!",
    sendAnother: "Firanṣẹ Omiran",
    needSupport: "Nilo atilẹyin taara?",
    supportEmail: "Imeeli wa ni contact.promoearn@gmail.com · A dahun laarin wakati 24",
    logOutQuestion: "Jade?", logOutDesc: "Iwọ yoo jade kuro ninu akọọlẹ PromoEarn rẹ. Iye owo ati data rẹ wa ni aabo.",
    yesLogOut: "Bẹẹni, Jade", cancelStayIn: "Fagilee, Duro",
  },

  ha: {
    home: "Gida", promoSpace: "PromoSpace", wallet: "Walat",
    referral: "Referral", profile: "Bayanai",
    availableBalance: "Kasafin Kudi", totalEarned: "Jimlar da aka samu",
    withdraw: "Cire Kudi", history: "Tarihi", tasksDone: "Ayyukan da aka Kammala",
    referrals: "Referrals", rank: "Matsayi", latestTasks: "Sabbin Ayyuka",
    topEarners: "Manyan Masu Samun Kudi", activateAccount: "Kunna Asusunka",
    activateSubtitle: "Karo ɗaya $3.00 · Samu kyauta $0.33",
    earn: "Samu Kudi", advertise: "Tallata", marketplace: "Kasuwa",
    todayPotential: "Damar Yau", earnUpTo: "Samu har",
    completing: "kammala duk ayyuka", done: "an kammala",
    loadingTasks: "Ana loda ayyuka...", noTasksFound: "Babu ayyuka",
    checkBackLater: "Duba baya don sabon ayyuka",
    unlockAllTasks: "Buɗe Duk Ayyuka",
    unlockSubtitle: "Kunna asusunka da kuɗi ɗaya $3.00 don samun damar duk ayyuka.",
    activate: "Kunna · $3.00", oneTimeFee: "Karo ɗaya · Kyauta $0.33",
    start: "Fara", completed: "An Kammala",
    totalBalance: "Jimlar Kudi", withdrawn: "An Cire",
    transactionHistory: "Tarihin Ma'amala", noTransactions: "Babu ma'amala tukuna",
    withdrawFunds: "Cire Kudi", allAmountsUSD: "Duk adadi a USD · Mafi ƙaranci $3.50",
    amount: "Adadi ($)", accountNumber: "Lambar Asusun", bankName: "Sunan Banki",
    requestWithdrawal: "Nemi Cirewa", submitting: "Ana Aika...",
    howWithdrawalsWork: "Yadda Cirewa ke Aiki", feesInfo: "Kuɗi, darajar musanya, da bayanin biyan kuɗi",
    withdrawalFeeNotice: "Sanarwar Kuɗin Cirewa",
    withdrawalFeeDetail: "Ana cire kuɗin sarrafa $0.13 daga kowane cirewa.",
    dollarConversion: "Darajar Canza Dala",
    dollarConversionDetail: "Duk ma'auni ana nuna su a Dalolin Amurka. Muna canza zuwa",
    stepByStep: "Tsarin Mataki-da-Mataki",
    step1Title: "Nemi Cirewa", step1Desc: "Shigar da adadi (mafi ƙaranci $3.50), sunan banki da lambar asusun.",
    step2Title: "An Cire $1.00", step2Desc: "Ana ɗaukar kuɗin sarrafa $0.13 daga adadin da ka nema.",
    step3Title: "Muna Canza zuwa Naira", step3Desc: "Sauran ana canza shi a $1 = ₦1,500.",
    step4Title: "Biyan Kuɗi a cikin 24hrs", step4Desc: "Ana aika kuɗi kai tsaye zuwa asusun bankin Najeriya naka.",
    youWithdraw: "Kana Cirewa", processingFee: "Kuɗin Sarrafawa",
    youReceiveUSD: "Kana Karɓa (USD)", nairaEquivalent: "Darajar Naira",
    referAndEarn: "Kira & Samu Kudi",
    inviteFriends: "Gayyata abokai, samu kudi tare",
    yourReferralCode: "Lambar Referral naka", copyCode: "Kwafi Lamba",
    copied: "An Kwafi!", share: "Raba", totalReferrals: "Jimlar Referrals",
    refEarnings: "Kuɗin Referral", perReferral: "A kowane Referral",
    howItWorks: "Yadda Yake Aiki", yourReferrals: "Referrals naka",
    noReferrals: "Babu referrals tukuna. Raba lambar ka!",
    ref1: "Raba lambar referral ko hanyar haɗin ka",
    ref2: "Abokinka ya yi rajista ta amfani da lambar ka",
    ref3: "Suna kunna asusunsu (kuɗi $3.00)",
    ref4: "Kana samun kyautar referral $1.00 nan take!",
    payoutMethods: "Hanyoyin Biyan Kuɗi", notifications: "Sanarwa",
    accountSettings: "Saitunan Asusun", helpFeedback: "Taimako & Ra'ayi",
    sharePromoEarn: "Raba PromoEarn", logOut: "Fita",
    tasks: "Ayyuka", earned: "An Samu", balance: "Daidaita", activeAccount: "Asusun Mai Aiki",
    activateAccountBtn: "Kunna Asusun", taskComplete: "An Kammala Aiki!",
    addedToBalance: "an ƙara zuwa ma'auninka!", noTasksYet: "Babu ayyuka tukuna",
    noDataYet: "Babu bayanai tukuna", today: "Yau", yesterday: "Jiya",
    daysAgo: "kwanaki da suka wuce", weeksAgo: "makonni da suka wuce", week: "mako",
    helpFeedbackTitle: "Taimako & Ra'ayi", helpFaq: "❓ Taimako / FAQ",
    sendFeedback: "💬 Aika Ra'ayi", rateExperience: "Ƙima ƙwarewar ka",
    yourMessage: "Saƙon ka *", sendFeedbackBtn: "Aika Ra'ayi 🚀",
    sending: "Ana Aika…", thanksFeedback: "Na gode da ra'ayinka!",
    sendAnother: "Aika Wani",
    needSupport: "Kana buƙatar tallafi kai tsaye?",
    supportEmail: "Aiko mana imel a contact.promoearn@gmail.com · Muna amsa a cikin sa'o'i 24",
    logOutQuestion: "Fita?", logOutDesc: "Za a fitar da kai daga asusun PromoEarn naka. Ma'aunin ka da bayananka sun yi aminci.",
    yesLogOut: "Ee, Fita", cancelStayIn: "Soke, Ci Gaba",
  },

  ig: {
    home: "Ụlọ", promoSpace: "PromoSpace", wallet: "Akpa ego",
    referral: "Ntụaka", profile: "Profaịlụ",
    availableBalance: "Ego Dị Ugbu A", totalEarned: "Nnọkọ ejiri nweta",
    withdraw: "Wepu Ego", history: "Akụkọ ihe mere", tasksDone: "Ọrụ emechara",
    referrals: "Ntụaka", rank: "Ọnọdụ", latestTasks: "Ọrụ Ọhụrụ",
    topEarners: "Ndị Nwetara Kacha Ọtụtụ", activateAccount: "Mee Akaụntụ Gị Ka Ọ Rụọ Ọrụ",
    activateSubtitle: "Otu oge $3.00 · Nweta ọbọnụ $0.33",
    earn: "Nweta Ego", advertise: "Mgbasa Ozi", marketplace: "Ahịa",
    todayPotential: "Ike Taa", earnUpTo: "Nweta ruo",
    completing: "mechaa ọrụ niile", done: "emechara",
    loadingTasks: "Na-ebugharị ọrụ...", noTasksFound: "Ọ nweghị ọrụ",
    checkBackLater: "Leba anya ọzọ maka ọrụ ọhụrụ",
    unlockAllTasks: "Meghee Ọrụ Niile",
    unlockSubtitle: "Mee akaụntụ gị ka ọ rụọ ọrụ site na ọtu oge $3.00 iji nweta ọrụ niile.",
    activate: "Mee Ka Ọ Rụọ · $3.00", oneTimeFee: "Otu oge · Ọbọnụ $0.33",
    start: "Malite", completed: "Emechara",
    totalBalance: "Ego Niile", withdrawn: "Ewepụrụ",
    transactionHistory: "Akụkọ Azụmahịa", noTransactions: "Ọ nweghị azụmahịa ka",
    withdrawFunds: "Wepu Ego", allAmountsUSD: "Ego niile na USD · Kacha ọchie $3.50",
    amount: "Ego ($)", accountNumber: "Nọmba Akaụntụ", bankName: "Aha Ụlọ Akụ",
    requestWithdrawal: "Arịọ Iwepụ Ego", submitting: "Na-eziga...",
    howWithdrawalsWork: "Otu Iwepụ Ego Si Arụ Ọrụ", feesInput: "Ụgwọ, ọnụ ahịa mgbanwe, na ozi ịkwụ ụgwọ",
    feesInfo: "Ụgwọ, ọnụ ahịa mgbanwe, na ozi ịkwụ ụgwọ",
    withdrawalFeeNotice: "Ọkwa Ụgwọ Iwepụ",
    withdrawalFeeDetail: "A na-ewepụ ụgwọ nhazi $0.13 sitere na iwepụ niile.",
    dollarConversion: "Ọnụ Ahịa Mgbanwe Dollar",
    dollarConversionDetail: "E gosipụtara ọnụọgụ niile na Dollar America. Anyị na-agbanwe zuoputara",
    stepByStep: "Usoro Nzọụkwụ-Ka-Nzọụkwụ",
    step1Title: "Arịọ Iwepụ Ego", step1Desc: "Tinye ego gị (kacha ọchie $3.50), aha ụlọ akụ na nọmba akaụntụ.",
    step2Title: "A Wepụrụ $1.00", step2Desc: "A na-ewepụ ụgwọ nhazi $0.13 sitere n'ego i rịọrọ.",
    step3Title: "Anyị Na-agbanwe zuoputara Naira", step3Desc: "A na-agbanwe ihe fọdụrụ na $1 = ₦1,500.",
    step4Title: "Ịkwụ Ụgwọ n'ime 24hrs", step4Desc: "A na-eziga ego ozugbo n'akaụntụ ụlọ akụ Nigeria gị.",
    youWithdraw: "Ị Na-ewepụ", processingFee: "Ụgwọ Nhazi",
    youReceiveUSD: "Ị Na-anata (USD)", nairaEquivalent: "Ọnụ Naira",
    referAndEarn: "Tụọ Aka & Nweta Ego",
    inviteFriends: "Kpọọ ndị enyi, nwetakọ ego ọnụ",
    yourReferralCode: "Koodu Ntụaka Gị", copyCode: "Detuo Koodu",
    copied: "Edeyụrụ!", share: "Kesaa", totalReferrals: "Ntụaka Niile",
    refEarnings: "Ego Ntụaka", perReferral: "Maka Ntụaka Ọ Bụla",
    howItWorks: "Otu Ọ Si Arụ Ọrụ", yourReferrals: "Ntụaka Gị",
    noReferrals: "Ọ nweghị ntụaka ka. Kesaa koodu gị!",
    ref1: "Kesaa koodu ntụaka pụrụ iche gị ma ọ bụ njikọ",
    ref2: "Enyi gị debanye aha site na iji koodu gị",
    ref3: "Ha na-eme akaụntụ ha ka ọ rụọ ọrụ (ụgwọ $3.00)",
    ref4: "Ị nwetara ọbọnụ ntụaka $1.00 ozugbo!",
    payoutMethods: "Ụzọ Ịkwụ Ụgwọ", notifications: "Ọkwa",
    accountSettings: "Ntọala Akaụntụ", helpFeedback: "Enyemaka & Nzaghachi",
    sharePromoEarn: "Kesaa PromoEarn", logOut: "Pụọ",
    tasks: "Ọrụ", earned: "Ewetara", balance: "Ọnọdụ", activeAccount: "Akaụntụ Na-arụ Ọrụ",
    activateAccountBtn: "Mee Akaụntụ Ka Ọ Rụọ", taskComplete: "Ọrụ Mechara!",
    addedToBalance: "agbakwụnyere n'ego gị!", noTasksYet: "Ọ nweghị ọrụ ka",
    noDataYet: "Ọ nweghị data ka", today: "Taa", yesterday: "Ụnyaahụ",
    daysAgo: "ụbọchị gara aga", weeksAgo: "izu gara aga", week: "izu",
    helpFeedbackTitle: "Enyemaka & Nzaghachi", helpFaq: "❓ Enyemaka / FAQ",
    sendFeedback: "💬 Zipu Nzaghachi", rateExperience: "Tọọ ogo ahụmahụ gị",
    yourMessage: "Ozi gị *", sendFeedbackBtn: "Zipu Nzaghachi 🚀",
    sending: "Na-ezipu…", thanksFeedback: "Daalụ maka nzaghachi gị!",
    sendAnother: "Zipu Ọzọ",
    needSupport: "Chọọ nkwado ozugbo?",
    supportEmail: "Zipụ anyị email na contact.promoearn@gmail.com · Anyị na-azaghachi n'ime awa 24",
    logOutQuestion: "Pụọ?", logOutDesc: "A ga-apụ gị n'akaụntụ PromoEarn gị. Ego gị na data gị dị mma.",
    yesLogOut: "Ee, Pụọ", cancelStayIn: "Kagbuo, Nọdụ",
  },

  fr: {
    home: "Accueil", promoSpace: "PromoSpace", wallet: "Portefeuille",
    referral: "Parrainage", profile: "Profil",
    availableBalance: "Solde Disponible", totalEarned: "Total gagné",
    withdraw: "Retirer", history: "Historique", tasksDone: "Tâches Complétées",
    referrals: "Parrainages", rank: "Rang", latestTasks: "Dernières Tâches",
    topEarners: "Meilleurs Gagnants", activateAccount: "Activez Votre Compte",
    activateSubtitle: "Frais unique $3.00 · Obtenez un bonus de $0.33",
    earn: "Gagner", advertise: "Publicité", marketplace: "Marché",
    todayPotential: "Potentiel du Jour", earnUpTo: "Gagnez jusqu'à",
    completing: "en complétant toutes les tâches", done: "terminé",
    loadingTasks: "Chargement des tâches...", noTasksFound: "Aucune tâche trouvée",
    checkBackLater: "Revenez plus tard pour de nouvelles tâches",
    unlockAllTasks: "Débloquer Toutes les Tâches",
    unlockSubtitle: "Activez votre compte avec des frais uniques de $3.00 pour accéder à toutes les tâches.",
    activate: "Activer · $3.00", oneTimeFee: "Frais unique · Bonus $0.33",
    start: "Commencer", completed: "Terminé",
    totalBalance: "Solde Total", withdrawn: "Retiré",
    transactionHistory: "Historique des Transactions", noTransactions: "Aucune transaction pour l'instant",
    withdrawFunds: "Retirer des Fonds", allAmountsUSD: "Tous les montants en USD · Min. $3.50",
    amount: "Montant ($)", accountNumber: "Numéro de Compte", bankName: "Nom de la Banque",
    requestWithdrawal: "Demander un Retrait", submitting: "Envoi en cours...",
    howWithdrawalsWork: "Comment Fonctionnent les Retraits", feesInfo: "Frais, taux de conversion et infos de paiement",
    withdrawalFeeNotice: "Avis de Frais de Retrait",
    withdrawalFeeDetail: "Des frais de traitement fixes de $0.13 sont déduits de chaque retrait.",
    dollarConversion: "Taux de Conversion du Dollar",
    dollarConversionDetail: "Tous les soldes sont affichés en Dollars US. Nous convertissons à",
    stepByStep: "Processus Étape par Étape",
    step1Title: "Demander un Retrait", step1Desc: "Entrez votre montant (min $3.50), nom de banque et numéro de compte.",
    step2Title: "Frais $1.00 Déduits", step2Desc: "Des frais de traitement de $0.13 sont prélevés sur votre montant demandé.",
    step3Title: "Nous Convertissons en Naira", step3Desc: "Le solde restant est converti à $1 = ₦1,500.",
    step4Title: "Paiement sous 24–48h", step4Desc: "Les fonds sont envoyés directement à votre compte bancaire nigérian.",
    youWithdraw: "Vous retirez", processingFee: "Frais de traitement",
    youReceiveUSD: "Vous recevez (USD)", nairaEquivalent: "Équivalent en Naira",
    referAndEarn: "Parrainer & Gagner",
    inviteFriends: "Invitez des amis, gagnez ensemble",
    yourReferralCode: "Votre Code de Parrainage", copyCode: "Copier le Code",
    copied: "Copié!", share: "Partager", totalReferrals: "Total des Parrainages",
    refEarnings: "Gains de Parrainage", perReferral: "Par Parrainage",
    howItWorks: "Comment Ça Marche", yourReferrals: "Vos Parrainages",
    noReferrals: "Aucun parrainage pour l'instant. Partagez votre code!",
    ref1: "Partagez votre code ou lien de parrainage unique",
    ref2: "Votre ami s'inscrit en utilisant votre code",
    ref3: "Il active son compte (frais $3.00)",
    ref4: "Vous gagnez un bonus de parrainage de $1.33 instantanément!",
    payoutMethods: "Méthodes de Paiement", notifications: "Notifications",
    accountSettings: "Paramètres du Compte", helpFeedback: "Aide & Commentaires",
    sharePromoEarn: "Partager PromoEarn", logOut: "Se Déconnecter",
    tasks: "Tâches", earned: "Gagné", balance: "Solde", activeAccount: "Compte Actif",
    activateAccountBtn: "Activer le Compte", taskComplete: "Tâche Terminée!",
    addedToBalance: "ajouté à votre solde!", noTasksYet: "Aucune tâche disponible pour l'instant",
    noDataYet: "Aucune donnée pour l'instant", today: "Aujourd'hui", yesterday: "Hier",
    daysAgo: "jours passés", weeksAgo: "semaines passées", week: "semaine",
    helpFeedbackTitle: "Aide & Commentaires", helpFaq: "❓ Aide / FAQ",
    sendFeedback: "💬 Envoyer des Commentaires", rateExperience: "Évaluez votre expérience",
    yourMessage: "Votre message *", sendFeedbackBtn: "Envoyer 🚀",
    sending: "Envoi…", thanksFeedback: "Merci pour vos commentaires!",
    sendAnother: "Envoyer un Autre",
    needSupport: "Besoin d'un support direct?",
    supportEmail: "Envoyez-nous un email à contact.promoearn@gmail.com · Nous répondons dans 24h",
    logOutQuestion: "Se Déconnecter?", logOutDesc: "Vous serez déconnecté de votre compte PromoEarn. Votre solde et vos données sont en sécurité.",
    yesLogOut: "Oui, Se Déconnecter", cancelStayIn: "Annuler, Rester",
  },

  ar: {
    home: "الرئيسية", promoSpace: "فضاء الترويج", wallet: "المحفظة",
    referral: "الإحالة", profile: "الملف الشخصي",
    availableBalance: "الرصيد المتاح", totalEarned: "إجمالي المكتسب",
    withdraw: "سحب", history: "التاريخ", tasksDone: "المهام المنجزة",
    referrals: "الإحالات", rank: "الترتيب", latestTasks: "أحدث المهام",
    topEarners: "أعلى الكاسبين", activateAccount: "تفعيل حسابك",
    activateSubtitle: "رسوم لمرة واحدة $3.00 · احصل على مكافأة $0.33",
    earn: "اكسب", advertise: "أعلن", marketplace: "السوق",
    todayPotential: "إمكانية اليوم", earnUpTo: "اكسب حتى",
    completing: "بإكمال جميع المهام", done: "مكتمل",
    loadingTasks: "جار تحميل المهام...", noTasksFound: "لا توجد مهام",
    checkBackLater: "تحقق لاحقاً للمهام الجديدة",
    unlockAllTasks: "فتح جميع المهام",
    unlockSubtitle: "فعّل حسابك برسوم لمرة واحدة $3.00 للوصول إلى جميع المهام.",
    activate: "تفعيل · $3.00", oneTimeFee: "لمرة واحدة · مكافأة $0.33",
    start: "ابدأ", completed: "مكتمل",
    totalBalance: "الرصيد الإجمالي", withdrawn: "المسحوب",
    transactionHistory: "سجل المعاملات", noTransactions: "لا توجد معاملات بعد",
    withdrawFunds: "سحب الأموال", allAmountsUSD: "جميع المبالغ بالدولار · الحد الأدنى $3.50",
    amount: "المبلغ ($)", accountNumber: "رقم الحساب", bankName: "اسم البنك",
    requestWithdrawal: "طلب سحب", submitting: "جار الإرسال...",
    howWithdrawalsWork: "كيف تعمل عمليات السحب", feesInfo: "الرسوم وسعر الصرف ومعلومات الدفع",
    withdrawalFeeNotice: "إشعار رسوم السحب",
    withdrawalFeeDetail: "يتم خصم رسوم معالجة ثابتة قدرها $0.13 من كل عملية سحب.",
    dollarConversion: "سعر تحويل الدولار",
    dollarConversionDetail: "تُعرض جميع الأرصدة بالدولار الأمريكي. نحن نحول بسعر",
    stepByStep: "العملية خطوة بخطوة",
    step1Title: "طلب السحب", step1Desc: "أدخل مبلغك (الحد الأدنى $3.50) واسم البنك ورقم الحساب.",
    step2Title: "خصم $1.00", step2Desc: "يتم أخذ رسوم معالجة بقيمة $0.13 من مبلغك المطلوب.",
    step3Title: "نحوّل إلى نايرا", step3Desc: "يُحوَّل الرصيد المتبقي بسعر $1 = ₦1,500.",
    step4Title: "الدفع خلال 24–48 ساعة", step4Desc: "يُرسَل المال مباشرة إلى حسابك المصرفي النيجيري.",
    youWithdraw: "تسحب", processingFee: "رسوم المعالجة",
    youReceiveUSD: "تستلم (دولار)", nairaEquivalent: "ما يعادل بالنايرا",
    referAndEarn: "أحِل واكسب",
    inviteFriends: "ادعُ أصدقاءك، اكسبوا معاً",
    yourReferralCode: "رمز الإحالة الخاص بك", copyCode: "نسخ الرمز",
    copied: "تم النسخ!", share: "مشاركة", totalReferrals: "إجمالي الإحالات",
    refEarnings: "أرباح الإحالة", perReferral: "لكل إحالة",
    howItWorks: "كيف يعمل", yourReferrals: "إحالاتك",
    noReferrals: "لا توجد إحالات بعد. شارك رمزك!",
    ref1: "شارك رمز أو رابط الإحالة الفريد الخاص بك",
    ref2: "يسجل صديقك باستخدام رمزك",
    ref3: "يفعّلون حسابهم (رسوم $3.00)",
    ref4: "تحصل على مكافأة إحالة $1.00 فوراً!",
    payoutMethods: "طرق الدفع", notifications: "الإشعارات",
    accountSettings: "إعدادات الحساب", helpFeedback: "المساعدة والتعليقات",
    sharePromoEarn: "مشاركة PromoEarn", logOut: "تسجيل الخروج",
    tasks: "المهام", earned: "المكتسب", balance: "الرصيد", activeAccount: "حساب نشط",
    activateAccountBtn: "تفعيل الحساب", taskComplete: "اكتملت المهمة!",
    addedToBalance: "أضيف إلى رصيدك!", noTasksYet: "لا توجد مهام متاحة بعد",
    noDataYet: "لا توجد بيانات بعد", today: "اليوم", yesterday: "أمس",
    daysAgo: "أيام مضت", weeksAgo: "أسابيع مضت", week: "أسبوع",
    helpFeedbackTitle: "المساعدة والتعليقات", helpFaq: "❓ المساعدة / الأسئلة الشائعة",
    sendFeedback: "💬 إرسال تعليق", rateExperience: "قيّم تجربتك",
    yourMessage: "رسالتك *", sendFeedbackBtn: "إرسال التعليق 🚀",
    sending: "جار الإرسال…", thanksFeedback: "شكراً على تعليقك!",
    sendAnother: "إرسال آخر",
    needSupport: "تحتاج دعماً مباشراً؟",
    supportEmail: "راسلنا على contact.promoearn@gmail.com · نرد في غضون 24 ساعة",
    logOutQuestion: "تسجيل الخروج؟", logOutDesc: "ستخرج من حساب PromoEarn الخاص بك. رصيدك وبياناتك في أمان.",
    yesLogOut: "نعم، اخرج", cancelStayIn: "إلغاء، ابقَ",
  },

  pt: {
    home: "Início", promoSpace: "PromoSpace", wallet: "Carteira",
    referral: "Indicação", profile: "Perfil",
    availableBalance: "Saldo Disponível", totalEarned: "Total ganho",
    withdraw: "Sacar", history: "Histórico", tasksDone: "Tarefas Concluídas",
    referrals: "Indicações", rank: "Classificação", latestTasks: "Últimas Tarefas",
    topEarners: "Maiores Ganhadores", activateAccount: "Ativar Sua Conta",
    activateSubtitle: "Taxa única $3.00 · Ganhe bônus de $0.33",
    earn: "Ganhar", advertise: "Anunciar", marketplace: "Mercado",
    todayPotential: "Potencial de Hoje", earnUpTo: "Ganhe até",
    completing: "completando todas as tarefas", done: "concluído",
    loadingTasks: "Carregando tarefas...", noTasksFound: "Nenhuma tarefa encontrada",
    checkBackLater: "Volte mais tarde para novas tarefas",
    unlockAllTasks: "Desbloquear Todas as Tarefas",
    unlockSubtitle: "Ative sua conta com uma taxa única de $3.00 para acessar todas as tarefas.",
    activate: "Ativar · $3.00", oneTimeFee: "Taxa única · Bônus $0.33",
    start: "Iniciar", completed: "Concluído",
    totalBalance: "Saldo Total", withdrawn: "Sacado",
    transactionHistory: "Histórico de Transações", noTransactions: "Nenhuma transação ainda",
    withdrawFunds: "Sacar Fundos", allAmountsUSD: "Todos os valores em USD · Mín. $3.50",
    amount: "Valor ($)", accountNumber: "Número da Conta", bankName: "Nome do Banco",
    requestWithdrawal: "Solicitar Saque", submitting: "Enviando...",
    howWithdrawalsWork: "Como Funcionam os Saques", feesInfo: "Taxas, taxa de câmbio e info de pagamento",
    withdrawalFeeNotice: "Aviso de Taxa de Saque",
    withdrawalFeeDetail: "Uma taxa de processamento de $0.13 é deduzida de cada saque.",
    dollarConversion: "Taxa de Conversão do Dólar",
    dollarConversionDetail: "Todos os saldos são mostrados em Dólares Americanos. Convertemos a",
    stepByStep: "Processo Passo a Passo",
    step1Title: "Solicitar Saque", step1Desc: "Insira seu valor (mín $3.50), nome do banco e número da conta.",
    step2Title: "Taxa $1.00 Deduzida", step2Desc: "Uma taxa de processamento de $0.13 é retirada do valor solicitado.",
    step3Title: "Convertemos para Naira", step3Desc: "O saldo restante é convertido a $1 = ₦1,500.",
    step4Title: "Pagamento em 24–48h", step4Desc: "Os fundos são enviados diretamente para sua conta bancária nigeriana.",
    youWithdraw: "Você saca", processingFee: "Taxa de processamento",
    youReceiveUSD: "Você recebe (USD)", nairaEquivalent: "Equivalente em Naira",
    referAndEarn: "Indicar & Ganhar",
    inviteFriends: "Convide amigos, ganhem juntos",
    yourReferralCode: "Seu Código de Indicação", copyCode: "Copiar Código",
    copied: "Copiado!", share: "Compartilhar", totalReferrals: "Total de Indicações",
    refEarnings: "Ganhos de Indicação", perReferral: "Por Indicação",
    howItWorks: "Como Funciona", yourReferrals: "Suas Indicações",
    noReferrals: "Nenhuma indicação ainda. Compartilhe seu código!",
    ref1: "Compartilhe seu código ou link de indicação único",
    ref2: "Seu amigo se cadastra usando seu código",
    ref3: "Eles ativam a conta deles (taxa $3.00)",
    ref4: "Você ganha um bônus de indicação de $1.33 instantaneamente!",
    payoutMethods: "Métodos de Pagamento", notifications: "Notificações",
    accountSettings: "Configurações da Conta", helpFeedback: "Ajuda & Feedback",
    sharePromoEarn: "Compartilhar PromoEarn", logOut: "Sair",
    tasks: "Tarefas", earned: "Ganho", balance: "Saldo", activeAccount: "Conta Ativa",
    activateAccountBtn: "Ativar Conta", taskComplete: "Tarefa Concluída!",
    addedToBalance: "adicionado ao seu saldo!", noTasksYet: "Nenhuma tarefa disponível ainda",
    noDataYet: "Nenhum dado ainda", today: "Hoje", yesterday: "Ontem",
    daysAgo: "dias atrás", weeksAgo: "semanas atrás", week: "semana",
    helpFeedbackTitle: "Ajuda & Feedback", helpFaq: "❓ Ajuda / FAQ",
    sendFeedback: "💬 Enviar Feedback", rateExperience: "Avalie sua experiência",
    yourMessage: "Sua mensagem *", sendFeedbackBtn: "Enviar Feedback 🚀",
    sending: "Enviando…", thanksFeedback: "Obrigado pelo seu feedback!",
    sendAnother: "Enviar Outro",
    needSupport: "Precisa de suporte direto?",
    supportEmail: "Envie-nos um email para contact.promoearn@gmail.com · Respondemos em 24h",
    logOutQuestion: "Sair?", logOutDesc: "Você será desconectado da sua conta PromoEarn. Seu saldo e dados estão seguros.",
    yesLogOut: "Sim, Sair", cancelStayIn: "Cancelar, Ficar",
  },

  es: {
    home: "Inicio", promoSpace: "PromoSpace", wallet: "Billetera",
    referral: "Referido", profile: "Perfil",
    availableBalance: "Saldo Disponible", totalEarned: "Total ganado",
    withdraw: "Retirar", history: "Historial", tasksDone: "Tareas Completadas",
    referrals: "Referidos", rank: "Rango", latestTasks: "Últimas Tareas",
    topEarners: "Mayores Ganancias", activateAccount: "Activa Tu Cuenta",
    activateSubtitle: "Tarifa única $3.00 · Obtén bono de $0.33",
    earn: "Ganar", advertise: "Anunciar", marketplace: "Mercado",
    todayPotential: "Potencial de Hoy", earnUpTo: "Gana hasta",
    completing: "completando todas las tareas", done: "completado",
    loadingTasks: "Cargando tareas...", noTasksFound: "No se encontraron tareas",
    checkBackLater: "Vuelve más tarde para nuevas tareas",
    unlockAllTasks: "Desbloquear Todas las Tareas",
    unlockSubtitle: "Activa tu cuenta con una tarifa única de $3.00 para acceder a todas las tareas.",
    activate: "Activar · $3.00", oneTimeFee: "Tarifa única · Bono $0.33",
    start: "Iniciar", completed: "Completado",
    totalBalance: "Saldo Total", withdrawn: "Retirado",
    transactionHistory: "Historial de Transacciones", noTransactions: "No hay transacciones aún",
    withdrawFunds: "Retirar Fondos", allAmountsUSD: "Todos los montos en USD · Mín. $3.50",
    amount: "Monto ($)", accountNumber: "Número de Cuenta", bankName: "Nombre del Banco",
    requestWithdrawal: "Solicitar Retiro", submitting: "Enviando...",
    howWithdrawalsWork: "Cómo Funcionan los Retiros", feesInfo: "Comisiones, tasa de conversión e info de pago",
    withdrawalFeeNotice: "Aviso de Comisión de Retiro",
    withdrawalFeeDetail: "Se deduce una comisión fija de procesamiento de $0.13 de cada retiro.",
    dollarConversion: "Tasa de Conversión del Dólar",
    dollarConversionDetail: "Todos los saldos se muestran en Dólares Americanos. Convertimos a",
    stepByStep: "Proceso Paso a Paso",
    step1Title: "Solicitar Retiro", step1Desc: "Ingresa tu monto (mín $3.50), nombre del banco y número de cuenta.",
    step2Title: "Comisión $1.00 Deducida", step2Desc: "Se toma una comisión de procesamiento de $0.13 de tu monto solicitado.",
    step3Title: "Convertimos a Naira", step3Desc: "El saldo restante se convierte a $1 = ₦1,500.",
    step4Title: "Pago en 24–48h", step4Desc: "Los fondos se envían directamente a tu cuenta bancaria nigeriana.",
    youWithdraw: "Tú retiras", processingFee: "Comisión de procesamiento",
    youReceiveUSD: "Recibes (USD)", nairaEquivalent: "Equivalente en Naira",
    referAndEarn: "Referir & Ganar",
    inviteFriends: "Invita amigos, ganen juntos",
    yourReferralCode: "Tu Código de Referido", copyCode: "Copiar Código",
    copied: "¡Copiado!", share: "Compartir", totalReferrals: "Total de Referidos",
    refEarnings: "Ganancias por Referido", perReferral: "Por Referido",
    howItWorks: "Cómo Funciona", yourReferrals: "Tus Referidos",
    noReferrals: "Sin referidos aún. ¡Comparte tu código!",
    ref1: "Comparte tu código o enlace de referido único",
    ref2: "Tu amigo se registra usando tu código",
    ref3: "Activan su cuenta (tarifa $3.00)",
    ref4: "¡Ganas un bono de referido de $1.33 instantáneamente!",
    payoutMethods: "Métodos de Pago", notifications: "Notificaciones",
    accountSettings: "Configuración de Cuenta", helpFeedback: "Ayuda & Comentarios",
    sharePromoEarn: "Compartir PromoEarn", logOut: "Cerrar Sesión",
    tasks: "Tareas", earned: "Ganado", balance: "Saldo", activeAccount: "Cuenta Activa",
    activateAccountBtn: "Activar Cuenta", taskComplete: "¡Tarea Completada!",
    addedToBalance: "añadido a tu saldo!", noTasksYet: "No hay tareas disponibles aún",
    noDataYet: "Sin datos aún", today: "Hoy", yesterday: "Ayer",
    daysAgo: "días atrás", weeksAgo: "semanas atrás", week: "semana",
    helpFeedbackTitle: "Ayuda & Comentarios", helpFaq: "❓ Ayuda / FAQ",
    sendFeedback: "💬 Enviar Comentarios", rateExperience: "Califica tu experiencia",
    yourMessage: "Tu mensaje *", sendFeedbackBtn: "Enviar Comentarios 🚀",
    sending: "Enviando…", thanksFeedback: "¡Gracias por tus comentarios!",
    sendAnother: "Enviar Otro",
    needSupport: "¿Necesitas soporte directo?",
    supportEmail: "Escríbenos a contact.promoearn@gmail.com · Respondemos en 24h",
    logOutQuestion: "¿Cerrar Sesión?", logOutDesc: "Serás desconectado de tu cuenta PromoEarn. Tu saldo y datos están seguros.",
    yesLogOut: "Sí, Cerrar Sesión", cancelStayIn: "Cancelar, Quedarme",
  },
};

const PREMIUM_PLAN = {
  id:      "premium",
  label:   "Premium",
  price:   3.25,
  tagline: "Everything you need to earn and grow.",
  perks: [
    "Access all earning tasks daily",
    "Full referral program access",
    "Marketplace & brand promotions",
    "Weekly leaderboard bonuses",
    "Priority support",
  ],
};

const TYPE_STYLE = {
  social: { bg:"#EEF4FF",  color:"#1A56DB", label:"Social"  },
  video:  { bg:"#FFF7ED",  color:"#F97316", label:"Video"   },
  share:  { bg:"#F0FDF4",  color:"#10B981", label:"Share"   },
  review: { bg:"#F5F3FF",  color:"#8B5CF6", label:"Review"  },
  survey: { bg:"#FFFBEB",  color:"#F59E0B", label:"Survey"  },
};

const TASK_TYPES = [
  { key:"likes",     label:"Likes",       icon:"👍", desc:"Get people to like your post or page" },
  { key:"followers", label:"Followers",   icon:"👥", desc:"Grow your follower count" },
  { key:"views",     label:"Views",       icon:"👁️", desc:"Increase views on your content" },
  { key:"signup",    label:"Sign Ups",    icon:"✍️", desc:"Get users to register on your platform" },
  { key:"comments",  label:"Comments",   icon:"💬", desc:"Boost engagement with comments" },
  { key:"shares",    label:"Shares",     icon:"🔁", desc:"Amplify reach through sharing" },
  { key:"downloads", label:"Downloads",  icon:"⬇️", desc:"Drive app or file downloads" },
  { key:"clicks",    label:"Link Clicks",icon:"🔗", desc:"Send traffic to your link" },
];

// ── API Helper ─────────────────────────────────────────────────────────────
const api = async (endpoint, options = {}) => {
  const token = await AuthService.getToken();
  const res   = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${token}`,
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  return res.json();
};

// ── Icons ──────────────────────────────────────────────────────────────────
const Ico = {
  Home:     ({sz=22,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><Polyline points="9 22 9 12 15 12 15 22"/></Svg>,
  Promo:    ({sz=22,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2L2 7l10 5 10-5-10-5z"/><Path d="M2 17l10 5 10-5"/><Path d="M2 12l10 5 10-5"/></Svg>,
  Wallet:   ({sz=22,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><Path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><Path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></Svg>,
  Refer:    ({sz=22,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><Circle cx="9" cy="7" r="4"/><Path d="M23 21v-2a4 4 0 0 0-3-3.87"/><Path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>,
  User:     ({sz=22,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><Circle cx="12" cy="7" r="4"/></Svg>,
  Lock:     ({sz=18,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><Path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>,
  Crown:    ({sz=18,cl=C.gold})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill={cl} stroke={cl} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="M2 20h20M4 20l2-8 6 4 6-4 2 8"/></Svg>,
  Check:    ({sz=13,cl=C.green}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Polyline points="20 6 9 17 4 12"/></Svg>,
  Bell:     ({sz=20,cl=C.dark})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><Path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>,
  Star:     ({sz=14,cl=C.gold})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill={cl} stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Polyline points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>,
  Trophy:   ({sz=15,cl=C.gold})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><Path d="M4 22h16"/><Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><Path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></Svg>,
  Up:       ({sz=13,cl=C.green}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Line x1="12" y1="19" x2="12" y2="5"/><Polyline points="5 12 12 5 19 12"/></Svg>,
  Down:     ({sz=13,cl=C.red})   => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Line x1="12" y1="5" x2="12" y2="19"/><Polyline points="19 12 12 19 5 12"/></Svg>,
  Copy:     ({sz=15,cl=C.blue})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Svg>,
  Share:    ({sz=15,cl=C.blue})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="18" cy="5" r="3"/><Circle cx="6" cy="12" r="3"/><Circle cx="18" cy="19" r="3"/><Line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><Line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></Svg>,
  Plus:     ({sz=16,cl=C.white}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Line x1="12" y1="5" x2="12" y2="19"/><Line x1="5" y1="12" x2="19" y2="12"/></Svg>,
  Out:      ({sz=17,cl=C.red})   => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><Polyline points="16 17 21 12 16 7"/><Line x1="21" y1="12" x2="9" y2="12"/></Svg>,
  Gear:     ({sz=17,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="3"/><Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></Svg>,
  Link:     ({sz=14,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><Path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></Svg>,
  Image:    ({sz=18,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><Circle cx="8.5" cy="8.5" r="1.5"/><Polyline points="21 15 16 10 5 21"/></Svg>,
  Rocket:   ({sz=20,cl=C.white}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><Path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><Path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><Path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></Svg>,
  Store:    ({sz=20,cl=C.muted}) => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><Path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><Path d="M2 7h20"/><Path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></Svg>,
  Task:     ({sz=20,cl=C.blue})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></Svg>,
  Megaphone:({sz=20,cl=C.blue})  => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="m3 11 18-5v12L3 14v-3z"/><Path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></Svg>,
  ChevDown:  ({sz=14,cl=C.muted})    => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><Polyline points="6 9 12 15 18 9"/></Svg>,
  X:         ({sz=16,cl=C.muted})    => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Line x1="18" y1="6" x2="6" y2="18"/><Line x1="6" y1="6" x2="18" y2="18"/></Svg>,
  Help:      ({sz=16,cl=C.purple})   => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10"/><Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><Line x1="12" y1="17" x2="12.01" y2="17"/></Svg>,
  Message:   ({sz=16,cl=C.orange})   => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>,
  Eye:       ({sz=18,cl=C.white})    => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><Circle cx="12" cy="12" r="3"/></Svg>,
  EyeOff:    ({sz=18,cl=C.white})    => <Svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke={cl} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><Line x1="1" y1="1" x2="23" y2="23"/></Svg>,
};

// ── Reusable Components ────────────────────────────────────────────────────
const SH = ({ title, action, onAction }) => (
  <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
    <Text style={{ fontFamily:fonts.bold, fontSize:16, color:C.dark }}>{title}</Text>
    {action && <TouchableOpacity onPress={onAction} activeOpacity={0.7}><Text style={{ fontFamily:fonts.semibold, fontSize:13, color:C.blue }}>{action}</Text></TouchableOpacity>}
  </View>
);
// ── Fake tasks shown to unactivated users ─────────────────────────────────
const FAKE_TASKS = [
  { id:"demo_1", type:"social", brand:"Nike",    title:"Follow Nike's official Instagram page",          reward:"2.15", slots:500, filled:312, time:"1 min",  color:"#EF4444" },
  { id:"demo_2", type:"video",  brand:"Samsung", title:"Watch the Samsung Galaxy S25 launch video",       reward:"2.20", slots:300, filled:187, time:"2 min",  color:"#1A56DB" },
  { id:"demo_3", type:"share",  brand:"Jumia",   title:"Share Jumia Black Friday sale to WhatsApp",       reward:"1.18", slots:200, filled:94,  time:"1 min",  color:"#F97316" },
  { id:"demo_4", type:"review", brand:"Konga",   title:"Leave a 5-star review on the Konga app",          reward:"1.25", slots:150, filled:55,  time:"3 min",  color:"#10B981" },
  { id:"demo_5", type:"survey", brand:"MTN",     title:"Complete MTN customer satisfaction survey",       reward:"3.30", slots:100, filled:23,  time:"4 min",  color:"#F59E0B" },
];
// ── Shared TaskCard (used in HomeScreen + PromoSpaceScreen) ────────────────
const TaskCard = ({ task, locked, onStart, completed, completedIds }) => {
  const ts   = TYPE_STYLE[task.type] || TYPE_STYLE.social;
  // support both a `completed` bool (HomeScreen) and a `completedIds` array (PromoSpace)
  const done = completed || (completedIds ? completedIds.includes(task.id) : false) || task.status === "completed";
  const logo  = task.brand?.slice(0,2).toUpperCase() || "PE";
  const color = task.color || C.blue;
  const [step, setStep] = useState("idle");

  const handleStart = async () => {
    if (task.link) {
      try {
        await Linking.openURL(task.link);
        setStep("opened");
      } catch (err) {
        Alert.alert("Error", "Could not open this link.");
      }
    } else {
      onStart(task);
    }
  };
  const handleConfirm = () => {
    setStep("confirming");
    onStart(task, () => setStep("idle"));
  };

  return (
    <View style={[z.taskCard, done && { opacity:0.6 }]}>
      <View style={[z.taskLogo, { backgroundColor: color + "22" }]}>
        <Text style={[z.taskLogoTxt, { color }]}>{logo}</Text>
      </View>
      <View style={{ flex:1 }}>
        <View style={{ flexDirection:"row", alignItems:"center", gap:7, marginBottom:5 }}>
          <View style={[z.badge, { backgroundColor:ts.bg }]}>
            <Text style={[z.badgeTxt, { color:ts.color }]}>{ts.label}</Text>
          </View>
          {task.time && (
            <Text style={z.taskTime}>⏱ {task.time}</Text>
          )}
        </View>
        <Text style={z.taskTitle} numberOfLines={2}>{task.title}</Text>
        <Text style={z.taskBrand}>{task.brand}</Text>
        {task.description ? (
          <Text style={{ fontFamily:fonts.regular, fontSize:11, color:C.muted, marginTop:3 }} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems:"flex-end", justifyContent:"space-between", minWidth:70 }}>
        <Text style={z.taskReward}>+${parseFloat(task.reward).toFixed(2)}</Text>
        {done ? (
          <View style={[z.startBtn, { backgroundColor:C.border }]}>
            <Ico.Lock sz={13} cl={C.muted}/>
          </View>
        ) : locked ? (
          <View style={[z.startBtn, { backgroundColor:C.border }]}>
            <Ico.Lock sz={13} cl={C.white}/>
          </View>
        ) : step === "idle" ? (
          <TouchableOpacity style={z.startBtn} onPress={handleStart} activeOpacity={0.85}>
            <Text style={z.startBtnTxt}>Start</Text>
          </TouchableOpacity>
        ) : step === "opened" ? (
          <TouchableOpacity
            style={[z.startBtn, { backgroundColor:C.green, paddingHorizontal:8 }]}
            onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={[z.startBtnTxt, { fontSize:10 }]}>Done?</Text>
          </TouchableOpacity>
        ) : (
          <View style={[z.startBtn, { backgroundColor:C.muted }]}>
            <ActivityIndicator size="small" color={C.white}/>
          </View>
        )}
      </View>
    </View>
  );
};

const AdCard = ({ ad }) => {
  const full  = ad.filled >= ad.slots;
  const logo  = ad.brand?.slice(0,2).toUpperCase() || "AD";
  const color = ad.color || C.blue;
  return (
    <View style={z.adCard}>
      <View style={{ flexDirection:"row", gap:12, marginBottom:12 }}>
        <View style={[z.adLogo, { backgroundColor: color+"22" }]}><Text style={[z.adLogoTxt, { color }]}>{logo}</Text></View>
        <View style={{ flex:1 }}>
          <View style={{ flexDirection:"row", justifyContent:"space-between" }}>
            <Text style={{ fontFamily:fonts.semibold, fontSize:12, color:C.muted }}>{ad.brand}</Text>
            <View style={[z.catBadge, { backgroundColor: color+"18" }]}><Text style={[z.catTxt, { color }]}>{ad.category || ad.type}</Text></View>
          </View>
          <Text style={z.adTitle}>{ad.title}</Text>
          <Text style={z.adDesc} numberOfLines={2}>{ad.description}</Text>
        </View>
      </View>
      <View style={{ flexDirection:"row", alignItems:"center", justifyContent:"space-between" }}>
        <View>
          <Text style={z.adReward}>+${parseFloat(ad.reward).toFixed(2)}</Text>
          <Text style={{ fontFamily:fonts.regular, fontSize:11, color:C.muted, marginTop:2 }}>{(ad.slots||0)-(ad.filled||0)} / {ad.slots||0} slots left</Text>
        </View>
        <TouchableOpacity style={[z.applyBtn, full && { backgroundColor:C.border }]} activeOpacity={0.85}>
          <Text style={[z.applyTxt, full && { color:C.muted }]}>{full ? "Full" : "Apply"}</Text>
        </TouchableOpacity>
      </View>
      <View style={{ height:4, backgroundColor:C.border, borderRadius:2, marginTop:10, overflow:"hidden" }}>
        <View style={{ width:`${Math.min(((ad.filled||0)/(ad.slots||1))*100,100)}%`, height:"100%", backgroundColor:color, borderRadius:2 }}/>
      </View>
    </View>
  );
};

const PremiumGate = ({ onUpgrade }) => {
  const fakeTasks = [
    { title: "Follow this brand on Instagram",  reward: "$1.00", type: "follow"   },
    { title: "Watch a 30-second product video", reward: "$2.00", type: "video"    },
    { title: "Like and share this post",        reward: "$3.00", type: "like"     },
    { title: "Click and visit brand website",   reward: "$1.50", type: "click"    },
    { title: "Download this app for free",      reward: "$2.50", type: "download" },
  ];
  return (
    <View style={{ flex:1 }}>
      {/* Blurred fake task cards */}
      <View style={{ opacity: 0.3, pointerEvents: "none" }}>
        {fakeTasks.map((task, i) => (
          <View key={i} style={[z.taskCard]}>
            <View style={[z.taskLogo, { backgroundColor:"#E2E8F0" }]}>
              <Text style={{ fontFamily:fonts.semibold, fontSize:11, color:"#94A3B8" }}>PE</Text>
            </View>
            <View style={{ flex:1 }}>
              <Text style={z.taskTitle}>{task.title}</Text>
              <Text style={z.taskBrand}>PromoEarn Task</Text>
            </View>
            <View style={{ alignItems:"flex-end" }}>
              <Text style={z.taskReward}>{task.reward}</Text>
              <View style={[z.startBtn, { backgroundColor:"#CBD5E1" }]}>
                <Text style={z.startBtnTxt}>Start</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Centered lock overlay */}
      <View style={{ position:"absolute", top:0, left:0, right:0, bottom:0, alignItems:"center", justifyContent:"center", padding:24 }}>
        <View style={{ backgroundColor:"#FFFFFF", borderRadius:24, padding:28, alignItems:"center", shadowColor:"#000", shadowOpacity:0.12, shadowRadius:24, elevation:10, width:"90%" }}>
          <View style={{ width:60, height:60, borderRadius:30, backgroundColor:"#EEF4FF", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
            <Ico.Lock sz={26} cl={C.blue}/>
          </View>
          <Text style={{ fontFamily:fonts.black, fontSize:20, color:C.dark, textAlign:"center", marginBottom:8 }}>Unlock All Tasks</Text>
          <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, textAlign:"center", lineHeight:20, marginBottom:22 }}>
            Activate your account with a one-time fee to access all earning tasks above and more.
          </Text>
          <TouchableOpacity
            style={{ backgroundColor:C.blue, borderRadius:14, height:52, width:"100%", alignItems:"center", justifyContent:"center" }}
            onPress={onUpgrade} activeOpacity={0.85}>
            <Text style={{ fontFamily:fonts.bold, fontSize:15, color:"#FFFFFF" }}>Activate Account · $3.00</Text>
          </TouchableOpacity>
          {/* <Text style={{ fontFamily:fonts.regular, fontSize:11, color:C.muted, marginTop:10, textAlign:"center" }}>
            One-time fee · $0.33 welcome bonus included
          </Text> */}
        </View>
      </View>
    </View>
  );
};
// ── Filter Chip ────────────────────────────────────────────────────────────
const FilterChip = ({ label, active, onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}
    style={[fc.chip, active && fc.chipActive]}>
    <Text style={[fc.txt, active && fc.txtActive]}>{label}</Text>
  </TouchableOpacity>
);
const fc = StyleSheet.create({
  chip:       { paddingHorizontal:16, paddingVertical:8, borderRadius:20, backgroundColor:"#FFFFFF", borderWidth:1.5, borderColor:"#E2E8F0" },
  chipActive: { backgroundColor:"#1A56DB", borderColor:"#1A56DB" },
  txt:        { fontFamily:fonts.semibold, fontSize:12, color:"#64748B" },
  txtActive:  { color:"#FFFFFF" },
});

// ── Advertise Form (Step wizard) ───────────────────────────────────────────
function AdvertiseSection({ user }) {
  const [form, setForm] = useState({
    brandName:"", taskType:"", targetCount:"", reward:"",
    slots:"", pageLink:"", description:"", mediaNote:"", budget:"",
  });
  const [step,         setStep]         = useState(1);
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.brandName || !selectedType || !form.pageLink || !form.slots) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setSubmitted(true);
    } catch {
      Alert.alert("Error", "Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setForm({ brandName:"", taskType:"", targetCount:"", reward:"", slots:"", pageLink:"", description:"", mediaNote:"", budget:"" });
    setStep(1); setSelectedType(null); setSubmitted(false);
  };

  if (submitted) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:32, paddingTop:60 }}>
        <View style={{ width:80, height:80, borderRadius:40, backgroundColor:C.greenSoft, alignItems:"center", justifyContent:"center", marginBottom:20 }}>
          <Text style={{ fontSize:36 }}>🎉</Text>
        </View>
        <Text style={{ fontFamily:fonts.black, fontSize:22, color:C.dark, textAlign:"center", marginBottom:10 }}>Campaign Submitted!</Text>
        <Text style={{ fontFamily:fonts.regular, fontSize:14, color:C.muted, textAlign:"center", lineHeight:22, marginBottom:32 }}>
          Our team will review your campaign within 24 hours and notify you once it goes live.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor:C.blue, borderRadius:16, paddingHorizontal:32, paddingVertical:14 }}
          onPress={resetForm} activeOpacity={0.85}>
          <Text style={{ fontFamily:fonts.bold, fontSize:15, color:C.white }}>Submit Another</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const StepDot = ({ n }) => (
    <View style={{ alignItems:"center" }}>
      <View style={{ width:30, height:30, borderRadius:15, backgroundColor:step >= n ? C.blue : C.border, alignItems:"center", justifyContent:"center" }}>
        {step > n
          ? <Ico.Check sz={14} cl={C.white}/>
          : <Text style={{ fontFamily:fonts.bold, fontSize:12, color:step >= n ? C.white : C.muted }}>{n}</Text>
        }
      </View>
    </View>
  );

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal:20, paddingBottom:60 }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ marginBottom:24, marginTop:8 }}>
        <Text style={{ fontFamily:fonts.black, fontSize:22, color:C.dark, letterSpacing:-0.5 }}>Advertise With Us</Text>
        <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, marginTop:4 }}>
          Reach thousands of active PromoEarn users ready to promote your brand.
        </Text>
      </View>

      {/* Stats banner */}
      <View style={{ backgroundColor:C.dark, borderRadius:20, padding:20, marginBottom:24, overflow:"hidden", flexDirection:"row" }}>
        <View style={{ position:"absolute", width:160, height:160, borderRadius:80, backgroundColor:C.blue, opacity:0.15, top:-40, right:-30 }}/>
        {[
          { val:"10K+", lbl:"Active Users" },
          { val:"95%",  lbl:"Task Rate"    },
          { val:"24h",  lbl:"Go Live"      },
        ].map((s, i) => (
          <View key={i} style={{ flex:1, alignItems:"center", borderRightWidth:i<2?1:0, borderRightColor:"rgba(255,255,255,0.1)" }}>
            <Text style={{ fontFamily:fonts.black, fontSize:22, color:C.white, letterSpacing:-0.5 }}>{s.val}</Text>
            <Text style={{ fontFamily:fonts.regular, fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:2 }}>{s.lbl}</Text>
          </View>
        ))}
      </View>

      {/* Step indicator */}
      <View style={{ flexDirection:"row", alignItems:"center", marginBottom:28 }}>
        {[1,2,3].map((n, i) => (
          <View key={n} style={{ flexDirection:"row", alignItems:"center", flex:i<2?1:0 }}>
            <StepDot n={n}/>
            {i < 2 && <View style={{ flex:1, height:2, backgroundColor:step>n?C.blue:C.border, marginHorizontal:4 }}/>}
          </View>
        ))}
        <View style={{ marginLeft:12 }}>
          <Text style={{ fontFamily:fonts.semibold, fontSize:12, color:C.blue }}>
            Step {step} of 3 — {step===1?"Campaign Details":step===2?"Platform & Links":"Review & Submit"}
          </Text>
        </View>
      </View>

      {/* STEP 1 */}
      {step === 1 && (
        <View>
          <AdvFormField label="Brand / Product Name *" placeholder="e.g. MyApp, Nike, TechStore" value={form.brandName} onChange={v => set("brandName", v)} />

          <Text style={af.sectionLbl}>What do you want users to do? *</Text>
          <View style={{ flexDirection:"row", flexWrap:"wrap", gap:10, marginBottom:20 }}>
            {TASK_TYPES.map(t => (
              <TouchableOpacity key={t.key} onPress={() => setSelectedType(t.key)} activeOpacity={0.8}
                style={[af.typeChip, selectedType===t.key && af.typeChipActive]}>
                <Text style={{ fontSize:16 }}>{t.icon}</Text>
                <Text style={[af.typeChipTxt, selectedType===t.key && { color:C.blue, fontFamily:fonts.bold }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedType && (
            <View style={{ backgroundColor:C.blueSoft, borderRadius:12, padding:12, marginBottom:20, flexDirection:"row", gap:8, alignItems:"center" }}>
              <Text style={{ fontSize:20 }}>{TASK_TYPES.find(t=>t.key===selectedType)?.icon}</Text>
              <Text style={{ fontFamily:fonts.medium, fontSize:13, color:C.blue, flex:1 }}>
                {TASK_TYPES.find(t=>t.key===selectedType)?.desc}
              </Text>
            </View>
          )}
          <View style={{ flexDirection:"row", gap:12 }}>
            <View style={{ flex:1 }}><AdvFormField label="Target Count" placeholder="e.g. 500" value={form.targetCount} onChange={v=>set("targetCount",v)} numeric/></View>
            <View style={{ flex:1 }}><AdvFormField label="No. of Slots *" placeholder="e.g. 100" value={form.slots} onChange={v=>set("slots",v)} numeric/></View>
          </View>
          <View style={{ flexDirection:"row", gap:12 }}>
            <View style={{ flex:1 }}><AdvFormField label="Reward per user ($)" placeholder="0.50" value={form.reward} onChange={v=>set("reward",v)} numeric/></View>
            <View style={{ flex:1 }}><AdvFormField label="Total Budget ($)" placeholder="e.g. 50.00" value={form.budget} onChange={v=>set("budget",v)} numeric/></View>
          </View>
          <TouchableOpacity
            style={[af.nextBtn, (!form.brandName||!selectedType) && { opacity:0.5 }]}
            onPress={() => { if (form.brandName && selectedType) setStep(2); }}
            activeOpacity={0.85}>
            <Text style={af.nextBtnTxt}>Continue →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <View>
          <AdvFormField
            label="Link to your page / post *"
            placeholder="https://instagram.com/yourbrand"
            value={form.pageLink}
            onChange={v=>set("pageLink",v)}
            icon={<Ico.Link sz={14} cl={C.muted}/>}
          />
          <Text style={af.sectionLbl}>Campaign Description</Text>
          <View style={{ backgroundColor:C.white, borderRadius:14, borderWidth:1.5, borderColor:C.border, padding:14, marginBottom:16 }}>
            <TextInput
              style={{ fontFamily:fonts.medium, fontSize:14, color:C.dark, minHeight:90, textAlignVertical:"top" }}
              placeholder="Describe what users should do, what your brand is about, and any specific instructions..."
              placeholderTextColor="#CBD5E1"
              multiline
              value={form.description}
              onChangeText={v=>set("description",v)}
            />
          </View>
          <Text style={af.sectionLbl}>Media (optional)</Text>
          <TouchableOpacity
            style={{ backgroundColor:C.white, borderRadius:14, borderWidth:2, borderColor:C.border, borderStyle:"dashed", padding:24, alignItems:"center", gap:8, marginBottom:20 }}
            activeOpacity={0.8}
            onPress={() => Alert.alert("Coming Soon", "Media upload will be available soon.")}>
            <Ico.Image sz={28} cl={C.slate}/>
            <Text style={{ fontFamily:fonts.semibold, fontSize:14, color:C.muted }}>Upload Image or Video</Text>
            <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.slate }}>JPG, PNG, MP4 · Max 10MB</Text>
          </TouchableOpacity>
          <Text style={af.sectionLbl}>Additional Notes</Text>
          <View style={{ backgroundColor:C.white, borderRadius:14, borderWidth:1.5, borderColor:C.border, padding:14, marginBottom:20 }}>
            <TextInput
              style={{ fontFamily:fonts.medium, fontSize:14, color:C.dark, minHeight:60, textAlignVertical:"top" }}
              placeholder="Any special requirements or notes for users..."
              placeholderTextColor="#CBD5E1"
              multiline
              value={form.mediaNote}
              onChangeText={v=>set("mediaNote",v)}
            />
          </View>
          <View style={{ flexDirection:"row", gap:12 }}>
            <TouchableOpacity style={af.backBtn} onPress={()=>setStep(1)} activeOpacity={0.8}>
              <Text style={af.backBtnTxt}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[af.nextBtn, { flex:1 }, !form.pageLink && { opacity:0.5 }]}
              onPress={() => { if (form.pageLink) setStep(3); }} activeOpacity={0.85}>
              <Text style={af.nextBtnTxt}>Review →</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <View>
          <View style={{ backgroundColor:C.white, borderRadius:20, padding:20, borderWidth:1, borderColor:C.border, marginBottom:20 }}>
            <Text style={{ fontFamily:fonts.bold, fontSize:16, color:C.dark, marginBottom:16 }}>Campaign Summary</Text>
            {[
              { lbl:"Brand",        val:form.brandName },
              { lbl:"Task Type",    val:TASK_TYPES.find(t=>t.key===selectedType)?.label||"—" },
              { lbl:"Target Count", val:form.targetCount||"Not specified" },
              { lbl:"Slots",        val:form.slots||"—" },
              { lbl:"Reward/User",  val:form.reward?`$${form.reward}`:"Not specified" },
              { lbl:"Budget",       val:form.budget?`$${form.budget}`:"Not specified" },
              { lbl:"Page Link",    val:form.pageLink },
            ].map((row, i) => (
              <View key={i} style={{ flexDirection:"row", justifyContent:"space-between", paddingVertical:10, borderBottomWidth:i<6?1:0, borderBottomColor:C.border }}>
                <Text style={{ fontFamily:fonts.medium, fontSize:13, color:C.muted }}>{row.lbl}</Text>
                <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:C.dark, flex:1, textAlign:"right", marginLeft:12 }} numberOfLines={1}>{row.val}</Text>
              </View>
            ))}
            {form.description ? (
              <View style={{ marginTop:12 }}>
                <Text style={{ fontFamily:fonts.medium, fontSize:12, color:C.muted, marginBottom:4 }}>Description</Text>
                <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.dark, lineHeight:20 }}>{form.description}</Text>
              </View>
            ) : null}
          </View>
          <View style={{ backgroundColor:C.goldSoft, borderRadius:14, padding:14, marginBottom:20, flexDirection:"row", gap:10 }}>
            <Ico.Star sz={16}/>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:fonts.bold, fontSize:13, color:C.dark }}>Pricing & Payment</Text>
              <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, marginTop:2, lineHeight:18 }}>
                Our team will contact you with a final quote after reviewing your campaign. You only pay when it goes live.
              </Text>
            </View>
          </View>
          <View style={{ flexDirection:"row", gap:12 }}>
            <TouchableOpacity style={af.backBtn} onPress={()=>setStep(2)} activeOpacity={0.8}>
              <Text style={af.backBtnTxt}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[af.nextBtn, { flex:1, backgroundColor:C.green }, submitting && { opacity:0.7 }]}
              onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
              {submitting
                ? <ActivityIndicator color={C.white}/>
                : <Text style={af.nextBtnTxt}>🚀 Submit Campaign</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Advertise Form Field ───────────────────────────────────────────────────
const AdvFormField = ({ label, placeholder, value, onChange, numeric, icon }) => (
  <View style={{ marginBottom:16 }}>
    <Text style={af.sectionLbl}>{label}</Text>
    <View style={{ flexDirection:"row", alignItems:"center", backgroundColor:C.white, borderRadius:14, borderWidth:1.5, borderColor:C.border, paddingHorizontal:14, height:50 }}>
      {icon && <View style={{ marginRight:8 }}>{icon}</View>}
      <TextInput
        style={{ flex:1, fontFamily:fonts.medium, fontSize:14, color:C.dark }}
        placeholder={placeholder}
        placeholderTextColor="#CBD5E1"
        value={value}
        onChangeText={onChange}
        keyboardType={numeric ? "numeric" : "default"}
      />
    </View>
  </View>
);

const af = StyleSheet.create({
  sectionLbl:     { fontFamily:fonts.semibold, fontSize:11, color:"#64748B", textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 },
  typeChip:       { flexDirection:"row", alignItems:"center", gap:6, backgroundColor:"#FFFFFF", borderRadius:12, paddingHorizontal:12, paddingVertical:10, borderWidth:1.5, borderColor:"#E2E8F0" },
  typeChipActive: { borderColor:"#1A56DB", backgroundColor:"#EEF4FF" },
  typeChipTxt:    { fontFamily:fonts.medium, fontSize:13, color:"#64748B" },
  nextBtn:        { backgroundColor:"#1A56DB", borderRadius:14, height:52, alignItems:"center", justifyContent:"center" },
  nextBtnTxt:     { fontFamily:fonts.bold, fontSize:15, color:"#FFFFFF" },
  backBtn:        { backgroundColor:"#F8FAFF", borderRadius:14, height:52, alignItems:"center", justifyContent:"center", paddingHorizontal:20, borderWidth:1.5, borderColor:"#E2E8F0" },
  backBtnTxt:     { fontFamily:fonts.semibold, fontSize:14, color:"#64748B" },
});

// ── Marketplace Locked Screen ──────────────────────────────────────────────
function MarketplaceLocked() {
  return (
    <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:32, paddingTop:40 }}>
      <View style={{ width:"100%", borderRadius:20, overflow:"hidden", marginBottom:32, opacity:0.35 }}>
        {[1,2,3].map(i => (
          <View key={i} style={{ backgroundColor:C.white, borderRadius:16, padding:16, marginBottom:8, flexDirection:"row", gap:12 }}>
            <View style={{ width:46, height:46, borderRadius:14, backgroundColor:C.border }}/>
            <View style={{ flex:1, gap:6 }}>
              <View style={{ width:"70%", height:12, backgroundColor:C.border, borderRadius:6 }}/>
              <View style={{ width:"50%", height:10, backgroundColor:C.border, borderRadius:6 }}/>
              <View style={{ width:"30%", height:10, backgroundColor:C.border, borderRadius:6 }}/>
            </View>
          </View>
        ))}
      </View>
      <View style={{ width:72, height:72, borderRadius:36, backgroundColor:C.dark, alignItems:"center", justifyContent:"center", marginBottom:20, shadowColor:C.dark, shadowOffset:{width:0,height:8}, shadowOpacity:0.3, shadowRadius:16, elevation:10 }}>
        <Ico.Lock sz={32} cl={C.white}/>
      </View>
      <Text style={{ fontFamily:fonts.black, fontSize:24, color:C.dark, textAlign:"center", letterSpacing:-0.5, marginBottom:10 }}>Marketplace</Text>
      <View style={{ backgroundColor:"#FFF3CD", borderRadius:20, paddingHorizontal:16, paddingVertical:6, marginBottom:16 }}>
        <Text style={{ fontFamily:fonts.bold, fontSize:12, color:"#92600A" }}>🚧 Coming Soon</Text>
      </View>
      <Text style={{ fontFamily:fonts.regular, fontSize:14, color:C.muted, textAlign:"center", lineHeight:22, marginBottom:32 }}>
        The PromoEarn Marketplace is our next big feature — a full ecosystem where brands and creators connect, trade services, and collaborate.
      </Text>
      <View style={{ width:"100%", backgroundColor:C.white, borderRadius:20, padding:20, borderWidth:1, borderColor:C.border }}>
        <Text style={{ fontFamily:fonts.bold, fontSize:14, color:C.dark, marginBottom:14 }}>What's Coming</Text>
        {[
          { icon:"🛍️", text:"Buy & sell promotional services"    },
          { icon:"🤝", text:"Direct brand-creator collaboration"  },
          { icon:"📊", text:"Analytics & performance tracking"    },
          { icon:"💎", text:"Premium verified brand badges"       },
        ].map((item, i) => (
          <View key={i} style={{ flexDirection:"row", alignItems:"center", gap:12, paddingVertical:8, borderBottomWidth:i<3?1:0, borderBottomColor:C.border }}>
            <Text style={{ fontSize:20 }}>{item.icon}</Text>
            <Text style={{ fontFamily:fonts.medium, fontSize:13, color:C.muted, flex:1 }}>{item.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Premium Modal ──────────────────────────────────────────────────────────
const PremiumModal = ({ visible, onProceed, onClose }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={pm.overlay}>
      <View style={pm.sheet}>
        <View style={pm.handle} />
        <View style={pm.gradientCard}>
          <View style={[pm.blob, { backgroundColor:"#F472B6", top:-50, left:-30, width:200, height:200 }]} />
          <View style={[pm.blob, { backgroundColor:"#A78BFA", top:-30, right:-50, width:180, height:180 }]} />
          <View style={[pm.blob, { backgroundColor:"#FB923C", bottom:-40, left:40, width:160, height:160 }]} />
          <View style={[pm.blob, { backgroundColor:"#34D399", bottom:-20, right:20, width:120, height:120, opacity:0.5 }]} />
          <TouchableOpacity style={pm.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={{ fontSize:17, color:"rgba(255,255,255,0.9)", fontWeight:"800" }}>✕</Text>
          </TouchableOpacity>
          <View style={pm.planLabelWrap}>
            <Ico.Crown sz={13} cl={C.white} />
            <Text style={pm.planLabel}>Activate Account</Text>
          </View>
          <View style={pm.priceRow}>
            <Text style={pm.priceBig}>$3</Text>
            <Text style={pm.priceSub}>.00  one-time</Text>
          </View>
          <Text style={pm.tagline}>{PREMIUM_PLAN.tagline}</Text>
          <TouchableOpacity style={pm.ctaBtn} onPress={onProceed} activeOpacity={0.85}>
            <Text style={pm.ctaBtnTxt}>Get Started</Text>
          </TouchableOpacity>
        </View>
        <View style={pm.perksWrap}>
          {PREMIUM_PLAN.perks.map((perk, i) => (
            <View key={i} style={pm.perkRow}>
              <View style={pm.checkCircle}><Ico.Check sz={11} cl={C.dark} /></View>
              <Text style={pm.perkText}>{perk}</Text>
            </View>
          ))}
        </View>
        <Text style={pm.hint}>Secured by Paystack</Text>
      </View>
    </View>
  </Modal>
);

const pm = StyleSheet.create({
  overlay:      { flex:1, backgroundColor:"rgba(0,0,0,0.6)", justifyContent:"flex-end" },
  sheet:        { backgroundColor:"#FFFFFF", borderTopLeftRadius:32, borderTopRightRadius:32, paddingBottom:Platform.OS==="ios"?44:28 },
  handle:       { width:40, height:4, backgroundColor:"#E2E8F0", borderRadius:2, alignSelf:"center", marginTop:12, marginBottom:14 },
  gradientCard: { marginHorizontal:16, borderRadius:24, padding:24, paddingTop:30, backgroundColor:"#FDA4AF", overflow:"hidden", minHeight:228, position:"relative" },
  blob:         { position:"absolute", borderRadius:999, opacity:0.72 },
  closeBtn:     { position:"absolute", top:14, right:14, width:30, height:30, borderRadius:15, backgroundColor:"rgba(0,0,0,0.18)", alignItems:"center", justifyContent:"center", zIndex:10 },
  planLabelWrap:{ flexDirection:"row", alignItems:"center", gap:6, marginBottom:14 },
  planLabel:    { fontFamily:fonts.bold, fontSize:14, color:"#FFFFFF" },
  priceRow:     { flexDirection:"row", alignItems:"flex-end", gap:3, marginBottom:6 },
  priceBig:     { fontFamily:fonts.black, fontSize:54, color:"#FFFFFF", letterSpacing:-2, lineHeight:58 },
  priceSub:     { fontFamily:fonts.medium, fontSize:14, color:"rgba(255,255,255,0.88)", marginBottom:9 },
  tagline:      { fontFamily:fonts.regular, fontSize:13, color:"rgba(255,255,255,0.9)", lineHeight:19, marginBottom:20 },
  ctaBtn:       { backgroundColor:"rgba(15,23,42,0.88)", borderRadius:14, height:50, alignItems:"center", justifyContent:"center" },
  ctaBtnTxt:    { fontFamily:fonts.bold, fontSize:15, color:"#FFFFFF" },
  perksWrap:    { paddingHorizontal:20, paddingTop:18, gap:13 },
  perkRow:      { flexDirection:"row", alignItems:"center", gap:12 },
  checkCircle:  { width:22, height:22, borderRadius:11, backgroundColor:"#E2E8F0", alignItems:"center", justifyContent:"center" },
  perkText:     { fontFamily:fonts.medium, fontSize:14, color:"#0F172A", flex:1 },
  hint:         { fontFamily:fonts.regular, fontSize:11, color:"#64748B", textAlign:"center", marginTop:18, marginHorizontal:20 },
});

// ── Paystack Modal ─────────────────────────────────────────────────────────
// ── Paystack Modal ─────────────────────────────────────────────────────────
// Replace your entire PaystackModal component with this version.
// Works on BOTH web (opens in browser tab) and mobile (uses WebView).

const PaystackModal = ({ visible, user, onSuccess, onClose }) => {
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [reference,  setReference]  = useState(null);
  const [verifying,  setVerifying]  = useState(false);
 
  const isWeb = Platform.OS === "web";
 
  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      setLoading(false);
      setError(null);
      setPaymentUrl(null);
      setReference(null);
      setVerifying(false);
    }
  }, [visible]);
 
  // ── On web: poll every 2s to see if user came back after paying ────────
  // Works with ngrok — when Paystack redirects to /payment-success?reference=xxx
  // that page stores the ref in localStorage then closes itself.
  useEffect(() => {
    if (!isWeb || !paymentUrl || !reference) return;
 
    const interval = setInterval(() => {
      try {
        const done = localStorage.getItem("pe_payment_done");
        if (done === reference) {
          clearInterval(interval);
          localStorage.removeItem("pe_payment_done");
          verifyAndActivate(reference);
        }
      } catch {}
    }, 2000);
 
    return () => clearInterval(interval);
  }, [paymentUrl, reference]);
 
  // ── Step 1: Call backend to get Paystack URL ───────────────────────────
  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AuthService.getToken();
      if (!token) {
        setError("Session expired. Please log out and log back in.");
        return;
      }
 
      const res = await fetch(`${BASE_URL}/payments/create-checkout`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.uid, email: user.email }),
      });
 
      const data = await res.json();
 
      if (!data.success || !data.url) {
        setError(data.message || "Could not start payment. Please try again.");
        return;
      }
 
      // Save reference so we can verify later
      setReference(data.reference);
      try { localStorage.setItem("pe_payment_ref", data.reference); } catch {}
 
      if (isWeb) {
        // Open Paystack in a new tab — stay on this screen to verify
        window.open(data.url, "_blank");
        setPaymentUrl(data.url);
      } else {
        setPaymentUrl(data.url);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };
 
  // ── Step 2: Verify with backend and activate ───────────────────────────
  const verifyAndActivate = async (ref) => {
    if (verifying) return;
    setVerifying(true);
    setError(null);
 
    const refToUse = ref || reference;
    if (!refToUse) {
      setError("Payment reference missing. If you paid, contact contact.promoearn@gmail.com");
      setVerifying(false);
      return;
    }
 
    try {
      const token = await AuthService.getToken();
      const res = await fetch(`${BASE_URL}/payments/verify-payment`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ reference: refToUse }),
      });
 
      const data = await res.json();
 
      if (data.success || data.message?.includes("already activated")) {
        try { await AsyncStorage.removeItem("pe_payment_ref"); } catch {}
        setPaymentUrl(null);
        // ← This calls onPaid() in MainApp which calls fetchUser() + shows success
        onSuccess();
      } else {
        setError(data.message || "Payment not confirmed yet. Please wait a moment and try again.");
      }
    } catch {
      setError("Verification failed. If you paid, tap the button again or contact support.");
    } finally {
      setVerifying(false);
    }
  };
 
  // ── Mobile: WebView nav watcher ────────────────────────────────────────
  const handleWebViewNav = async (navState) => {
    const url = navState.url || "";
    const isComplete =
      url.includes("/payment-success") ||
      url.includes("paystack.com/close") ||
      url.includes("standard.paystack.com/close");
 
    if (isComplete) {
      // Try to grab reference from redirect URL params
      try {
        const parsed = new URL(url);
        const urlRef =
          parsed.searchParams.get("reference") ||
          parsed.searchParams.get("trxref");
          if (urlRef) {
            setReference(urlRef);
            try { await AsyncStorage.setItem("pe_payment_ref", urlRef); } catch {}
            await verifyAndActivate(urlRef);
          return;
        }
      } catch {}
      // Fallback to stored reference
      await verifyAndActivate(reference);
    }
  };
 
  // ── WEB: Waiting screen after Paystack tab opened ──────────────────────
  if (isWeb && paymentUrl) {
    return (
      <Modal visible={true} animationType="slide" transparent>
        <View style={sm.overlay}>
          <View style={sm.sheet}>
            <View style={sm.handle} />
 
            {/* Header */}
            <View style={sm.header}>
              <View>
                <Text style={sm.title}>
                  {verifying ? "Activating your account..." : "Complete Your Payment"}
                </Text>
                <Text style={sm.sub}>
                  {verifying ? "Please wait a moment" : "Paystack opened in a new tab"}
                </Text>
              </View>
              {!verifying && (
                <TouchableOpacity
                  style={sm.closeBtn}
                  onPress={() => { setPaymentUrl(null); setError(null); }}
                  activeOpacity={0.7}>
                  <Text style={{ fontSize: 18, color: "#64748B" }}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
 
            <View style={sm.body}>
              {verifying ? (
                // ── Verifying state ──
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
                  <ActivityIndicator color="#1A56DB" size="large" />
                  <Text style={{
                    marginTop: 16, color: "#0F172A",
                    fontFamily: fonts.bold, fontSize: 16, textAlign: "center",
                  }}>
                    Verifying your payment...
                  </Text>
                  <Text style={{
                    marginTop: 8, color: "#64748B",
                    fontFamily: fonts.regular, fontSize: 13, textAlign: "center",
                  }}>
                    Activating your account and adding your $0.33 welcome bonus
                  </Text>
                </View>
              ) : (
                // ── Waiting state ──
                <>
                  {/* Step instructions */}
                  <View style={{
                    backgroundColor: "#EEF4FF", borderRadius: 16, padding: 16,
                    marginBottom: 20,
                  }}>
                    <Text style={{
                      fontFamily: fonts.bold, fontSize: 14, color: "#0F172A", marginBottom: 10,
                    }}>
                      How to complete payment:
                    </Text>
                    {[
                      "Complete the payment in the new tab that just opened",
                      "Come back to this tab when done",
                      "Tap the green button below to activate your account",
                    ].map((step, i) => (
                      <View key={i} style={{
                        flexDirection: "row", gap: 10, marginBottom: i < 2 ? 8 : 0,
                      }}>
                        <View style={{
                          width: 22, height: 22, borderRadius: 11,
                          backgroundColor: "#1A56DB", alignItems: "center", justifyContent: "center",
                        }}>
                          <Text style={{
                            fontFamily: fonts.black, fontSize: 11, color: "#fff",
                          }}>{i + 1}</Text>
                        </View>
                        <Text style={{
                          flex: 1, fontFamily: fonts.regular, fontSize: 13,
                          color: "#0F172A", lineHeight: 20,
                        }}>{step}</Text>
                      </View>
                    ))}
                  </View>
 
                  {/* Retry open link */}
                  <TouchableOpacity
                    onPress={() => window.open(paymentUrl, "_blank")}
                    style={{ marginBottom: 16, alignItems: "center" }}
                    activeOpacity={0.7}>
                    <Text style={{
                      fontFamily: fonts.semibold, fontSize: 13, color: "#1A56DB",
                    }}>
                      Tab didn't open? Tap here to retry ↗
                    </Text>
                  </TouchableOpacity>
 
                  {error && (
                    <View style={sm.errorBox}>
                      <Text style={sm.errorTxt}>⚠️ {error}</Text>
                    </View>
                  )}
 
                  {/* Main CTA */}
                  <TouchableOpacity
                    style={[sm.payBtn, { backgroundColor: "#10B981" }]}
                    onPress={() => verifyAndActivate(reference)}
                    activeOpacity={0.85}>
                    <Text style={sm.payBtnTxt}>✅  I've completed payment</Text>
                  </TouchableOpacity>
                </>
              )}
 
              <Text style={sm.hint}>
                Secured by Paystack · One-time fee · No recurring charges
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
 
  // ── MOBILE: WebView screen ─────────────────────────────────────────────
  if (!isWeb && paymentUrl) {
    const { WebView } = require("react-native-webview");
    return (
      <Modal visible={true} animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#fff" }}>
          <View style={{
            flexDirection: "row", alignItems: "center",
            paddingTop: Platform.OS === "ios" ? 56 : 40,
            paddingHorizontal: 16, paddingBottom: 12,
            borderBottomWidth: 1, borderBottomColor: "#E2E8F0",
          }}>
            <TouchableOpacity
              onPress={() => { setPaymentUrl(null); setError(null); }}
              style={{ marginRight: 16 }}
              activeOpacity={0.7}>
              <Text style={{ fontSize: 16, color: "#64748B" }}>✕ Cancel</Text>
            </TouchableOpacity>
            <Text style={{
              fontFamily: fonts.bold, fontSize: 16, color: "#0F172A", flex: 1,
            }}>
              Secure Payment · Paystack
            </Text>
            {verifying && <ActivityIndicator color="#1A56DB" />}
          </View>
 
          <WebView
            source={{ uri: paymentUrl }}
            onNavigationStateChange={handleWebViewNav}
            startInLoadingState
            renderLoading={() => (
              <View style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
              }}>
                <ActivityIndicator size="large" color="#1A56DB" />
                <Text style={{ marginTop: 12, color: "#64748B", fontSize: 14 }}>
                  Loading payment page...
                </Text>
              </View>
            )}
          />
 
          {verifying ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator color="#1A56DB" />
              <Text style={{ marginTop: 8, color: "#64748B", fontSize: 13 }}>
                Activating your account...
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => verifyAndActivate(reference)}
              style={{
                margin: 16, backgroundColor: "#10B981",
                borderRadius: 14, height: 52,
                alignItems: "center", justifyContent: "center",
              }}
              activeOpacity={0.85}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#fff" }}>
                ✅  I've completed payment
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    );
  }
 
  // ── Summary sheet (before payment) ────────────────────────────────────
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={sm.overlay}>
        <View style={sm.sheet}>
          <View style={sm.handle} />
          <View style={sm.header}>
            <View>
              <Text style={sm.title}>Activate Account · $3.00</Text>
              <Text style={sm.sub}>One-time · Secured by Paystack</Text>
            </View>
            <TouchableOpacity style={sm.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={{ fontSize: 18, color: "#64748B" }}>✕</Text>
            </TouchableOpacity>
          </View>
 
          <View style={sm.body}>
            {[
              { lbl: "Registration Fee",  val: "$3.00",  color: "#0F172A" },
        
            ].map((row, i) => (
              <View key={i} style={sm.summaryRow}>
                <Text style={sm.summaryLbl}>{row.lbl}</Text>
                <Text style={[sm.summaryVal, { color: row.color }]}>{row.val}</Text>
              </View>
            ))}
            {/* <View style={[sm.summaryRow, {
              borderTopWidth: 1, borderTopColor: "#E2E8F0",
              marginTop: 10, paddingTop: 10,
            }]}>
              <Text style={[sm.summaryLbl, { fontFamily: fonts.bold, color: "#0F172A" }]}>
                Min. Withdrawal
              </Text>
              <Text style={[sm.summaryVal, { color: "#1A56DB" }]}>$3.50.00</Text>
            </View> */}
 
            {error && (
              <View style={sm.errorBox}>
                <Text style={sm.errorTxt}>⚠️ {error}</Text>
              </View>
            )}
 
            <TouchableOpacity
              style={[sm.payBtn, loading && { opacity: 0.7 }]}
              onPress={handlePay}
              disabled={loading}
              activeOpacity={0.85}>
              <Text style={sm.payBtnTxt}>
                {loading ? "Opening Paystack..." : "Pay $3.00 with Paystack"}
              </Text>
            </TouchableOpacity>
            <Text style={sm.hint}>
              Secured by Paystack · One-time fee · No recurring charges
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const sm = StyleSheet.create({
  overlay:    { flex:1, backgroundColor:"rgba(0,0,0,0.55)", justifyContent:"flex-end" },
  sheet:      { backgroundColor:C.white, borderTopLeftRadius:28, borderTopRightRadius:28, paddingBottom:Platform.OS==="ios"?40:28 },
  handle:     { width:40, height:4, backgroundColor:C.border, borderRadius:2, alignSelf:"center", marginTop:12 },
  header:     { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border },
  title:      { fontFamily:fonts.bold, fontSize:17, color:C.dark },
  sub:        { fontFamily:fonts.regular, fontSize:12, color:C.muted, marginTop:2 },
  closeBtn:   { width:36, height:36, borderRadius:18, backgroundColor:C.light, alignItems:"center", justifyContent:"center" },
  body:       { padding:20 },
  summaryRow: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingVertical:6 },
  summaryLbl: { fontFamily:fonts.medium, fontSize:14, color:C.muted },
  summaryVal: { fontFamily:fonts.bold, fontSize:14, color:C.dark },
  errorBox:   { backgroundColor:"#FFF5F5", borderRadius:12, padding:12, marginBottom:16, borderWidth:1, borderColor:"#FECACA" },
  errorTxt:   { fontFamily:fonts.medium, fontSize:13, color:C.red, textAlign:"center" },
  payBtn:     { backgroundColor:"#00C3F7", borderRadius:14, height:54, alignItems:"center", justifyContent:"center", marginBottom:14 },
  payBtnTxt:  { fontFamily:fonts.bold, fontSize:15, color:C.white },
  hint:       { fontFamily:fonts.regular, fontSize:11, color:C.muted, textAlign:"center" },
});

// ── Logout Modal ───────────────────────────────────────────────────────────
const LogoutModal = ({ visible, onConfirm, onCancel }) => (
  <Modal visible={visible} animationType="fade" transparent>
    <View style={lm.overlay}>
      <View style={lm.card}>
        <View style={lm.iconWrap}><Ico.Out sz={26} cl={C.red} /></View>
        <Text style={lm.title}>Log Out?</Text>
        <Text style={lm.desc}>You'll be signed out of your PromoEarn account. Your balance and data are safe.</Text>
        <TouchableOpacity style={lm.confirmBtn} onPress={onConfirm} activeOpacity={0.85}>
          <Text style={lm.confirmTxt}>Yes, Log Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={lm.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
          <Text style={lm.cancelTxt}>Cancel, Stay In</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const lm = StyleSheet.create({
  overlay:    { flex:1, backgroundColor:"rgba(0,0,0,0.5)", alignItems:"center", justifyContent:"center", paddingHorizontal:32 },
  card:       { backgroundColor:"#FFFFFF", borderRadius:24, padding:28, alignItems:"center", width:"100%", shadowColor:"#000", shadowOffset:{width:0,height:12}, shadowOpacity:0.15, shadowRadius:28, elevation:14 },
  iconWrap:   { width:60, height:60, borderRadius:30, backgroundColor:"#FFF5F5", alignItems:"center", justifyContent:"center", marginBottom:16 },
  title:      { fontFamily:fonts.black, fontSize:20, color:"#0F172A", marginBottom:10 },
  desc:       { fontFamily:fonts.regular, fontSize:14, color:"#64748B", textAlign:"center", lineHeight:22, marginBottom:24 },
  confirmBtn: { backgroundColor:"#EF4444", borderRadius:14, height:52, alignItems:"center", justifyContent:"center", width:"100%", marginBottom:10 },
  confirmTxt: { fontFamily:fonts.bold, fontSize:15, color:"#FFFFFF" },
  cancelBtn:  { backgroundColor:"#F8FAFF", borderRadius:14, height:52, alignItems:"center", justifyContent:"center", width:"100%", borderWidth:1.5, borderColor:"#E2E8F0" },
  cancelTxt:  { fontFamily:fonts.bold, fontSize:15, color:"#0F172A" },
});

// ── Balance visibility helpers ─────────────────────────────────────────────
const MASK = "••••••";
const fmtAmt = (val, hidden) => hidden ? MASK : `$${parseFloat(val||0).toFixed(2)}`;

// ── PIN Modal (setup & verify) ─────────────────────────────────────────────
/**
 * mode = "setup"  → user creates a 4-digit PIN (shown when no PIN exists yet)
 * mode = "verify" → user enters existing PIN to reveal balance
 */
const PinModal = ({ visible, mode, onSuccess, onClose, userId }) => {
  const [pin,        setPin]        = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step,       setStep]       = useState("enter"); // "enter" | "confirm"
  const [error,      setError]      = useState("");
  const [shaking,    setShaking]    = useState(false);

  // Reset every time modal opens
  useEffect(() => {
    if (visible) { setPin(""); setConfirmPin(""); setStep("enter"); setError(""); }
  }, [visible]);

  const storageKey = `pe_pin_${userId}`;

  const shake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleDigit = async (d) => {
    setError("");
    if (mode === "setup") {
      if (step === "enter") {
        const next = pin + d;
        setPin(next);
        if (next.length === 4) setStep("confirm");
      } else {
        const next = confirmPin + d;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next !== pin) {
            setError("PINs don't match. Try again.");
            shake();
            setTimeout(() => { setConfirmPin(""); setStep("enter"); setPin(""); }, 600);
          } else {
            try { await AsyncStorage.setItem(storageKey, pin); } catch {}
            onSuccess();
          }
        }
      }
    } else {
      const next = pin + d;
      setPin(next);
      if (next.length === 4) {
        let saved = "";
        try { saved = await AsyncStorage.getItem(storageKey) || ""; } catch {}
        if (next === saved) {
          onSuccess();
        } else {
          setError("Wrong PIN. Try again.");
          shake();
          setTimeout(() => setPin(""), 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setError("");
    if (mode === "setup" && step === "confirm") {
      setConfirmPin(prev => prev.slice(0,-1));
    } else {
      setPin(prev => prev.slice(0,-1));
    }
  };

  const currentVal = mode === "setup" && step === "confirm" ? confirmPin : pin;

  const DIGITS = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];

  const title  = mode === "setup"
    ? (step === "enter" ? "Create a PIN" : "Confirm your PIN")
    : "Enter your PIN";
  const subtitle = mode === "setup"
    ? (step === "enter" ? "Choose a 4-digit PIN to protect your balance" : "Re-enter your PIN to confirm")
    : "Enter your 4-digit PIN to reveal your balance";

  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.65)", alignItems:"center", justifyContent:"center", paddingHorizontal:32 }}>
        <View style={[
          { backgroundColor:C.white, borderRadius:28, padding:28, width:"100%", alignItems:"center", shadowColor:"#000", shadowOffset:{width:0,height:16}, shadowOpacity:0.2, shadowRadius:32, elevation:16 },
          shaking && { transform:[{translateX:8}] }, // quick flash — real shake needs Animated
        ]}>
          {/* Close */}
          <TouchableOpacity onPress={onClose} style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:16, backgroundColor:C.light, alignItems:"center", justifyContent:"center" }}>
            <Text style={{ fontSize:16, color:C.muted }}>✕</Text>
          </TouchableOpacity>

          {/* Lock icon */}
          <View style={{ width:60, height:60, borderRadius:30, backgroundColor:C.blueSoft, alignItems:"center", justifyContent:"center", marginBottom:16 }}>
            <Text style={{ fontSize:28 }}>{mode==="setup" ? "🔐" : "🔒"}</Text>
          </View>

          <Text style={{ fontFamily:fonts.black, fontSize:20, color:C.dark, marginBottom:6 }}>{title}</Text>
          <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, textAlign:"center", marginBottom:24, lineHeight:19 }}>{subtitle}</Text>

          {/* Dot indicators */}
          <View style={{ flexDirection:"row", gap:14, marginBottom:8 }}>
            {[0,1,2,3].map(i => (
              <View key={i} style={{ width:14, height:14, borderRadius:7,
                backgroundColor: currentVal.length > i ? C.blue : C.border,
                transform:[{scale: currentVal.length === i ? 1.15 : 1}],
              }}/>
            ))}
          </View>

          {/* Error */}
          {error ? (
            <Text style={{ fontFamily:fonts.medium, fontSize:12, color:C.red, marginTop:8, marginBottom:4 }}>⚠️ {error}</Text>
          ) : <View style={{ height:24 }}/>}

          {/* Numpad */}
          <View style={{ width:"100%", gap:10, marginTop:8 }}>
            {DIGITS.map((row, ri) => (
              <View key={ri} style={{ flexDirection:"row", gap:10 }}>
                {row.map((d, di) => (
                  <TouchableOpacity key={di}
                    onPress={() => d === "⌫" ? handleDelete() : d !== "" ? handleDigit(d) : null}
                    activeOpacity={d===""?1:0.7}
                    style={{ flex:1, height:58, borderRadius:16, backgroundColor:d===""?C.white:d==="⌫"?"#FFF5F5":C.light, alignItems:"center", justifyContent:"center", borderWidth:d===""?0:1.5, borderColor:d==="⌫"?"#FECACA":C.border }}>
                    <Text style={{ fontFamily:fonts.bold, fontSize:d==="⌫"?20:22, color:d==="⌫"?C.red:C.dark }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>

          {mode === "verify" && (
            <TouchableOpacity onPress={onClose} style={{ marginTop:18 }}>
              <Text style={{ fontFamily:fonts.medium, fontSize:13, color:C.muted }}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCREENS
// ══════════════════════════════════════════════════════════════════════════
function HomeScreen({ user, setUser, onTabChange, onUpgrade, onRefresh, refreshing, onBellPress, unreadCount, balanceHidden, onToggleHide, C, language, t }) {
  const [tasks,        setTasks]        = useState([]);
  const [leaders,      setLeaders]      = useState([]);
  // const [completedIds, setCompletedIds] = useState([]);
  const [showAllLeaders, setShowAllLeaders] = useState(false);
  const [completedIds, setCompletedIds] = useState([]);

useEffect(() => {
  AsyncStorage.getItem("pe_completed_tasks").then(raw => {
    if (raw) setCompletedIds(JSON.parse(raw));
  });
}, []);

const markTaskDone = async (taskId) => {
  const updated = [...completedIds, taskId];
  setCompletedIds(updated);
  await AsyncStorage.setItem("pe_completed_tasks", JSON.stringify(updated));
};
 
  const storageKey = `pe_completed_${user?.uid}`;
 
  // ── Load completed IDs from localStorage ──────────────────────────────────
  // ── Load completed IDs from AsyncStorage ──────────────────────────────────
  const loadCompletedIds = async () => {
    try {
      const stored = await AsyncStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  };

  // ── Save a newly completed task ID ────────────────────────────────────────
  const saveCompletedId = async (id) => {
    try {
      const current = await loadCompletedIds();
      const updated = [...new Set([...current, id])];
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      setCompletedIds(updated);
    } catch {}
  };

  // ── Fetch tasks AND merge with AsyncStorage completedIds ───────────────────
  const fetchData = async () => {
    const localIds = await loadCompletedIds();
    setCompletedIds(localIds);

    try {
      const [tasksRes, leadersRes] = await Promise.all([
        api("/tasks"),
        fetch(`${BASE_URL}/leaderboard`).then(r => r.json()),
      ]);

      if (tasksRes.success) {
        const fetchedTasks = tasksRes.data.tasks;
        const backendCompletedIds = fetchedTasks
          .filter(t => t.status === "completed" || t.userCompleted === true)
          .map(t => t.id);
        const mergedIds = [...new Set([...localIds, ...backendCompletedIds])];
        try { await AsyncStorage.setItem(storageKey, JSON.stringify(mergedIds)); } catch {}
        setCompletedIds(mergedIds);
        setTasks(fetchedTasks);
      }

      if (leadersRes.success) setLeaders(leadersRes.data.leaders);

    } catch (err) {
      console.error("Home fetch error:", err);
    }
  };                  // ← this closes fetchData

  useEffect(() => {   // ← this comes after
    fetchData();
  }, []);
 
  // ── Re-fetch when user changes (e.g. after task completion) ───────────────
  useEffect(() => {
    if (user?.uid) {
      const localIds = loadCompletedIds();
      setCompletedIds(localIds);
    }
  }, [user?.uid]);
 
  const getGreeting = () => {
    const now  = new Date();
    const hour = now.getHours();
    const day  = now.getDay();
    const dayGreetings = {
      0: ["Happy Sunday! Rest up 😌", "Sunday Funday! 🌟", "Enjoy your Sunday ☀️"],
      1: ["Happy Monday! Let's go 💪", "New week, new wins! 🚀", "Monday motivation! ⚡"],
      2: ["Happy Tuesday! Keep pushing 🔥", "Tuesday grind! 💼", "Making moves on Tuesday 📈"],
      3: ["Happy Wednesday! Halfway there 🎯", "Hump day hustle! 💰", "Wednesday wins! ✨"],
      4: ["Happy Thursday! Almost there 🏁", "Thursday grind! 💪", "Thursday earnings incoming 💸"],
      5: ["Happy Friday! Weekend's near 🎉", "TGIF! Let's earn big 💰", "Friday vibes! 🔥"],
      6: ["Happy Saturday! 🎊", "Weekend warrior mode 💪", "Saturday = earn day! 🚀"],
    };
    const timeGreeting =
      hour < 5  ? "Up early, let's earn! 🌙"
      : hour < 12 ? "Good Morning"
      : hour < 17 ? "Good Afternoon"
      : hour < 21 ? "Good Evening"
      : "Good Night 🌙";
    const options = dayGreetings[day];
    const dayMsg  = options[Math.floor(Math.random() * options.length)];
    return `${timeGreeting} · ${dayMsg}`;
  };
 
  const getDateTime = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    return `${dateStr} · ${timeStr}`;
  };
 
  const handleStart = async (task, onDone) => {
    try {
      const res = await api(`/tasks/${task.id}/complete`, { method: "POST" });
      if (res.success) {
        saveCompletedId(task.id);
        const userRes = await AuthService.getMe();
        if (userRes.success) setUser && setUser(userRes.data.user);
        Alert.alert("🎉 " + t("taskComplete"), `+$${parseFloat(task.reward).toFixed(2)} ${t("addedToBalance")}`);
      } else {
        Alert.alert("Oops", res.message);
      }
    } catch {
      Alert.alert("Error", "Failed to complete task.");
    } finally {
      if (onDone) onDone();
    }
  };
 
  const myRank = leaders.findIndex(l => l.uid === user?.uid);
 
  return (
    <ScrollView
      style={[s.screen, { backgroundColor: C.bg }]}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.blue} />}
    >
      {/* Header */}
      <View style={[s.header, { backgroundColor: C.bg }]}>
        <View style={{ flex: 1 }}>
          <Text style={[s.greet, { color: C.muted }]}>{getGreeting()}</Text>
          <Text style={[s.name, { color: C.dark }]}>{user?.firstName} {user?.lastName}</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.slate, marginTop: 3 }}>
            {getDateTime()}
          </Text>
        </View>
        {(user?.isActivated || user?.isAdmin) && (
          <View style={[s.premBadge, { backgroundColor: C.card }]}>
            <Ico.Crown sz={12} />
            <Text style={[s.premBadgeTxt, { color: C.gold }]}>Active</Text>
          </View>
        )}
        <TouchableOpacity style={[s.bellBtn, { backgroundColor: C.card }]} onPress={onBellPress}>
          <Ico.Bell cl={C.dark} />
          {unreadCount > 0 && (
            <View style={[s.bellDot, { minWidth: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 }]}>
              <Text style={{ fontFamily: fonts.black, fontSize: 9, color: "#FFFFFF" }}>
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
 
      {/* Balance card */}
      <View style={{ marginHorizontal: 16, marginBottom: 18 }}>
        <View style={s.balCard}>
          <View style={{ ...StyleSheet.absoluteFillObject, borderRadius: 24, backgroundColor: C.blue, overflow: "hidden" }}>
            <View style={{ position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "#3B82F6", opacity: 0.4, top: -60, right: -40 }} />
            <View style={{ position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: "#06B6D4", opacity: 0.3, bottom: -30, left: 20 }} />
          </View>
          <Text style={s.balLabel}>{t("availableBalance")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 2 }}>
            <Text style={[s.balAmt, balanceHidden && { letterSpacing: 6, fontSize: 32 }]}>
              {fmtAmt(user?.balance, balanceHidden)}
            </Text>
            <TouchableOpacity onPress={onToggleHide} activeOpacity={0.75}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" }}>
              {balanceHidden
                ? <Ico.EyeOff sz={24} cl="#FFFFFF" />
                : <Ico.Eye sz={24} cl="#FFFFFF" />
              }
            </TouchableOpacity>
          </View>
          <Text style={s.balSub}>{t("totalEarned")}: {fmtAmt(user?.totalEarned, balanceHidden)}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
            <TouchableOpacity style={s.balBtn} onPress={() => onTabChange("wallet")}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: C.blue }}>{t("withdraw")}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.balBtn, { backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" }]}
              onPress={() => onTabChange("wallet")}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#FFFFFF", opacity: 0.9 }}>{t("history")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
 
      {/* Stats row */}
      <View style={{ flexDirection: "row", gap: 10, marginHorizontal: 16, marginBottom: 18 }}>
        {[
          { label: t("tasksDone"), val: balanceHidden ? MASK : (user?.tasksCompleted || 0), icon: <Ico.Promo sz={15} cl={C.blue} />, color: C.blue },
          { label: t("referrals"), val: balanceHidden ? MASK : (user?.referralsCount || 0), icon: <Ico.Refer sz={15} cl={C.green} />, color: C.green },
          { label: t("rank"), val: balanceHidden ? MASK : (myRank >= 0 ? `#${myRank + 1}` : "—"), icon: <Ico.Trophy sz={15} />, color: C.gold },
        ].map((st, i) => (
          <View key={i} style={[s.statCard, { borderTopColor: st.color, backgroundColor: C.card }]}>
            <View style={[s.statIcon, { backgroundColor: st.color + "18" }]}>{st.icon}</View>
            <Text style={[s.statVal, { color: C.dark }, balanceHidden && { fontSize: 14, letterSpacing: 2 }]}>{st.val}</Text>
            <Text style={[s.statLbl, { color: C.muted }]}>{st.label}</Text>
          </View>
        ))}
      </View>
 
      {/* Activation upsell */}
      {!(user?.isActivated || user?.isAdmin) && (
        <TouchableOpacity onPress={onUpgrade} activeOpacity={0.9} style={{ marginHorizontal: 16, marginBottom: 18 }}>
          <View style={s.upsell}>
            <View style={{ ...StyleSheet.absoluteFillObject, borderRadius: 18, backgroundColor: C.bg === "#FFFFFF" ? "#0F172A" : "#1E293B", overflow: "hidden" }}>
              <View style={{ position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: C.gold, opacity: 0.12, top: -40, right: -20 }} />
            </View>
            <Ico.Crown sz={22} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#FFFFFF" }}>{t("activateAccount")}</Text>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>{t("activateSubtitle")}</Text>
            </View>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.gold, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: C.dark, fontWeight: "800" }}>→</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}
 
      {/* Tasks preview */}
      <View style={{ paddingHorizontal: 16, marginBottom: 18 }}>
        <SH title={t("latestTasks")} action={`${t("promoSpace")} →`} onAction={() => onTabChange("promo")} C={C} />
        {!(user?.isActivated || user?.isAdmin)
          ? FAKE_TASKS.slice(0, 3).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                locked={true}
                completedIds={[]}
                onStart={() => {}}
              />
            ))
          : tasks.slice(0, 3).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                locked={false}
                completedIds={completedIds}
                onStart={handleStart}
              />
            ))
        }
        {(user?.isActivated || user?.isAdmin) && tasks.length === 0 && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, textAlign: "center", paddingVertical: 20 }}>
            {t("noTasksYet")}
          </Text>
        )}
      </View>
 
      {/* Leaderboard */}
      <View style={{ paddingHorizontal: 16 }}>
        <SH title={t("topEarners")} C={C} />
        <View style={[s.lbBox, { backgroundColor: C.card }]}>
        {leaders.slice(0, 3).map((u, i) => {
            const isMe = u.uid === user?.uid;
            return (
              <View key={u.uid} style={[
                s.lbRow,
                i < Math.min(leaders.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: C.border },
                isMe && { backgroundColor: C.blue + "18" },
              ]}>
                <Text style={[s.lbRank, { color: C.muted }, i === 0 && { color: C.gold }, i === 1 && { color: "#94A3B8" }, i === 2 && { color: "#CD7F32" }]}>#{u.rank}</Text>
                <View style={[s.lbAv, isMe && { backgroundColor: C.blue + "25" }]}>
                  <Text style={[s.lbAvTxt, { color: C.blue }]}>{u.firstName?.[0]}{u.lastName?.[0]}</Text>
                </View>
                <Text style={[s.lbName, { color: C.dark }, isMe && { color: C.blue, fontFamily: fonts.bold }]}>
                  {u.username}{isMe ? " (you)" : ""}
                </Text>
                <Text style={[s.lbEarned, { color: C.green }]}>${u.totalEarned.toFixed(2)}</Text>
                {i === 0 && <Ico.Trophy />}
              </View>
            );
          })}
          {leaders.length === 0 && (
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, textAlign: "center", padding: 20 }}>
              {t("noDataYet")}
            </Text>
          )}
          {leaders.length > 3 && (
  <TouchableOpacity
    onPress={() => setShowAllLeaders(true)}
    style={{ alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.border }}
    activeOpacity={0.8}>
    <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: C.blue }}>
      See All Top 15 →
    </Text>
  </TouchableOpacity>
)}
        </View>
      </View>
      <Modal visible={showAllLeaders} animationType="slide" transparent>
  <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"flex-end" }}>
    <View style={{ backgroundColor:C.white, borderTopLeftRadius:28, borderTopRightRadius:28, maxHeight:"85%", paddingBottom: Platform.OS==="ios" ? 44 : 28 }}>
      <View style={{ width:40, height:4, backgroundColor:C.border, borderRadius:2, alignSelf:"center", marginTop:12, marginBottom:4 }}/>
      <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border }}>
        <Text style={{ fontFamily:fonts.black, fontSize:18, color:C.dark }}>Top 15 Earners</Text>
        <TouchableOpacity onPress={() => setShowAllLeaders(false)}>
          <Text style={{ fontSize:18, color:C.muted }}>✕</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal:20, paddingTop:16, paddingBottom:40 }}>
        {leaders.slice(0, 15).map((u, i) => {
          const isMe = u.uid === user?.uid;
          return (
            <View key={u.uid} style={[
              s.lbRow,
              i < Math.min(leaders.length, 15) - 1 && { borderBottomWidth:1, borderBottomColor:C.border },
              isMe && { backgroundColor: C.blue + "18" },
            ]}>
              <Text style={[s.lbRank, { color:C.muted }, i===0&&{color:C.gold}, i===1&&{color:"#94A3B8"}, i===2&&{color:"#CD7F32"}]}>#{u.rank}</Text>
              <View style={[s.lbAv, isMe && { backgroundColor:C.blue+"25" }]}>
                <Text style={[s.lbAvTxt, { color:C.blue }]}>{u.firstName?.[0]}{u.lastName?.[0]}</Text>
              </View>
              <Text style={[s.lbName, { color:C.dark }, isMe&&{color:C.blue, fontFamily:fonts.bold}]}>
                {u.username}{isMe ? " (you)" : ""}
              </Text>
              <Text style={[s.lbEarned, { color:C.green }]}>${u.totalEarned.toFixed(2)}</Text>
              {i === 0 && <Ico.Trophy />}
            </View>
          );
        })}
      </ScrollView>
    </View>
  </View>
</Modal>
    </ScrollView>
  );
}
 


// ── Withdrawal PIN Modal ───────────────────────────────────────────────────
function WithdrawalPinModal({ visible, mode, onSuccess, onClose, userId, C }) {
  const [pin,        setPin]        = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step,       setStep]       = useState("enter");
  const [error,      setError]      = useState("");

  useEffect(() => {
    if (visible) { setPin(""); setConfirmPin(""); setStep("enter"); setError(""); }
  }, [visible]);

  const storageKey = `pe_withdraw_pin_${userId}`;

  const handleDigit = async (d) => {
    setError("");
    if (mode === "setup") {
      if (step === "enter") {
        const next = pin + d;
        setPin(next);
        if (next.length === 4) setStep("confirm");
      } else {
        const next = confirmPin + d;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next !== pin) {
            setError("PINs don't match. Try again.");
            setTimeout(() => { setConfirmPin(""); setStep("enter"); setPin(""); }, 600);
          } else {
            try { await AsyncStorage.setItem(storageKey, pin); } catch {}
            onSuccess();
          }
        }
      }
    } else {
      const next = pin + d;
      setPin(next);
      if (next.length === 4) {
        let saved = "";
        try { saved = await AsyncStorage.getItem(storageKey) || ""; } catch {}
        if (next === saved) {
          onSuccess();
        } else {
          setError("Wrong PIN. Try again.");
          setTimeout(() => setPin(""), 600);
        }
      }
    }
  };
  const handleDelete = () => {
    setError("");
    if (mode === "setup" && step === "confirm") {
      setConfirmPin(prev => prev.slice(0,-1));
    } else {
      setPin(prev => prev.slice(0,-1));
    }
  };

  const currentVal = mode === "setup" && step === "confirm" ? confirmPin : pin;
  const DIGITS = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];

  const title = mode === "setup"
    ? (step === "enter" ? "Create Withdrawal PIN" : "Confirm your PIN")
    : "Enter Withdrawal PIN";
  const subtitle = mode === "setup"
    ? (step === "enter" ? "Set a 4-digit PIN to secure your withdrawals" : "Re-enter your PIN to confirm")
    : "Enter your PIN to authorize this withdrawal";

  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.65)", alignItems:"center", justifyContent:"center", paddingHorizontal:28 }}>
        <View style={{ backgroundColor:C.card, borderRadius:28, padding:28, width:"100%", alignItems:"center" }}>
          <TouchableOpacity onPress={onClose}
            style={{ position:"absolute", top:16, right:16, width:32, height:32, borderRadius:16, backgroundColor:C.input, alignItems:"center", justifyContent:"center" }}>
            <Text style={{ fontSize:16, color:C.muted }}>✕</Text>
          </TouchableOpacity>

          <View style={{ width:60, height:60, borderRadius:30, backgroundColor:C.blue+"20", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
            <Text style={{ fontSize:28 }}>{mode==="setup" ? "🔐" : "🔒"}</Text>
          </View>
          <Text style={{ fontFamily:fonts.black, fontSize:20, color:C.dark, marginBottom:6 }}>{title}</Text>
          <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, textAlign:"center", marginBottom:24 }}>{subtitle}</Text>

          {/* Dots */}
          <View style={{ flexDirection:"row", gap:14, marginBottom:8 }}>
            {[0,1,2,3].map(i => (
              <View key={i} style={{ width:14, height:14, borderRadius:7,
                backgroundColor: currentVal.length > i ? C.blue : C.border }}/>
            ))}
          </View>
          {error ? <Text style={{ fontFamily:fonts.medium, fontSize:12, color:C.red, marginTop:8, marginBottom:4 }}>⚠️ {error}</Text> : <View style={{ height:24 }}/>}

          {/* Numpad */}
          <View style={{ width:"100%", gap:10, marginTop:8 }}>
            {DIGITS.map((row, ri) => (
              <View key={ri} style={{ flexDirection:"row", gap:10 }}>
                {row.map((d, di) => (
                  <TouchableOpacity key={di}
                    onPress={() => d === "⌫" ? handleDelete() : d !== "" ? handleDigit(d) : null}
                    activeOpacity={d===""?1:0.7}
                    style={{ flex:1, height:58, borderRadius:16,
                      backgroundColor: d==="" ? "transparent" : d==="⌫" ? "#FFF5F5" : C.input,
                      alignItems:"center", justifyContent:"center",
                      borderWidth: d===""?0:1.5,
                      borderColor: d==="⌫" ? "#FECACA" : C.border }}>
                    <Text style={{ fontFamily:fonts.bold, fontSize:d==="⌫"?20:22, color:d==="⌫"?C.red:C.dark }}>{d}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Withdraw Form ──────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// STEP 1: Add this import at the very top of MainApp.jsx with the other imports:
//
//   import { loadSavedAccounts } from "./PayoutMethodsscreen";
//
// STEP 2: Replace the entire WithdrawForm function in MainApp.jsx with the
//         function below.
//
// STEP 3: In ProfileScreen inside MainApp.jsx, make sure PayoutMethodsScreen
//         receives the user prop:
//
//   <PayoutMethodsScreen visible={showPayout} onClose={() => setShowPayout(false)} user={user} darkMode={darkMode} />
//
// ─────────────────────────────────────────────────────────────────────────────

function WithdrawForm({ user, C, t, onSuccess, onCancel }) {
  const [step,           setStep]           = useState("pin");
  const [savedAccounts,  setSavedAccounts]  = useState([]);
  const [loadingAccounts,setLoadingAccounts]= useState(true);
  const [selectedSaved,  setSelectedSaved]  = useState(null); // chosen saved account or null
  const [showSavedList,  setShowSavedList]  = useState(false);

  // Manual-entry state (used when no saved account selected)
  const [banks,          setBanks]          = useState([]);
  const [loadingBanks,   setLoadingBanks]   = useState(false);
  const [bankSearch,     setBankSearch]     = useState("");
  const [showBankList,   setShowBankList]   = useState(false);
  const [selectedBank,   setSelectedBank]   = useState(null);
  const [accountNumber,  setAccountNumber]  = useState("");
  const [accountName,    setAccountName]    = useState("");
  const [verifying,      setVerifying]      = useState(false);

  const [amount,         setAmount]         = useState("");
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState("");
  const [pinMode,        setPinMode]        = useState("setup");
  const [showPin,        setShowPin]        = useState(true);

  const WITHDRAWAL_FEE = 200 / 1500;  // ₦200 = ~$0.13
  const NGN_RATE       = 1500;
  const withdrawAmt    = parseFloat(amount) || 0;
  const youReceive     = withdrawAmt > 0 ? Math.max(0, withdrawAmt - WITHDRAWAL_FEE) : 0;
  const nairaEquiv     = youReceive * NGN_RATE;

  const pinStorageKey  = `pe_withdraw_pin_${user?.uid}`;
  const hasPin = async () => { try { return !!(await AsyncStorage.getItem(pinStorageKey)); } catch { return false; } };

  // ── On mount ──────────────────────────────────────────────────────────────
  useEffect(() => {
    hasPin().then(exists => setPinMode(exists ? "verify" : "setup"));
    fetchBanks();

    // Load saved payout accounts
    loadSavedAccounts(user?.uid).then((accs) => {
      setSavedAccounts(accs);
      // Auto-select default account
      const def = accs.find(a => a.isDefault) || (accs.length > 0 ? accs[0] : null);
      if (def) applyAccount(def);
      setLoadingAccounts(false);
    });
  }, []);

  const fetchBanks = async () => {
    setLoadingBanks(true);
    try {
      const res = await api("/payments/banks");
      if (res.success) setBanks(res.data.banks);
    } catch {}
    finally { setLoadingBanks(false); }
  };

  // Apply a saved account — fills all account fields instantly, no verification needed
  const applyAccount = (acc) => {
    setSelectedSaved(acc);
    setAccountNumber(acc.accountNumber);
    setAccountName(acc.accountName);
    setSelectedBank({ name: acc.bankName, code: acc.bankCode || "" });
    setError("");
  };

  // Clear back to manual entry
  const clearAccount = () => {
    setSelectedSaved(null);
    setAccountNumber("");
    setAccountName("");
    setSelectedBank(null);
    setError("");
  };

  const handlePinSuccess = () => {
    setShowPin(false);
    setStep("form");
  };

  // Auto-verify when 10 digits + bank selected (manual mode only)
  useEffect(() => {
    if (selectedSaved) return; // skip — already have account name from saved
    if (accountNumber.length === 10 && selectedBank?.code) {
      handleVerifyAccount();
    } else {
      setAccountName("");
    }
  }, [accountNumber, selectedBank]);

  const handleVerifyAccount = async () => {
    setVerifying(true); setError(""); setAccountName("");
    try {
      const res = await api("/payments/verify-account", {
        method: "POST",
        body:   { accountNumber, bankCode: selectedBank.code },
      });
      if (res.success) {
        setAccountName(res.data.accountName);
      } else {
        setError(res.message || "Account not found. Check the details.");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSubmit = async () => {
    setError("");
    const amt = parseFloat(amount);
    if (!amt || amt < 3.50)            { setError("Minimum withdrawal is $3.50."); return; }
    if (!accountName)                  { setError("Please verify your account first."); return; }
    if ((user?.balance || 0) < amt)    { setError("Insufficient balance."); return; }

    setSubmitting(true);
    try {
      const res = await api("/payments/withdraw", {
        method: "POST",
        body: {
          amount:        amt,
          accountNumber,
          bankCode:      selectedBank?.code || "",
          bankName:      selectedBank?.name || "",
          accountName,
        },
      });
      if (res.success) {
        setStep("done");
      } else {
        setError(res.message || "Withdrawal failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBanks = banks.filter(b =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const mask = (num) => num ? `${"•".repeat(num.length - 4)}${num.slice(-4)}` : "";

  // ── PIN gate ──────────────────────────────────────────────────────────────
  if (showPin) {
    return (
      <WithdrawalPinModal
        visible={showPin}
        mode={pinMode}
        userId={user?.uid}
        C={C}
        onSuccess={handlePinSuccess}
        onClose={onCancel}
      />
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <View style={{ marginHorizontal: 16, marginBottom: 20, backgroundColor: C.card, borderRadius: 20, padding: 28, alignItems: "center" }}>
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "#F0FDF4", alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: 2, borderColor: C.green }}>
          <Text style={{ fontSize: 36 }}>✅</Text>
        </View>
        <Text style={{ fontFamily: fonts.black, fontSize: 22, color: C.dark, textAlign: "center", marginBottom: 8 }}>Withdrawal Submitted!</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, textAlign: "center", lineHeight: 22, marginBottom: 8 }}>
          <Text style={{ fontFamily: fonts.bold, color: C.green }}>${youReceive.toFixed(2)}</Text> (₦{nairaEquiv.toLocaleString()}) will be sent to
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, textAlign: "center", marginBottom: 16 }}>
  Your withdrawal will be processed within 24 hours.
</Text>
        <View style={{ backgroundColor: C.input, borderRadius: 14, padding: 14, width: "100%", marginBottom: 24 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark, textAlign: "center" }}>{accountName}</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted, textAlign: "center", marginTop: 4 }}>
            {selectedBank?.name} · {mask(accountNumber)}
          </Text>
        </View>
        <TouchableOpacity
          style={{ backgroundColor: C.blue, borderRadius: 14, height: 50, alignItems: "center", justifyContent: "center", width: "100%" }}
          onPress={onSuccess} activeOpacity={0.85}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#fff" }}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <View style={{ marginHorizontal: 16, marginBottom: 20, backgroundColor: C.card, borderRadius: 20, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: C.dark }}>Withdraw Funds</Text>
        <TouchableOpacity onPress={onCancel} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.input, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: C.muted, fontSize: 16 }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* ── SAVED ACCOUNTS SECTION ─────────────────────────────────────────── */}
      {loadingAccounts ? (
        <View style={{ paddingVertical: 14, alignItems: "center", marginBottom: 10 }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: C.muted }}>Loading your accounts...</Text>
        </View>
      ) : savedAccounts.length > 0 ? (
        <View style={{ marginBottom: 18 }}>
          <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Payout Account
          </Text>

          {selectedSaved ? (
            // Selected saved account card
            <View style={{ borderRadius: 14, borderWidth: 2, borderColor: C.blue, backgroundColor: C.blue + "0A", padding: 14 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.blue + "20", alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontFamily: fonts.black, fontSize: 13, color: C.blue }}>
                    {selectedSaved.bankName?.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark }}>{selectedSaved.bankName}</Text>
                  <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: C.muted, marginTop: 1 }}>{selectedSaved.accountName}</Text>
                  <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 1, letterSpacing: 1 }}>
                    {mask(selectedSaved.accountNumber)}
                  </Text>
                </View>
                {selectedSaved.isDefault && (
                  <View style={{ backgroundColor: C.blue + "18", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: C.blue }}>Default</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.blue + "20" }}>
                {savedAccounts.length > 1 && (
                  <TouchableOpacity
                    onPress={() => setShowSavedList(true)}
                    style={{ flex: 1, height: 36, borderRadius: 10, backgroundColor: C.blue + "15", alignItems: "center", justifyContent: "center" }}
                    activeOpacity={0.8}>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.blue }}>Change Account</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={clearAccount}
                  style={{ flex: 1, height: 36, borderRadius: 10, backgroundColor: C.input, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: C.border }}
                  activeOpacity={0.8}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: C.muted }}>Enter Manually</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // No saved account chosen — show picker button
            <TouchableOpacity
              onPress={() => setShowSavedList(true)}
              style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.input, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, height: 52, gap: 10 }}
              activeOpacity={0.8}>
              <Text style={{ fontSize: 20 }}>🏦</Text>
              <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 14, color: C.muted }}>
                Choose a saved account
              </Text>
              <Text style={{ color: C.muted, fontSize: 16 }}>›</Text>
            </TouchableOpacity>
          )}

          {/* Divider between saved section and manual section */}
          {!selectedSaved && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 14 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
              <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: C.muted }}>or enter manually below</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: C.border }} />
            </View>
          )}
        </View>
      ) : null}

      {/* ── MANUAL ENTRY — shown only when no saved account is selected ─────── */}
      {!selectedSaved && (
        <>
          {/* Bank Selector */}
          <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Select Bank
          </Text>
          <TouchableOpacity
            onPress={() => setShowBankList(true)}
            style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.input, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, height: 52, marginBottom: 14 }}
            activeOpacity={0.8}>
            <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: selectedBank ? C.dark : C.slate }}>
              {selectedBank ? selectedBank.name : loadingBanks ? "Loading banks..." : "Select your bank"}
            </Text>
            <Text style={{ color: C.muted }}>▼</Text>
          </TouchableOpacity>

          {/* Account Number */}
          <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Account Number
          </Text>
          <View style={[{
            flexDirection: "row", alignItems: "center", backgroundColor: C.input,
            borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, height: 52, marginBottom: 6,
            borderColor: accountName ? C.green : verifying ? C.blue : C.border,
          }]}>
            <TextInput
              style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: C.dark }}
              placeholder="10-digit account number"
              placeholderTextColor={C.slate}
              keyboardType="numeric"
              maxLength={10}
              value={accountNumber}
              onChangeText={v => { setAccountNumber(v.replace(/\D/g, "")); setAccountName(""); setError(""); }}
            />
            {verifying && <ActivityIndicator size="small" color={C.blue} />}
            {accountName ? <Text style={{ fontSize: 16 }}>✅</Text> : null}
          </View>
        </>
      )}

      {/* Account name confirmation row */}
      {accountName ? (
        <View style={{ backgroundColor: C.green + "15", borderRadius: 10, padding: 10, marginBottom: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 16 }}>✅</Text>
          <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: C.green }}>{accountName}</Text>
        </View>
      ) : null}

      {!accountName && !selectedSaved && accountNumber.length === 10 && !verifying ? (
        <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: C.red, marginBottom: 10 }}>
          Account not found. Check your number and bank.
        </Text>
      ) : null}

      {/* ── AMOUNT ─────────────────────────────────────────────────────────── */}
      <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 }}>
        Amount ($)
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.input, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, height: 52, marginBottom: 14 }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: C.muted, marginRight: 6 }}>$</Text>
        <TextInput
          style={{ flex: 1, fontFamily: fonts.medium, fontSize: 16, color: C.dark }}
          placeholder="Min. $3.50"
          placeholderTextColor={C.slate}
          keyboardType="numeric"
          value={amount}
          onChangeText={v => { setAmount(v); setError(""); }}
        />
        {withdrawAmt > 0 && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: C.muted }}>
            ≈ ₦{((withdrawAmt - WITHDRAWAL_FEE) * NGN_RATE).toLocaleString()}
          </Text>
        )}
      </View>

      {/* Fee breakdown */}
      {withdrawAmt >= 3.50 && (
        <View style={{ backgroundColor: C.input, borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: C.dark, marginBottom: 10 }}>Payout Breakdown</Text>
          {[
            { lbl: "You withdraw",      val: `$${withdrawAmt.toFixed(2)}`,      color: C.dark  },
            { lbl: "Processing fee",    val: `– $${WITHDRAWAL_FEE.toFixed(2)}`, color: C.red   },
            { lbl: "You receive (USD)", val: `$${youReceive.toFixed(2)}`,        color: C.green },
            { lbl: "Naira equivalent",  val: `₦${nairaEquiv.toLocaleString()}`,  color: C.blue  },
          ].map((row, i) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderTopWidth: i === 2 ? 1 : 0, borderTopColor: C.border, marginTop: i === 2 ? 4 : 0 }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted }}>{row.lbl}</Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: row.color }}>{row.val}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Error */}
      {error ? (
        <View style={{ backgroundColor: "#FFF5F5", borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: "#FECACA" }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: C.red, textAlign: "center" }}>⚠️ {error}</Text>
        </View>
      ) : null}

      {/* Submit button */}
      <TouchableOpacity
        style={{
          backgroundColor: (!accountName || !amount || parseFloat(amount) < 3.50 || submitting) ? C.border : C.green,
          borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center",
        }}
        onPress={handleSubmit}
        disabled={!accountName || !amount || parseFloat(amount) < 3.50 || submitting}
        activeOpacity={0.85}>
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: (!accountName || !amount || parseFloat(amount) < 3.50) ? C.muted : "#fff" }}>
              {accountName ? `Withdraw $${amount} →` : "Select or verify account first"}
            </Text>
        }
      </TouchableOpacity>

      {/* ── SAVED ACCOUNTS LIST MODAL ──────────────────────────────────────── */}
      <Modal visible={showSavedList} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "75%", paddingBottom: Platform.OS === "ios" ? 44 : 20 }}>
            <View style={{ width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4 }} />
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ fontFamily: fonts.black, fontSize: 18, color: C.dark }}>Choose Account</Text>
              <TouchableOpacity onPress={() => setShowSavedList(false)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.input, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 16, color: C.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
              {savedAccounts.map((acc, i) => (
                <TouchableOpacity
                  key={acc.id}
                  onPress={() => { applyAccount(acc); setShowSavedList(false); }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row", alignItems: "center",
                    paddingHorizontal: 20, paddingVertical: 16, gap: 14,
                    borderBottomWidth: i < savedAccounts.length - 1 ? 1 : 0,
                    borderBottomColor: C.border,
                    backgroundColor: selectedSaved?.id === acc.id ? C.blue + "10" : "transparent",
                  }}>
                  <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: C.blue + "20", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontFamily: fonts.black, fontSize: 14, color: C.blue }}>
                      {acc.bankName?.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: C.dark }}>{acc.bankName}</Text>
                      {acc.isDefault && (
                        <View style={{ backgroundColor: C.blue + "18", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 }}>
                          <Text style={{ fontFamily: fonts.bold, fontSize: 10, color: C.blue }}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: C.muted }}>{acc.accountName}</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: C.muted, marginTop: 1, letterSpacing: 1 }}>
                      {mask(acc.accountNumber)}
                    </Text>
                  </View>
                  {selectedSaved?.id === acc.id && (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.blue, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "#fff", fontSize: 14 }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => { setShowSavedList(false); clearAccount(); }}
              style={{ marginHorizontal: 20, marginTop: 8, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, alignItems: "center", justifyContent: "center" }}
              activeOpacity={0.8}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: C.muted }}>+ Enter account manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── BANK LIST MODAL (manual entry only) ────────────────────────────── */}
      <Modal visible={showBankList} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: C.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: "80%", paddingBottom: Platform.OS === "ios" ? 44 : 20 }}>
            <View style={{ width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 }} />
            <Text style={{ fontFamily: fonts.black, fontSize: 18, color: C.dark, paddingHorizontal: 20, marginBottom: 14 }}>Select Bank</Text>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: C.input, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, marginHorizontal: 20, paddingHorizontal: 14, height: 46, marginBottom: 10 }}>
              <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
              <TextInput
                style={{ flex: 1, fontFamily: fonts.medium, fontSize: 14, color: C.dark }}
                placeholder="Search bank..."
                placeholderTextColor={C.slate}
                value={bankSearch}
                onChangeText={setBankSearch}
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredBanks.map((bank, i) => (
                <TouchableOpacity
                  key={bank.id}
                  onPress={() => { setSelectedBank(bank); setShowBankList(false); setBankSearch(""); }}
                  activeOpacity={0.7}
                  style={{
                    flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 14,
                    borderBottomWidth: i < filteredBanks.length - 1 ? 1 : 0, borderBottomColor: C.border,
                    backgroundColor: selectedBank?.code === bank.code ? C.blue + "12" : "transparent",
                  }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.blue + "20", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ fontFamily: fonts.black, fontSize: 12, color: C.blue }}>{bank.name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <Text style={{ flex: 1, fontFamily: selectedBank?.code === bank.code ? fonts.bold : fonts.medium, fontSize: 14, color: selectedBank?.code === bank.code ? C.blue : C.dark }}>
                    {bank.name}
                  </Text>
                  {selectedBank?.code === bank.code && <Text style={{ color: C.blue }}>✓</Text>}
                </TouchableOpacity>
              ))}
              {filteredBanks.length === 0 && (
                <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: C.muted, textAlign: "center", padding: 24 }}>No banks found</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
// ══════════════════════════════════════════════════════════════════════════
// WALLET SCREEN
// ══════════════════════════════════════════════════════════════════════════
function WalletScreen({ user, onUserUpdate, balanceHidden, onToggleHide, C, language, t }) {
  const [showWithdraw,   setShowWithdraw]   = useState(false);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [transactions,   setTransactions]   = useState([]);
  const [withdrawForm,   setWithdrawForm]   = useState({ amount:"", accountNumber:"", bankName:"" });
  const [submitting,     setSubmitting]     = useState(false);
  const [withdrawn,      setWithdrawn]      = useState(0);

  const withdrawAmt    = parseFloat(withdrawForm.amount) || 0;
  const WITHDRAWAL_FEE = 0.00;
  const youReceive     = withdrawAmt > 0 ? Math.max(0, withdrawAmt - WITHDRAWAL_FEE) : 0;
  const nairaEquiv     = youReceive * 1500;

  useEffect(() => { fetchTransactions(); }, []);

  const fetchTransactions = async () => {
    try {
      const res = await api("/payments/transactions");
      if (res.success) {
        setTransactions(res.data.transactions);
        const w = res.data.transactions
        .filter(tx => 
          tx.type === "withdrawal" && 
          (tx.status === "completed" || tx.status === "pending" || tx.status === "approved")
        )
        .reduce((s, tx) => s + Math.abs(tx.amount || 0), 0);
      setWithdrawn(w);
        setWithdrawn(w);
      }
    } catch (err) {
      console.error("Fetch transactions error:", err);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawForm.amount);
    if (!amount || amount < 1.00) { Alert.alert("Minimum withdrawal is $3.50"); return; }
    if (!withdrawForm.accountNumber || !withdrawForm.bankName) { Alert.alert("Please fill all fields"); return; }
    setSubmitting(true);
    try {
      const res = await api("/payments/withdraw", {
        method: "POST",
        body:   { amount, accountNumber: withdrawForm.accountNumber, bankName: withdrawForm.bankName },
      });
      if (res.success) {
        Alert.alert("✅ Request Submitted", res.message);
        setShowWithdraw(false);
        setWithdrawForm({ amount:"", accountNumber:"", bankName:"" });
        fetchTransactions();
        if (onUserUpdate) onUserUpdate();
      } else {
        Alert.alert("Error", res.message);
      }
    } catch {
      Alert.alert("Error", "Failed to submit withdrawal.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (ts) => {
    if (!ts?._seconds) return "—";
    return new Date(ts._seconds * 1000).toLocaleDateString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" });
  };

  return (
    <ScrollView style={[s.screen, { backgroundColor: C.bg }]} contentContainerStyle={{ paddingBottom:32 }} showsVerticalScrollIndicator={false}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: C.bg }]}>
        <View>
          <Text style={[s.pageTitle, { color: C.dark }]}>{t("wallet")}</Text>
          <Text style={[s.pageSub, { color: C.muted }]}>{t("allAmountsUSD")}</Text>
        </View>
      </View>

      {/* Balance card — always dark regardless of theme, looks great both ways */}
      <View style={{ marginHorizontal:16, marginBottom:18 }}>
        <View style={{ borderRadius:24, padding:24, minHeight:160, overflow:"hidden" }}>
          <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor:"#0F172A" }}>
            <View style={{ position:"absolute", width:180, height:180, borderRadius:90, backgroundColor:"#1E293B", top:-40, right:-40 }}/>
            <View style={{ position:"absolute", width:120, height:120, borderRadius:60, backgroundColor:C.blue, opacity:0.2, bottom:-20, left:30 }}/>
          </View>
          <Text style={{ fontFamily:fonts.medium, fontSize:13, color:"rgba(255,255,255,0.65)", marginBottom:4 }}>{t("totalBalance")}</Text>
          <View style={{ flexDirection:"row", alignItems:"center", gap:10, marginBottom:2 }}>
            <Text style={{ fontFamily:fonts.black, fontSize:40, color:"#FFFFFF", letterSpacing: balanceHidden ? 6 : -1 }}>
              {fmtAmt(user?.balance, balanceHidden)}
            </Text>
            <TouchableOpacity onPress={onToggleHide} activeOpacity={0.75}
              style={{ width:36, height:36, borderRadius:18, backgroundColor:"rgba(255,255,255,0.18)", alignItems:"center", justifyContent:"center" }}>
              {balanceHidden
                ? <Ico.EyeOff sz={24} cl="#FFFFFF"/>
                : <Ico.Eye    sz={24} cl="#FFFFFF"/>
              }
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection:"row", gap:24, marginTop:12 }}>
            <View>
              <Text style={{ fontFamily:fonts.regular, fontSize:11, color:"rgba(255,255,255,0.6)" }}>{t("totalEarned")}</Text>
              <Text style={{ fontFamily:fonts.bold, fontSize:15, color:"#FFFFFF", marginTop:2 }}>
                {fmtAmt(user?.totalEarned, balanceHidden)}
              </Text>
            </View>
            <View style={{ width:1, backgroundColor:"rgba(255,255,255,0.15)" }}/>
            <View>
              <Text style={{ fontFamily:fonts.regular, fontSize:11, color:"rgba(255,255,255,0.6)" }}>{t("withdrawn")}</Text>
              <Text style={{ fontFamily:fonts.bold, fontSize:15, color:"#FFFFFF", marginTop:2 }}>
                {balanceHidden ? MASK : `$${withdrawn.toFixed(2)}`}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={{ flexDirection:"row", gap:12, marginHorizontal:16, marginBottom:16 }}>
        <TouchableOpacity style={[s.walAction, { backgroundColor: C.card }]} onPress={() => setShowWithdraw(!showWithdraw)} activeOpacity={0.85}>
          <View style={[s.walActionIco, { backgroundColor:"#F0FDF4" }]}><Ico.Up sz={17} cl={C.green}/></View>
          <Text style={[s.walActionTxt, { color: C.dark }]}>{t("withdraw")}</Text>
        </TouchableOpacity>
        <TouchableOpacity
  style={[s.walAction, { backgroundColor: C.card }]}
  activeOpacity={0.85}
  onPress={async () => {
    try {
      await Share.share({
        message: `Join PromoEarn and earn real money!\nUse my referral code: ${user?.referralCode || user?.username}\nDownload: https://promoearn.com`,
      });
    } catch {}
  }}>
          <View style={[s.walActionIco, { backgroundColor:"#EEF4FF" }]}><Ico.Share sz={17} cl={C.blue}/></View>
          <Text style={[s.walActionTxt, { color: C.dark }]}>{t("referAndEarn")}</Text>
        </TouchableOpacity>
      </View>

      {/* How it works banner */}
      <TouchableOpacity
        onPress={() => setShowHowItWorks(!showHowItWorks)}
        activeOpacity={0.85}
        style={{ marginHorizontal:16, marginBottom:14, backgroundColor:C.blue+"18", borderRadius:16, padding:16, borderWidth:1.5, borderColor:C.blue+"40", flexDirection:"row", alignItems:"center", gap:12 }}>
        <View style={{ width:38, height:38, borderRadius:12, backgroundColor:C.blue, alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <Text style={{ fontSize:18 }}>ℹ️</Text>
        </View>
        <View style={{ flex:1 }}>
          <Text style={{ fontFamily:fonts.bold, fontSize:14, color:C.dark }}>{t("howWithdrawalsWork")}</Text>
          <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, marginTop:2 }}>{t("feesInfo")}</Text>
        </View>
        <Text style={{ fontSize:16, color:C.muted }}>{showHowItWorks ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {showHowItWorks && (
        <View style={{ marginHorizontal:16, marginBottom:16, backgroundColor:C.card, borderRadius:16, overflow:"hidden", borderWidth:1.5, borderColor:C.border }}>

          {/* Fee warning */}
          <View style={{ backgroundColor:"#FFF5F5", padding:16, borderBottomWidth:1.5, borderBottomColor:"#FECACA", flexDirection:"row", gap:12, alignItems:"flex-start" }}>
            <Text style={{ fontSize:20, flexShrink:0 }}>⚠️</Text>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:fonts.bold, fontSize:13, color:"#7F1D1D", marginBottom:4 }}>{t("withdrawalFeeNotice")}</Text>
              <Text style={{ fontFamily:fonts.regular, fontSize:12, color:"#991B1B", lineHeight:18 }}>
                {t("withdrawalFeeDetail")}
              </Text>
            </View>
          </View>

          {/* Conversion rate */}
          <View style={{ padding:16, borderBottomWidth:1, borderBottomColor:C.border, flexDirection:"row", gap:12, alignItems:"flex-start" }}>
            <Text style={{ fontSize:20, flexShrink:0 }}>💱</Text>
            <View style={{ flex:1 }}>
              <Text style={{ fontFamily:fonts.bold, fontSize:13, color:C.dark, marginBottom:4 }}>{t("dollarConversion")}</Text>
              <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, lineHeight:18 }}>
                {t("dollarConversionDetail")} <Text style={{ fontFamily:fonts.bold, color:C.blue }}>$1 = ₦1,500</Text>.
              </Text>
              <View style={{ flexDirection:"row", gap:8, marginTop:10 }}>
                {[
                  { dollar:"$1.00",  naira:"₦1,500"  },
                  { dollar:"$5.00",  naira:"₦7,500"  },
                  { dollar:"$10.00", naira:"₦15,000" },
                ].map((ex, i) => (
                  <View key={i} style={{ flex:1, backgroundColor:C.blue+"15", borderRadius:10, padding:8, alignItems:"center" }}>
                    <Text style={{ fontFamily:fonts.bold, fontSize:13, color:C.blue }}>{ex.dollar}</Text>
                    <Text style={{ fontFamily:fonts.regular, fontSize:10, color:C.muted, marginTop:2 }}>= {ex.naira}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Steps */}
          <View style={{ padding:16 }}>
            <Text style={{ fontFamily:fonts.bold, fontSize:13, color:C.dark, marginBottom:12 }}>📋 {t("stepByStep")}</Text>
            {[
              { n:"1", title: t("step1Title"), desc: t("step1Desc") },
              { n:"2", title: t("step2Title"), desc: t("step2Desc") },
              { n:"3", title: t("step3Title"), desc: t("step3Desc") },
              { n:"4", title: t("step4Title"), desc: t("step4Desc") },
            ].map((step, i) => (
              <View key={i} style={{ flexDirection:"row", gap:12, marginBottom:i<3?14:0 }}>
                <View style={{ width:28, height:28, borderRadius:14, backgroundColor:C.blue, alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 }}>
                  <Text style={{ fontFamily:fonts.black, fontSize:12, color:"#FFFFFF" }}>{step.n}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontFamily:fonts.bold, fontSize:13, color:C.dark }}>{step.title}</Text>
                  <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, marginTop:2, lineHeight:17 }}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}


      {showWithdraw && (
     <WithdrawForm
       user={user}
       C={C}
       t={t}
       onSuccess={() => {
         setShowWithdraw(false);
         fetchTransactions();
         if (onUserUpdate) onUserUpdate();   // ← FIXED
       }}
       onCancel={() => setShowWithdraw(false)}
     />
   )}

      
      {/* Transaction History */}
      <View style={{ paddingHorizontal:16 }}>
        <SH title={t("transactionHistory")} C={C}/>
        <View style={{ backgroundColor:C.card, borderRadius:20, overflow:"hidden", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.04, shadowRadius:8, elevation:1 }}>
          {transactions.length === 0 ? (
            <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, textAlign:"center", padding:24 }}>{t("noTransactions")}</Text>
          ) : transactions.map((tx, i) => (
            <View key={tx.id} style={[s.txRow, i<transactions.length-1 && { borderBottomWidth:1, borderBottomColor:C.border }]}>
              <View style={[s.txIco, { backgroundColor:tx.amount>0?"#F0FDF4":tx.type==="bonus"?"#FFFBEB":"#FFF5F5" }]}>
                {tx.amount>0 ? <Ico.Down sz={13} cl={C.green}/> : tx.type==="bonus" ? <Ico.Crown sz={13}/> : <Ico.Up sz={13} cl={C.red}/>}
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontFamily:fonts.medium, fontSize:13, color:C.dark }} numberOfLines={1}>{tx.description}</Text>
                <Text style={{ fontFamily:fonts.regular, fontSize:11, color:C.muted, marginTop:2 }}>{formatDate(tx.createdAt)}</Text>
              </View>
              <Text style={{ fontFamily:fonts.bold, fontSize:14, color:tx.amount>0?C.green:C.red }}>
                {balanceHidden ? MASK : `${tx.amount>0?"+":""}$${Math.abs(tx.amount).toFixed(2)}`}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
// ══════════════════════════════════════════════════════════════════════════
// REFERRAL SCREEN
// ══════════════════════════════════════════════════════════════════════════
function ReferralScreen({ user, onUpgrade, C, language, t }) {
  const [copied,    setCopied]    = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [earnings,  setEarnings]  = useState(0);
  const locked = !(user?.isActivated || user?.isAdmin);

  useEffect(() => { if (!locked) fetchReferrals(); }, [locked]);

  const fetchReferrals = async () => {
    try {
      const res = await api("/referrals/mine");
      if (res.success) {
        setReferrals(res.data.referrals);
        setEarnings(res.data.referralEarnings || 0);
      }
    } catch (err) {
      console.error("Fetch referrals error:", err);
    }
  };
  const handleShare = async () => {
    try {
      const { Share } = require("react-native");
      await Share.share({
        message: `Join PromoEarn and earn real money! Use my referral code: ${user?.referralCode || user?.username}\n\nDownload the app: https://expo.dev/artifacts/eas/YOUR-BUILD-ID.apk?ref=${user?.referralCode || user?.username}`,
        title: "Join PromoEarn",
      });
    } catch (err) {
      // user cancelled
    }
  };
  const formatJoined = (ts) => {
    if (!ts?._seconds) return "—";
    const diff = Date.now() - ts._seconds * 1000;
    const days = Math.floor(diff / 86400000);
    if (days === 0) return t("today");
    if (days === 1) return t("yesterday");
    if (days < 7)  return `${days} ${t("daysAgo")}`;
    const weeks = Math.floor(days / 7);
    return `${weeks} ${t("week")}${weeks > 1 ? "s" : ""} ${t("weeksAgo").replace(/\d+\s*/,"")}`;
  };

  return (
    <View style={{ flex:1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom:32 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[s.header, { backgroundColor: C.bg }]}>
          <Text style={[s.pageTitle, { color: C.dark }]}>{t("referAndEarn")}</Text>
          <Text style={[s.pageSub, { color: C.muted }]}>{t("inviteFriends")}</Text>
        </View>

        {/* Referral code card */}
        <View style={{ marginHorizontal:16, marginBottom:18 }}>
          <View style={{ borderRadius:24, padding:24, minHeight:160, overflow:"hidden" }}>
            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor:C.blue }}>
              <View style={{ position:"absolute", width:200, height:200, borderRadius:100, backgroundColor:"#3B82F6", opacity:0.35, top:-60, right:-40 }}/>
            </View>
            <Text style={{ fontFamily:fonts.bold, fontSize:13, color:"rgba(255,255,255,0.8)", marginBottom:4 }}>
              {t("yourReferralCode")}
            </Text>
            <Text style={{ fontFamily:fonts.black, fontSize:30, color:"#FFFFFF", letterSpacing:2, marginBottom:18 }}>
              @{user?.referralCode || user?.username || "—"}
            </Text>
            <View style={{ flexDirection:"row", gap:10 }}>
              <TouchableOpacity
                onPress={async () => {
                  await Clipboard.setStringAsync(user?.referralCode || user?.username || "");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                style={{ flexDirection:"row", alignItems:"center", gap:7, backgroundColor:"#FFFFFF", borderRadius:12, paddingHorizontal:16, paddingVertical:10 }}
                activeOpacity={0.85}>
                <Ico.Copy sz={14} cl={C.blue}/>
                <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:C.blue }}>
                  {copied ? t("copied") : t("copyCode")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
  onPress={handleShare}
  style={{ flexDirection:"row", alignItems:"center", gap:7, backgroundColor:"rgba(255,255,255,0.15)", borderRadius:12, paddingHorizontal:16, paddingVertical:10, borderWidth:1, borderColor:"rgba(255,255,255,0.3)" }}
  activeOpacity={0.85}>
  <Ico.Share sz={14} cl="#FFFFFF"/>
  <Text style={{ fontFamily:fonts.semibold, fontSize:13, color:"#FFFFFF" }}>{t("share")}</Text>
</TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection:"row", gap:10, marginHorizontal:16, marginBottom:18 }}>
          {[
            { lbl: t("totalReferrals"), val: referrals.length },
            { lbl: t("refEarnings"),    val: `$${earnings.toFixed(2)}`, green:true },
            { lbl: t("perReferral"),    val: "$1.33", gold:true },
          ].map((st,i) => (
            <View key={i} style={{ flex:1, backgroundColor:C.card, borderRadius:16, padding:14, alignItems:"center", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.04, shadowRadius:8, elevation:1 }}>
              <Text style={{ fontFamily:fonts.extrabold, fontSize:18, color:st.green?C.green:st.gold?C.gold:C.dark }}>{st.val}</Text>
              <Text style={{ fontFamily:fonts.regular, fontSize:11, color:C.muted, marginTop:2, textAlign:"center" }}>{st.lbl}</Text>
            </View>
          ))}
        </View>

        {/* How it works */}
        <View style={{ marginHorizontal:16, marginBottom:18 }}>
          <SH title={t("howItWorks")} C={C}/>
          <View style={{ backgroundColor:C.card, borderRadius:20, padding:20, shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.04, shadowRadius:8, elevation:1, gap:16 }}>
            {[t("ref1"), t("ref2"), t("ref3"), t("ref4")].map((txt, i) => (
              <View key={i} style={{ flexDirection:"row", alignItems:"flex-start", gap:14 }}>
                <View style={{ width:28, height:28, borderRadius:14, backgroundColor:C.blue+"20", alignItems:"center", justifyContent:"center" }}>
                  <Text style={{ fontFamily:fonts.black, fontSize:13, color:C.blue }}>{i+1}</Text>
                </View>
                <Text style={{ flex:1, fontFamily:fonts.regular, fontSize:14, color:C.muted, lineHeight:20, paddingTop:4 }}>{txt}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Your referrals list */}
        <View style={{ paddingHorizontal:16 }}>
          <SH title={t("yourReferrals")} C={C}/>
          <View style={{ backgroundColor:C.card, borderRadius:20, overflow:"hidden", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.04, shadowRadius:8, elevation:1 }}>
            {referrals.length === 0 ? (
              <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, textAlign:"center", padding:24 }}>
                {t("noReferrals")}
              </Text>
            ) : referrals.map((ref, i) => (
              <View key={ref.uid} style={[
                { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingVertical:14, gap:12 },
                i < referrals.length-1 && { borderBottomWidth:1, borderBottomColor:C.border },
              ]}>
                <View style={{ width:38, height:38, borderRadius:19, backgroundColor:C.blue+"20", alignItems:"center", justifyContent:"center" }}>
                  <Text style={{ fontFamily:fonts.bold, fontSize:12, color:C.blue }}>{ref.username?.slice(0,2).toUpperCase()}</Text>
                </View>
                <View style={{ flex:1 }}>
                  <Text style={{ fontFamily:fonts.semibold, fontSize:14, color:C.dark }}>@{ref.username}</Text>
                  <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted }}>Joined {formatJoined(ref.joinedAt)}</Text>
                </View>
                <View style={{ alignItems:"flex-end" }}>
                  <Text style={{ fontFamily:fonts.bold, fontSize:13, color:C.green }}>+$1.33</Text>
                  <View style={{ backgroundColor:ref.isActive ? C.green+"18" : C.border, paddingHorizontal:8, paddingVertical:3, borderRadius:6, marginTop:4 }}>
                    <Text style={{ fontFamily:fonts.semibold, fontSize:10, color:ref.isActive?C.green:C.muted }}>
                      {ref.isActive ? "active" : "inactive"}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      {locked && <PremiumGate onUpgrade={onUpgrade}/>}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PROFILE SCREEN
// ══════════════════════════════════════════════════════════════════════════
function ProfileScreen({ user, onUpgrade, onLogout, onHelp, balanceHidden, C, language, t, onDarkModeChange, onLanguageChange, darkMode }) {
  const [showLogout,      setShowLogout]      = useState(false);
  const [showPayout,      setShowPayout]      = useState(false);
  const [showNotifs,      setShowNotifs]      = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);
  const [showHelpModal,   setShowHelpModal]   = useState(false);
  const [feedbackTab,     setFeedbackTab]     = useState("help");
  const [feedbackText,    setFeedbackText]    = useState("");
  const [feedbackRating,  setFeedbackRating]  = useState(0);
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [feedbackSent,    setFeedbackSent]    = useState(false);
  const [openFaq,         setOpenFaq]         = useState(null);

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) { Alert.alert("Please write your feedback before sending."); return; }
    setSendingFeedback(true);
    try {
      await api("/feedback", {
        method: "POST",
        body: { message: feedbackText, rating: feedbackRating, userId: user?.uid, email: user?.email },
      });
      setFeedbackSent(true);
      setFeedbackText("");
      setFeedbackRating(0);
    } catch {
      Alert.alert("Error", "Failed to send feedback. Please try again.");
    } finally {
      setSendingFeedback(false);
    }
  };

  const menu = [
    { icon:<Ico.Wallet sz={16} cl={C.blue}/>,   lbl: t("payoutMethods"),   bg: C.blue+"18",   onPress:() => setShowPayout(true)   },
    { icon:<Ico.Bell   sz={16} cl={C.gold}/>,   lbl: t("notifications"),   bg: C.gold+"18",   onPress:() => setShowNotifs(true)   },
    { icon:<Ico.Gear   sz={16} cl={C.muted}/>,  lbl: t("accountSettings"), bg: C.border,      onPress:() => setShowSettings(true) },
    { icon:<Ico.Help   sz={16} cl={C.purple}/>, lbl: t("helpFeedback"),    bg: C.purple+"18", onPress:() => { setShowHelpModal(true); setFeedbackSent(false); } },
    { icon:<Ico.Share  sz={16} cl={C.green}/>,  lbl: t("sharePromoEarn"),  bg: C.green+"18",  onPress: async () => {
      try {
        const { Share } = require("react-native");
        await Share.share({
          message: `Join PromoEarn and earn real money! Use my referral code: ${user?.referralCode || user?.username}\n\nDownload the app: https://expo.dev/artifacts/eas/YOUR-BUILD-ID.apk?ref=${user?.referralCode || user?.username}`,
          title: "PromoEarn",
        });
      } catch {}
    }},
  ];

  const FAQ_ITEMS = [
    { q:"How do I earn money?",                a:"Complete tasks in the PromoSpace tab. Each task shows how much you earn. Tap Start, do the task, then tap Done to claim your reward." },
    { q:"When do I get paid?",                 a:"Withdrawal requests are processed within 24 hours. Funds are sent directly to your Local bank account account." },
    { q:"What is the withdrawal fee?",         a:"There is a flat $0.13 processing fee deducted from every withdrawal. For example, withdrawing $5.00 gives you $4.87 in your bank." },
    { q:"What is the conversion rate?",        a:"We convert your USD balance to Naira at a fixed rate of $1 = ₦1,500. All balances in the app are shown in US Dollars." },
    { q:"How does the referral program work?", a:"Share your referral code. When a friend signs up and activates their account, you earn a $1.33 bonus instantly." },
    { q:"Why is my account locked?",           a:"You need to activate your account with a one-time $3.00 fee to access all tasks and features. Tap 'Activate Account' to get started." },
    { q:"How do I contact support?",           a:"Use the Feedback tab in this screen to send us a message, or email us at contact.promoearn@gmail.com. We respond within 24 hours." },
  ];

  return (
    <>
      <ScrollView style={[s.screen, { backgroundColor: C.bg }]} contentContainerStyle={{ paddingBottom:40 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[s.header, { backgroundColor: C.bg }]}>
          <Text style={[s.pageTitle, { color: C.dark }]}>{t("profile")}</Text>
        </View>

        {/* Avatar + name */}
        <View style={{ alignItems:"center", marginBottom:24 }}>
          <View style={{ width:80, height:80, borderRadius:40, backgroundColor:C.blue, alignItems:"center", justifyContent:"center", shadowColor:C.blue, shadowOffset:{width:0,height:8}, shadowOpacity:0.3, shadowRadius:16, elevation:8 }}>
            <Text style={{ fontFamily:fonts.black, fontSize:26, color:"#FFFFFF" }}>{user?.firstName?.[0]}{user?.lastName?.[0]}</Text>
          </View>
          <Text style={{ fontFamily:fonts.bold, fontSize:20, color:C.dark, marginTop:12 }}>{user?.firstName} {user?.lastName}</Text>
          <Text style={{ fontFamily:fonts.regular, fontSize:14, color:C.muted, marginTop:2 }}>@{user?.username}</Text>
          {(user?.isActivated || user?.isAdmin) ? (
            <View style={{ flexDirection:"row", alignItems:"center", gap:5, backgroundColor:C.gold+"20", paddingHorizontal:12, paddingVertical:5, borderRadius:20, marginTop:8 }}>
              <Ico.Crown sz={13}/>
              <Text style={{ fontFamily:fonts.bold, fontSize:12, color:C.gold }}>{t("activeAccount")}</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={onUpgrade} activeOpacity={0.8}
              style={{ flexDirection:"row", alignItems:"center", gap:5, backgroundColor:C.gold+"20", paddingHorizontal:12, paddingVertical:5, borderRadius:20, marginTop:8 }}>
              <Ico.Crown sz={13}/>
              <Text style={{ fontFamily:fonts.bold, fontSize:12, color:C.gold }}>{t("activateAccountBtn")}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats row */}
        <View style={{ flexDirection:"row", marginHorizontal:16, marginBottom:16, backgroundColor:C.card, borderRadius:20, overflow:"hidden", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 }}>
          {[
            { lbl: t("tasks"),     val: balanceHidden ? MASK : (user?.tasksCompleted || 0) },
            { lbl: t("earned"),    val: balanceHidden ? MASK : `$${(user?.totalEarned||0).toFixed(2)}` },
            { lbl: t("referrals"), val: balanceHidden ? MASK : (user?.referralsCount  || 0) },
            { lbl: t("balance"),   val: balanceHidden ? MASK : `$${(user?.balance||0).toFixed(2)}` },
          ].map((st,i) => (
            <View key={i} style={{ flex:1, alignItems:"center", paddingVertical:16, borderRightWidth:i<3?1:0, borderRightColor:C.border }}>
              <Text style={[{ fontFamily:fonts.extrabold, fontSize:17, color:C.dark }, balanceHidden && { fontSize:13, letterSpacing:2 }]}>{st.val}</Text>
              <Text style={{ fontFamily:fonts.regular, fontSize:11, color:C.muted, marginTop:2 }}>{st.lbl}</Text>
            </View>
          ))}
        </View>

        {/* Activation upsell banner */}
        {!(user?.isActivated || user?.isAdmin) && (
          <TouchableOpacity onPress={onUpgrade} activeOpacity={0.9} style={{ marginHorizontal:16, marginBottom:14 }}>
            <View style={{ borderRadius:18, padding:18, overflow:"hidden", flexDirection:"row", alignItems:"center", gap:14 }}>
              <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor:C.dark, borderRadius:18 }}/>
              <View style={{ position:"absolute", width:150, height:150, borderRadius:75, backgroundColor:C.gold, opacity:0.1, top:-40, right:-20 }}/>
              <View style={{ width:46, height:46, borderRadius:14, backgroundColor:"rgba(245,158,11,0.2)", alignItems:"center", justifyContent:"center" }}>
                <Ico.Crown sz={22}/>
              </View>
              <View style={{ flex:1 }}>
                <Text style={{ fontFamily:fonts.bold, fontSize:15, color:"#FFFFFF" }}>{t("activateAccount")}</Text>
                <Text style={{ fontFamily:fonts.regular, fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:3 }}>{t("activateSubtitle")}</Text>
              </View>
              <Text style={{ color:C.gold, fontSize:20, fontWeight:"800" }}>→</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Menu items */}
        <View style={{ marginHorizontal:16, marginBottom:14, backgroundColor:C.card, borderRadius:20, overflow:"hidden", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.04, shadowRadius:8, elevation:1 }}>
          {menu.map((item, i) => (
            <TouchableOpacity key={i} onPress={item.onPress} activeOpacity={0.7}
              style={[
                { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingVertical:16, gap:14 },
                i < menu.length-1 && { borderBottomWidth:1, borderBottomColor:C.border },
              ]}>
              <View style={{ width:38, height:38, borderRadius:12, backgroundColor:item.bg, alignItems:"center", justifyContent:"center" }}>
                {item.icon}
              </View>
              <Text style={{ flex:1, fontFamily:fonts.medium, fontSize:15, color:C.dark }}>{item.lbl}</Text>
              <Text style={{ color:C.muted, fontSize:18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Log out button */}
        <View style={{ marginHorizontal:16 }}>
          <TouchableOpacity
            style={{ flexDirection:"row", alignItems:"center", justifyContent:"center", gap:10, backgroundColor:C.red+"15", borderRadius:16, height:54, borderWidth:1.5, borderColor:C.red+"40" }}
            onPress={() => setShowLogout(true)} activeOpacity={0.85}>
            <Ico.Out sz={17} cl={C.red}/>
            <Text style={{ fontFamily:fonts.bold, fontSize:15, color:C.red }}>{t("logOut")}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modals */}
      <LogoutModal
        visible={showLogout}
        onConfirm={() => { setShowLogout(false); onLogout(); }}
        onCancel={() => setShowLogout(false)}
      />
  <PayoutMethodsScreen
  visible={showPayout}
  onClose={() => setShowPayout(false)}
  user={user}
  C={C}
/>
<NotificationsScreen visible={showNotifs} onClose={() => setShowNotifs(false)} user={user} C={C} />
      <AccountSettingsScreen
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        onLogout={onLogout}
        darkMode={darkMode}
        language={language}
        onDarkModeChange={onDarkModeChange}
        onLanguageChange={onLanguageChange}
      />

      {/* Help & Feedback Modal */}
      <Modal visible={showHelpModal} animationType="slide" transparent>
        <View style={{ flex:1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent:"flex-end" }}>
          <View style={{ backgroundColor:C.card, borderTopLeftRadius:28, borderTopRightRadius:28, maxHeight:"92%", paddingBottom:Platform.OS==="ios"?44:28 }}>

            <View style={{ width:40, height:4, backgroundColor:C.border, borderRadius:2, alignSelf:"center", marginTop:12, marginBottom:4 }}/>
            <View style={{ flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingHorizontal:20, paddingVertical:16, borderBottomWidth:1, borderBottomColor:C.border }}>
              <Text style={{ fontFamily:fonts.black, fontSize:18, color:C.dark }}>{t("helpFeedbackTitle")}</Text>
              <TouchableOpacity onPress={() => setShowHelpModal(false)}
                style={{ width:34, height:34, borderRadius:17, backgroundColor:C.input, alignItems:"center", justifyContent:"center" }}>
                <Text style={{ fontSize:18, color:C.muted }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Tab switcher */}
            <View style={{ flexDirection:"row", marginHorizontal:20, marginTop:16, marginBottom:4, backgroundColor:C.input, borderRadius:14, padding:3 }}>
              {[
                { key:"help",     label: t("helpFaq")      },
                { key:"feedback", label: t("sendFeedback") },
              ].map(tab => (
                <TouchableOpacity key={tab.key}
                  onPress={() => { setFeedbackTab(tab.key); setFeedbackSent(false); }}
                  activeOpacity={0.8}
                  style={{ flex:1, paddingVertical:9, borderRadius:11, alignItems:"center",
                    backgroundColor: feedbackTab===tab.key ? C.card : "transparent",
                    shadowColor: feedbackTab===tab.key ? "#000" : "transparent",
                    shadowOffset:{width:0,height:1}, shadowOpacity:0.06, shadowRadius:4,
                    elevation: feedbackTab===tab.key ? 2 : 0 }}>
                  <Text style={{ fontFamily:feedbackTab===tab.key?fonts.bold:fonts.semibold, fontSize:13, color:feedbackTab===tab.key?C.dark:C.muted }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal:20, paddingBottom:40, paddingTop:16 }} showsVerticalScrollIndicator={false}>

              {/* FAQ TAB */}
              {feedbackTab === "help" && (
                <View>
                  <View style={{ backgroundColor:C.purple+"18", borderRadius:14, padding:14, marginBottom:20, flexDirection:"row", gap:12, alignItems:"center" }}>
                    <Text style={{ fontSize:22 }}>📧</Text>
                    <View style={{ flex:1 }}>
                      <Text style={{ fontFamily:fonts.bold, fontSize:13, color:C.dark }}>{t("needSupport")}</Text>
                      <Text style={{ fontFamily:fonts.regular, fontSize:12, color:C.muted, marginTop:2 }}>{t("supportEmail")}</Text>
                    </View>
                  </View>

                  {FAQ_ITEMS.map((item, i) => (
                    <TouchableOpacity key={i} onPress={() => setOpenFaq(openFaq===i?null:i)} activeOpacity={0.8}
                      style={{ borderRadius:14, marginBottom:10, overflow:"hidden", borderWidth:1.5,
                        borderColor: openFaq===i ? C.purple : C.border,
                        backgroundColor: openFaq===i ? C.purple+"15" : C.card }}>
                      <View style={{ flexDirection:"row", alignItems:"center", padding:14, gap:12 }}>
                        <View style={{ width:28, height:28, borderRadius:14,
                          backgroundColor: openFaq===i ? C.purple : C.input,
                          alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                          <Text style={{ fontFamily:fonts.black, fontSize:12, color:openFaq===i?"#FFFFFF":C.muted }}>Q</Text>
                        </View>
                        <Text style={{ flex:1, fontFamily:fonts.semibold, fontSize:14, color:C.dark, lineHeight:20 }}>{item.q}</Text>
                        <Text style={{ fontSize:16, color:C.muted }}>{openFaq===i?"▲":"▼"}</Text>
                      </View>
                      {openFaq === i && (
                        <View style={{ paddingHorizontal:14, paddingBottom:14, paddingTop:2 }}>
                          <View style={{ height:1, backgroundColor:C.purple+"30", marginBottom:10 }}/>
                          <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, lineHeight:20 }}>{item.a}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* FEEDBACK TAB */}
              {feedbackTab === "feedback" && (
                <View>
                  {feedbackSent ? (
                    <View style={{ alignItems:"center", paddingVertical:40 }}>
                      <View style={{ width:80, height:80, borderRadius:40, backgroundColor:C.green+"20", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                        <Text style={{ fontSize:36 }}>🎉</Text>
                      </View>
                      <Text style={{ fontFamily:fonts.black, fontSize:20, color:C.dark, marginBottom:8 }}>{t("thanksFeedback")}</Text>
                      <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, textAlign:"center", lineHeight:20 }}>
                        We read every message and use it to improve PromoEarn for everyone.
                      </Text>
                      <TouchableOpacity onPress={() => setFeedbackSent(false)}
                        style={{ marginTop:24, backgroundColor:C.blue, borderRadius:14, paddingHorizontal:28, paddingVertical:12 }}
                        activeOpacity={0.85}>
                        <Text style={{ fontFamily:fonts.bold, fontSize:14, color:"#FFFFFF" }}>{t("sendAnother")}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View>
                      <Text style={{ fontFamily:fonts.regular, fontSize:13, color:C.muted, marginBottom:20, lineHeight:20 }}>
                        Have a suggestion, found a bug, or just want to share your experience? We'd love to hear from you.
                      </Text>

                      {/* Star rating */}
                      <Text style={{ fontFamily:fonts.semibold, fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:10 }}>
                        {t("rateExperience")}
                      </Text>
                      <View style={{ flexDirection:"row", gap:8, marginBottom:20 }}>
                        {[1,2,3,4,5].map(star => (
                          <TouchableOpacity key={star} onPress={() => setFeedbackRating(star)} activeOpacity={0.7}
                            style={{ width:48, height:48, borderRadius:14, borderWidth:1.5,
                              borderColor: feedbackRating>=star ? C.gold : C.border,
                              backgroundColor: feedbackRating>=star ? C.gold+"20" : C.card,
                              alignItems:"center", justifyContent:"center" }}>
                            <Text style={{ fontSize:22 }}>{feedbackRating >= star ? "⭐" : "☆"}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Message input */}
                      <Text style={{ fontFamily:fonts.semibold, fontSize:11, color:C.muted, textTransform:"uppercase", letterSpacing:0.5, marginBottom:8 }}>
                        {t("yourMessage")}
                      </Text>
                      <View style={{ backgroundColor:C.input, borderRadius:14, borderWidth:1.5, borderColor:C.border, padding:14, marginBottom:20 }}>
                        <TextInput
                          style={{ fontFamily:fonts.medium, fontSize:14, color:C.dark, minHeight:110, textAlignVertical:"top" }}
                          placeholder="Tell us what you think, what's broken, or what you'd love to see..."
                          placeholderTextColor={C.slate}
                          multiline
                          value={feedbackText}
                          onChangeText={setFeedbackText}
                        />
                      </View>

                      <TouchableOpacity
                        style={{ backgroundColor:C.blue, borderRadius:14, height:52, alignItems:"center", justifyContent:"center", opacity:sendingFeedback?0.7:1 }}
                        onPress={handleSendFeedback} disabled={sendingFeedback} activeOpacity={0.85}>
                        <Text style={{ fontFamily:fonts.bold, fontSize:15, color:"#FFFFFF" }}>
                          {sendingFeedback ? t("sending") : t("sendFeedbackBtn")}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

// ── Tab Bar ────────────────────────────────────────────────────────────────
const TABS_CONFIG = [
  { key:"home",     label:"Home",       Ic:Ico.Home   },
  { key:"promo",    label:"PromoSpace", Ic:Ico.Promo  },
  { key:"wallet",   label:"Wallet",     Ic:Ico.Wallet },
  { key:"referral", label:"Referral",   Ic:Ico.Refer  },
  { key:"profile",  label:"Profile",    Ic:Ico.User   },
];
const LOCKED_KEYS = ["promo","referral"];

function TabBar({ active, onChange, isActivated, C, t }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.tabBar, { backgroundColor: C.card, borderTopColor: C.border, paddingBottom: insets.bottom || 8 }]}>
      {TABS_CONFIG.map(t => {
        const isActive = active === t.key;
        const isLocked = !isActivated && LOCKED_KEYS.includes(t.key);
        return (
          <TouchableOpacity key={t.key} style={s.tabItem} onPress={() => onChange(t.key)} activeOpacity={0.8}>
            {isActive && <View style={s.tabLine}/>}
            <View style={{ position:"relative" }}>
              <t.Ic sz={22} cl={isActive?C.blue:isLocked?"#CBD5E1":"#94A3B8"}/>
              {isLocked && <View style={s.lockDot}><Ico.Lock sz={7} cl={C.white}/></View>}
            </View>
            <Text style={[s.tabLabel, isActive&&{ color:C.blue, fontFamily:fonts.bold }, isLocked&&{ color:"#CBD5E1" }]}>{t.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════
export default function MainApp({ onLogout, initialUser }) {
  const [tab,               setTab]               = useState("home");
  const [darkMode,  setDarkMode]  = useState(false);
const [language,  setLanguage]  = useState("en");
const C = darkMode ? DARK : LIGHT;
const t = (key) => TRANSLATIONS[language]?.[key] ?? TRANSLATIONS["en"][key] ?? key;
  const [user,              setUser]              = useState(null);
  const [refreshing,        setRefreshing]        = useState(false);
  const [showPremium,       setShowPremium]       = useState(false);
  const [showStripe,        setShowStripe]        = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount,       setUnreadCount]       = useState(0);

  // ── Balance visibility state ──────────────────────────────────────────
  // Persisted in localStorage so it survives app restarts
   // ── Balance visibility state ──────────────────────────────────────────
   const [balanceHidden, setBalanceHidden] = useState(false);
   const [pinMode,  setPinMode]  = useState(null);
 
   const pinKey = `pe_pin_${user?.uid}`;
 
   // Load persisted balance hidden state on mount
   useEffect(() => {
     AsyncStorage.getItem("pe_balance_hidden").then(val => {
       if (val === "true") setBalanceHidden(true);
     });
   }, []);
 
   const hasPin = async () => {
     try { return !!(await AsyncStorage.getItem(pinKey)); } catch { return false; }
   };
 
   const handleToggleHide = async () => {
    const newVal = !balanceHidden;
    setBalanceHidden(newVal);
    await AsyncStorage.setItem("pe_balance_hidden", newVal ? "true" : "false");
  };
// Add this temporarily in Main
  // Called when PIN modal succeeds
  const handlePinSuccess = async () => {
    setPinMode(null);
    if (pinMode === "setup") {
      setBalanceHidden(true);
      await AsyncStorage.setItem("pe_balance_hidden", "true");
    } else {
      setBalanceHidden(false);
      await AsyncStorage.setItem("pe_balance_hidden", "false");
    }
  };

  useEffect(() => {
    fetchUser();
    registerForPushNotifications();
    fetchUnreadCount();
    loadPreferences();
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await api("/notifications");
      if (res.success) setUnreadCount(res.data.unreadCount);
    } catch {}
  };

  const loadPreferences = async () => {
    try {
      const raw = await AsyncStorage.getItem("pe_user_preferences");
      if (raw) {
        const prefs = JSON.parse(raw);
        if (prefs.darkMode  !== undefined) setDarkMode(prefs.darkMode);
        if (prefs.language  !== undefined) setLanguage(prefs.language);
      }
    } catch {}
  };

  const handleDarkModeChange = async (val) => {
    setDarkMode(val);
    try {
      const raw = await AsyncStorage.getItem("pe_user_preferences");
      const prefs = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem("pe_user_preferences", JSON.stringify({ ...prefs, darkMode: val }));
    } catch {}
  };

  const handleLanguageChange = async (val) => {
    setLanguage(val);
    try {
      const raw = await AsyncStorage.getItem("pe_user_preferences");
      const prefs = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem("pe_user_preferences", JSON.stringify({ ...prefs, language: val }));
    } catch {}
  };

  const fetchUser = async () => {
    try {
      const cached = await AsyncStorage.getItem("pe_cached_user");
      if (cached) setUser(JSON.parse(cached));
      const res = await AuthService.getMe();
      if (res.success) {
        setUser(res.data.user);
        await AsyncStorage.setItem("pe_cached_user", JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error("Fetch user error:", err);
    }
  };

  const registerForPushNotifications = async () => {
    if (!Device.isDevice) return;
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") return;
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      const authToken = await AuthService.getToken();
      await fetch(`${BASE_URL}/notifications/push-token`, {
        method:  "POST",
        headers: { "Content-Type":"application/json", Authorization:`Bearer ${authToken}` },
        body:    JSON.stringify({ pushToken: token }),
      });
    } catch (err) {
      console.error("Push notification registration error:", err);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  }, []);

  const openUpgrade = () => setShowPremium(true);
  const onProceed   = () => { setShowPremium(false); setShowStripe(true); };

  const onPaid = async () => {
    setShowStripe(false);
    await fetchUser();   // refresh user so isActivated = true, balance updated
    Alert.alert(
      "🎉 Account Activated!",
      "Welcome to PromoEarn! Your $0.33 welcome bonus has been added to your balance."
    );
  };

const render = () => {
    const themeProps = { C, darkMode, language, t };
    switch (tab) {
      case "home":     return <HomeScreen     {...themeProps} user={user} setUser={setUser} onTabChange={setTab} onUpgrade={openUpgrade} onRefresh={onRefresh} refreshing={refreshing} onBellPress={() => setShowNotifications(true)} unreadCount={unreadCount} balanceHidden={balanceHidden} onToggleHide={handleToggleHide}/>;
      case "promo":    return <PromoSpaceScreen {...themeProps} user={user} setUser={setUser} onUpgrade={openUpgrade}/>;
      case "wallet": return <WalletScreen {...themeProps} user={user} onUserUpdate={fetchUser} onRefreshUser={fetchUser} balanceHidden={balanceHidden} onToggleHide={handleToggleHide}/>;
      case "referral": return <ReferralScreen {...themeProps} user={user} onUpgrade={openUpgrade}/>;
      case "profile":  return <ProfileScreen  {...themeProps} user={user} onUpgrade={openUpgrade} onLogout={onLogout} onDarkModeChange={handleDarkModeChange} onLanguageChange={handleLanguageChange} balanceHidden={balanceHidden}/>;
    }
  };

  return (
    <View style={{ flex:1, backgroundColor:C.light }}>
      <View style={{ flex:1 }}>{render()}</View>
      <TabBar active={tab} onChange={setTab} isActivated={!!(user?.isActivated || user?.isAdmin)} C={C} t={t}/>
      <PremiumModal visible={showPremium} onProceed={onProceed} onClose={() => setShowPremium(false)}/>
      <NotificationsListScreen visible={showNotifications} onClose={() => setShowNotifications(false)} onUnreadChange={setUnreadCount} C={C} darkMode={darkMode}/>
      
<PaystackModal visible={showStripe} user={user} onSuccess={onPaid} onClose={() => setShowStripe(false)}/>



      {/* PIN modal — shown globally so it works from any tab */}
      <PinModal
        visible={!!pinMode}
        mode={pinMode || "verify"}
        userId={user?.uid}
        onSuccess={handlePinSuccess}
        onClose={() => setPinMode(null)}
      />
    </View>
  );
}

// ── Global Styles ──────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen:         { flex:1, backgroundColor:"#F8FAFF" },
  header:         { paddingHorizontal:20, paddingTop:Platform.OS==="ios"?56:40, paddingBottom:20 },
  pageTitle:      { fontFamily:fonts.black, fontSize:26, color:"#0F172A", letterSpacing:-0.5 },
  pageSub:        { fontFamily:fonts.regular, fontSize:14, color:"#64748B", marginTop:2 },
  greet:          { fontFamily:fonts.regular, fontSize:13, color:"#64748B" },
  name:           { fontFamily:fonts.extrabold, fontSize:22, color:"#0F172A", letterSpacing:-0.5 },
  premBadge:      { flexDirection:"row", alignItems:"center", gap:5, backgroundColor:"#FFFBEB", paddingHorizontal:10, paddingVertical:5, borderRadius:20, marginRight:10 },
  premBadgeTxt:   { fontFamily:fonts.bold, fontSize:11, color:"#F59E0B" },
  bellBtn:        { width:42, height:42, borderRadius:13, backgroundColor:"#FFFFFF", alignItems:"center", justifyContent:"center", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.06, shadowRadius:6, elevation:2 },
  bellDot:        { position:"absolute", top:8, right:8, width:8, height:8, borderRadius:4, backgroundColor:"#EF4444", borderWidth:1.5, borderColor:"#FFFFFF" },
  balCard:        { borderRadius:24, padding:24, minHeight:175 },
  balLabel:       { fontFamily:fonts.medium, fontSize:13, color:"rgba(255,255,255,0.75)", marginBottom:4 },
  balAmt:         { fontFamily:fonts.black, fontSize:42, color:"#FFFFFF", letterSpacing:-1 },
  balSub:         { fontFamily:fonts.regular, fontSize:13, color:"rgba(255,255,255,0.65)", marginTop:4 },
  balBtn:         { backgroundColor:"#FFFFFF", borderRadius:12, paddingHorizontal:20, paddingVertical:10 },
  statCard:       { flex:1, backgroundColor:"#FFFFFF", borderRadius:16, padding:14, borderTopWidth:3, shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  statIcon:       { width:32, height:32, borderRadius:10, alignItems:"center", justifyContent:"center", marginBottom:8 },
  statVal:        { fontFamily:fonts.extrabold, fontSize:20, color:"#0F172A", letterSpacing:-0.5 },
  statLbl:        { fontFamily:fonts.medium, fontSize:11, color:"#64748B", marginTop:2 },
  upsell:         { borderRadius:18, padding:18, flexDirection:"row", alignItems:"center", gap:14, overflow:"hidden" },
  lbBox:          { backgroundColor:"#FFFFFF", borderRadius:20, overflow:"hidden", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.04, shadowRadius:8, elevation:1 },
  lbRow:          { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingVertical:13, gap:12 },
  lbRank:         { fontFamily:fonts.black, fontSize:15, color:"#64748B", width:28 },
  lbAv:           { width:36, height:36, borderRadius:18, backgroundColor:"#EEF4FF", alignItems:"center", justifyContent:"center" },
  lbAvTxt:        { fontFamily:fonts.bold, fontSize:12, color:"#1A56DB" },
  lbName:         { flex:1, fontFamily:fonts.semibold, fontSize:14, color:"#0F172A" },
  lbEarned:       { fontFamily:fonts.bold, fontSize:14, color:"#10B981", marginRight:6 },
  walAction:      { flex:1, backgroundColor:"#FFFFFF", borderRadius:16, padding:16, alignItems:"center", shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  walActionIco:   { width:44, height:44, borderRadius:14, alignItems:"center", justifyContent:"center", marginBottom:8 },
  walActionTxt:   { fontFamily:fonts.semibold, fontSize:13, color:"#0F172A" },
  txRow:          { flexDirection:"row", alignItems:"center", paddingHorizontal:16, paddingVertical:14, gap:12 },
  txIco:          { width:36, height:36, borderRadius:12, alignItems:"center", justifyContent:"center" },
  tabBar: { flexDirection:"row", backgroundColor:"#FFFFFF", borderTopWidth:1, borderTopColor:"#E2E8F0", paddingTop:10, shadowColor:"#000", shadowOffset:{width:0,height:-4}, shadowOpacity:0.05, shadowRadius:12, elevation:10 },
  tabItem:        { flex:1, alignItems:"center", gap:3, position:"relative" },
  tabLine:        { position:"absolute", top:-10, width:32, height:3, backgroundColor:"#1A56DB", borderRadius:2 },
  tabLabel:       { fontFamily:fonts.medium, fontSize:10, color:"#94A3B8" },
  lockDot:        { position:"absolute", bottom:-3, right:-5, width:14, height:14, borderRadius:7, backgroundColor:"#F59E0B", alignItems:"center", justifyContent:"center", borderWidth:1.5, borderColor:"#FFFFFF" },
});

const z = StyleSheet.create({
  taskCard:    { flexDirection:"row", backgroundColor:"#FFFFFF", borderRadius:16, padding:14, marginBottom:10, shadowColor:"#000", shadowOffset:{width:0,height:1}, shadowOpacity:0.04, shadowRadius:6, elevation:1, gap:12 },
  taskLogo:    { width:44, height:44, borderRadius:13, alignItems:"center", justifyContent:"center" },
  taskLogoTxt: { fontFamily:fonts.black, fontSize:14 },
  badge:       { paddingHorizontal:8, paddingVertical:3, borderRadius:6 },
  badgeTxt:    { fontFamily:fonts.bold, fontSize:10, letterSpacing:0.3 },
  taskTime:    { fontFamily:fonts.regular, fontSize:11, color:"#64748B" },
  taskTitle:   { fontFamily:fonts.semibold, fontSize:14, color:"#0F172A", lineHeight:20, marginBottom:4 },
  taskBrand:   { fontFamily:fonts.regular, fontSize:12, color:"#64748B" },
  taskReward:  { fontFamily:fonts.extrabold, fontSize:16, color:"#10B981" },
  startBtn:    { backgroundColor:"#1A56DB", borderRadius:10, paddingHorizontal:14, paddingVertical:8, alignItems:"center", justifyContent:"center" },
  startBtnTxt: { fontFamily:fonts.bold, fontSize:12, color:"#FFFFFF" },
  doneBtn:     { flexDirection:"row", alignItems:"center", gap:4, backgroundColor:"#F0FDF4", borderRadius:10, paddingHorizontal:10, paddingVertical:8 },
  adCard:      { backgroundColor:"#FFFFFF", borderRadius:18, padding:16, marginBottom:12, shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.05, shadowRadius:8, elevation:2 },
  adLogo:      { width:46, height:46, borderRadius:14, alignItems:"center", justifyContent:"center" },
  adLogoTxt:   { fontFamily:fonts.black, fontSize:15 },
  adTitle:     { fontFamily:fonts.bold, fontSize:15, color:"#0F172A", marginTop:3 },
  adDesc:      { fontFamily:fonts.regular, fontSize:13, color:"#64748B", marginTop:3, lineHeight:19 },
  catBadge:    { paddingHorizontal:9, paddingVertical:4, borderRadius:8 },
  catTxt:      { fontFamily:fonts.bold, fontSize:10 },
  adReward:    { fontFamily:fonts.extrabold, fontSize:18, color:"#10B981" },
  applyBtn:    { backgroundColor:"#1A56DB", borderRadius:12, paddingHorizontal:20, paddingVertical:10 },
  applyTxt:    { fontFamily:fonts.bold, fontSize:13, color:"#FFFFFF" },
  gateWrap:    { ...StyleSheet.absoluteFillObject, alignItems:"center", justifyContent:"center", zIndex:10, paddingHorizontal:32 },
  gateBg:      { ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(248,250,255,0.93)" },
  gateCard:    { backgroundColor:"#FFFFFF", borderRadius:24, padding:28, alignItems:"center", shadowColor:"#000", shadowOffset:{width:0,height:8}, shadowOpacity:0.12, shadowRadius:24, elevation:12, width:"100%" },
  gateIconWrap:{ width:64, height:64, borderRadius:32, backgroundColor:"#FFFBEB", alignItems:"center", justifyContent:"center", marginBottom:16 },
  gateTitle:   { fontFamily:fonts.black, fontSize:22, color:"#0F172A", marginBottom:10 },
  gateDesc:    { fontFamily:fonts.regular, fontSize:14, color:"#64748B", textAlign:"center", lineHeight:22, marginBottom:24 },
  gateBtn:     { flexDirection:"row", alignItems:"center", gap:8, backgroundColor:"#F59E0B", borderRadius:14, paddingHorizontal:28, paddingVertical:14, marginBottom:12 },
  gateBtnTxt:  { fontFamily:fonts.bold, fontSize:15, color:"#0F172A" },
  gateHint:    { fontFamily:fonts.regular, fontSize:11, color:"#64748B" },
});