const User = require('./user');
const Store = require('./store');
const Rating = require('./rating');

// User - Store associations (for store owners)
User.hasMany(Store, { foreignKey: 'ownerId' });
Store.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User - Rating associations
User.hasMany(Rating, { foreignKey: 'userId' });
Rating.belongsTo(User, { foreignKey: 'userId' });

// Store - Rating associations
Store.hasMany(Rating, { foreignKey: 'storeId' });
Rating.belongsTo(Store, { foreignKey: 'storeId' });

module.exports = {
  User,
  Store,
  Rating
};
