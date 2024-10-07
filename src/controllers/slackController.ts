import { Request, Response } from "express";
import { WebClient } from "@slack/web-api";

import { config } from "../config/config";
import axios from "axios";

const slackClient = new WebClient(config.slackToken);

export const handleSlackInteraction = async (req: Request, res: Response) => {
  const payload = JSON.parse(req.body.payload);

  if (payload.actions[0].action_id === "users") {
    return res.sendStatus(200);
  }

  if (payload.actions[0].action_id === "forward_button") {
    const selectedUsers = payload.state.values.list.users.selected_users;

    if (!selectedUsers || selectedUsers.length === 0) {
      // Respond with a modal asking to select users
      await axios.post(
        "https://slack.com/api/views.open",
        {
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
        },
        {
          headers: {
            Authorization: `Bearer ${config.slackToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      return res.send({
        text: "No users were selected. Please select users first.",
        response_type: "ephemeral",
      });
    } else {
      const vunerabilityDescription = payload.message.blocks.find(
        (block: { block_id: string }) =>
          block.block_id === "vulnerability_description"
      );

      // Forward the vulnerability details to selected users
      try {
        await sendForwardedMessage(
          payload.user.id,
          selectedUsers,
          vunerabilityDescription.text.text || payload.message.text
        );
      } catch (error) {
        console.log("Error while forwarding message", error);
      }

      res.sendStatus(200);
    }
  }
};

const sendForwardedMessage = async (
  adminId: string,
  memberIds: string[],
  vulnerabilityDescription: string
) => {
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
        text: "Remediation Details",
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
};
