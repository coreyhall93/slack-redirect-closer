// Closes Zoom's leftover join tab after the desktop app has launched.
// Zoom marks that state by appending #success. "Join from browser" navigates
// away before the timer ends, which cancels the close.
const DELAY_MS = 3000;

let armed = false;

const launched = () => /success/i.test(location.hash || "");

const arm = () => {
  if (armed || !launched()) return;
  armed = true;
  setTimeout(() => chrome.runtime.sendMessage("close-me"), DELAY_MS);
};

arm();
window.addEventListener("hashchange", arm);

// Zoom often sets #success after load, sometimes without a hashchange event.
let tries = 0;
const poll = () => {
  arm();
  if (!armed && ++tries < 40) setTimeout(poll, 250);
};
poll();
