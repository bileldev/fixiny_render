// controllers/enterpriseController.js
const prisma = require('../config/prisma');

exports.searchEnterprises = async (req, res) => {
  const { search } = req.query;

  try {
    const enterprises = await prisma.enterprise.findMany({
      where: {
        enterprise_name: {
          contains: search,
          mode: 'insensitive' // Case-insensitive search
        }
      },
      select: {
        id: true,
        enterprise_name: true
      },
      take: 10 // Limit results to 10
    });

    res.json(enterprises.map(enterprise => ({
      id: enterprise.id,
      name: enterprise.enterprise_name
    })));
  } catch (error) {
    console.error('Enterprise search error:', error);
    res.status(500).json({ error: 'Failed to search enterprises' });
  }
};