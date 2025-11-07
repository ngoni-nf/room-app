// bookings.js - Booking management endpoints

import express from 'express';
import verifyFirebaseToken from '../middleware/verifyFirebaseToken.js';
import { firestore } from '../firebaseAdmin.js';
import { sendBookingNotificationToStylist } from '../utils/notifications.js';

const router = express.Router();

/**
 * POST /api/bookings
 * Headers: Authorization: Bearer <idToken>
 * Body: { stylistUid, serviceId, serviceName, dateTime, price, clientNotes }
 * 
 * Creates a new booking and notifies the stylist
 */
router.post('/', verifyFirebaseToken, async (req, res) => {
  try {
    const { stylistUid, serviceId, serviceName, dateTime, price, clientNotes } = req.body;
    
    // Validation
    if (!stylistUid || !serviceId || !dateTime) {
      return res.status(400).json({ error: 'Missing required fields: stylistUid, serviceId, dateTime' });
    }
    
    // Create booking doc
    const bookingRef = firestore.collection('bookings').doc();
    const bookingData = {
      id: bookingRef.id,
      clientUid: req.user.uid,
      stylistUid,
      serviceId,
      serviceName,
      dateTime: new Date(dateTime),
      price: price || 0,
      clientNotes: clientNotes || '',
      status: 'pending',
      createdAt: new Date(),
    };
    
    await bookingRef.set(bookingData);
    
    // Send notification to stylist
    try {
      const notifPayload = {
        title: 'New booking request',
        body: `You have a booking for ${serviceName} at ${new Date(dateTime).toLocaleString()}`,
        data: {
          bookingId: bookingRef.id,
          type: 'NEW_BOOKING',
        },
      };
      await sendBookingNotificationToStylist(stylistUid, notifPayload);
    } catch (notifErr) {
      console.error('Notification send failed (non-critical):', notifErr);
      // Don't fail the booking if notification fails
    }
    
    res.json({ ok: true, booking: bookingData });
  } catch (err) {
    console.error('create booking error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PATCH /api/bookings/:id/status
 * Headers: Authorization: Bearer <idToken>
 * Body: { status }
 * 
 * Updates booking status (accepted/rejected/completed/cancelled)
 * Only stylist or client should be able to update their own booking
 */
router.patch('/:id/status', verifyFirebaseToken, async (req, res) => {
  try {
    const bid = req.params.id;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const bookingRef = firestore.collection('bookings').doc(bid);
    const bookingDoc = await bookingRef.get();
    
    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookingDoc.data();
    
    // Authorization check: only stylist or client can update
    if (req.user.uid !== booking.stylistUid && req.user.uid !== booking.clientUid) {
      return res.status(403).json({ error: 'Not authorized to update this booking' });
    }
    
    // Validate status transition
    const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }
    
    await bookingRef.update({
      status,
      updatedAt: new Date(),
    });
    
    res.json({ ok: true, status });
  } catch (err) {
    console.error('update booking status error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/bookings/user/:uid
 * Headers: Authorization: Bearer <idToken>
 * 
 * Get bookings for a user (can be client or stylist)
 */
router.get('/user/:uid', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.params.uid;
    
    // In production, ensure req.user.uid === uid or user is admin
    if (req.user.uid !== uid) {
      return res.status(403).json({ error: 'Can only view your own bookings' });
    }
    
    // Get bookings where user is client OR stylist
    const clientBookings = await firestore
      .collection('bookings')
      .where('clientUid', '==', uid)
      .orderBy('dateTime', 'desc')
      .get();
    
    const stylistBookings = await firestore
      .collection('bookings')
      .where('stylistUid', '==', uid)
      .orderBy('dateTime', 'desc')
      .get();
    
    const allBookings = [
      ...clientBookings.docs.map(d => d.data()),
      ...stylistBookings.docs.map(d => d.data()),
    ];
    
    // Sort by date
    allBookings.sort((a, b) => b.dateTime - a.dateTime);
    
    res.json({ bookings: allBookings });
  } catch (err) {
    console.error('list bookings error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/bookings/:id
 * Headers: Authorization: Bearer <idToken>
 * 
 * Get a specific booking (only if user is client or stylist)
 */
router.get('/:id', verifyFirebaseToken, async (req, res) => {
  try {
    const bid = req.params.id;
    const bookingDoc = await firestore.collection('bookings').doc(bid).get();
    
    if (!bookingDoc.exists) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const booking = bookingDoc.data();
    
    // Authorization check
    if (req.user.uid !== booking.clientUid && req.user.uid !== booking.stylistUid) {
      return res.status(403).json({ error: 'Not authorized to view this booking' });
    }
    
    res.json({ booking });
  } catch (err) {
    console.error('get booking error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
