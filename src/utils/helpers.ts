import fs from "node:fs";
import { config } from "../config/config";

export const formatVulnerabilityMessage = (vulnerability: any): string => {
  return `*CVE ID*: ${vulnerability.cve.CVE_data_meta.ID}\n*Description*: ${vulnerability.cve.description.description_data[0].value}`;
};

export async function setLastScannedDate() {
  try {
    const { last_scanned_date } = JSON.parse(
      fs.readFileSync("./cronConfigs.json", { encoding: "utf-8" })
    );
    if (!last_scanned_date || last_scanned_date == "") {
      fs.writeFileSync(
        "./cronConfigs.json",
        JSON.stringify({
          last_scanned_date: config.lastScannedDate,
        })
      );
    }
  } catch (err) {
    console.error("Error writing last scanned date:", err);
  }
}
