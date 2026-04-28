import mongoose from "mongoose";
import dotenv from "dotenv";
import User, {
  USER_ROLES,
  KYC_STATUSES,
  ACCOUNT_STATUSES,
} from "../models/User.model.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const DBNAME = process.env.DBNAME; // optional

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env");
  process.exit(1);
}

async function seedUsers() {
  try {
    console.log("⏳ Connecting to MongoDB...");

    await mongoose.connect(
      DBNAME ? `${MONGO_URI}/${DBNAME}` : MONGO_URI
    );

    console.log("✅ MongoDB connected.");

    // Updated duplicate check to match your seed email
    const existingAdmin = await User.findOne({
      email: "admin@cryptians.com",
    });

    if (existingAdmin) {
      console.log("⚠️ Seed users already exist. Skipping.");
      process.exit(0);
    }

    const users = [
      {
        name: "Admin User",
        email: "admin@cryptians.com",
        password: "admin123",
        address: "Admin Street",
        state: "Uttar Pradesh",
        city: "Mathura",
        pincode: "281001",
        mobileNumber: "9999999999",
        altMobileNumber: "8888888888",
        gender: "male",
        role: USER_ROLES.ADMIN,
        accountStatus: ACCOUNT_STATUSES.ACTIVE,
        kycStatus: KYC_STATUSES.APPROVED,
        kyc: {
          aadharNumber: "123412341234",
          aadharImageUrl: "",
          panNumber: "ABCDE1234F",
          panImageUrl: "",
          reference1Name: "Ref Admin",
          reference1Mobile: "9000000000",
          reference2Name: "Ref Two",
          reference2Mobile: "9111111111",
        },
      },
      {
        name: "Verified User",
        email: "user_verified@test.com",
        password: "password123",
        address: "Verified House",
        state: "Uttar Pradesh",
        city: "Agra",
        pincode: "282001",
        mobileNumber: "9876543210",
        altMobileNumber: "9123456789",
        gender: "male",
        role: USER_ROLES.USER,
        accountStatus: ACCOUNT_STATUSES.ACTIVE,
        kycStatus: KYC_STATUSES.APPROVED,
        kyc: {
          aadharNumber: "222244445555",
          aadharImageUrl: "",
          panNumber: "ZXYDE1234F",
          panImageUrl: "",
          reference1Name: "Ref Verified",
          reference1Mobile: "9000000000",
          reference2Name: "Ref Two",
          reference2Mobile: "9111111111",
        },
      },
      {
        name: "Unverified User",
        email: "user_unverified@test.com",
        password: "password123",
        address: "Unknown House",
        state: "Delhi",
        city: "New Delhi",
        pincode: "110001",
        mobileNumber: "9123456780",
        altMobileNumber: "",
        gender: "male",
        role: USER_ROLES.USER,
        accountStatus: ACCOUNT_STATUSES.ACTIVE,
        kycStatus: KYC_STATUSES.NOT_SUBMITTED,
        kyc: {},
      },
    ];

    console.log("⏳ Seeding users with safe hashing...");

    // Use create() instead of insertMany() so pre-save hooks run
    for (const u of users) {
      const user = new User(u);
      await user.save();
    }

    console.log("🎉 Users seeded successfully!");
    console.log("➡️ Admin: admin@cryptians.com / admin123");
    console.log("➡️ Verified: user_verified@test.com / password123");
    console.log("➡️ Unverified: user_unverified@test.com / password123");

    process.exit(0);
  } catch (err) {
    console.error("❌ Error seeding users:", err);
    process.exit(1);
  }
}

seedUsers();
