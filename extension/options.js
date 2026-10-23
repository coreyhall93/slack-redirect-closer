const DEFAULTS = { seenSlack: [], slackRouting: {} };
const list = document.getElementById("list");
const empty = document.getElementById("empty");
const form = document.getElementById("add");
const input = document.getElementById("workspace");
const error = document.getElementById("error");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  addWorkspace(input.value);
});

list.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const host = button.closest("li")?.dataset.host;
  if (!host) return;
  if (button.dataset.mode) setMode(host, button.dataset.mode);
  if (button.classList.contains("remove")) removeWorkspace(host);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && (changes.seenSlack || changes.slackRouting)) render();
});

render();

async function load() {
  const data = await chrome.storage.local.get(DEFAULTS);
  const seen = Array.isArray(data.seenSlack) ? data.seenSlack.filter((host) => typeof host === "string") : [];
  const routing = data.slackRouting && typeof data.slackRouting === "object" ? data.slackRouting : {};
  return { seenSlack: seen, slackRouting: routing };
}

async function render() {
  const { seenSlack, slackRouting } = await load();
  const hosts = [...seenSlack].sort((a, b) => a.localeCompare(b));
  empty.hidden = hosts.length > 0;
  list.replaceChildren(...hosts.map((host) => row(host, routing[host] === "browser" ? "browser" : "desktop")));
}

function row(host, mode) {
  const item = document.createElement("li");
  item.dataset.host = host;

  const top = document.createElement("div");
  top.className = "top";
  const name = document.createElement("span");
  name.className = "host";
  name.textContent = host;
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "remove";
  remove.textContent = "Remove";
  top.append(name, remove);

  const choice = document.createElement("div");
  choice.className = "choice";
  choice.setAttribute("role", "group");
  choice.setAttribute("aria-label", "Where " + host + " opens");
  choice.append(modeButton(host, "desktop", "Desktop", mode), modeButton(host, "browser", "Browser", mode));

  item.append(top, choice);
  return item;
}

function modeButton(host, mode, label, current) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.mode = mode;
  button.textContent = label;
  button.setAttribute("aria-pressed", mode === current ? "true" : "false");
  button.setAttribute("aria-label", host + " opens on " + label.toLowerCase());
  return button;
}

async function setMode(host, mode) {
  const { slackRouting } = await load();
  slackRouting[host] = mode;
  await chrome.storage.local.set({ slackRouting });
  clearError();
}

async function addWorkspace(raw) {
  const host = globalThis.SlackRouting.normalizeWorkspace(raw);
  if (!host) {
    showError("Use a workspace like a8c.slack.com.");
    return;
  }
  const { seenSlack } = await load();
  if (!seenSlack.includes(host)) {
    await chrome.storage.local.set({ seenSlack: [...seenSlack, host].sort() });
  }
  input.value = "";
  clearError();
  render();
}

async function removeWorkspace(host) {
  const { seenSlack } = await load();
  await chrome.storage.local.set({ seenSlack: seenSlack.filter((item) => item !== host) });
  clearError();
}

function showError(message) {
  error.hidden = false;
  error.textContent = message;
}

function clearError() {
  error.hidden = true;
  error.textContent = "";
}
