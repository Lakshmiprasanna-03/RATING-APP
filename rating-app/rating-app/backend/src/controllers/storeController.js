const { Op, fn, col } = require('sequelize');
const Store = require('../models/store');
const Rating = require('../models/rating');
const User = require('../models/user');

exports.createStore = async (req, res) => {
  try {
    const { name, address, ownerId } = req.body;

    // If admin is creating a store for a store owner
    let storeOwnerId = ownerId;

    // If store owner is creating their own store
    if (!storeOwnerId && req.user.role === 'storeOwner') {
      storeOwnerId = req.user.id;
    }

    // Validate owner exists and is a store owner
    if (storeOwnerId) {
      const owner = await User.findByPk(storeOwnerId);
      if (!owner || owner.role !== 'storeOwner') {
        return res.status(400).json({ message: 'Invalid store owner' });
      }
    }

    const store = await Store.create({
      name,
      address,
      ownerId: storeOwnerId
    });

    res.status(201).json({
      message: 'Store created successfully',
      store
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating store', error: error.message });
  }
};

exports.updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address } = req.body;

    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if user is admin or store owner
    if (req.user.role !== 'admin' && store.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this store' });
    }

    await store.update({ name, address });
    res.json({ message: 'Store updated successfully', store });
  } catch (error) {
    res.status(500).json({ message: 'Error updating store', error: error.message });
  }
};

exports.deleteStore = async (req, res) => {
  try {
    const { id } = req.params;

    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if user is admin or store owner
    if (req.user.role !== 'admin' && store.ownerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this store' });
    }

    await store.destroy();
    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting store', error: error.message });
  }
};

exports.getStores = async (req, res) => {
  try {
    const { search, sortBy = 'name', sortOrder = 'ASC' } = req.query;

    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { address: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const stores = await Store.findAll({
      where,
      include: [
        {
          model: Rating,
          attributes: [],
          required: false
        },
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name'],
          required: true
        }
      ],
      attributes: [
        'id',
        'name',
        'address',
        'ownerId',
        'createdAt',
        'updatedAt',
        [fn('AVG', col('Ratings.rating')), 'averageRating'],
        [fn('COUNT', col('Ratings.id')), 'totalRatings']
      ],
      group: ['Store.id', 'owner.id'],
      order: sortBy === 'averageRating'
        ? [[fn('AVG', col('Ratings.rating')), sortOrder]]
        : [[sortBy, sortOrder]]
    });

    // Format the response
    const formattedStores = stores.map(store => ({
      ...store.toJSON(),
      averageRating: parseFloat(store.getDataValue('averageRating')) || 0,
      totalRatings: parseInt(store.getDataValue('totalRatings')) || 0
    }));

    res.json(formattedStores);
  } catch (error) {
    console.error('Store fetch error:', error);
    res.status(500).json({ message: 'Error fetching stores', error: error.message });
  }
};

exports.getStoreRatings = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.findByPk(id, {
      include: [
        {
          model: Rating,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ],
      attributes: [
        'id',
        'name',
        'address',
        'ownerId',
        [fn('AVG', col('Ratings.rating')), 'averageRating'],
        [fn('COUNT', col('Ratings.id')), 'totalRatings']
      ],
      group: ['Store.id', 'Ratings.id', 'Ratings->User.id']
    });

    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Format the response
    const formattedStore = {
      ...store.toJSON(),
      averageRating: parseFloat(store.getDataValue('averageRating')) || 0,
      totalRatings: parseInt(store.getDataValue('totalRatings')) || 0,
      ratings: store.Ratings.map(rating => ({
        id: rating.id,
        rating: rating.rating,
        user: rating.User,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt
      }))
    };

    res.json(formattedStore);
  } catch (error) {
    console.error('Store ratings fetch error:', error);
    res.status(500).json({ message: 'Error fetching store ratings', error: error.message });
  }
};

exports.getMyStore = async (req, res) => {
  try {
    // First, check if the store exists without trying to get ratings
    const storeExists = await Store.findOne({
      where: { ownerId: req.user.id },
      attributes: ['id', 'name', 'address', 'ownerId']
    });

    if (!storeExists) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Now get the store with ratings if any exist
    const storeWithRatings = await Store.findByPk(storeExists.id, {
      include: [
        {
          model: Rating,
          required: false,
          include: [
            {
              model: User,
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    // Calculate average rating manually
    const ratings = storeWithRatings.Ratings || [];
    const totalRatings = ratings.length;
    const averageRating = totalRatings > 0
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings
      : 0;

    // Format the response
    const formattedStore = {
      id: storeWithRatings.id,
      name: storeWithRatings.name,
      address: storeWithRatings.address,
      ownerId: storeWithRatings.ownerId,
      createdAt: storeWithRatings.createdAt,
      updatedAt: storeWithRatings.updatedAt,
      averageRating,
      totalRatings,
      ratings: ratings.map(rating => ({
        id: rating.id,
        rating: rating.rating,
        user: rating.User,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt
      }))
    };

    res.json(formattedStore);
  } catch (error) {
    console.error('Store fetch error:', error);
    res.status(500).json({ message: 'Error fetching store', error: error.message });
  }
};

// Admin dashboard stats
exports.getStats = async (req, res) => {
  try {
    const totalStores = await Store.count();
    const totalUsers = await User.count();
    const totalRatings = await Rating.count();

    // Get recent stores
    const recentStores = await Store.findAll({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      totalStores,
      totalUsers,
      totalRatings,
      recentStores
    });
  } catch (error) {
    console.error('Stats fetch error:', error);
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};
