# Room App - Production Setup Guide

## Overview
This guide covers the complete setup and deployment of the Room App MVP for the South African market.

## Prerequisites
- Flutter SDK >= 3.0.0
- Dart >= 3.0.0
- Firebase project with Blaze plan (for PayStack integration)
- Google Cloud Console project
- PayStack merchant account
- GitHub account for version control

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: `room-app-sa`
4. Disable Google Analytics
5. Create project

### 1.2 Enable Services

#### Authentication
- Go to Build > Authentication
- Click "Get Started"
- Enable "Phone Number" authentication
- Add test numbers:
  - Phone: +27 123456789
  - OTP Code: 123456

#### Firestore Database
- Go to Build > Firestore Database
- Click "Create Database"
- Location: `europe-west1` (closest to South Africa)
- Start in "Production Mode"

#### Apply Security Rules
Replace default rules with:
```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    
    match /bookings/{bookingId} {
      allow read, write: if isSignedIn();
    }
    
    match /staff/{staffId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && request.auth.uid == staffId;
    }
    
    match /users/{userId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
  }
}
```

### 1.3 Download Configuration Files

#### For Android
1. Go to Project Settings > General
2. Scroll to "Your apps" section
3. Click Android app
4. Download `google-services.json`
5. Place in `android/app/` directory

#### For iOS
1. Add iOS app in Firebase Console
2. Download `GoogleService-Info.plist`
3. Add to Xcode project

## Step 2: Google Maps API Setup

### 2.1 Enable APIs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project (same as Firebase project)
3. Enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API
   - Geocoding API
   - Directions API

### 2.2 Get API Keys
1. Create API key with restrictions:
   - Application restriction: Android and iOS
   - API restriction: Maps APIs

### 2.3 Configure in App

#### Android (`android/app/src/main/AndroidManifest.xml`)
```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_ANDROID_API_KEY" />
```

#### iOS (`ios/Runner/Info.plist`)
```xml
<key>com.google.maps.webApiKey</key>
<string>YOUR_IOS_API_KEY</string>
```

## Step 3: PayStack Payment Gateway

### 3.1 Create Merchant Account
1. Go to [PayStack.com](https://paystack.com/)
2. Create merchant account
3. Verify identity and bank account
4. Get Public Key and Secret Key

### 3.2 Store Keys Securely
1. Do NOT commit keys to GitHub
2. Store in `.env` file (add to `.gitignore`)
3. Access via:
```dart
import 'package:flutter_dotenv/flutter_dotenv.dart';

final publicKey = dotenv.env['PAYSTACK_PUBLIC_KEY']!;
final secretKey = dotenv.env['PAYSTACK_SECRET_KEY']!;
```

### 3.3 Test Mode
- Use test card: 4084084084084081
- Expiry: 12/25
- CVV: 408

## Step 4: Flutter Project Configuration

### 4.1 Install Dependencies
```bash
cd mobile_app
flutter pub get
flutterfire configure
```

### 4.2 Update pubspec.yaml
```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^2.24.0
  firebase_auth: ^4.10.0
  cloud_firestore: ^4.13.0
  google_maps_flutter: ^2.5.0
  paystack_flutter: ^1.0.0
  geolocator: ^9.0.0
  geocoding: ^2.1.0
```

### 4.3 Android Configuration

#### Update `android/build.gradle`
```gradle
buildscript {
  ext {
    kotlin_version = '1.7.10'
  }
}
```

#### Update `android/app/build.gradle`
```gradle
dependencies {
  implementation 'com.google.firebase:firebase-core:32.2.0'
}
```

### 4.4 iOS Configuration

#### Update `ios/Podfile`
```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= [
        '$(inherited)',
        'PERMISSION_LOCATION=1',
      ]
    end
  end
end
```

## Step 5: SMS OTP Authentication

### 5.1 Firebase Phone Authentication Flow
1. User enters phone number
2. Firebase sends OTP via SMS (auto-managed)
3. User enters OTP code
4. Firebase creates session token
5. User is authenticated

### 5.2 Implementation
```dart
final firebaseService = FirebaseService();

// Step 1: Request OTP
final verificationId = await firebaseService.signUpWithPhone('+27123456789');

// Step 2: Verify OTP
final success = await firebaseService.verifyOTP(verificationId, '123456');

if (success) {
  // User authenticated
  final user = firebaseService.getCurrentUser();
}
```

## Step 6: Deployment Checklist

### Before Google Play Store
- [ ] Enable ProGuard/R8 (minification)
- [ ] Test on actual devices (Android 8+)
- [ ] Test payment flow with PayStack test cards
- [ ] Test SMS OTP authentication
- [ ] Test Google Maps integration
- [ ] Verify all Firestore rules work
- [ ] Add app icon and signing certificate

### Google Play Store Submission
1. Build release APK:
   ```bash
   flutter build apk --release
   ```
2. Create App on Google Play Console
3. Upload signed APK
4. Add store listing details
5. Request review (2-3 days)

### Apple App Store Submission
1. Build release IPA:
   ```bash
   flutter build ios --release
   ```
2. Create App on App Store Connect
3. Use Xcode Organizer to upload
4. Add store listing and screenshots
5. Submit for review (1-3 days)

## Step 7: South African Compliance

### POPIA (Protection of Personal Information Act)
- [ ] Privacy policy published
- [ ] Data stored encrypted
- [ ] User consent for location tracking
- [ ] Terms of service established

### Payment Compliance
- [ ] Use PayStack (licensed payment processor)
- [ ] PCI DSS compliance (handled by PayStack)
- [ ] No payment data stored locally

## Troubleshooting

### Firebase Connection Issues
```bash
# Clear Flutter cache
flutter clean
rm -rf ios/Pods
flutter pub get
flutterfire configure
```

### Google Maps Not Loading
- Verify API key is correct
- Check API restrictions in Google Cloud Console
- Ensure APIs are enabled

### PayStack Integration Issues
- Verify keys are correctly set
- Test mode vs. live mode switch
- Check transaction logs in PayStack dashboard

## Support & Documentation

- [Firebase Documentation](https://firebase.flutter.dev/)
- [Google Maps Flutter](https://pub.dev/packages/google_maps_flutter)
- [PayStack Documentation](https://paystack.com/docs/payments)
- [Flutter Deployment Guide](https://docs.flutter.dev/deployment)

## Next Steps

1. Complete Firebase setup
2. Configure Google Maps APIs
3. Set up PayStack merchant account
4. Test on physical devices
5. Submit to app stores
6. Monitor analytics and user feedback
