chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg === "close-me" && sender.tab?.id) chrome.tabs.remove(sender.tab.id);
});
