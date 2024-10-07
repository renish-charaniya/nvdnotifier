export type SlackInteractivePayload = {
  type: string;
  team: {
    id: string;
    domain: string;
  };
  user: {
    id: string;
    username: string;
    team_id: string;
  };
  api_app_id: string;
  token: string;
  trigger_id: string;
  response_url: string;
  channel?: Channel;
  message: {
    type: string;
    text: string;
    user: string;
    ts: string;
    blocks: Array<Blocks>;
  };
  actions: Array<SlackAction>;
  state: RemediationState;
};

export type Channel = {
  id: string;
  name: string;
};

export type Blocks = {
  block_id: string;
  type: string;
  text: {
    text: string;
  };
};

type RemediationState = {
  values: {
    remediation_description: {
      remediation_input: {
        value: string;
      };
    };
  };
};

export type SlackAction = {
  type: string;
  action_id: string;
  block_id?: string;
  value?: string;
  selected_options?: Array<SlackSelectOption>;
};

export type SlackSelectOption = {
  text: {
    type: string;
    text: string;
  };
  value: string;
};

export interface SlackViewSubmissionPayload extends SlackInteractivePayload {
  view: {
    id: string;
    team_id: string;
    type: string;
    callback_id: string;
    state: {
      values: Record<string, any>;
    };
    private_metadata?: string;
  };
}
