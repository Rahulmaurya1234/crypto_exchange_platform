// Script to fix duplicate empty mobileNumber issue
import mongoose from "mongoose";
import User from "../models/User.model.js";
import { config } from "dotenv";

// Load environment variables
config();

const fixMobileDuplicates = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        // Find all users with empty string mobileNumber
        const usersWithEmptyMobile = await User.find({ mobileNumber: "" });
        console.log(`Found ${usersWithEmptyMobile.length} users with empty mobileNumber`);

        if (usersWithEmptyMobile.length > 0) {
            // Update all users with empty mobileNumber to undefined
            const result = await User.updateMany(
                { mobileNumber: "" },
                { $unset: { mobileNumber: "" } }
            );

            console.log(`✅ Updated ${result.modifiedCount} users - removed empty mobileNumber`);
        }

        // Also check for null values (should be fine with sparse index, but let's verify)
        const usersWithNullMobile = await User.countDocuments({ mobileNumber: null });
        console.log(`Found ${usersWithNullMobile} users with null mobileNumber (OK with sparse index)`);

        // Count users without mobileNumber field
        const usersWithoutMobile = await User.countDocuments({ mobileNumber: { $exists: false } });
        console.log(`Found ${usersWithoutMobile} users without mobileNumber field (OK)`);

        console.log("\n✅ Cleanup completed successfully!");

    } catch (error) {
        console.error("❌ Error during cleanup:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB");
        process.exit(0);
    }
};

// Run the script
fixMobileDuplicates();
