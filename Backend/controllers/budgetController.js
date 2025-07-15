const prisma = require('../config/prisma');

exports.getMyBudget = async (req, res) => {
  try {
    const budgets = await prisma.budget.findMany({
    where: { 
      zone: { chef_park_id: req.user.id } 
    },
    include: {
      zone: { select: { zone_name: true } }
    }
  });
  res.json(budgets);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

exports.createBudget = async (req, res) => {
  try {
    const { zone_id, amount, fiscalYear, description } = req.body;

    // Verify chef_park owns the zone
    const zone = await prisma.zone.findUnique({
      where: { id: zone_id },
      select: { chef_park_id: true }
    });

    if (!zone || zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized zone access' });
    }

    const budget = await prisma.budget.create({
      data: {
        amount,
        fiscalYear,
        description,
        zone_id
      }
    });

    res.status(201).json(budget);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Budget already exists for this zone' 
      });
    }
    res.status(500).json({ error: 'Failed to create budget' });
  }
};

exports.updateBudget = async (req, res) => {
  try {
    const { amount, description } = req.body;

    // First get the zone ID from the budget
    const budget = await prisma.budget.findUnique({
      where: { id: req.params.id },
      select: { zone: { select: { chef_park_id: true } } }
    });

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' });
    }

    if (budget.zone.chef_park_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized budget access' });
    }

    const updatedBudget = await prisma.budget.update({
      where: { id: req.params.id },
      data: { amount, description }
    });

    res.json(updatedBudget);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update budget' });
  }
};