/**
 * Secure One-Time Teacher Account Seed Script
 * Initializes the administrative instructor account in MongoDB.
 * Usage: npm run seed:teacher (or node scripts/seedTeacher.js)
 */
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const config = require('../config/env');

async function seedTeacher() {
  console.log('====================================================');
  console.log('🌱 ATCodes Teacher Account Initialization');
  console.log('====================================================');

  try {
    await connectDB();

    const teacherData = config.seedTeacher;

    if (!teacherData.email || !teacherData.password) {
      throw new Error('SEED_TEACHER_EMAIL and SEED_TEACHER_PASSWORD must be configured in .env');
    }

    const normalizedEmail = teacherData.email.toLowerCase().trim();
    const existingTeacher = await User.findOne({ email: normalizedEmail });

    const passwordHash = await User.hashPassword(teacherData.password);

    if (existingTeacher) {
      console.log(`[Seed] Teacher account already exists for ${normalizedEmail}. Updating credentials & status...`);
      existingTeacher.fullName = teacherData.name;
      existingTeacher.passwordHash = passwordHash;
      existingTeacher.role = 'teacher';
      existingTeacher.accountStatus = 'active';
      existingTeacher.mobile = teacherData.mobile;
      await existingTeacher.save();
      console.log(`✔ [Seed] Teacher account updated successfully!`);
    } else {
      console.log(`[Seed] Creating initial teacher account for ${normalizedEmail}...`);
      const newTeacher = await User.create({
        fullName: teacherData.name,
        email: normalizedEmail,
        mobile: teacherData.mobile,
        passwordHash: passwordHash,
        role: 'teacher',
        accountStatus: 'active',
        profileImage: ''
      });
      console.log(`✔ [Seed] Teacher account created successfully (ID: ${newTeacher._id})`);
    }

    console.log(`Instructor Name:   ${teacherData.name}`);
    console.log(`Instructor Email:  ${normalizedEmail}`);
    console.log(`Role:              teacher`);
    console.log(`Account Status:    active`);
    console.log('====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seed] Error initializing teacher account:', error.message);
    await disconnectDB().catch(() => {});
    process.exit(1);
  }
}

if (require.main === module) {
  seedTeacher();
}

module.exports = { seedTeacher };
