var rebuildRules = undefined;
if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.id) {
    rebuildRules = async function (domain) {
    const domains = [domain];
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
          value: `http://${domain}`,
        }],
      },
    }];
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: rules.map(r => r.id),
      addRules: rules,
    });
  }
}


var ollama_host = localStorage.getItem("host-address");
if (!ollama_host){
  ollama_host = 'http://localhost:11434'
} else {
  document.getElementById("host-address").value = ollama_host;
}

if (rebuildRules){
  rebuildRules(ollama_host);
}

function setHostAddress(){
  ollama_host = document.getElementById("host-address").value;
  localStorage.setItem("host-address", ollama_host);
  populateModels();
  if (rebuildRules){
    rebuildRules(ollama_host);
  }
}



async function getModels(){
  const response = await fetch(`${ollama_host}/api/tags`, {credentials: 'include'});
  const data = await response.json();
  return data;
}


// Function to send a POST request to the API
function postRequest(data, signal) {
  const URL = `${ollama_host}/api/generate`;
  return fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
    signal: signal,
    credentials: 'include',
  });
}

// Function to stream the response from the server
async function getResponse(response, callback) {
  const reader = response.body.getReader();
  let partialLine = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    // Decode the received value and split by lines
    const textChunk = new TextDecoder().decode(value);
    const lines = (partialLine + textChunk).split('\n');
    partialLine = lines.pop(); // The last line might be incomplete

    for (const line of lines) {
      if (line.trim() === '') continue;
      const parsedResponse = JSON.parse(line);
      callback(parsedResponse); // Process each response word
    }
  }

  // Handle any remaining line
  if (partialLine.trim() !== '') {
    const parsedResponse = JSON.parse(partialLine);
    callback(parsedResponse);
  }
}
