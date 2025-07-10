const express = require('express');
const emailController = require('../controllers/emailController');

const router = express.Router();

/**
 * POST /api/email/send
 * Envoie des notifications de tournoi par email
 * 
 * Body attendu:
 * {
 *   "to": ["email1@example.com", "email2@example.com"],
 *   "tournament": {
 *     "name": "Tournoi de Tennis",
 *     "start_date": "2024-03-15T10:00:00.000Z",
 *     "start_time": "10:00",
 *     "match_duration_minutes": 90,
 *     "courts_available": 4
 *   },
 *   "customMessage": "Message personnalisé optionnel"
 * }
 */
router.post('/send', emailController.sendTournamentNotification);

/**
 * GET /api/email/test
 * Teste la connexion SMTP
 */
router.get('/test', emailController.testConnection);

/**
 * GET /api/email/info
 * Récupère les informations sur le service
 */
router.get('/info', emailController.getServiceInfo);

/**
 * GET /api/email/account
 * Récupère les informations détaillées du compte Brevo
 */
router.get('/account', emailController.getAccountInfo);

module.exports = router; 