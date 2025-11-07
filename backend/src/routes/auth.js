// auth.js - Authentication endpoints for user registration and profile management

import express from 'express';
import verifyFirebaseToken from '../middleware/verifyFirebaseToken.js';
import { firestore } from '../firebaseAdmin.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Body (JSON): { name, role, ... }
 * Client must include header: Authorization: Bearer <idToken>
 *
 * This endpoint will:
 * - verify token via middleware
 * - create or update a user profile in Firestore at collection 'users' with doc id = uid
 */
router.post('/register', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, role = 'customer', bio, location } = req.body;
    
    // Validate input
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required and must be a string' });
    }
    
    const userRef = firestore.collection('users').doc(uid);
    const now = new Date();
    const doc = await userRef.get();
    
    const data = {
      name,
      role,
      bio: bio || '',
      phone: req.user.phone || null,
      email: req.user.email || null,
      location: location || null,
      updatedAt: now,
    };
    
    if (!doc.exists) {
      data.createdAt = now;
    }
    
    await userRef.set(data, { merge: true });
    const userDoc = await userRef.get();
    
    res.json({ ok: true, user: userDoc.data() });
  } catch (err) {
    console.error('register error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/auth/me
 * Headers: Authorization: Bearer <idToken>
 * 
 * Returns the authenticated user's profile
 */
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await firestore.collection('users').doc(uid).get();
    
    if (!doc.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    return res.json({ user: doc.data() });
  } catch (err) {
    console.error('auth/me error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * PUT /api/auth/profile
 * Headers: Authorization: Bearer <idToken>
 * Body: { name, bio, location }
 * 
 * Updates user profile information
 */
router.put('/profile', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { name, bio, location } = req.body;
    
    const updateData = { updatedAt: new Date() };
    
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (location !== undefined) updateData.location = location;
    
    const userRef = firestore.collection('users').doc(uid);
    await userRef.update(updateData);
    
    const doc = await userRef.get();
    res.json({ ok: true, user: doc.data() });
  } catch (err) {
    console.error('profile update error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
