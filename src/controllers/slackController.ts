import { Request, Response } from "express";

import {
  handleConfirmRemediation,
  handleEmptySelectionModal,
  sendForwardedMessage,
} from "../services/slackService";

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
