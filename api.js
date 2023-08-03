// Base URL
const URL = "http://localhost:11434/api/generate";

// Function to send a POST request to the API
function postRequest(data) {
  return fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
}

// Function to stream the response from the server
async function getResponse(response, callback, stopper) {
  const reader = response.body.getReader();
  let partialLine = '';

  while (true) {
    // if we have an interrupt, stop reading the stream and cancel it
    if (stopper.interrupt === true) {
      reader.cancel()
      break;
    }

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


