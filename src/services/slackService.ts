import { WebClient } from "@slack/web-api";
import { config } from "../config/config";
import { Block, KnownBlock } from "@slack/types"; // Importing Slack types
import {
  Blocks,
  Channel,
  SlackInteractivePayload,
} from "../types/slackInteractiveTypes";
const slackClient = new WebClient(config.slackToken);

export const sendVulnerabilityMessage = async (
  vulnerability: any,
  adminId: string
) => {
  await validateUser(adminId);

  try {
    const description = "";
    const blocks: (Block | KnownBlock)[] = [
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

    let channelId;
    if (adminId) {
      // Assuming adminId is actually a user ID
      channelId = await getDMChannelId(adminId);
    } else {
      // ! fallback channel ID
      channelId = "C1234567890";
    }

    await slackClient.chat.postMessage({
      channel: adminId,
      blocks,
      text: "['MANUAL_INTERVENTION_REQUIRED'] - It's a fallback notification. New Vulnerability Found",
    });
  } catch (error) {
    console.error(
      "Error sending Slack message:",
      JSON.stringify(error, null, 4)
    );
  }
};

async function validateUser(userId: string) {
  try {
    const userInfo = await slackClient.users.info({ user: userId });

    if (
      (userInfo.user as { deleted: boolean }).deleted ||
      !(userInfo.user as { is_admin: boolean }).is_admin
    ) {
      console.error(`User ${userId} not found or has left the workspace.`);
      return;
    }
  } catch (error) {
    console.error(`Error getting user info for ${userId}:`, error);
    throw error;
  }
}

async function getDMChannelId(userId: string) {
  try {
    const result = await slackClient.conversations.open({ users: userId });

    return (result.channel as { id: string }).id;
  } catch (error) {
    console.error("Error opening DM channel:", error);
    throw error;
  }
}

export async function handleEmptySelectionModal(
  payload: SlackInteractivePayload
) {
  // Respond with a modal asking to select users
  slackClient.views.open({
    trigger_id: payload.trigger_id,
    view: {
      type: "modal",
      title: {
        type: "plain_text",
        text: "Error",
      },
      close: {
        type: "plain_text",
        text: "Close",
      },
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

export async function sendForwardedMessage(
  adminId: string,
  memberIds: string[],
  vulnerabilityDescription: string
) {
  const blocks = [
    {
      type: "section",
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
      label: {
        type: "plain_text",
        text: "Remediation Steps",
      },
    },
    {
      type: "actions",
      block_id: "remediation_confirmation",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Confirm Remediation",
          },
          value: "confirm_remediation",
          action_id: "confirm_button",
          style: "primary",
        },
      ],
    },
  ];

  for (const memberId of memberIds) {
    await slackClient.chat.postMessage({
      channel: memberId,
      blocks,
      text: "New Vulnerability Forwarded",
    });
  }
}

export async function handleConfirmRemediation(
  payload: SlackInteractivePayload
) {
  const remediationDetails =
    payload.state.values.remediation_description.remediation_input.value;

  const vunerabilityDescriptionBlock = <Blocks>(
    payload.message.blocks.find(
      (block: { block_id: string; type: string }) => block.type === "section"
    )
  );
  const extractVulnerabilityDescriptionRegex = /Vulnerability\*:(.*)/;
  const matchVD = vunerabilityDescriptionBlock.text.text.match(
    extractVulnerabilityDescriptionRegex
  );
  const extractCveIdRegex = /CVE_ID\*:(.*)/;
  const matchCVE =
    vunerabilityDescriptionBlock.text.text.match(extractCveIdRegex);
  let cveId = "";
  if (matchVD && matchCVE) {
    vunerabilityDescriptionBlock.text.text = `✅ *This vulnerability has been handled successfully!*\nRemediation confirmed by <@${
      payload.user.id
    }>:\n*CVE_ID*: ${matchCVE[1].trim()}\n*Vulnerability Description*: ${matchVD[1].trim()}\n *Remediation Performed*: ${remediationDetails}`;
    cveId = matchCVE[1].trim();
  }

  await notifyAdmin(config.adminId, payload.user.id, cveId, remediationDetails);

  // Confirm remediation
  await slackClient.chat.update({
    channel: (payload.channel as Channel).id,
    ts: payload.message.ts,
    text: `✅ *This vulnerability has been handled successfully!*\nRemediation confirmed by <@${payload.user.id}>: ${remediationDetails}`,
    blocks: [vunerabilityDescriptionBlock], // Clear interactive components
  });
}

export async function notifyAdmin(
  adminUserId: string,
  respondentId: string,
  cveId: string,
  remediationDetails: string
) {
  const message = `*Responded by <@${respondentId}>*\n✅ The vulnerability you forwarded has been remediated:\n*CVE_ID*: ${cveId}\n*Remediation Steps*: ${remediationDetails}`;

  await slackClient.chat.postMessage({
    channel: adminUserId, // Send a DM to the admin
    text: message,
  });
}
