import { Schema, model, Document } from "mongoose";

export interface IScanStatus extends Document {
  cron_id: string;
  last_scanned_date: string;
}

const vulnerabilitySchema = new Schema<IScanStatus>({
  cron_id: { type: String, required: true },
  last_scanned_date: { type: String, required: true },
});

const ScanStatus = model<IScanStatus>("scanStatus", vulnerabilitySchema);

export default ScanStatus;
