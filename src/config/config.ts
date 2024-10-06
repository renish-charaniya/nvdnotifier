import dotenv from "dotenv";
dotenv.config();

export const config = {
  slackToken: process.env.SLACK_TOKEN || "",
  // adminEmail: process.env.ADMIN_EMAIL || "",
  adminId: process.env.ADMIN_ID || "",
  nvdApiUrl: "https://services.nvd.nist.gov/rest/json/cves/2.0",
};
