import axios from "axios";
import { config } from "../config/config";
import { addSeconds } from "date-fns";
import fs from "node:fs/promises";

export const fetchVulnerabilities = async () => {
  try {
    let { last_scanned_date } = JSON.parse(
      await fs.readFile("./cronConfigs.json", { encoding: "utf-8" })
    );

    const nvdCveUrl = new URL(config.nvdApiUrl);
    nvdCveUrl.searchParams.append("resultsPerPage", "10");
    nvdCveUrl.searchParams.append("lastModStartDate", `${last_scanned_date}`);

    const addedInterval = addSeconds(
      last_scanned_date,
      config.scanInterval
    ).toISOString();

    nvdCveUrl.searchParams.append("lastModEndDate", `${addedInterval}`);

    const { data } = await axios.get(nvdCveUrl.toString());

    await fs.writeFile(
      "./cronConfigs.json",
      JSON.stringify({ last_scanned_date: addedInterval }),
      { encoding: "utf-8" }
    );
    return data.vulnerabilities;
  } catch (error) {
    console.error("Error fetching vulnerabilities from NVD:", error);
    return [];
  }
};
