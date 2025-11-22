import "dotenv/config";
import app from './app';
import connectDB from "./db";

const PORT = process.env.PORT || 8080;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on port http://localhost:${PORT}/api`);
        });
    })
    .catch((error) => {
        console.error("Failed to connect to the database", error);
        process.exit(1);
    });