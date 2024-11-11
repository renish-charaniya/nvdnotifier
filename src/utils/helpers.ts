import fs from "node:fs";
import { config } from "../config/config";
import crypto from "node:crypto";

export const formatVulnerabilityMessage = (vulnerability: any): string => {
  return `*CVE ID*: ${vulnerability.cve.CVE_data_meta.ID}\n*Description*: ${vulnerability.cve.description.description_data[0].value}`;
};

export async function setLastScannedDate() {
  try {
    const { last_scanned_date } = JSON.parse(
      fs.readFileSync("./public/cronConfigs.json", { encoding: "utf-8" })
    );
    if (!last_scanned_date || last_scanned_date == "") {
      fs.writeFileSync(
        "./public/cronConfigs.json",
        JSON.stringify({
          last_scanned_date: config.lastScannedDate,
        })
      );
    }
  } catch (err) {
    console.error("Error writing last scanned date:", err);
  }
}

export function secondsToCron(seconds: number) {
  if (seconds < 1 || seconds > 59) {
    throw new Error("Invalid input. Seconds should be between 1 and 59.");
  }

  return `*/${seconds} * * * * *`;
}

const algorithm = "aes-256-gcm";
const ivLength = 16; // Initialization vector length
const sec = <string>config.ENCRYPTION_KEY;

export function encrypt(token: string) {
  const iv = crypto.randomBytes(ivLength); // Random IV for each encryption
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(sec), iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
}

export function decrypt(token: string) {
  const [ivHex, authTagHex, encryptedText] = token.split(":");

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(sec), iv);

  decipher.setAuthTag(authTag); // Set the authentication tag before decryption

  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function isEncrypted(token: string) {
  const parts = token.split(":");

  if (parts.length !== 3) return false;

  const [ivHex, authTagHex, encryptedText] = parts;

  return (
    ivHex.length === 32 && authTagHex.length === 32 && encryptedText.length > 0
  );
}
