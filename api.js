// Base URL

var ollama_host;
if (!ollama_host){
  ollama_host = 'localhost:11434'
}

const URL = `http://${ollama_host}/api/generate`;

async function getModels(){
  const response = await fetch(`http://${ollama_host}/api/tags`);
  const data = await response.json();
  return data;
}


// Function to send a POST request to the API
function postRequest(data, signal) {
  return fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data),
    signal: signal
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