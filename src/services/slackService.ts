import { WebClient } from "@slack/web-api";
import { config } from "../config/config";
import { Block, KnownBlock } from "@slack/types"; // Importing Slack types

const slackClient = new WebClient(config.slackToken);

export const sendVulnerabilityMessage = async (
  vulnerability: any,
  adminId: string
) => {
  console.log("🚀 ~ adminEmail:", adminId);
  // console.log("🚀 ~ vulnerability:", JSON.stringify(vulnerability, null, 4));
  await validateUser(adminId);
  // const usersFormattedBlocks = (await listUsers(adminId)).map((user) => {
  //   return {
  //     text:{
  //       type: "plain_text",
  //       text: "Team Member 1",
  //     }
  //   }
  // })
  try {
    const blocks: (Block | KnownBlock)[] = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          // TODO Select only english language descriptions.
          text: `*New Vulnerability Found*\n${JSON.stringify(
            vulnerability.cve.descriptions.map(
              (desc: { lang: string; value: string }) => desc.value
            )
          )}`,
        },
      },
      {
        type: "input",
        block_id: "team_members_selection",
        element: {
          type: "multi_static_select",
          action_id: "select_members",
          placeholder: {
            type: "plain_text",
            text: "Select team members",
          },
          options: [
            {
              text: {
                type: "plain_text",
                text: "Team Member 1",
              },
              value: "member_1",
            },
            {
              text: {
                type: "plain_text",
                text: "Team Member 2",
              },
              value: "member_2",
            },
          ],
        },
        label: {
          type: "plain_text",
          text: "Team Members",
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
          },
        ],
      },
    ];

    let channelId;
    if (adminId) {
      // Assuming adminEmail is actually a user ID
      channelId = await getDMChannelId(adminId);
    } else {
      channelId = "C1234567890"; // Your fallback channel ID
    }

    await slackClient.chat.postMessage({
      channel: adminId,
      blocks,
      text: "New Vulnerability Found", // Fallback text for accessibility
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
      !(userInfo.user as { is_member: boolean }).is_member
    ) {
      console.error(`User ${userId} not found or has left the workspace.`);
      return;
    }
  } catch (error) {
    console.error(`Error getting user info for ${userId}:`, error);
    throw error;
  }
}

// If you want to send to a channel
const channelId = "C1234567890"; // Replace with actual channel ID

// If you want to send to a user directly
async function getDMChannelId(userId: string) {
  console.log("🚀 ~ getDMChannelId ~ userId:", userId);
  try {
    const result = await slackClient.conversations.open({ users: userId });
    console.log(
      "🚀 ~ getDMChannelId ~ result:",
      JSON.stringify(result, null, 4)
    );
    return (result.channel as { id: string }).id;
  } catch (error) {
    console.error("Error opening DM channel:", error);
    throw error;
  }
}

async function listUsers(userId: string) {
  try {
    // TODO what is no teamid is provided
    // TODO find an api to fetch teamID
    const userList = await slackClient.users.list({ team_id: "T07QLAV0EM8" });
    if (!userList.members?.length) {
      throw new Error("No users found in the team.");
    }
    // TODO handle deleted user > isDeleted
    const users = userList.members.map((member) => {
      return {
        id: member.id,
        name: member.real_name,
      };
    });
    console.log(
      "🚀 ~ validateUser ~ userList:",
      JSON.stringify(users, null, 4)
    );
    return users;
    // if (
    //   (userInfo.user as { deleted: boolean }).deleted ||
    //   !(userInfo.user as { is_member: boolean }).is_member
    // ) {
    //   console.error(`User ${userId} not found or has left the workspace.`);
    //   return;
    // }
  } catch (error) {
    console.error(`Error getting user info for ${userId}:`, error);
    throw error;
  }
}
