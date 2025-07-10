require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const emailRoutes = require('./routes/emailRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de sécurité
app.use(helmet());
app.use(cors(
  {
    allowedHeaders: ['Content-Type', 'Authorization'],
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
  }
));

// Middlewares pour le parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/email', emailRoutes);
app.use('/api/user', userRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Service de notification opérationnel',
    timestamp: new Date().toISOString(),
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
});

// Gestion globale des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`);
  console.log(`📧 Service de notification prêt !`);
}); 