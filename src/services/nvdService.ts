import axios from "axios";
import { config } from "../config/config";
import { addSeconds } from "date-fns";
import { promises as fs } from "fs";
import path from "path";
import ScanStatus from "../models/scanStatus.model";
import { ScanStatusType } from "../types/scanStatus.type";

const configPath = path.join(process.cwd(), "public", "cronConfigs.json");

export const fetchVulnerabilities = async () => {
  try {
    const cron_id = "cron_job";
    const cronDate: ScanStatusType | null = await ScanStatus.findOne({
      cron_id: cron_id,
    });
    let last_scanned_date = cronDate?.last_scanned_date;
    if (!last_scanned_date) {
      last_scanned_date = config.lastScannedDate;
    }

    const nvdCveUrl = new URL(config.nvdApiUrl);
    nvdCveUrl.searchParams.append("resultsPerPage", "10");
    nvdCveUrl.searchParams.append("lastModStartDate", `${last_scanned_date}`);

    const addedInterval = addSeconds(
      last_scanned_date,
      config.scanInterval
    ).toISOString();

    console.log("SCANNED -> ", {
      lsd: last_scanned_date,
      addedInterval: addedInterval,
    });

    nvdCveUrl.searchParams.append("lastModEndDate", `${addedInterval}`);

    const { data } = await axios.get(nvdCveUrl.toString());

    await ScanStatus.updateOne(
      { cron_id: cron_id },
      {
        last_scanned_date: addedInterval,
      },
      {
        upsert: true,
      }
    );

    return data.vulnerabilities;
  } catch (err) {
    console.error("Error fetching vulnerabilities from NVD:", err);
    return [];
  }
};
