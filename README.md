# NVD Notifier

Automate the detection of vulnerabilities from the [National Vulnerability Database (NVD)](https://nvd.nist.gov) and streamline communication within your IT team through Slack. This tool eliminates the need for manual vulnerability checks and forwards security patch details to co-admins for quick action.

<img width="906" alt="image" src="https://github.com/user-attachments/assets/b25bd0ec-950a-4686-9bb3-25d22b5825a7">


Demo - [NVD-Notifier](https://drive.google.com/file/d/1O4m8VCERahT0CcAy_SJPMc3btQEwnJFO/view?usp=sharing)


## Problem Statement

### Motivation
The customer relies on Slack for internal communication, and the IT team wants to extend this to handle newly discovered vulnerabilities. Currently, System Administrators manually visit the NVD daily to identify threats and notify team members. This process is time-consuming and prone to delays in remediation. The NVD Notifier automates these tasks, ensuring that vulnerabilities are quickly communicated and assigned within the team.

### Requirements
1. **Slack Integration**: A Slack app that continuously scans the NVD at a specified interval.
2. **Automated Notifications**: When a new vulnerability is found, a Slack message is sent to the System Administrator.
3. **Actionable Alerts**: Administrators receive:
   - Vulnerability details
   - A list of team members to assign the task to
   - A button to forward the vulnerability details to selected members
4. **Forwarding Functionality**: 
   - The forwarded message contains the vulnerability description, a text box for remediation details, and a confirmation button to indicate that the issue has been resolved.


## Installation

Use the package manager [pnpm](https://pip.pypa.io/en/stable/) to install the nvd-notifier.

```bash
pnpm install
```

## Usage
To build and start the application:

```bash
pnpm build && pnpm start
```

## Development
For development purposes:

```bash
pnpm build && pnpm dev
```

### Setting up the Slack App for OAuth Tokens
(Note: An OAuth flow can be used to simplify the process for users.)

Video - [Onboarding & Slack setup](https://drive.google.com/file/d/1zMUFdZlC-VaL922LOuAPB5aKTacJEITI/view?usp=sharing)


To integrate with Slack, you first need to create a Slack Bot. Follow these steps:

1. Go to the Slack API Apps page.
2. Click "Create App" and select "Create App from Manifest."
3. Paste the following manifest file:
```json
{
    "display_information": {
        "name": "Demo Slack Notifier",
        "description": "A bot that notifies about new vulnerabilities",
        "background_color": "#4A154B"
    },
    "features": {
        "bot_user": {
            "display_name": "Vulnerability Bot",
            "always_online": true
        }
    },
    "oauth_config": {
        "redirect_urls": [
            "https://<DOMAIN_NAME_OR_NGROK_URL>/api/slack/callback",
        ],
        "scopes": {
            "bot": [
                "chat:write",
                "users:read",
                "im:write",
                "mpim:write"
            ]
        }
    },
    "settings": {
        "interactivity": {
            "is_enabled": true,
            "request_url": "<BASE_URL_OF_YOUR_HOSTED_APP_OR_NGROK_URL>/api/slack/actions"
        },
        "org_deploy_enabled": false,
        "socket_mode_enabled": false,
        "token_rotation_enabled": false
    }
}
```
4. Navigate to Features > Oauth & Permissions
5. Under Oauth token click on Install App to your workspace.
5. Generate the Bot Token which will allow us to communicate with [Slack sdk](https://tools.slack.dev/node-slack-sdk/).

### Example .env
```json
CLIENT_ID=<SLACK_OAUTH_APP_CLIENT_ID>
CLIENT_SECRET=<SLACK_OAUTH_APP_CLIENT_SECRET>
REDIRECT_BASE_URI=<REDIRECT_URL_YOUR_DOMAIN_NAME>
SCAN_INTERVAL=30// In seconds
LAST_SCANNED_DATE="2024-10-07T12:08:00.973Z"
DATABASE_URL="mongodb+srv://<USERNAME>:<PASSWORD>@xyz-cluster.wsq1q.mongodb.net/?retryWrites=true&w=majority&appName=xyz-cluster"
DB_NAME=testnvdnotifier

```


## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
