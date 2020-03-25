// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// const settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });


//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(
  (request, sender, sendResponse) => {
    chrome.pageAction.show(sender.tab.id);
    if (request && request.MSE_STATUS) {
      chrome.tabs.sendMessage(sender.tab.id, {DISPLAY_STATUS: request.MSE_STATUS});
    }
    if (sendResponse) {
      sendResponse();
    }
  });