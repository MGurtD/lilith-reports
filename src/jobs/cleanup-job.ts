import fs from "fs";
import path from "path";
import cron from "node-cron";

/**
 * Deletes files older than the specified age (in milliseconds) from the given directory.
 * @param directory - The directory to clean up.
 * @param maxAge - The maximum age of files in milliseconds (e.g., 24 hours = 24 * 60 * 60 * 1000).
 */
function deleteOldFiles(directory: string, maxAge: number): void {
  const now = Date.now();

  fs.readdir(directory, (err, files) => {
    if (err) {
      console.error(`Error reading directory ${directory}:`, err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(directory, file);

      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting stats for file ${filePath}:`, err);
          return;
        }

        // Check if the file is older than the max age
        if (now - stats.mtimeMs > maxAge) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting file ${filePath}:`, err);
            } else {
              console.log(`Deleted old file: ${filePath}`);
            }
          });
        }
      });
    });
  });
}

// Define the directory and max age for cleanup
const reportsDirectory = path.resolve(__dirname, "../../reports");
const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

// Run the cleanup job immediately when the application starts
console.log("Running initial cleanup job...");
deleteOldFiles(reportsDirectory, oneDayInMilliseconds);

// Schedule the cleanup job to run once a day at midnight
cron.schedule("0 0 * * *", () => {
  console.log("Running scheduled cleanup job...");
  deleteOldFiles(reportsDirectory, oneDayInMilliseconds);
});
