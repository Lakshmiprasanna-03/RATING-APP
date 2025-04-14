require('dotenv').config();
const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const seedAdmin = async () => {
  try {
    // Connect to the database
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if admin already exists
    const [existingAdmin] = await sequelize.query(
      "SELECT * FROM \"Users\" WHERE email = 'admin@example.com'",
      { type: QueryTypes.SELECT }
    );

    if (existingAdmin) {
      console.log('Admin user already exists.');
      return;
    }

    // Create admin user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);
    const now = new Date();

    // Insert directly using SQL to bypass model validations
    await sequelize.query(
      `INSERT INTO "Users" (name, email, password, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6)`,
      {
        bind: [
          'System Administrator Account',
          'admin@example.com',
          hashedPassword,
          'admin',
          now,
          now
        ],
        type: QueryTypes.INSERT
      }
    );

    console.log('Admin user created successfully.');
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    // Close the database connection
    await sequelize.close();
  }
};

// Run the seed function
seedAdmin();
