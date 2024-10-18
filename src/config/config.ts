import dotenv from "dotenv";
dotenv.config();

export const config = {
  slackToken: process.env.SLACK_TOKEN || "",
  // adminEmail: process.env.ADMIN_EMAIL || "",
  adminId: process.env.ADMIN_ID || "",
  lastScannedDate: process.env.LAST_SCANNED_DATE || "",
  scanInterval: parseInt(<string>process.env.SCAN_INTERVAL) || 10,
  nvdApiUrl: "https://services.nvd.nist.gov/rest/json/cves/2.0",
  mongodbUri:
    process.env.DATABASE_URL || "mongodb://localhost:27017/nvdnotifier",
  dbName: process.env.DB_NAME,
};
