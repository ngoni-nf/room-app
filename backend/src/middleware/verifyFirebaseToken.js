// backend/src/middleware/verifyFirebaseToken.js
import { auth } from '../firebaseAdmin.js';

/**
 * Middleware to verify Firebase ID tokens
 * Extracts token from Authorization header and validates it
 * Attaches decoded user data to req.user
 */
export default async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid Authorization header. Format: Bearer <token>'
      });
    }
    
    const idToken = authHeader.substring('Bearer '.length).trim();
    
    // Verify the token with Firebase Auth
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Attach user data to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      phone_number: decodedToken.phone_number || null,
      email_verified: decodedToken.email_verified || false,
      iat: decodedToken.iat,
      exp: decodedToken.exp
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    
    let statusCode = 401;
    let message = 'Invalid token';
    
    if (error.code === 'auth/id-token-expired') {
      message = 'Token has expired';
    } else if (error.code === 'auth/invalid-id-token') {
      message = 'Token is malformed or invalid';
    } else if (error.code === 'auth/argument-error') {
      message = 'Token format is incorrect';
    }
    
    return res.status(statusCode).json({
      error: 'Token Verification Failed',
      message,
      code: error.code
    });
  }
}
