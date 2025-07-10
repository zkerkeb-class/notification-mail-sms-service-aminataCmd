const EmailService = require('../services/emailService');
const { EmailRequest } = require('../models/EmailModel');

const emailService = new EmailService();

/**
 * Contrôleur pour la gestion des emails
 */
class EmailController {
  /**
   * Envoie des emails de notification de tournoi
   */
  async sendTournamentNotification(req, res) {
    try {
      console.log('📥 Nouvelle demande d\'envoi d\'email reçue');
      console.log('Données reçues:', JSON.stringify(req.body, null, 2));

      // Validation de la configuration du service
      emailService.validateConfiguration();

      // Création et validation de la demande d'email
      const emailRequest = new EmailRequest(req.body);
      emailRequest.validate();

      // Génération du contenu et du sujet
      const subject = emailRequest.generateEmailSubject();
      const content = emailRequest.generateEmailContent();

      console.log(`📝 Sujet: ${subject}`);
      console.log(`👥 Nombre de destinataires: ${emailRequest.to.length}`);

      // Vérification de la connexion Brevo avant l'envoi
      const isConnected = await emailService.verifyConnection();
      if (!isConnected) {
        return res.status(500).json({
          success: false,
          message: 'Impossible de se connecter à l\'API Brevo',
          error: 'Vérifiez la clé API Brevo',
        });
      }

      // Envoi des emails
      const results = await emailService.sendBulkEmails(
        emailRequest.to,
        subject,
        content
      );

      // Construction de la réponse
      const response = {
        success: true,
        message: 'Envoi d\'emails terminé',
        data: {
          tournament: emailRequest.tournament.name,
          results: results,
          timestamp: new Date().toISOString(),
        },
      };

      // Statut de réponse selon les résultats
      const statusCode = results.summary.failedCount === 0 ? 200 : 207; // 207 = Multi-Status

      console.log('📤 Réponse envoyée avec succès');
      
      res.status(statusCode).json(response);
    } catch (error) {
      console.error('❌ Erreur dans sendTournamentNotification:', error);

      // Gestion des erreurs de validation
      if (error.message.includes('Données invalides')) {
        return res.status(400).json({
          success: false,
          message: 'Erreur de validation',
          error: error.message,
        });
      }

      // Gestion des erreurs de configuration
      if (error.message.includes('Variables d\'environnement manquantes')) {
        return res.status(500).json({
          success: false,
          message: 'Erreur de configuration du serveur',
          error: 'Configuration Brevo incomplète',
        });
      }

      // Autres erreurs
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur inattendue s\'est produite',
      });
    }
  }

  /**
   * Teste la connexion Brevo
   */
  async testConnection(req, res) {
    try {
      console.log('🔍 Test de connexion Brevo demandé');

      // Validation de la configuration
      emailService.validateConfiguration();

      // Test de la connexion
      const isConnected = await emailService.verifyConnection();

      if (isConnected) {
        // Récupération des infos du compte si possible
        try {
          const accountInfo = await emailService.getAccountInfo();
          res.status(200).json({
            success: true,
            message: 'Connexion Brevo opérationnelle',
            data: {
              account: {
                email: accountInfo.email,
                plan: accountInfo.plan,
                credits: accountInfo.credits,
              },
            },
            timestamp: new Date().toISOString(),
          });
        } catch (infoError) {
          // Si on ne peut pas récupérer les infos, on retourne juste la connexion OK
          res.status(200).json({
            success: true,
            message: 'Connexion Brevo opérationnelle',
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        res.status(500).json({
          success: false,
          message: 'Échec de connexion Brevo',
          error: 'Vérifiez la clé API Brevo',
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors du test de connexion:', error);

      if (error.message.includes('Variables d\'environnement manquantes')) {
        return res.status(500).json({
          success: false,
          message: 'Configuration Brevo incomplète',
          error: error.message,
        });
      }

      if (error.message.includes('Format de clé API Brevo invalide')) {
        return res.status(500).json({
          success: false,
          message: 'Clé API Brevo invalide',
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors du test de connexion',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne',
      });
    }
  }

  /**
   * Renvoie les informations sur le service
   */
  getServiceInfo(req, res) {
    try {
      const info = {
        service: 'Notification Service',
        version: '1.0.0',
        description: 'Service d\'envoi d\'emails pour les tournois',
        features: [
          'Envoi d\'emails en lot (max 100)',
          'Gestion des succès/échecs',
          'Templates personnalisés',
          'Validation des données',
        ],
        endpoints: {
          'POST /api/email/send': 'Envoie des notifications de tournoi',
          'GET /api/email/test': 'Teste la connexion Brevo',
          'GET /api/email/info': 'Informations sur le service',
          'GET /api/email/account': 'Informations du compte Brevo',
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json({
        success: true,
        data: info,
      });
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des infos:', error);
      
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des informations',
      });
    }
  }

  /**
   * Récupère les informations détaillées du compte Brevo
   */
  async getAccountInfo(req, res) {
    try {
      console.log('📊 Récupération des informations du compte Brevo');

      // Validation de la configuration
      emailService.validateConfiguration();

      // Récupération des informations du compte
      const accountInfo = await emailService.getAccountInfo();

      res.status(200).json({
        success: true,
        message: 'Informations du compte récupérées',
        data: {
          account: accountInfo,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des infos du compte:', error);

      if (error.message.includes('Variables d\'environnement manquantes')) {
        return res.status(500).json({
          success: false,
          message: 'Configuration Brevo incomplète',
          error: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des informations du compte',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne',
      });
    }
  }
}

module.exports = new EmailController(); 