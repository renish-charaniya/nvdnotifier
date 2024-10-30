import { WebClient, ChatPostMessageArguments } from "@slack/web-api";
import { inject, singleton } from "tsyringe";
import { Block, KnownBlock } from "@slack/types";

import {
  Blocks,
  SlackInteractivePayload,
} from "../types/slackInteractiveTypes";
import axios from "axios";
import { config } from "../config/config";
import { SlackTokenService } from "./slackTokenService";

@singleton()
export class SlackService {
  private slackClient!: WebClient;
  private slackTokenService: SlackTokenService;

  constructor(slackToken: string) {
    this.slackClient = new WebClient(slackToken);
    this.slackTokenService = new SlackTokenService();
  }

  // Check if access token is valid by calling Slack API using WebClient
  private async isAccessTokenValid(accessToken: string): Promise<boolean> {
    try {
      const response = await axios.post(
        config.slackTokenValidityUrl,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.ok;
    } catch (error: any) {
      console.error(
        "isAccessTokenValid: Error validating access token:",
        error.message
      );
      return false;
    }
  }

  // Refresh the access token if expired
  private async refreshAccessToken(refreshToken: string): Promise<void> {
    try {
      const response = await axios.post(config.slackTokenUrl, null, {
        params: {
          grant_type: "refresh_token",
          client_id: config.SLACK_AUTH_PARAMS.CLIENT_ID_VALUE,
          client_secret: config.SLACK_AUTH_PARAMS.CLIENT_SECRET_VALUE,
          refresh_token: refreshToken,
        },
      });

      if (response.data.ok) {
        const teamId = response.data.team.id;
        const newAccessToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;

        // Update the WebClient with the new access token
        this.slackClient = new WebClient(response.data.access_token);
        console.log("Access token refreshed successfully");
        // Store the new access token (e.g., in a database or securely)
        await this.slackTokenService.updateRefreshedToken(
          teamId,
          newAccessToken,
          newRefreshToken
        );
      } else {
        throw new Error("Failed to refresh access token");
      }
    } catch (error) {
      console.error("Error refreshing access token:", error);
      throw error;
    }
  }

  // Ensure access token is valid before making an API call
  public async authenticate(
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    const isValid = await this.isAccessTokenValid(accessToken);
    if (!isValid) {
      console.log("Access token expired, refreshing...");
      await this.refreshAccessToken(refreshToken);
    }
  }

  // Add a public wrapper to expose the validateUser method
  public async isValidAdmin(adminId: string): Promise<boolean> {
    return this.validateUser(adminId);
  }

  // Send a vulnerability notification to an admin
  async sendVulnerabilityMessage(
    vulnerability: any,
    adminId: string,
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    await this.authenticate(accessToken, refreshToken);
    await this.validateUser(adminId);

    const blocks = this.createVulnerabilityBlocks(vulnerability);
    const channelId = await this.getDMChannelId(adminId);

    const message: ChatPostMessageArguments = {
      channel: channelId || "C1234567890", // Fallback channel if no adminId
      blocks,
      text: `:rotating_light: *CVE_ID*: ${vulnerability.cve.id} :rotating_light:`,
    };

    await this.slackClient.chat.postMessage(message);
  }

  // Validate if the user is an admin or owner
  private async validateUser(adminId: string): Promise<boolean> {
    try {
      const userInfo = await this.slackClient.users.info({ user: adminId });
      const user = userInfo.user as {
        deleted: boolean;
        is_admin: boolean;
        is_owner: boolean;
      };

      if (user.deleted || !user.is_admin || !user.is_owner) {
        // throw new Error(`User ${adminId} is not an active admin or owner.`);
        // return false;
        console.log(">>>>>>>>>>>>> NOT AN ADMIN <<<<<<<<<<<");
      }
      return true;
    } catch (error) {
      console.error(`Error validating user ${adminId}:`, error);
      throw error;
    }
  }

  // Get the DM channel ID for a user
  private async getDMChannelId(userId: string): Promise<string> {
    try {
      const result = await this.slackClient.conversations.open({
        users: userId,
      });
      return (result.channel as { id: string }).id;
    } catch (error) {
      console.error(`Error opening DM channel for ${userId}:`, error);
      throw error;
    }
  }

  // Handle empty user selection with a modal response
  async handleEmptySelectionModal(
    payload: SlackInteractivePayload
  ): Promise<void> {
    await this.slackClient.views.open({
      trigger_id: payload.trigger_id,
      view: {
        type: "modal",
        title: { type: "plain_text", text: "Error" },
        close: { type: "plain_text", text: "Close" },
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "You must select at least one user before forwarding.",
            },
          },
        ],
      },
    });
  }

  // Send the forwarded vulnerability details to selected users
  async sendForwardedMessage(
    adminId: string,
    memberIds: string[],
    vulnerabilityDescription: string
  ): Promise<void> {
    const blocks: (Block | KnownBlock)[] = this.createForwardedMessageBlocks(
      adminId,
      vulnerabilityDescription
    );

    await Promise.all(
      memberIds.map(async (memberId) => {
        await this.slackClient.chat.postMessage({
          channel: memberId,
          blocks,
          text: "New Vulnerability Forwarded",
        });
      })
    );
  }

  // Handle remediation confirmation from the user
  async handleConfirmRemediation(
    payload: SlackInteractivePayload,
    adminId: string
  ): Promise<void> {
    const remediationDetails =
      payload.state.values.remediation_description.remediation_input.value;
    const vulnerabilityBlock = this.extractVulnerabilityBlock(payload);

    const cveId = this.extractCVEId(vulnerabilityBlock);
    const updatedVulnerabilityBlock = this.buildRemediationMessage(
      payload.user.id,
      cveId,
      remediationDetails,
      vulnerabilityBlock
    );

    await this.notifyAdmin(adminId, payload.user.id, cveId, remediationDetails);

    await this.slackClient.chat.update({
      channel: payload.channel ? payload.channel.id : "",
      ts: payload.message.ts,
      text: `[:FALLBACK:]✅ *This vulnerability has been handled successfully!*\nRemediation confirmed by <@${payload.user.id}>: ${remediationDetails}`,
      blocks: [updatedVulnerabilityBlock], // Clear the interactive components
    });
  }

  // Notify the admin that the vulnerability was remediated
  private async notifyAdmin(
    adminUserId: string,
    respondentId: string,
    cveId: string,
    remediationDetails: string
  ): Promise<void> {
    const message = `Responded by <@${respondentId}>:\n✅ Vulnerability remediated.\n*CVE_ID*: ${cveId}\n*Remediation Steps*: ${remediationDetails}`;

    await this.slackClient.chat.postMessage({
      channel: adminUserId,
      text: message,
    });
  }

  // Create Slack blocks for vulnerability message
  private createVulnerabilityBlocks(
    vulnerability: any
  ): (Block | KnownBlock)[] {
    const description = vulnerability.cve.descriptions
      .filter((desc: { lang: string }) => desc.lang === "en")
      .map((desc: { value: string }) => desc.value)
      .join("\n");

    return [
      {
        type: "section",
        block_id: "vulnerability_description",
        text: {
          type: "mrkdwn",
          text: `:rotating_light: *New Vulnerability Found* :rotating_light:\n*CVE_ID*: ${
            vulnerability.cve.id
          }\n*Vulnerability*: ${vulnerability.cve.descriptions.map(
            (desc: { lang: string; value: string }) => {
              // !CVE API doesn't have the language filter.
              if (desc.lang === "en") return description + desc.value;
            }
          )}`,
        },
      },
      {
        type: "section",
        block_id: "list",
        text: {
          type: "mrkdwn",
          text: "Pick users from the list",
        },
        accessory: {
          action_id: "users",
          type: "multi_users_select",
          placeholder: {
            type: "plain_text",
            text: "Select users",
          },
        },
      },
      {
        type: "actions",
        block_id: "forward_action",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Forward",
            },
            value: "forward_vulnerability",
            action_id: "forward_button",
            style: "primary",
          },
        ],
      },
    ];
  }

  // Create blocks for forwarded message
  private createForwardedMessageBlocks(
    adminId: string,
    vulnerabilityDescription: string
  ): (Block | KnownBlock)[] {
    return [
      {
        type: "section",
        block_id: "vulnerability_description",
        text: {
          type: "mrkdwn",
          text: `*Forwarded by <@${adminId}>*\n${vulnerabilityDescription}`,
        },
      },
      {
        type: "input",
        block_id: "remediation_description",
        element: {
          type: "plain_text_input",
          action_id: "remediation_input",
          multiline: true,
          placeholder: {
            type: "plain_text",
            text: "Describe the remediation...",
          },
        },
        label: { type: "plain_text", text: "Remediation Steps" },
      },
      {
        type: "actions",
        block_id: "remediation_confirmation",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Confirm Remediation" },
            value: "confirm_remediation",
            action_id: "confirm_button",
            style: "primary",
          },
        ],
      },
    ];
  }

  // Extract the vulnerability description block from the payload
  private extractVulnerabilityBlock(payload: SlackInteractivePayload) {
    return <Blocks>(
      payload.message.blocks.find(
        (block: Block) =>
          block.type === "section" &&
          block.block_id === "vulnerability_description"
      )
    );
  }

  // Extract the CVE ID from the vulnerability description block
  private extractCVEId(vulnerabilityBlock: Blocks): string {
    const match = vulnerabilityBlock.text.text.match(/CVE_ID\*:(.*)/);
    return match ? match[1].trim() : "";
  }

  // Build the remediation confirmation message
  private buildRemediationMessage(
    userId: string,
    cveId: string,
    remediationDetails: string,
    vulnerabilityBlock: Blocks
  ): Blocks {
    const vulnerabilityDescription =
      vulnerabilityBlock.text.text.match(/Vulnerability\*:(.*)/)?.[1].trim() ||
      "";

    vulnerabilityBlock.text.text = `✅ *This vulnerability has been handled successfully!*\nRemediation confirmed by <@${userId}>:\n*CVE_ID*: ${cveId}\n*Vulnerability Description*: ${vulnerabilityDescription}\n *Remediation Performed*: ${remediationDetails}`;
    return vulnerabilityBlock;
  }
}
