export const formatVulnerabilityMessage = (vulnerability: any): string => {
  return `*CVE ID*: ${vulnerability.cve.CVE_data_meta.ID}\n*Description*: ${vulnerability.cve.description.description_data[0].value}`;
};
