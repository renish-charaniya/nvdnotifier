import { Request, Response } from "express";

import {
  handleConfirmRemediation,
  handleEmptySelectionModal,
  sendForwardedMessage,
} from "../services/slackService";
import axios from "axios";
import { config } from "../config/config";
import SlackToken from "../models/slackToken.model";

export const handleSlackInteraction = async (req: Request, res: Response) => {
  const payload = JSON.parse(req.body.payload);

  if (payload.actions[0].action_id === "users") {
    return res.sendStatus(200);
  }

  if (payload.actions[0].action_id === "forward_button") {
    const selectedUsers = payload.state.values.list.users.selected_users;

    if (!selectedUsers || selectedUsers.length === 0) {
      await handleEmptySelectionModal(payload);
      return res.send({
        text: "No users were selected. Please select users first.",
        response_type: "ephemeral",
      });
    } else {
      const vunerabilityDescriptionBlock = payload.message.blocks.find(
        (block: { block_id: string }) =>
          block.block_id === "vulnerability_description"
      );

      // Forward the vulnerability details to selected users
      try {
        await sendForwardedMessage(
          payload.user.id,
          selectedUsers,
          vunerabilityDescriptionBlock.text.text || payload.message.text
        );
      } catch (err) {
        console.error("Error while forwarding message", err);
      }

      res.sendStatus(200);
    }
  }

  if (payload.actions[0].action_id === "confirm_button") {
    await handleConfirmRemediation(payload);

    res.sendStatus(200);
  }
};

export const handleAuthorize = async (_req: Request, res: Response) => {
  const authUrl = new URL(config.slackAuthorizationUrl);
  authUrl.searchParams.append(
    config.SLACK_AUTH_PARAMS.SCOPE_KEY,
    config.SLACK_AUTH_PARAMS.SCOPES_VALUE
  );
  authUrl.searchParams.append(
    config.SLACK_AUTH_PARAMS.CLIENT_ID_KEY,
    config.SLACK_AUTH_PARAMS.CLIENT_ID_VALUE
  );
  authUrl.searchParams.append(
    config.SLACK_AUTH_PARAMS.REDIRECT_URI_KEY,
    config.SLACK_AUTH_PARAMS.REDIRECT_URI_VALUE
  );

  res.redirect(authUrl.toString());
};

export const handleAuthCallback = async (req: Request, res: Response) => {
  const { code } = req.query;
  const tokenUrl = new URL(config.slackTokenUrl);
  tokenUrl.searchParams.append("code", <string>code);
  tokenUrl.searchParams.append(
    config.SLACK_AUTH_PARAMS.CLIENT_ID_KEY,
    config.SLACK_AUTH_PARAMS.CLIENT_ID_VALUE
  );
  tokenUrl.searchParams.append(
    config.SLACK_AUTH_PARAMS.CLIENT_SECRET_KEY,
    config.SLACK_AUTH_PARAMS.CLIENT_SECRET_VALUE
  );
  const slackToken = await axios.post(tokenUrl.toString());
  delete slackToken.data["_id"];
  const tokenSaved = await SlackToken.findOneAndUpdate(
    { app_id: slackToken.data.app_id },
    slackToken.data
  );
  if (!tokenSaved) {
    return res.send({
      code: 400,
      message: "Error while saving slack response.",
    });
  }
  res.send({
    code: 200,
    team_name: tokenSaved.team.name,
  });
};
