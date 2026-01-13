IMPLEMENTATION_CHECKLIST.md# Room App - Production Implementation Checklist

## Current Status
✅ **MVP Complete** - Flutter app with Client, Staff, and Admin interfaces
✅ **Code Tested** - All UIs verified on DartPad
✅ **Firebase Service** - Firestore and Authentication implementation ready
✅ **Production Guide** - Comprehensive 290+ line setup documentation created

---

## PHASE 1: Firebase Project Setup
### Status: NOT STARTED

### Tasks:
- [ ] **1.1** Go to [Firebase Console](https://console.firebase.google.com/)
- [ ] **1.2** Click "Add Project"
- [ ] **1.3** Name: `room-app-sa`
- [ ] **1.4** Disable Google Analytics
- [ ] **1.5** Click "Create Project" (wait 5-10 minutes)

### Enable Phone Authentication:
- [ ] **1.6** Go to Build > Authentication
- [ ] **1.7** Click "Get Started"
- [ ] **1.8** Click "Phone" sign-in method
- [ ] **1.9** Enable toggle
- [ ] **1.10** Add test numbers:
  - Phone: +27 123456789
  - OTP Code: 123456
- [ ] **1.11** Save

### Enable Firestore Database:
- [ ] **1.12** Go to Build > Firestore Database
- [ ] **1.13** Click "Create Database"
- [ ] **1.14** Location: `europe-west1` (Europe, closest to South Africa)
- [ ] **1.15** Select "Start in Production Mode"
- [ ] **1.16** Click "Create"

### Apply Security Rules:
- [ ] **1.17** Go to Firestore > Rules tab
- [ ] **1.18** Copy rules from PRODUCTION_SETUP_GUIDE.md
- [ ] **1.19** Paste and Publish

### Download Configuration Files:
#### Android:
- [ ] **1.20** Go to Project Settings > General tab
- [ ] **1.21** Scroll to "Your apps" section
- [ ] **1.22** Click "Google Play" or add Android app
- [ ] **1.23** Download `google-services.json`
- [ ] **1.24** Place in: `mobile_app/android/app/`

#### iOS:
- [ ] **1.25** Add iOS app in Firebase Console
- [ ] **1.26** Download `GoogleService-Info.plist`
- [ ] **1.27** Add to Xcode project: `ios/Runner/`

---

## PHASE 2: Google Cloud Maps Setup
### Status: NOT STARTED

### Create Project:
- [ ] **2.1** Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] **2.2** Create new project (name: `room-app-maps`)
- [ ] **2.3** Link to same billing account as Firebase

### Enable APIs:
- [ ] **2.4** Search "Maps SDK for Android"
- [ ] **2.5** Click "Enable"
- [ ] **2.6** Search "Maps SDK for iOS"
- [ ] **2.7** Click "Enable"
- [ ] **2.8** Search "Places API"
- [ ] **2.9** Click "Enable"
- [ ] **2.10** Search "Geocoding API"
- [ ] **2.11** Click "Enable"
- [ ] **2.12** Search "Directions API"
- [ ] **2.13** Click "Enable"

### Create API Keys:
- [ ] **2.14** Go to Credentials
- [ ] **2.15** Click "Create Credentials" > "API Key"
- [ ] **2.16** Name: `Android-API-Key`
- [ ] **2.17** Click "Edit API Key"
- [ ] **2.18** Application restrictions: Android apps
- [ ] **2.19** Add Package name: `com.room.app` (or your package)
- [ ] **2.20** Add SHA-1 certificate fingerprint
  - Get from: `keytool -list -v -keystore ~/.android/debug.keystore`
- [ ] **2.21** API restrictions: Select Maps APIs
- [ ] **2.22** Save

- [ ] **2.23** Create second key for iOS
- [ ] **2.24** Name: `iOS-API-Key`
- [ ] **2.25** Application restrictions: iOS apps
- [ ] **2.26** Bundle ID: `com.room.app` (or your bundle ID)

### Add to App:
#### Android (`android/app/src/main/AndroidManifest.xml`):
- [ ] **2.27** Add meta-data:
```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_ANDROID_API_KEY" />
```

#### iOS (`ios/Runner/Info.plist`):
- [ ] **2.28** Add key:
```xml
<key>com.google.maps.webApiKey</key>
<string>YOUR_IOS_API_KEY</string>
```

---

## PHASE 3: PayStack Payment Setup
### Status: NOT STARTED

