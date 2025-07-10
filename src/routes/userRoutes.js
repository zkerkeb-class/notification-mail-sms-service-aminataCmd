const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

/**
 * @route   POST /api/users/register
 * @desc    Enregistre un utilisateur avec juste son email
 * @access  Public
 * @body    { email: string }
 */
router.post('/register', userController.registerUser);

/**
 * @route   POST /api/users/register-multiple
 * @desc    Enregistre plusieurs utilisateurs avec leurs emails
 * @access  Public
 * @body    { emails: string[] }
 */
router.post('/register-multiple', userController.registerMultipleUsers);

/**
 * @route   POST /api/users/resend-welcome
 * @desc    Renvoie un email de bienvenue
 * @access  Public
 * @body    { email: string }
 */
router.post('/resend-welcome', userController.resendWelcomeEmail);

module.exports = router; 