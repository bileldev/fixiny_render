const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

class InitService {
  async initializeApplication() {
    try {
      console.log('🔍 Verifying admin user...');
      await this.ensureAdminExists();

      console.log('🔍 Verifying maintenance rules...');
      await this.ensureMaintenanceRulesExist();

      logger.info('🎉 Application initialization completed');

    } catch (error) {
      logger.error('Initialization failed:', error);
      logger.error('❌ INIT ERROR DETAILS:', {
        message: error.message,
        stack: error.stack,
        meta: error.meta || 'No additional metadata'
    });
    throw error;
    }
  }

  async ensureAdminExists() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin.fixiny@gmail.com';
    let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

    if (!admin) {
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin_123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      admin = await prisma.user.create({
        data: {
          firstName: 'Admin',
          lastName: 'Fixiny',
          email: adminEmail,
          phone_number: '+98511245',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'APPROVED',
        },
      });
      logger.info('Admin user created');
    }
  }

  async ensureMaintenanceRulesExist() {
    const defaultRules = [
    { name: 'VIDANGE', description: 'Remplacement régulier de l\'huile moteur', mileageInterval: 10000 },
    { name: 'FILTRE HABITACLE', description: 'Remplacement du filtre à air de l\'habitacle', mileageInterval: 20000 },
    { name: 'FILTRE GASOIL', description: 'Remplacement du filtre à gasoil', mileageInterval: 30000 },
    { name: 'PATIN FREIN', description: 'Vérification et remplacement des plaquettes de frein', mileageInterval: 30000 },
    { name: 'LIQ FREIN', description: 'Vidange et remplacement du liquide de frein', mileageInterval: 40000 },
    { name: 'LIQ REFROIDISSEMENT', description: 'Remplacement du liquide de refroidissement', mileageInterval: 50000 },
    { name: 'POMPE A EAU', description: 'Vérification ou remplacement de la pompe à eau', mileageInterval: 60000 },
    { name: 'DISQUE FREIN', description: 'Contrôle et remplacement des disques de frein', mileageInterval: 70000 },
    { name: 'AMORTISSEUR', description: 'Contrôle et remplacement des amortisseurs', mileageInterval: 80000 },
    { name: 'ROTULE', description: 'Vérification des rotules de direction', mileageInterval: 80000 },
    { name: 'CHAINE', description: 'Contrôle et remplacement de la chaîne de distribution', mileageInterval: 100000 },
    { name: 'COURROIE', description: 'Contrôle et remplacement de la courroie de distribution', mileageInterval: 100000 },
    { name: 'MACHOIR DE FREIN A TOMBOUR', description: 'Remplacement des mâchoires de frein à tambour', mileageInterval: 120000 },
    { name: 'CARDANS + ROULEMENTS', description: 'Vérification des cardans et roulements de roue', mileageInterval: 120000 },
    { name: 'EMBRAYAGE', description: 'Contrôle et remplacement du kit d\'embrayage', mileageInterval: 150000 },
  ];

    for (const rule of defaultRules) {
      await prisma.maintenanceRule.upsert({
        where: { name: rule.name },
        update: {},
        create: rule,
      });
    }
    logger.info('Maintenance rules verified');
  }
}

module.exports = new InitService();