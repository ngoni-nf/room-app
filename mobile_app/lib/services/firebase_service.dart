import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'firebase_options.dart';

/// Firebase Service
/// Handles all Firebase Firestore and Authentication operations
class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();

  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _db = FirebaseFirestore.instance;

  FirebaseService._internal();

  factory FirebaseService() {
    return _instance;
  }

  /// Initialize Firebase
  /// Must be called in main() before runApp()
  static Future<void> initialize() async {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
  }

  // ==================== AUTHENTICATION ====================
  /// Sign up with phone number
  /// Returns verification ID for OTP confirmation
  Future<String?> signUpWithPhone(String phoneNumber) async {
    try {
      String? verificationId;
      await _auth.verifyPhoneNumber(
        phoneNumber: phoneNumber,
        timeout: const Duration(seconds: 60),
        verificationCompleted: (PhoneAuthCredential credential) async {
          await _auth.signInWithCredential(credential);
        },
        verificationFailed: (FirebaseAuthException e) {
          print('Verification failed: ${e.message}');
        },
        codeSent: (String vId, int? resendToken) {
          verificationId = vId;
        },
        codeAutoRetrievalTimeout: (String vId) {
          verificationId = vId;
        },
      );
      return verificationId;
    } catch (e) {
      print('Error in signUpWithPhone: $e');
      return null;
    }
  }

  /// Sign in with OTP code
  Future<bool> verifyOTP(String verificationId, String otp) async {
    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: verificationId,
        smsCode: otp,
      );
      await _auth.signInWithCredential(credential);
      return true;
    } catch (e) {
      print('Error verifying OTP: $e');
      return false;
    }
  }

  // ==================== BOOKING OPERATIONS ====================
  /// Create a new booking in Firestore
  Future<String?> createBooking(Map<String, dynamic> bookingData) async {
    try {
      final docRef = await _db.collection('bookings').add({
        ...bookingData,
        'createdAt': FieldValue.serverTimestamp(),
        'status': 'pending',
      });
      return docRef.id;
    } catch (e) {
      print('Error creating booking: $e');
      return null;
    }
  }

  /// Get live dispatch bookings (for admin)
  Stream<QuerySnapshot> getLiveDispatch() {
    return _db
        .collection('bookings')
        .where('status', whereIn: ['pending', 'confirmed', 'en_route'])
        .orderBy('createdAt', descending: true)
        .snapshots();
  }

  /// Update booking status
  Future<bool> updateBookingStatus(String bookingId, String status) async {
    try {
      await _db.collection('bookings').doc(bookingId).update({
        'status': status,
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return true;
    } catch (e) {
      print('Error updating booking: $e');
      return false;
    }
  }

  // ==================== STAFF OPERATIONS ====================
  /// Get staff job queue
  Stream<QuerySnapshot> getStaffJobs(String staffId) {
    return _db
        .collection('bookings')
        .where('staffId', isEqualTo: staffId)
        .where('status', whereNotIn: ['completed', 'cancelled'])
        .snapshots();
  }

  /// Get current user
  User? getCurrentUser() {
    return _auth.currentUser;
  }

  /// Sign out
  Future<void> signOut() async {
    await _auth.signOut();
  }
}
