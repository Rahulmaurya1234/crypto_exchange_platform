import mongoose from "mongoose";

export const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        const dbName = process.env.DBNAME;

        if (!uri) throw new Error("MONGO_URI missing in .env");
        if (!dbName) throw new Error("DBNAME missing in .env");

        await mongoose.connect(uri, {
            dbName,
            autoIndex: true,
        });

        console.log("✅ MongoDB Connected");
        console.log(`📦 Database: ${mongoose.connection.name}`);
        console.log(`🗄️ Host: ${mongoose.connection.host}`);
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};
