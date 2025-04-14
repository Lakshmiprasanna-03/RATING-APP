const Rating = require('../models/rating');
const Store = require('../models/store');
const User = require('../models/user');
const { fn, col } = require('sequelize');

exports.submitRating = async (req, res) => {
  try {
    const { storeId, rating } = req.body;
    const userId = req.user.id;

    // Validate rating value
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if store exists
    const store = await Store.findByPk(storeId);
    if (!store) {
      return res.status(404).json({ message: 'Store not found' });
    }

    // Check if user is not rating their own store
    if (store.ownerId === userId) {
      return res.status(403).json({ message: 'Store owners cannot rate their own stores' });
    }

    // Find or create rating
    const [ratingRecord, created] = await Rating.findOrCreate({
      where: { userId, storeId },
      defaults: { rating }
    });

    // Update existing rating if not created
    if (!created) {
      await ratingRecord.update({ rating });
    }

    // Get updated store statistics
    const storeStats = await Store.findByPk(storeId, {
      attributes: [
        'id',
        [fn('AVG', col('Ratings.rating')), 'averageRating'],
        [fn('COUNT', col('Ratings.id')), 'totalRatings']
      ],
      include: [{
        model: Rating,
        attributes: []
      }],
      group: ['Store.id']
    });

    res.json({
      message: created ? 'Rating submitted successfully' : 'Rating updated successfully',
      rating: ratingRecord,
      storeStats: {
        averageRating: parseFloat(storeStats.getDataValue('averageRating')) || 0,
        totalRatings: parseInt(storeStats.getDataValue('totalRatings')) || 0
      }
    });
  } catch (error) {
    console.error('Rating submission error:', error);
    res.status(500).json({ message: 'Error submitting rating', error: error.message });
  }
};

exports.getUserRatings = async (req, res) => {
  try {
    const userId = req.user.id;
    const ratings = await Rating.findAll({
      where: { userId },
      include: [{
        model: Store,
        attributes: ['id', 'name', 'address'],
        include: [{
          model: User,
          as: 'owner',
          attributes: ['id', 'name']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      ratings: ratings.map(rating => ({
        id: rating.id,
        rating: rating.rating,
        store: rating.Store,
        createdAt: rating.createdAt,
        updatedAt: rating.updatedAt
      }))
    });
  } catch (error) {
    console.error('User ratings fetch error:', error);
    res.status(500).json({ message: 'Error fetching user ratings', error: error.message });
  }
};

exports.getStoreOwnerRatings = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // First get all stores owned by this user
    const storeIds = await Store.findAll({
      where: { ownerId },
      attributes: ['id']
    }).then(stores => stores.map(store => store.id));

    if (storeIds.length === 0) {
      return res.json({ stores: [] });
    }

    // Now get the stores with their ratings
    const stores = await Store.findAll({
      where: { id: storeIds },
      include: [{
        model: Rating,
        required: false,
        include: [{
          model: User,
          attributes: ['id', 'name', 'email']
        }]
      }]
    });

    // Format the stores with calculated ratings
    const formattedStores = stores.map(store => {
      const ratings = store.Ratings || [];
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings
        : 0;

      return {
        id: store.id,
        name: store.name,
        address: store.address,
        ownerId: store.ownerId,
        createdAt: store.createdAt,
        updatedAt: store.updatedAt,
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
    });

    res.json({ stores: formattedStores });
  } catch (error) {
    console.error('Store owner ratings fetch error:', error);
    res.status(500).json({ message: 'Error fetching store owner ratings', error: error.message });
  }
};
