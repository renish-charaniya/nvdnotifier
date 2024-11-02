import dotenv from "dotenv";
dotenv.config();

export const config = {
  AUTH_TOKEN: process.env.AUTH_TOKEN,
  slackToken: process.env.SLACK_TOKEN || "",
  // adminEmail: process.env.ADMIN_EMAIL || "",
  adminId: process.env.ADMIN_ID || "",
  lastScannedDate: process.env.LAST_SCANNED_DATE || "",
  scanInterval: parseInt(<string>process.env.SCAN_INTERVAL) || 10,
  nvdApiUrl: "https://services.nvd.nist.gov/rest/json/cves/2.0",
  slackAuthorizationUrl: "https://slack.com/oauth/v2/authorize",
  SLACK_AUTH_PARAMS: {
    SCOPES_VALUE:
      "channels:write.invites,chat:write,chat:write.public,im:write,mpim:write,usergroups:write,users:read",
    SCOPE_KEY: "scope",
    CLIENT_ID_VALUE: process.env.CLIENT_ID || "",
    CLIENT_ID_KEY: "client_id",
    CLIENT_SECRET_VALUE: process.env.CLIENT_SECRET || "",
    CLIENT_SECRET_KEY: "client_secret",
    REDIRECT_URI_KEY: "redirect_uri",
    REDIRECT_URI_VALUE: `${new URL(
      process.env.REDIRECT_BASE_URI || "http://localhost:3000"
    ).toString()}api/slack/callback`,
  },
  slackTokenUrl: "https://slack.com/api/oauth.v2.access",
  slackTokenValidityUrl: "https://slack.com/api/auth.test",
  mongodbUri:
    process.env.DATABASE_URL || "mongodb://localhost:27017/nvdnotifier",
  dbName: process.env.DB_NAME,
};
