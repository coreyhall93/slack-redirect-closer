# Slack & Zoom Redirect Closer

A small unpacked extension for Chromium-based browsers. It closes the leftover tab after Slack or Zoom opens the desktop app.

**Slack.** Each workspace is Desktop or Browser. Click the extension icon to choose. Until you choose, a workspace stays on Desktop.

Desktop: when a Slack link opens in the browser and Slack shows its "Launching… / We've redirected you to the desktop app" page, the tab closes itself 3 seconds later.

- Only fires on `*.slack.com` pages whose text says the app was launched. Real Slack-in-browser (`app.slack.com`) is excluded.
- Click "open this link in your browser" within 3 seconds and the tab stays.
- Change the delay: `DELAY_MS` in `extension/content.js`, then hit reload on the extension card.

Browser: the extension keeps that workspace in your browser.

- Channel and message links (`/archives/…`) are sent to Slack's web path (`/messages/…`) before the desktop handoff.
- If Slack still shows the launch page, the extension follows "open this link in your browser," which lands on `app.slack.com`. The tab is not closed.
- The choice is saved in that browser profile. It does not sync with the extension files, so set it once on each profile you use.
- Add a workspace by name (`a8c` or `a8c.slack.com`) before the next link if it is not in the list yet. Workspaces also appear on their own after you open one. Remove hides a row and keeps the choice for the next time it appears.

**Zoom.** When a join link such as `https://anysphere-co.zoom.us/j/…#success` has launched Zoom Workplace, the tab closes itself 3 seconds later.

- Only fires on join URLs (`/j/`, `/s/`, `/w/`, `/my/`) once the address has `#success`. That hash is Zoom's signal that the desktop app opened. Recordings, settings, and the in-browser meeting (`/wc/`) stay open.
- Click "Join from browser" within 3 seconds and the tab stays, because that click navigates away and cancels the timer.
- If Zoom never adds `#success`, the tab stays, so a join page where the app failed to launch is still there.
- Change the delay: `DELAY_MS` in `extension/content-zoom.js`, then hit reload on the extension card.

## Install

1. Download or clone this repository.
2. Open your browser's extensions page (usually `chrome://extensions`).
3. Turn on Developer mode and choose **Load unpacked**.
4. Select the `extension` folder in this repository.

After an update, reload the extension card. Each browser profile keeps its own workspace choices.

## Privacy

The extension stores Slack workspace choices locally in the browser profile. It does not send data to an external service. Its content scripts run on Slack redirect pages and Zoom join links listed in the manifest.

## Remove
Remove it from the extensions page, then delete this folder.

## License

Copyright (c) 2026 Corey Hall. Released under the GNU General Public License v3.0. See [LICENSE](LICENSE) for the full text.

