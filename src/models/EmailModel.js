const { z } = require('zod');

/**
 * Schéma de validation pour les données du tournoi
 */
const tournamentSchema = z.object({
  name: z.string().min(3, 'Le nom doit contenir au moins 3 caractères').max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  start_date: z.string().datetime('Format de date invalide (ISO 8601 requis)').or(z.date()),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide (HH:MM requis)'),
  match_duration_minutes: z.number().int('La durée doit être un nombre entier').min(10, 'Durée minimale : 10 minutes').max(300, 'Durée maximale : 300 minutes'),
  courts_available: z.number().int('Le nombre de terrains doit être un nombre entier').min(1, 'Minimum 1 terrain').max(50, 'Maximum 50 terrains'),
});

/**
 * Schéma de validation pour la requête d'envoi d'email
 */
const emailRequestSchema = z.object({
  to: z.array(z.string().email('Email invalide'))
    .min(1, 'Au moins un email requis')
    .max(100, 'Maximum 100 emails autorisés'),
  tournament: tournamentSchema,
  customMessage: z.string().max(500, 'Message personnalisé limité à 500 caractères').optional(),
});

/**
 * Classe pour représenter une demande d'envoi d'email
 */
class EmailRequest {
  constructor(data) {
    this.to = data.to;
    this.tournament = data.tournament;
    this.customMessage = data.customMessage || '';
  }

  /**
   * Valide les données de la requête avec Zod
   */
  validate() {
    try {
      const validatedData = emailRequestSchema.parse(this);
      return validatedData;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Données invalides : ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  }

  /**
   * Validation sécurisée qui retourne le résultat sans lever d'exception
   */
  safeValidate() {
    const result = emailRequestSchema.safeParse(this);
    if (!result.success) {
      const errorMessages = result.error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return {
        success: false,
        error: `Données invalides : ${errorMessages.join(', ')}`,
        data: null,
      };
    }
    return {
      success: true,
      error: null,
      data: result.data,
    };
  }

  /**
   * Génère le contenu de l'email à partir du template
   */
  generateEmailContent() {
    // Conversion de la date si elle est en string
    const startDate = typeof this.tournament.start_date === 'string' 
      ? new Date(this.tournament.start_date) 
      : this.tournament.start_date;

    const baseMessage = `
<p>Bonjour,</p>
<p>Nous avons le plaisir de vous confirmer votre inscription au tournoi <b>${this.tournament.name}</b>.</p>
<p>Détails du tournoi :</p>
<ul>
  <li>Date : ${startDate.toLocaleDateString('fr-FR')}</li>
  <li>Heure : ${this.tournament.start_time}</li>
  <li>Lieu : À confirmer</li>
  <li>Durée des matchs : ${this.tournament.match_duration_minutes} minutes</li>
  <li>Nombre de terrains : ${this.tournament.courts_available}</li>
</ul>

<p>Votre équipe a été enregistrée avec succès. Nous vous contacterons prochainement avec plus d'informations sur le déroulement du tournoi.</p>
`;

    if (this.customMessage && this.customMessage.trim()) {
      return `${baseMessage}\n\n<p>Message personnalisé :</p>\n${this.customMessage}\n\n<p>Cordialement,</p>\n<p>L'équipe d'organisation</p>`;
    }

    return `${baseMessage}\n\n<p>Cordialement,</p>\n<p>L'équipe d'organisation</p>`;
  }

  /**
   * Génère le sujet de l'email
   */
  generateEmailSubject() {
    return `Confirmation d'inscription - Tournoi ${this.tournament.name}`;
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

  /**
   * Méthode statique pour valider un tableau d'emails
   */
  static validateEmails(emails) {
    try {
      z.array(z.string().email()).min(1).max(100).parse(emails);
      return { isValid: true, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => err.message);
        return { isValid: false, error: errorMessages.join(', ') };
      }
      return { isValid: false, error: 'Erreur de validation des emails' };
    }
  }
}

module.exports = {
  EmailRequest,
  emailRequestSchema,
  tournamentSchema,
}; 