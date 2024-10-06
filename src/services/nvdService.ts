import axios from "axios";
import { config } from "../config/config";

export const fetchVulnerabilities = async () => {
  try {
    const { data } = await axios.get(config.nvdApiUrl);
    // console.log(
    //   "🚀 ~ fetchVulnerabilities ~ data:",
    //   JSON.stringify(data.vulnerabilities[0], null, 4)
    // );
    return data.vulnerabilities;
  } catch (error) {
    console.error("Error fetching vulnerabilities from NVD:", error);
    return [];
  }
};
