const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [20, 60],
      notEmpty: true
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    // We'll validate the password length in the beforeValidate hook instead
  },
  role: {
    type: DataTypes.ENUM('admin', 'user', 'storeOwner'),
    allowNull: false,
    defaultValue: 'user'
  }
}, {
  hooks: {
    beforeValidate: (user) => {
      // Only validate password length for new passwords (not hashed ones)
      if (user.password && !user.password.startsWith('$2')) {
        if (user.password.length < 8 || user.password.length > 16) {
          throw new Error('Password must be between 8 and 16 characters');
        }

        // Check for uppercase letter and special character
        const hasUppercase = /[A-Z]/.test(user.password);
        const hasSpecial = /[!@#$%^&*]/.test(user.password);

        if (!hasUppercase || !hasSpecial) {
          throw new Error('Password must contain at least one uppercase letter and one special character');
        }
      }
    },
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method to validate password
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User;
