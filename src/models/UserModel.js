const { z } = require('zod');

/**
 * Schéma de validation simple pour l'enregistrement d'un utilisateur
 */
const userRegistrationSchema = z.object({
  email: z.string().email('Format d\'email invalide'),
});

/**
 * Classe simple pour représenter un utilisateur qui s'enregistre
 */
class UserRegistration {
  constructor(data) {
    this.email = data.email;
    this.registrationDate = new Date();
  }

  /**
   * Valide l'email avec Zod
   */
  validate() {
    try {
      const validatedData = userRegistrationSchema.parse(this);
      return validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => err.message);
        throw new Error(`Email invalide : ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Génère le contenu de l'email de confirmation d'enregistrement
   */
  generateWelcomeEmailContent() {
    return `Bonjour,

Bienvenue dans notre communauté sportive ! 🎾

Nous avons le plaisir de confirmer votre inscription sur notre plateforme.

📋 Informations d'inscription :
- Email : ${this.email}
- Date d'inscription : ${this.registrationDate.toLocaleDateString('fr-FR')}

🏆 Prochaines étapes :
- Consultez vos emails régulièrement pour recevoir les invitations aux tournois
- Rejoignez notre communauté pour rencontrer d'autres sportifs
- Participez aux événements organisés

Si vous avez des questions ou besoin d'aide, n'hésitez pas à nous contacter.

Sportivement,
L'équipe d'organisation`;
  }

  /**
   * Génère le sujet de l'email de confirmation
   */
  generateWelcomeEmailSubject() {
    return `Bienvenue ! Votre inscription est confirmée 🎾`;
  }

  /**
   * Retourne un résumé des informations utilisateur
   */
  getSummary() {
    return {
      email: this.email,
      registrationDate: this.registrationDate.toISOString(),
    };
  }

  /**
   * Méthode statique pour valider uniquement un email
   */
  static validateEmail(email) {
    try {
      z.string().email().parse(email);
      return { isValid: true, error: null };
    } catch (error) {
      return { isValid: false, error: 'Format d\'email invalide' };
    }
  }
}

module.exports = {
  UserRegistration,
  userRegistrationSchema,
}; 