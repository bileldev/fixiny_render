// prisma/seed.js

const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  // Create admin user if not exists
  const adminEmail = 'admin.fixiny@gmail.com';
  let admin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!admin) {
    const hashedPassword = await bcrypt.hash('Admin_123', 10);
    admin = await prisma.user.create({
      data: {
        first_name: 'Admin',
        last_name: 'Fixiny',
        email: adminEmail,
        phone_number: '+98511245',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'APPROVED',
      },
    });
    console.log('Admin user created:', admin);
  } else {
    console.log('Admin user already exists');
  }

  // Create default maintenance rules
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
    const existingRule = await prisma.maintenanceRule.findFirst({
      where: { name: rule.name },
    });

    if (!existingRule) {
      await prisma.maintenanceRule.create({ data: rule });
      console.log(`Created maintenance rule: ${rule.name}`);
    } else {
      console.log(`Maintenance rule already exists: ${rule.name}`);
    }
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });