export type SlackTokenResponseType = {
  ok: boolean;
  app_id: string;
  authed_user: AuthedUser;
  scope: string;
  token_type: string;
  access_token: string;
  bot_user_id: string;
  refresh_token: string;
  expires_in: number;
  team: Team;
  enterprise: null;
  is_enterprise_install: boolean;
};

export type AuthedUser = {
  id: string;
};

export type Team = {
  id: string;
  name: string;
};

export type SlackTokenErrorResponseType = {
  ok: boolean;
  error: "invalid_code";
};

export type ErrorResponse = {
  message: string;
};
