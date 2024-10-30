import { Request, Response } from "express";
import axios from "axios";
import { config } from "../config/config";
import SlackToken from "../models/slackToken.model";
import { SlackService } from "../services/slackService";
import {
  SlackTokenErrorResponseType,
  SlackTokenResponseType,
} from "../types/oauthToken.type";
import { SlackTokenService } from "../services/slackTokenService";
import { connectDB } from "../db/connection";

export class SlackController {
  private slackTokenService: SlackTokenService;
  constructor() {
    this.slackTokenService = new SlackTokenService();
  }

  // Handle incoming Slack interactions
  async handleSlackInteraction(req: Request, res: Response) {
    try {
      const payload = JSON.parse(req.body.payload);
      const teamId = payload.team.id;
      await connectDB();
      const slackToken = await this.slackTokenService.getSlackToken(teamId);

      if (!slackToken) {
        return res.status(404).send({
          message: `No record found for the provided team ID -> ${teamId}.`,
        });
      }
      const slackService = new SlackService(slackToken?.accessToken);
      await slackService.authenticate(
        slackToken.accessToken,
        slackToken.refreshToken
      );

      switch (payload.actions[0].action_id) {
        case "users":
          return res.sendStatus(200);

        case "forward_button":
          await this.handleForwardButton(payload, slackService, res);
          break;

        case "confirm_button":
          await this.handleConfirmRemediation(
            payload,
            slackToken.adminId,
            slackService
          );
          res.sendStatus(200);
          break;

        default:
          res.status(400).send({ message: "Unknown action ID" });
      }
    } catch (error) {
      console.error("Error handling Slack interaction", error);
      res.status(500).send({ error: "Failed to process Slack interaction" });
    }
  }

  // Redirect user to Slack for authorization
  async handleAuthorize(_req: Request, res: Response) {
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
  }

  // Handle OAuth callback and save Slack token
  async handleAuthCallback(req: Request, res: Response) {
    try {
      const { code } = req.query;
      const slackTokenData = await this.exchangeCodeForToken(<string>code);

      if (!slackTokenData.ok) {
        return res.status(404).send({
          message: "" + (<SlackTokenErrorResponseType>slackTokenData).error,
        });
      }
      const slackService = new SlackService(
        (<SlackTokenResponseType>slackTokenData).access_token
      );
      await slackService.authenticate(
        (<SlackTokenResponseType>slackTokenData).access_token,
        (<SlackTokenResponseType>slackTokenData).refresh_token
      );

      const isValid = await this.validateUser(
        slackService,
        (<SlackTokenResponseType>slackTokenData).authed_user.id
      );

      if (!isValid) {
        return res
          .status(403)
          .send({ message: "Forbidden: Admin access required" });
      }

      const tokenSaved = await this.saveSlackToken(slackTokenData);

      if (!tokenSaved) {
        return res.status(500).send({ message: "Error saving Slack token." });
      }
      const teamName = (<SlackTokenResponseType>slackTokenData).team.name;
      res.redirect(`/?team=${teamName}&status=success`);
    } catch (error) {
      console.error("Error during Slack OAuth callback", error);
      res.status(500).send({ error: "Failed to handle OAuth callback" });
    }
  }

  // Private methods

  // Handle forwarding of messages
  private async handleForwardButton(
    payload: any,
    slackService: SlackService,
    res: Response
  ) {
    const selectedUsers = payload.state.values.list.users.selected_users;

    if (!selectedUsers || selectedUsers.length === 0) {
      await this.showEmptySelectionModal(slackService, payload);
      return res.send({
        text: "No users selected. Please select users first.",
        response_type: "ephemeral",
      });
    }

    const vulnerabilityDescriptionBlock = payload.message.blocks.find(
      (block: { block_id: string }) =>
        block.block_id === "vulnerability_description"
    );

    try {
      await slackService.sendForwardedMessage(
        payload.user.id,
        selectedUsers,
        vulnerabilityDescriptionBlock.text.text || payload.message.text
      );
      res.sendStatus(200);
    } catch (error) {
      console.error("Error forwarding message", error);
      res.status(500).send({ error: "Failed to forward vulnerability" });
    }
  }

  // Handle confirmation of remediation
  private async handleConfirmRemediation(
    payload: any,
    adminId: string,
    slackService: SlackService
  ) {
    try {
      await slackService.handleConfirmRemediation(payload, adminId);
    } catch (error) {
      console.error("Error confirming remediation", error);
      throw new Error("Failed to confirm remediation");
    }
  }

  // Exchange code for Slack token
  private async exchangeCodeForToken(
    code: string
  ): Promise<SlackTokenResponseType | SlackTokenErrorResponseType> {
    const tokenUrl = new URL(config.slackTokenUrl);
    tokenUrl.searchParams.append("code", code);
    tokenUrl.searchParams.append(
      config.SLACK_AUTH_PARAMS.CLIENT_ID_KEY,
      config.SLACK_AUTH_PARAMS.CLIENT_ID_VALUE
    );
    tokenUrl.searchParams.append(
      config.SLACK_AUTH_PARAMS.CLIENT_SECRET_KEY,
      config.SLACK_AUTH_PARAMS.CLIENT_SECRET_VALUE
    );

    const response = await axios.post(tokenUrl.toString());

    return response.data;
  }

  // Validate if the user is an admin
  private async validateUser(
    slackService: SlackService,
    userId: string
  ): Promise<boolean> {
    return await slackService.isValidAdmin(userId);
  }

  // Save the Slack token to the database
  private async saveSlackToken(slackTokenData: any) {
    console.log(
      "🚀 ~ SlackController ~ saveSlackToken ~ slackTokenData:",
      JSON.stringify(slackTokenData, null, 4)
    );
    delete slackTokenData["_id"]; // Remove _id if present

    return await SlackToken.updateOne(
      { "team.id": slackTokenData.team.id },
      slackTokenData,
      { upsert: true }
    );
  }

  // Handle case where no users are selected in the slack modal
  private async showEmptySelectionModal(
    slackService: SlackService,
    payload: any
  ) {
    // Logic to show a modal when no users are selected
    await slackService.handleEmptySelectionModal(payload);
  }
}
