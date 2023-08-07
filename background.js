chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({url: chrome.runtime.getURL("index.html")});
});


async function rebuildRules() {
  console.log("rebuildRules")
  const domains = ['localhost'];
  /** @type {chrome.declarativeNetRequest.Rule[]} */
  const rules = [{
    id: 1,
    condition: {
      requestDomains: domains
    },
    action: {
      type: 'modifyHeaders',
      requestHeaders: [{
        header: 'origin',
        operation: 'set',
        value: 'http://localhost',
      }],
    },
  }];
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: rules.map(r => r.id),
    addRules: rules,
  });
}

rebuildRules();
