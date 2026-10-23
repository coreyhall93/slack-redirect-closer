// Desktop workspaces: close Slack's launch tab a few seconds after the app opens.
// Browser workspaces: send the same link to Slack on the web, and do not close the tab.
const DELAY_MS = 3000;
const DESKTOP_MARKER = /redirected you to the desktop app/i;
const LAUNCH_HINT = /you will be redirected/i;
const BROWSER_TEXT = /in your browser/i;
const BOUNCE = "slack-redirect-closer-bounce";

const workspace = normalizeWorkspace(location.hostname);

if (workspace) {
  // Stay on /messages/ for a moment before allowing another archives rewrite.
  // Clearing immediately would loop if that page bounced straight back.
  if (location.pathname.startsWith("/messages/")) {
    setTimeout(() => {
      if (location.pathname.startsWith("/messages/")) sessionStorage.removeItem(BOUNCE);
    }, 2000);
  }
  chrome.storage.local.get({ slackRouting: {}, seenSlack: [] }).then((data) => {
    const seen = Array.isArray(data.seenSlack) ? data.seenSlack : [];
    if (!seen.includes(workspace)) {
      chrome.storage.local.set({ seenSlack: [...seen, workspace].sort() });
    }
    const mode = data.slackRouting?.[workspace] === "browser" ? "browser" : "desktop";
    if (mode === "browser") watchBrowser();
    else watchDesktop();
  });
}

function normalizeWorkspace(host) {
  return globalThis.SlackRouting.normalizeWorkspace(host);
}

function pageText() {
  return document.body?.innerText || "";
}

function onLaunchPage() {
  const text = pageText();
  return DESKTOP_MARKER.test(text)
    || LAUNCH_HINT.test(text)
    || location.pathname.startsWith("/ssb/redirect");
}

function targetFromLink(link) {
  const url = globalThis.SlackRouting.webClientUrl(link.href, location.href);
  if (url && url !== location.href) return { url };
  return { click: link };
}

function findBrowserTarget() {
  const qa = document.querySelector('a[data-qa="ssb_redirect_open_in_browser"]');
  if (qa) return targetFromLink(qa);
  if (!onLaunchPage()) return null;

  const links = document.querySelectorAll("a[href]");
  for (const link of links) {
    if (BROWSER_TEXT.test(link.textContent || "")) return targetFromLink(link);
  }

  const raw = document.getElementById("props_node")?.getAttribute("data-props");
  if (!raw) return null;
  try {
    const url = globalThis.SlackRouting.webClientUrl(JSON.parse(raw).teamUrl, location.href);
    if (url && url !== location.href) return { url };
  } catch {
    return null;
  }
  return null;
}

// One attempt per tab. If /messages/ bounces back to /archives/, follow the
// launch-page link instead of rewriting forever.
function rewriteArchives() {
  if (!location.pathname.startsWith("/archives/")) return false;
  if (sessionStorage.getItem(BOUNCE) === "1") {
    sessionStorage.removeItem(BOUNCE);
    return false;
  }
  const next = globalThis.SlackRouting.toMessagesUrl(location.href);
  if (!next || next === location.href) return false;
  sessionStorage.setItem(BOUNCE, "1");
  location.replace(next);
  return true;
}

function watchDesktop() {
  let tries = 0;
  const check = () => {
    const text = pageText();
    if (DESKTOP_MARKER.test(text) || (LAUNCH_HINT.test(text) && findBrowserTarget())) {
      setTimeout(() => chrome.runtime.sendMessage("close-me"), DELAY_MS);
      return;
    }
    if (++tries < 20) setTimeout(check, 250);
  };
  check();
}

function watchBrowser() {
  if (rewriteArchives()) return;
  let tries = 0;
  let clicked = false;
  const check = () => {
    const target = findBrowserTarget();
    if (target?.url) {
      location.replace(target.url);
      return;
    }
    if (target?.click && !clicked) {
      clicked = true;
      target.click.click();
    }
    if (++tries < 40) setTimeout(check, 250);
  };
  check();
}
