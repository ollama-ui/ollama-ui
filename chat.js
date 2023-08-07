const clipboardIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
</svg>`

// change settings of marked from default to remove deprecation warnings
// see conversation here: https://github.com/markedjs/marked/issues/2793
marked.use({
  mangle: false,
  headerIds: false
});

// Fetch available models and populate the dropdown
async function populateModels() {
  document.getElementById('send-button').addEventListener('click', submitRequest);

  try {
    const response = await fetch("http://localhost:11434/api/tags");
    const data = await response.json();
    const selectElement = document.getElementById('model-select');

    data.models.forEach(model => {
      const option = document.createElement('option');
      option.value = model.name;
      option.innerText = model.name;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error(error);
  }
}

// Function to get the selected model
function getSelectedModel() {
  return document.getElementById('model-select').value;
}

// Function to handle the user input and call the API functions
async function submitRequest() {
  document.getElementById('chat-container').style.display = 'block';

  const input = document.getElementById('user-input').value;
  const selectedModel = getSelectedModel();
  const context = document.getElementById('chat-history').context;
  const data = { model: selectedModel, prompt: input, context: context };

  // Create user message element and append to chat history
  let chatHistory = document.getElementById('chat-history');
  let userMessageDiv = document.createElement('div');
  userMessageDiv.className = 'mb-2 user-message text-end';
  userMessageDiv.innerText = input;
  chatHistory.appendChild(userMessageDiv);
  
  // Create response container
  let responseDiv = document.createElement('div');
  responseDiv.className = 'response-message mb-2 text-start';
  responseDiv.style.minHeight = '3em'; // make sure div does not shrink if we cancel the request when no text has been generated yet
  spinner = document.createElement('div');
  spinner.className = 'spinner-border text-light';
  spinner.setAttribute('role', 'status');
  responseDiv.appendChild(spinner);
  chatHistory.appendChild(responseDiv);

  // create button to stop text generation
  let interrupt = new AbortController();
  let stopButton = document.createElement('button');
  stopButton.className = 'btn btn-danger';
  stopButton.innerHTML = 'Stop';
  stopButton.onclick = () => {
    interrupt.abort('Stop button pressed');
  }
  // add button after responseDiv
  responseDiv.insertAdjacentElement('afterend', stopButton);
  
  postRequest(data, interrupt.signal)
    .then(async response => {
      await getResponse(response, parsedResponse => {
        let word = parsedResponse.response;
        if (parsedResponse.done) {
          chatHistory.context = parsedResponse.context;
          // Copy button
          let copyButton = document.createElement('button');
          copyButton.className = 'btn btn-secondary copy-button';
          copyButton.innerHTML = clipboardIcon;
          copyButton.onclick = () => {
            navigator.clipboard.writeText(responseDiv.hidden_text).then(() => {
              console.log('Text copied to clipboard');
            }).catch(err => {
              console.error('Failed to copy text:', err);
            });
          };
          responseDiv.appendChild(copyButton);
        }
        // add word to response
        if (word != undefined) {
          if (responseDiv.hidden_text == undefined){
            responseDiv.hidden_text = "";
          }
          responseDiv.hidden_text += word;
          responseDiv.innerHTML = DOMPurify.sanitize(marked.parse(responseDiv.hidden_text)); // Append word to response container
        }
      });
    })
    .then(() => {
      stopButton.remove(); // Remove stop button from DOM now that all text has been generated
      spinner.remove();
    }) 
    .catch(error => {
      if (error !== 'Stop button pressed') {
        console.error(error);
      }
      stopButton.remove();
      spinner.remove();
    });

  // Clear user input
  document.getElementById('user-input').value = '';
}

// Event listener for Ctrl + Enter or CMD + Enter
document.getElementById('user-input').addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    submitRequest();
  }
});


window.onload = populateModels;