### Create Account:
- [ ] **3.1** Go to [PayStack.com](https://paystack.com/)
- [ ] **3.2** Click "Get Started"
- [ ] **3.3** Register with email
- [ ] **3.4** Verify email
- [ ] **3.5** Complete profile:
  - [ ] Full name
  - [ ] Phone number
  - [ ] Business type: Beauty/Salon Services
  - [ ] Business location: South Africa

### Verify Identity:
- [ ] **3.6** Upload ID document (Passport or ID card)
- [ ] **3.7** Upload bank account details
- [ ] **3.8** Wait for approval (24-48 hours)

### Get API Keys:
- [ ] **3.9** Go to Dashboard > Settings > API Keys & Webhooks
- [ ] **3.10** Copy Public Key
- [ ] **3.11** Copy Secret Key

### Store Keys Securely:
- [ ] **3.12** Create `.env` file in `mobile_app/`:
```
PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_SECRET_KEY=sk_live_xxx
GOOGLE_MAPS_API_KEY=AIzaSy...
```
- [ ] **3.13** Add `.env` to `.gitignore`
- [ ] **3.14** Install `flutter_dotenv`
- [ ] **3.15** Load in app initialization

### Test Mode:
- [ ] **3.16** Test card: 4084084084084081
- [ ] **3.17** Expiry: 12/25
- [ ] **3.18** CVV: 408
- [ ] **3.19** OTP (when prompted): 123456

---

## PHASE 4: Testing
### Status: NOT STARTED

### SMS OTP Authentication:
- [ ] **4.1** Build app: `flutter build apk`
- [ ] **4.2** Install on Android device
- [ ] **4.3** Test phone login with test number (+27 123456789)
- [ ] **4.4** Verify OTP SMS is received
- [ ] **4.5** Enter OTP code (123456)
- [ ] **4.6** Verify successful authentication

### Google Maps Integration:
- [ ] **4.7** Test location pinning
- [ ] **4.8** Test address autocomplete
- [ ] **4.9** Verify map displays correctly
- [ ] **4.10** Test directions to location
- [ ] **4.11** Test gate code display

### PayStack Payment Flow:
- [ ] **4.12** Create test booking
- [ ] **4.13** Proceed to payment
- [ ] **4.14** Test with PayStack test card
- [ ] **4.15** Verify payment confirmation
- [ ] **4.16** Check Firestore booking record

### Firestore Rules:
- [ ] **4.17** Verify security rules are active
- [ ] **4.18** Test unauthorized access blocked
- [ ] **4.19** Test authorized access works
- [ ] **4.20** Verify timestamps are server-side

---

## PHASE 5: App Store Submission
### Status: NOT STARTED

### Google Play Store (Android):
- [ ] **5.1** Create Google Play Developer account ($25 one-time fee)
- [ ] **5.2** Create app listing
- [ ] **5.3** Upload app icon (512x512 PNG)
- [ ] **5.4** Take 5 screenshots
- [ ] **5.5** Write app description
- [ ] **5.6** Build release APK:
  ```bash
  flutter build apk --release
  ```
- [ ] **5.7** Sign APK with release keystore
- [ ] **5.8** Upload signed APK
- [ ] **5.9** Fill content rating questionnaire
- [ ] **5.10** Submit for review (2-3 days)

### Apple App Store (iOS):
- [ ] **5.11** Enroll Apple Developer Program ($99/year)
- [ ] **5.12** Create App ID in Developer Portal
- [ ] **5.13** Create provisioning profiles
- [ ] **5.14** Create App Store Connect entry
- [ ] **5.15** Upload app icon and screenshots
- [ ] **5.16** Write app description
- [ ] **5.17** Build release IPA:
  ```bash
  flutter build ios --release
  ```
- [ ] **5.18** Archive in Xcode Organizer
- [ ] **5.19** Upload to App Store Connect
- [ ] **5.20** Fill in app details
- [ ] **5.21** Submit for review (1-3 days)

---

## PHASE 6: Post-Launch
### Status: NOT STARTED

- [ ] **6.1** Monitor Firebase analytics
- [ ] **6.2** Check Firestore usage and costs
- [ ] **6.3** Monitor PayStack transaction logs
- [ ] **6.4** Set up error reporting
- [ ] **6.5** Create user support documentation
- [ ] **6.6** Monitor app reviews and ratings
- [ ] **6.7** Plan Phase 2 features:
  - Auto-dispatch algorithm
  - In-app chat
  - Loyalty points
  - Analytics dashboard

---

## Key Credentials to Store
```
Firebase Project ID: _______________
Firebase API Key: _______________

Google Cloud Project: _______________
Android API Key: _______________
Android Package Name: com.room.app
Android SHA-1: _______________
iOS API Key: _______________
iOS Bundle ID: _______________

PayStack Public Key: _______________
PayStack Secret Key: _______________

Google Play Developer Email: _______________
Apple Developer Team ID: _______________
```

---

## Troubleshooting Guide

### Firebase Connection Issues
```bash
flutter clean
rm -rf ios/Pods
flutter pub get
flutterfire configure
```

### Maps API Not Working
- Check API key in console.cloud.google.com
- Verify APIs are enabled
- Verify package name and SHA-1 match

### PayStack Test Fails
- Ensure test mode is enabled
- Use exact test card: 4084084084084081
- OTP is always: 123456

---

## Timeline Estimate
- **Phase 1 (Firebase):** 2-3 hours
- **Phase 2 (Google Maps):** 1-2 hours
- **Phase 3 (PayStack):** 1-2 hours (+ 24-48h for verification)
- **Phase 4 (Testing):** 2-3 hours
- **Phase 5 (Submission):** 1-2 hours (+ 2-3 days review time)
- **Total Active Time:** ~9-12 hours
- **Total Calendar Time:** 5-7 days

---

## Success Criteria
✅ SMS OTP working on physical device
✅ Maps displaying correctly with gate codes
✅ Payment processing successfully
✅ Firestore data syncing
✅ Apps available on both app stores
✅ 100+ downloads in first week
✅ 4.5+ star rating
