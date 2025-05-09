import SlackToken from "../models/slackToken.model";
import { decrypt } from "../utils/helpers";

export class SlackTokenService {
  // Method to retrieve the Slack token based on team ID or any identifier
  public async getSlackToken(
    teamId: string,
    teamName?: string
  ): Promise<{
    accessToken: string;
    adminId: string;
    refreshToken: string;
  } | null> {
    try {
      const query = {} as any;
      teamName !== undefined
        ? (query["team.name"] = teamName)
        : (query["team.id"] = teamId);
      const tokenRecord = await SlackToken.findOne(query);

      if (!tokenRecord) {
        console.error(`Slack token for team ID ${teamId} not found.`);
        return null;
      }

      return {
        accessToken: decrypt(tokenRecord.access_token),
        adminId: tokenRecord.authed_user.id,
        refreshToken: decrypt(tokenRecord.refresh_token),
      };
    } catch (error) {
      console.error("Error while retrieving Slack token:", error);
      throw new Error("Please authorize via Slack.");
    }
  }

  public async getAllAuthedUserTokens() {
    return await SlackToken.find({});
  }

  public async updateRefreshedToken(
    teamId: string,
    newAccessToken: string,
    newRefreshToken: string
  ) {
    return await SlackToken.findOneAndUpdate(
      { "team.id": teamId },
      {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      }
    );
  }
}
