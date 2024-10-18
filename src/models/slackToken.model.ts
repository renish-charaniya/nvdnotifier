import { Schema, model, Document } from "mongoose";

export interface ISlackToken extends Document {
  app_id: string;
  authed_user: {
    id: string;
  };
  scope: string;
  token_type: string;
  access_token: string;
  bot_user_id: string;
  refresh_token: string;
  team: {
    id: string;
    name: string;
  };
  enterprise: null;
  is_enterprise_install: false;
}

const vulnerabilitySchema = new Schema<ISlackToken>({
  app_id: { type: String, required: true },
  authed_user: {
    id: { type: String, required: true },
  },
  scope: { type: String, required: true },
  token_type: { type: String, required: true },
  access_token: { type: String, required: true },
  bot_user_id: { type: String, required: true },
  refresh_token: { type: String, required: true },
  team: {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  enterprise: { type: String || null, required: false },
  is_enterprise_install: { type: Boolean, required: true },
});

const SlackToken = model<ISlackToken>("SlackToken", vulnerabilitySchema);

export default SlackToken;
