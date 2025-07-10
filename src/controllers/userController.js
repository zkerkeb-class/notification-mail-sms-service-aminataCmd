const EmailService = require('../services/emailService');
const { UserRegistration } = require('../models/UserModel');

const emailService = new EmailService();

/**
 * Contrôleur simplifié pour la gestion des utilisateurs
 */
class UserController {
  /**
   * Enregistre un nouvel utilisateur avec seulement son email et envoie un email de bienvenue
   */
  async registerUser(req, res) {
    try {
      console.log('👤 Nouvelle demande d\'enregistrement d\'utilisateur');
      console.log('Email reçu:', req.body.email);

      // Validation de la configuration du service email
      emailService.validateConfiguration();

      // Création et validation de l'utilisateur (juste l'email)
      const userRegistration = new UserRegistration(req.body);
      userRegistration.validate();

      console.log(`📧 Enregistrement pour: ${userRegistration.email}`);

      // Génération du contenu et du sujet de l'email
      const subject = userRegistration.generateWelcomeEmailSubject();
      const content = userRegistration.generateWelcomeEmailContent();

      // Vérification de la connexion Brevo avant l'envoi
      const isConnected = await emailService.verifyConnection();
      if (!isConnected) {
        return res.status(500).json({
          success: false,
          message: 'Impossible de se connecter à l\'API Brevo',
          error: 'Vérifiez la clé API Brevo',
        });
      }

      // Envoi de l'email de bienvenue
      const emailResult = await emailService.sendSingleEmail(
        userRegistration.email,
        subject,
        content
      );

      // Construction de la réponse
      if (emailResult.success) {
        const response = {
          success: true,
          message: 'Utilisateur enregistré avec succès',
          data: {
            user: userRegistration.getSummary(),
            email: {
              sent: true,
              messageId: emailResult.messageId,
              recipient: emailResult.email,
            },
            timestamp: new Date().toISOString(),
          },
        };

        console.log('✅ Enregistrement et email envoyés avec succès');
        res.status(201).json(response);
      } else {
        // L'utilisateur est "enregistré" mais l'email a échoué
        const response = {
          success: true,
          message: 'Utilisateur enregistré mais échec de l\'envoi d\'email',
          data: {
            user: userRegistration.getSummary(),
            email: {
              sent: false,
              error: emailResult.error,
              recipient: emailResult.email,
            },
            timestamp: new Date().toISOString(),
          },
        };

        console.log('⚠️ Enregistrement réussi mais échec email');
        res.status(207).json(response); // 207 = Multi-Status
      }
    } catch (error) {
      console.error('❌ Erreur dans registerUser:', error);

      // Gestion des erreurs de validation
      if (error.message.includes('Email invalide')) {
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
        message: 'Erreur lors de l\'enregistrement',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Une erreur inattendue s\'est produite',
      });
    }
  }

  /**
   * Enregistre plusieurs utilisateurs avec seulement leurs emails
   */
  async registerMultipleUsers(req, res) {
    try {
      console.log('👥 Demande d\'enregistrement de plusieurs utilisateurs');
      
      const { emails } = req.body;
      
      if (!Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Un tableau d\'emails est requis',
          error: 'Format de données invalide',
        });
      }

      if (emails.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 100 emails par requête',
          error: 'Limite dépassée',
        });
      }

      console.log(`📋 Traitement de ${emails.length} emails...`);

      // Validation de la configuration du service email
      emailService.validateConfiguration();

      const results = {
        total: emails.length,
        success: [],
        failed: [],
        summary: {
          registeredCount: 0,
          emailsSentCount: 0,
          errorsCount: 0,
        },
      };

      // Traitement de chaque email
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        
        try {
          // Création et validation de l'utilisateur
          const userRegistration = new UserRegistration({ email });
          userRegistration.validate();

          // Génération du contenu email
          const subject = userRegistration.generateWelcomeEmailSubject();
          const content = userRegistration.generateWelcomeEmailContent();

          // Envoi de l'email
          const emailResult = await emailService.sendSingleEmail(
            userRegistration.email,
            subject,
            content
          );

          // Enregistrement du résultat
          results.success.push({
            user: userRegistration.getSummary(),
            email: emailResult.success ? {
              sent: true,
              messageId: emailResult.messageId,
            } : {
              sent: false,
              error: emailResult.error,
            },
          });

          results.summary.registeredCount++;
          if (emailResult.success) {
            results.summary.emailsSentCount++;
          }

          // Pause entre les envois
          await emailService.delay(200);
        } catch (userError) {
          console.error(`❌ Erreur pour l'email ${i + 1}:`, userError.message);
          
          results.failed.push({
            index: i,
            email: email,
            error: userError.message,
          });
          results.summary.errorsCount++;
        }
      }

      console.log(`📊 Traitement terminé - Succès: ${results.summary.registeredCount}, Échecs: ${results.summary.errorsCount}`);

      const response = {
        success: true,
        message: 'Traitement des enregistrements terminé',
        data: {
          results: results,
          timestamp: new Date().toISOString(),
        },
      };

      // Statut selon les résultats
      const statusCode = results.summary.errorsCount === 0 ? 201 : 207;
      res.status(statusCode).json(response);
    } catch (error) {
      console.error('❌ Erreur dans registerMultipleUsers:', error);

      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement des enregistrements',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne',
      });
    }
  }

  /**
   * Renvoie un email de bienvenue à une adresse existante
   */
  async resendWelcomeEmail(req, res) {
    try {
      console.log('🔄 Demande de renvoi d\'email de bienvenue');
      
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email requis',
          error: 'Paramètre manquant',
        });
      }

      // Validation email
      const emailValidation = UserRegistration.validateEmail(email);
      if (!emailValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: 'Email invalide',
          error: emailValidation.error,
        });
      }

      // Création d'un objet utilisateur temporaire pour générer l'email
      const tempUser = new UserRegistration({ email });

      const subject = tempUser.generateWelcomeEmailSubject();
      const content = tempUser.generateWelcomeEmailContent();

      // Envoi de l'email
      const emailResult = await emailService.sendSingleEmail(email, subject, content);

      if (emailResult.success) {
        res.status(200).json({
          success: true,
          message: 'Email de bienvenue renvoyé avec succès',
          data: {
            recipient: email,
            messageId: emailResult.messageId,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Échec du renvoi de l\'email',
          error: emailResult.error,
        });
      }
    } catch (error) {
      console.error('❌ Erreur dans resendWelcomeEmail:', error);

      res.status(500).json({
        success: false,
        message: 'Erreur lors du renvoi de l\'email',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne',
      });
    }
  }
}

module.exports = new UserController(); 