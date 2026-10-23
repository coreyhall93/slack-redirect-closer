(function (root) {
  "use strict";

  function normalizeWorkspace(input) {
    let raw = String(input || "").trim().toLowerCase();
    raw = raw.replace(/^https?:\/\//, "");
    raw = raw.split(/[/?#]/)[0].replace(/\.$/, "");
    if (!raw || raw.includes("@") || raw.includes(":") || raw.includes(" ")) return null;
    if (raw === "slack.com" || raw === "app.slack.com") return null;
    if (!raw.endsWith(".slack.com")) raw += ".slack.com";
    if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*\.slack\.com$/.test(raw)) {
      return null;
    }
    if (raw === "app.slack.com") return null;
    return raw;
  }

  // Slack's /archives/ links hand off to the desktop app. /messages/ is the same
  // channel or message, opened in the browser.
  function toMessagesUrl(href) {
    let url;
    try {
      url = new URL(href);
    } catch {
      return null;
    }
    if (url.protocol !== "https:" || !url.pathname.startsWith("/archives/")) return null;
    url.pathname = "/messages/" + url.pathname.slice("/archives/".length);
    return url.href;
  }

  function webClientUrl(href, base) {
    let url;
    try {
      url = new URL(href, base);
    } catch {
      return null;
    }
    if (url.protocol !== "https:") return null;
    const web = url.hostname === "app.slack.com"
      || url.pathname.startsWith("/messages/")
      || url.pathname.startsWith("/client/");
    if (!web) return null;
    return url.href;
  }

  root.SlackRouting = { normalizeWorkspace, toMessagesUrl, webClientUrl };
})(globalThis);
