// change settings of marked from default to remove deprecation warnings
// see conversation here: https://github.com/markedjs/marked/issues/2793
marked.use({
  mangle: false,
  headerIds: false
});

// Fetch available models and populate the dropdown
async function populateModels() {
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
  responseDiv.innerHTML = '<div class="spinner-border text-light" role="status" id="loading-spinner"><span class="visually-hidden">Loading...</span></div>'
  chatHistory.appendChild(responseDiv);
  
  postRequest(data)
    .then(response => getResponse(response, parsedResponse => {
      let word = parsedResponse.response;
      if (parsedResponse.done){
        chatHistory.context = parsedResponse.context;
      }
      if (word != undefined) {
        if (responseDiv.hidden_text == undefined){
          responseDiv.hidden_text = "";
        }
        responseDiv.hidden_text += word
        responseDiv.innerHTML = DOMPurify.sanitize(marked.parse(responseDiv.hidden_text)); // Append word to response container
      }
    }))
    .catch(error => {
      console.error(error);
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