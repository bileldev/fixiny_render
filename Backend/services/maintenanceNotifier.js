const prisma = require('../config/prisma');
const cron = require('node-cron');

const checkMaintenanceNotifications = async () => {
  try {

    // 1. Get all UPCOMING and OVERDUE maintenances with their related data
    const maintenances = await prisma.maintenance.findMany({
      where: {
        status: { in: ['UPCOMING', 'OVERDUE'] }
      },
      include: {
        car: {
          include: {
            zone: {
              include: {
                chef_park: true
              }
            }
          }
        }
      }
    });


    // 2. Get platform admin
    const platformAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!platformAdmin) {
      console.warn('No platform admin found');
      return;
    }

    for (const maintenance of maintenances) {
      // Skip if car isn't assigned to a zone with a chef_park
      if (!maintenance.car.zone?.chef_park_id) continue;

      // Determine notification type based on maintenance status
      const notificationType = maintenance.status === 'OVERDUE' 
        ? 'MAINTENANCE_OVERDUE' 
        : 'MAINTENANCE_UPCOMING';

      const adminNotificationType = maintenance.status === 'OVERDUE' 
        ? 'MAINTENANCE_OVERDUE_ADMIN' 
        : 'MAINTENANCE_UPCOMING_ADMIN';

      // Check if notification already exists
      const existingNotification = await prisma.notification.findFirst({
        where: {
          OR: [
            { user_id: maintenance.car.zone.chef_park_id },
            { user_id: platformAdmin.id }
          ],
          title: { contains: maintenance.description },
          message: { contains: maintenance.car.licensePlate },
          isRead: false
        }
      });

      if (!existingNotification) {
        // Notify chef_park
        await prisma.notification.create({
          data: {
            title: `${maintenance.status} Maintenance: ${maintenance.description}`,
            message: `Car ${maintenance.car.licensePlate} in ${maintenance.car.zone.zone_name} has ${maintenance.status.toLowerCase()} maintenance (Due at ${maintenance.recordedMileage} km)`,
            type: notificationType,
            user_id: maintenance.car.zone.chef_park_id
          }
        });

        // Notify platform admin
        await prisma.notification.create({
          data: {
            title: `${maintenance.status} Maintenance: ${maintenance.description}`,
            message: `Car ${maintenance.car.licensePlate} in ${maintenance.car.zone.zone_name} has ${maintenance.status.toLowerCase()} maintenance`,
            type: adminNotificationType,
            user_id: platformAdmin.id
          }
        });
      }
    }

  } catch (error) {
    console.error('Error in maintenance notifier:', error);
  } finally {
    await prisma.$disconnect();
  }
};

cron.schedule('* * * * *', () => {
  checkMaintenanceNotifications().catch(console.error);
});

module.exports = { checkMaintenanceNotifications };