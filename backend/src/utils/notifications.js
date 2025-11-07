// notifications.js - Firebase Cloud Messaging (FCM) push notification utilities

import { messaging, firestore } from '../firebaseAdmin.js';

/**
 * Send a booking notification to a stylist
 * @param {string} stylistUid - Stylist's Firebase UID
 * @param {object} payload - Notification payload with title, body, data
 * @returns {Promise} - Firebase messaging response
 */
export async function sendBookingNotificationToStylist(stylistUid, payload) {
  try {
    if (!stylistUid) {
      throw new Error('stylistUid is required');
    }
    
    // Get stylist's user document to retrieve device tokens
    const doc = await firestore.collection('users').doc(stylistUid).get();
    
    if (!doc.exists) {
      console.warn(`Stylist ${stylistUid} not found in database`);
      return false;
    }
    
    const userData = doc.data();
    const tokens = userData?.deviceTokens || [];
    
    // If no device tokens, user hasn't registered any devices yet
    if (!tokens || tokens.length === 0) {
      console.log(`No device tokens for stylist ${stylistUid}`);
      return false;
    }
    
    // Construct message for multicast (multiple devices)
    const message = {
      notification: {
        title: payload.title || 'New Notification',
        body: payload.body || 'You have a new message',
      },
      data: payload.data || {},
      tokens, // FCM will send to all tokens in the array
    };
    
    // Send to all registered devices
    const resp = await messaging.sendMulticast(message);
    
    console.log(`Notification sent to ${resp.successCount} devices for stylist ${stylistUid}`);
    
    // Log any failures (e.g., invalid tokens)
    if (resp.failureCount > 0) {
      console.error(`Failed to send to ${resp.failureCount} devices:`, resp.responses);
      
      // Clean up invalid tokens
      await cleanupInvalidTokens(stylistUid, resp);
    }
    
    return resp;
  } catch (err) {
    console.error('FCM send error', err);
    throw err;
  }
}

/**
 * Remove invalid device tokens from a user's record
 * Invalid tokens indicate the app was uninstalled or user revoked notification permission
 * @param {string} stylistUid - Stylist's Firebase UID
 * @param {object} response - Firebase messaging multicast response
 */
async function cleanupInvalidTokens(stylistUid, response) {
  try {
    const invalidTokens = [];
    
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const token = response.tokens?.[idx];
        if (token) {
          invalidTokens.push(token);
        }
      }
    });
    
    if (invalidTokens.length > 0) {
      const userRef = firestore.collection('users').doc(stylistUid);
      await userRef.update({
        deviceTokens: firestore.FieldValue.arrayRemove(...invalidTokens),
      });
      
      console.log(`Cleaned up ${invalidTokens.length} invalid tokens for stylist ${stylistUid}`);
    }
  } catch (err) {
    console.error('Error cleaning up invalid tokens:', err);
    // Don't throw - token cleanup is non-critical
  }
}

/**
 * Register a device token for a user (called from mobile app)
 * @param {string} uid - User's Firebase UID
 * @param {string} token - FCM device token from the mobile app
 */
export async function registerDeviceToken(uid, token) {
  try {
    if (!uid || !token) {
      throw new Error('uid and token are required');
    }
    
    const userRef = firestore.collection('users').doc(uid);
    
    // Add token to user's deviceTokens array (avoid duplicates)
    await userRef.update({
      deviceTokens: firestore.FieldValue.arrayUnion(token),
      updatedAt: new Date(),
    });
    
    console.log(`Device token registered for user ${uid}`);
  } catch (err) {
    console.error('Error registering device token:', err);
    throw err;
  }
}

/**
 * Unregister a device token for a user (called when user logs out)
 * @param {string} uid - User's Firebase UID
 * @param {string} token - FCM device token to remove
 */
export async function unregisterDeviceToken(uid, token) {
  try {
    if (!uid || !token) {
      throw new Error('uid and token are required');
    }
    
    const userRef = firestore.collection('users').doc(uid);
    
    // Remove token from user's deviceTokens array
    await userRef.update({
      deviceTokens: firestore.FieldValue.arrayRemove(token),
      updatedAt: new Date(),
    });
    
    console.log(`Device token unregistered for user ${uid}`);
  } catch (err) {
    console.error('Error unregistering device token:', err);
    throw err;
  }
}

/**
 * Send a test notification to a user (for testing/debugging)
 * @param {string} uid - User's Firebase UID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 */
export async function sendTestNotification(uid, title = 'Test Notification', body = 'This is a test') {
  try {
    const payload = {
      title,
      body,
      data: {
        type: 'TEST',
        timestamp: new Date().toISOString(),
      },
    };
    
    return await sendBookingNotificationToStylist(uid, payload);
  } catch (err) {
    console.error('Error sending test notification:', err);
    throw err;
  }
}

export default {
  sendBookingNotificationToStylist,
  registerDeviceToken,
  unregisterDeviceToken,
  sendTestNotification,
};
