const SibApiV3Sdk = require('sib-api-v3-sdk');

/**
 * Service de gestion des emails avec l'API Brevo (ex-Sendinblue)
 */
class EmailService {
  constructor() {
    this.apiInstance = null;
    this.initBrevoClient();
  }

  /**
   * Initialise le client Brevo avec la clé API
   */
  initBrevoClient() {
    try {
      // Configuration du client par défaut
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      
      // Configuration de la clé API
      const apiKey = defaultClient.authentications['api-key'];
      apiKey.apiKey = process.env.BREVO_API_KEY;

      // Création de l'instance pour les emails transactionnels
      this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

      console.log('✅ Client Brevo configuré avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la configuration du client Brevo:', error);
      throw new Error('Impossible de configurer le service email Brevo');
    }
  }

  /**
   * Vérifie la validité de la clé API Brevo
   */
  async verifyConnection() {
    try {
      // On utilise l'API Account pour vérifier la connexion
      const accountApi = new SibApiV3Sdk.AccountApi();
      await accountApi.getAccount();
      
      console.log('✅ Connexion Brevo vérifiée');
      return true;
    } catch (error) {
      console.error('❌ Erreur de connexion Brevo:', error.message);
      return false;
    }
  }

  /**
   * Envoie un email à une seule adresse via l'API transactionnelle Brevo
   */
  async sendSingleEmail(to, subject, content) {
    try {
      // Préparation de l'email transactionnel
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = content.replace(/\n/g, '<br>'); // Conversion simple text vers HTML
      sendSmtpEmail.textContent = content;
      sendSmtpEmail.sender = {
        name: process.env.DEFAULT_FROM_NAME || 'Service Tournoi',
        email: process.env.DEFAULT_FROM_EMAIL,
      };
      sendSmtpEmail.to = [{ email: to }];

      // Envoi de l'email
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log(`✅ Email envoyé avec succès à ${to} - ID: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        email: to,
      };
    } catch (error) {
      console.error(`❌ Échec d'envoi à ${to}:`, error.message);
      
      return {
        success: false,
        error: this.formatBrevoError(error),
        email: to,
      };
    }
  }

  /**
   * Envoie des emails à plusieurs adresses avec gestion des succès/échecs
   */
  async sendBulkEmails(emailAddresses, subject, content) {
    const results = {
      total: emailAddresses.length,
      success: [],
      failed: [],
      summary: {
        successCount: 0,
        failedCount: 0,
      },
    };

    console.log(`📧 Début de l'envoi de ${emailAddresses.length} emails via Brevo...`);

    // Traitement de chaque email individuellement
    for (const email of emailAddresses) {
      try {
        const result = await this.sendSingleEmail(email, subject, content);
        
        if (result.success) {
          results.success.push({
            email: result.email,
            messageId: result.messageId,
          });
          results.summary.successCount++;
        } else {
          results.failed.push({
            email: result.email,
            error: result.error,
          });
          results.summary.failedCount++;
        }

        // Pause entre les envois pour respecter les limites de débit
        await this.delay(200);
      } catch (error) {
        console.error(`❌ Erreur inattendue pour ${email}:`, error);
        
        results.failed.push({
          email: email,
          error: 'Erreur inattendue lors de l\'envoi',
        });
        results.summary.failedCount++;
      }
    }

    console.log(`📊 Envoi terminé - Succès: ${results.summary.successCount}, Échecs: ${results.summary.failedCount}`);
    
    return results;
  }

  /**
   * Envoie un email en lot optimisé (utilise l'API batch de Brevo)
   */
  async sendBatchEmails(emailAddresses, subject, content) {
    try {
      console.log(`📧 Envoi en lot de ${emailAddresses.length} emails via Brevo...`);

      // Préparation de l'email transactionnel
      const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
      
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = content.replace(/\n/g, '<br>');
      sendSmtpEmail.textContent = content;
      sendSmtpEmail.sender = {
        name: process.env.DEFAULT_FROM_NAME || 'Service Tournoi',
        email: process.env.DEFAULT_FROM_EMAIL,
      };
      
      // Conversion des emails en format Brevo
      sendSmtpEmail.to = emailAddresses.map(email => ({ email: email }));

      // Envoi en lot
      const result = await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      
      console.log(`✅ Envoi en lot réussi - ID: ${result.messageId}`);
      
      return {
        total: emailAddresses.length,
        success: emailAddresses.map(email => ({
          email: email,
          messageId: result.messageId,
        })),
        failed: [],
        summary: {
          successCount: emailAddresses.length,
          failedCount: 0,
        },
      };
    } catch (error) {
      console.error('❌ Échec de l\'envoi en lot:', error.message);
      
      // En cas d'échec du lot, on fait un envoi individuel
      console.log('🔄 Basculement vers l\'envoi individuel...');
      return await this.sendBulkEmails(emailAddresses, subject, content);
    }
  }

  /**
   * Fonction utilitaire pour créer une pause
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Formate les erreurs Brevo en messages lisibles
   */
  formatBrevoError(error) {
    if (error.response && error.response.body) {
      const body = error.response.body;
      if (body.message) {
        return body.message;
      }
      if (body.error) {
        return body.error;
      }
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'Erreur inconnue lors de l\'envoi';
  }

  /**
   * Valide la configuration Brevo
   */
  validateConfiguration() {
    const requiredVars = ['BREVO_API_KEY', 'DEFAULT_FROM_EMAIL'];
    const missing = requiredVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(`Variables d'environnement manquantes : ${missing.join(', ')}`);
    }

    if (!process.env.BREVO_API_KEY.startsWith('xkeysib-')) {
      throw new Error('Format de clé API Brevo invalide (doit commencer par "xkeysib-")');
    }

    return true;
  }

  /**
   * Récupère les informations du compte Brevo
   */
  async getAccountInfo() {
    try {
      const accountApi = new SibApiV3Sdk.AccountApi();
      const accountInfo = await accountApi.getAccount();
      
      return {
        email: accountInfo.email,
        firstName: accountInfo.firstName,
        lastName: accountInfo.lastName,
        companyName: accountInfo.companyName,
        plan: accountInfo.plan,
        credits: accountInfo.credits,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des infos compte:', error);
      throw new Error('Impossible de récupérer les informations du compte');
    }
  }
}

module.exports = EmailService; 