// change settings of marked from default to remove deprecation warnings
// see conversation here: https://github.com/markedjs/marked/issues/2793
marked.use({
  mangle: false,
  headerIds: false
});

// Function to handle the user input and call the API functions
async function submitRequest() {
  const input = document.getElementById('user-input').value;
  const data = { model: "llama2", prompt: input };
  
  // Create user message element and append to chat history
  let chatHistory = document.getElementById('chat-history');
  let userMessageDiv = document.createElement('div');
  userMessageDiv.className = 'mb-2 user-message text-end';
  userMessageDiv.innerText = input;
  chatHistory.appendChild(userMessageDiv);
  
  // Create response container
  let responseDiv = document.createElement('div');
  responseDiv.className = 'response-message mb-2 text-start';
  chatHistory.appendChild(responseDiv);
  
  postRequest(data)
    .then(response => getResponse(response, word => {
      if (word != undefined) {
        if (responseDiv.hidden_text == undefined){
          responseDiv.hidden_text = ""
        }
        responseDiv.hidden_text += word
        responseDiv.innerHTML = marked.parse(responseDiv.hidden_text); // Append word to response container
      }
    }))
    .catch(error => {
      console.error(error);
    });

  // Clear user input
  document.getElementById('user-input').value = '';
}

// Event listener for Ctrl + Enter
document.getElementById('user-input').addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.key === 'Enter') {
    submitRequest();
  }
});
