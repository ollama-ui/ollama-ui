const faqString = `
**How can I expose the Ollama server?**

By default, Ollama allows cross origin requests from 127.0.0.1 and 0.0.0.0.

To support more origins, you can use the OLLAMA_ORIGINS environment variable:

\`\`\`
OLLAMA_ORIGINS=${window.location.origin} ollama serve
\`\`\`

Also see: https://github.com/jmorganca/ollama/blob/main/docs/faq.md
`;



const clipboardIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
<path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
<path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
</svg>`
const textBoxBaseHeight = 40;  // This should match the default height set in CSS

// change settings of marked from default to remove deprecation warnings
// see conversation here: https://github.com/markedjs/marked/issues/2793
marked.use({
  mangle: false,
  headerIds: false
});

function autoFocusInput() {
  const userInput = document.getElementById('user-input');
  userInput.focus();
}

/*
takes in model as a string
updates the query parameters of page url to include model name
*/
function updateModelInQueryString(model) {
  // make sure browser supports features
  if (window.history.replaceState && 'URLSearchParams' in window) {
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set("model", model);
    // replace current url without reload
    const newPathWithQuery = `${window.location.pathname}?${searchParams.toString()}`
    window.history.replaceState(null, '', newPathWithQuery);
  }
}

// Fetch available models and populate the dropdown
async function populateModels() {
  document.getElementById('send-button').addEventListener('click', submitRequest);

  try {
    const data = await getModels();

    const selectElement = document.getElementById('model-select');

    // set up handler for selection
    selectElement.onchange = (() => updateModelInQueryString(selectElement.value));

    data.models.forEach((model) => {
      const option = document.createElement('option');
      option.value = model.name;
      option.innerText = model.name;
      selectElement.appendChild(option);
    });

    // select option present in url parameter if present
    const queryParams = new URLSearchParams(window.location.search);
    const requestedModel = queryParams.get('model');
    // update the selection based on if requestedModel is a value in options
    if ([...selectElement.options].map(o => o.value).includes(requestedModel)) {
      selectElement.value = requestedModel;
    }
    // otherwise set to the first element if exists and update URL accordingly
    else if (selectElement.options.length) {
      selectElement.value = selectElement.options[0].value;
      updateModelInQueryString(selectElement.value);
    }
  }
  catch (error) {
    const errorText = document.getElementById('errorText');
    errorText.textContent = ''; // Clear existing content
    const errorContent = DOMPurify.sanitize(marked.parse(
    `Ollama-ui was unable to communitcate with Ollama due to the following error:\n\n`
    + `\`\`\`${error.message}\`\`\`\n\n---------------------\n`
    + faqString));
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = errorContent;
    while (tempDiv.firstChild) {
      errorText.appendChild(tempDiv.firstChild);
    }
    let modal = new bootstrap.Modal(document.getElementById('errorModal'));
    modal.show();
  }
}

// adjusts the padding at the bottom of scrollWrapper to be the height of the input box
function adjustPadding() {
  const inputBoxHeight = document.getElementById('input-area').offsetHeight;
  const scrollWrapper = document.getElementById('scroll-wrapper');
  scrollWrapper.style.paddingBottom = `${inputBoxHeight + 15}px`;
}

// sets up padding resize whenever input box has its height changed
const autoResizePadding = new ResizeObserver(() => {
  adjustPadding();
});
autoResizePadding.observe(document.getElementById('input-area'));



// Function to get the selected model
function getSelectedModel() {
  return document.getElementById('model-select').value;
}

// variables to handle auto-scroll
// we only need one ResizeObserver and isAutoScrollOn variable globally
// no need to make a new one for every time submitRequest is called
const scrollWrapper = document.getElementById('scroll-wrapper');
let isAutoScrollOn = true;
// autoscroll when new line is added
const autoScroller = new ResizeObserver(() => {
  if (isAutoScrollOn) {
    scrollWrapper.scrollIntoView({behavior: "smooth", block: "end"});
  }
});

// event listener for scrolling
let lastKnownScrollPosition = 0;
let ticking = false;
document.addEventListener("scroll", (event) => {
  // if user has scrolled up and autoScroll is on we turn it off
  if (!ticking && isAutoScrollOn && window.scrollY < lastKnownScrollPosition) {
    window.requestAnimationFrame(() => {
      isAutoScrollOn = false;
      ticking = false;
    });
    ticking = true;
  }
  // if user has scrolled nearly all the way down and autoScroll is disabled, re-enable
  else if (!ticking && !isAutoScrollOn &&
    window.scrollY > lastKnownScrollPosition && // make sure scroll direction is down
    window.scrollY >= document.documentElement.scrollHeight - window.innerHeight - 30 // add 30px of space--no need to scroll all the way down, just most of the way
  ) {
    window.requestAnimationFrame(() => {
      isAutoScrollOn = true;
      ticking = false;
    });
    ticking = true;
  }
  lastKnownScrollPosition = window.scrollY;
});

function removeBetween(arr, startVal, endVal) {
  if (typeof arr === "undefined" || !Array.isArray(arr)) {
    return arr;
  }
  const startIndex = arr.indexOf(startVal);
  const endIndex = arr.indexOf(endVal);

  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
    return arr;
  }

  arr.splice(startIndex, endIndex - startIndex + 1);
  return arr;
}

// Function to handle the user input and call the API functions
async function submitRequest() {
  document.getElementById('chat-container').style.display = 'block';

  const input = document.getElementById('user-input').value;
  const selectedModel = getSelectedModel();
  const context = document.getElementById('chat-history').context;
  const systemPrompt = document.getElementById('system-prompt').value;

  // Prepare prompt with file contents for non-image files
  let enhancedPrompt = input;
  const imageAttachments = [];

  for (const file of attachedFiles) {
    if (file.isImage) {
      imageAttachments.push(file.base64);
    } else {
      // Append text file contents to the prompt
      enhancedPrompt += `\n\n--- File: ${file.name} ---\n${file.content}\n--- End of ${file.name} ---`;
    }
  }

  const data = {
    model: selectedModel,
    prompt: enhancedPrompt,
    system: systemPrompt
  };

  // Handle context carefully when switching between image and non-image messages
  const cleanedContext = removeBetween(context, 151648, 151649);
  
  // Add images if any and track for next message
  if (imageAttachments.length > 0) {
    data.images = imageAttachments;
    lastMessageHadImages = true;
    // Include context when sending images
    if (cleanedContext && cleanedContext.length > 0) {
      data.context = cleanedContext;
    }
  } else {
    // If last message had images but this one doesn't, skip context
    // to avoid "invalid image index" errors
    if (!lastMessageHadImages && cleanedContext && cleanedContext.length > 0) {
      data.context = cleanedContext;
    }
    lastMessageHadImages = false;
  }

  // Create user message element and append to chat history
  let chatHistory = document.getElementById('chat-history');
  let userMessageDiv = document.createElement('div');
  userMessageDiv.className = 'mb-2 user-message';

  // Add the text content
  const textDiv = document.createElement('div');
  textDiv.textContent = input;
  userMessageDiv.appendChild(textDiv);

  // Add attached images and files to user message
  if (attachedFiles.length > 0) {
    const attachmentsContainer = document.createElement('div');
    attachmentsContainer.className = 'message-attachments';

    // Separate images and other files
    const images = attachedFiles.filter(f => f.isImage);
    const otherFiles = attachedFiles.filter(f => !f.isImage);

    // Display images
    if (images.length > 0) {
      const imagesDiv = document.createElement('div');
      imagesDiv.className = 'message-images';
      images.forEach(file => {
        const img = document.createElement('img');
        img.src = `data:${file.type};base64,${file.base64}`;
        img.alt = file.name;
        img.className = 'message-image';
        img.title = file.name;
        imagesDiv.appendChild(img);
      });
      attachmentsContainer.appendChild(imagesDiv);
    }

    // Display other file indicators
    if (otherFiles.length > 0) {
      const filesDiv = document.createElement('div');
      filesDiv.className = 'message-files';
      otherFiles.forEach(file => {
        const fileIndicator = document.createElement('div');
        fileIndicator.className = 'file-indicator';
        fileIndicator.textContent = `📄 ${file.name}`;
        filesDiv.appendChild(fileIndicator);
      });
      attachmentsContainer.appendChild(filesDiv);
    }

    userMessageDiv.appendChild(attachmentsContainer);
  }

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
  stopButton.textContent = 'Stop';
  stopButton.onclick = (e) => {
    e.preventDefault();
    interrupt.abort('Stop button pressed');
  }
  // add button after sendButton
  const sendButton = document.getElementById('send-button');
  sendButton.insertAdjacentElement('beforebegin', stopButton);

  // change autoScroller to keep track of our new responseDiv
  autoScroller.observe(responseDiv);

  postRequest(data, interrupt.signal)
    .then(async response => {
      await getResponse(response, parsedResponse => {
        let word = parsedResponse.response;
        if (parsedResponse.done) {
          chatHistory.context = parsedResponse.context;
          // Copy button
          let copyButton = document.createElement('button');
          copyButton.className = 'btn btn-secondary copy-button';
          // Use a temporary div to parse the SVG string
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = clipboardIcon;
          copyButton.appendChild(tempDiv.firstChild);
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
        if (word != undefined && word != "") {
          if (responseDiv.hidden_text == undefined){
            responseDiv.hidden_text = "";
          }
          word = word.replace(/<think>/g, '<details open><summary>think content</summary><br><span style="color:gray;">').replace(/<\/think>/g, '</span><hr></details>');
          responseDiv.hidden_text += word;
          // Clear and update response content safely
          const sanitizedContent = DOMPurify.sanitize(marked.parse(responseDiv.hidden_text));
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = sanitizedContent;
          // Clear existing content except spinner and stop button
          while (responseDiv.firstChild &&
                 responseDiv.firstChild !== spinner &&
                 !responseDiv.firstChild.classList?.contains('copy-button')) {
            responseDiv.removeChild(responseDiv.firstChild);
          }
          // Append new content
          while (tempDiv.firstChild) {
            responseDiv.insertBefore(tempDiv.firstChild, spinner || responseDiv.firstChild);
          }
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

  // Clear user input and attachments
  const element = document.getElementById('user-input');
  element.value = '';
  $(element).css("height", textBoxBaseHeight + "px");
  clearAttachments();
}

function getUserMessagesFromHistory() {
  const UserMessageElements = document.querySelectorAll('#chat-history .user-message');
  return Array.from(UserMessageElements).map(e => e.innerText);
}

// Event listener for user input
document.getElementById('user-input').addEventListener('keydown', async (e) => {
  // Event listener for Ctrl + Enter or CMD + Enter to submit the request
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    await submitRequest();
  }

  // When the user presses the arrow up key, and no text has been entered, populate the input with the last user message
  if (e.key === 'ArrowUp' && e.target.value === '') {
    const lastUserMessage = getUserMessagesFromHistory().pop();
    if (lastUserMessage) {
      e.target.value = lastUserMessage;
    }
  }
});


// File attachment handling
let attachedFiles = [];
let lastMessageHadImages = false;

function initializeFileHandlers() {
  const fileInput = document.getElementById('file-input');
  const fileAttachButton = document.getElementById('file-attach-button');

  fileAttachButton.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', handleFileSelection);

  // Add drag and drop support
  const inputArea = document.getElementById('input-area');
  inputArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    inputArea.classList.add('drag-over');
  });

  inputArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    inputArea.classList.remove('drag-over');
  });

  inputArea.addEventListener('drop', (e) => {
    e.preventDefault();
    inputArea.classList.remove('drag-over');
    handleDroppedFiles(e.dataTransfer.files);
  });
}

async function handleFileSelection(event) {
  const files = event.target.files;
  await processFiles(files);
  event.target.value = ''; // Reset input
}

async function handleDroppedFiles(files) {
  await processFiles(files);
}

async function processFiles(files) {
  const maxFileSize = 10 * 1024 * 1024; // 10MB limit

  for (const file of files) {
    if (file.size > maxFileSize) {
      alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
      continue;
    }

    // Check if file is an image
    if (file.type.startsWith('image/')) {
      const base64 = await fileToBase64(file);
      attachedFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: base64.split(',')[1], // Remove data URL prefix
        isImage: true
      });
    } else {
      // For non-image files, read as text
      const text = await fileToText(file);
      attachedFiles.push({
        name: file.name,
        type: file.type,
        size: file.size,
        content: text,
        isImage: false
      });
    }
  }

  updateFilePreview();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fileToText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function updateFilePreview() {
  const filePreviewsContainer = document.getElementById('file-previews');
  const fileAttachmentArea = document.getElementById('file-attachment-area');

  // Clear container safely
  while (filePreviewsContainer.firstChild) {
    filePreviewsContainer.removeChild(filePreviewsContainer.firstChild);
  }

  if (attachedFiles.length === 0) {
    fileAttachmentArea.style.display = 'none';
    return;
  }

  fileAttachmentArea.style.display = 'block';

  attachedFiles.forEach((file, index) => {
    const previewDiv = document.createElement('div');
    previewDiv.className = 'file-preview';

    if (file.isImage) {
      const img = document.createElement('img');
      img.src = `data:${file.type};base64,${file.base64}`;
      img.alt = file.name;
      previewDiv.appendChild(img);
    } else {
      const fileIcon = document.createElement('div');
      fileIcon.className = 'file-icon';
      fileIcon.textContent = `📄 ${file.name}`;
      previewDiv.appendChild(fileIcon);
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-file';
    removeBtn.textContent = '×';
    removeBtn.onclick = () => removeFile(index);
    previewDiv.appendChild(removeBtn);

    filePreviewsContainer.appendChild(previewDiv);
  });
}

function removeFile(index) {
  attachedFiles.splice(index, 1);
  updateFilePreview();
}

function clearAttachments() {
  attachedFiles = [];
  updateFilePreview();
}

window.onload = () => {
  updateChatList();
  populateModels();
  adjustPadding();
  autoFocusInput();
  initializeFileHandlers();

  document.getElementById("delete-chat").addEventListener("click", deleteChat);
  document.getElementById("new-chat").addEventListener("click", startNewChat);
  document.getElementById("saveName").addEventListener("click", saveChat);
  document.getElementById("chat-select").addEventListener("change", loadSelectedChat);
  document.getElementById("host-address").addEventListener("change", setHostAddress);
  document.getElementById("system-prompt").addEventListener("change", setSystemPrompt);
}

function deleteChat() {
  const selectedChat = document.getElementById("chat-select").value;
  localStorage.removeItem(selectedChat);
  updateChatList();
}

// Function to save chat with a unique name
function saveChat() {
  const chatName = document.getElementById('userName').value;

  // Close the modal
  const bootstrapModal = bootstrap.Modal.getInstance(document.getElementById('nameModal'));
  bootstrapModal.hide();

  if (chatName === null || chatName.trim() === "") return;
  // Store chat messages as structured data instead of HTML
  const chatHistoryEl = document.getElementById("chat-history");
  const messages = [];
  for (const child of chatHistoryEl.children) {
    messages.push({
      className: child.className,
      textContent: child.textContent,
      isUser: child.classList.contains('user-message')
    });
  }
  const context = chatHistoryEl.context;
  const systemPrompt = document.getElementById('system-prompt').value;
  const model = getSelectedModel();
  localStorage.setItem(chatName, JSON.stringify({"messages":messages, "context":context, system: systemPrompt, "model": model}));
  updateChatList();
}

// Function to load selected chat from dropdown
function loadSelectedChat() {
  const selectedChat = document.getElementById("chat-select").value;
  const obj = JSON.parse(localStorage.getItem(selectedChat));
  const chatHistory = document.getElementById("chat-history");

  // Clear existing chat history
  while (chatHistory.firstChild) {
    chatHistory.removeChild(chatHistory.firstChild);
  }

  // Handle both old format (history) and new format (messages)
  if (obj.history) {
    // Legacy format - use innerHTML one last time for backward compatibility
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = obj.history;
    while (tempDiv.firstChild) {
      chatHistory.appendChild(tempDiv.firstChild);
    }
  } else if (obj.messages) {
    // New format - recreate messages from structured data
    obj.messages.forEach(msg => {
      const messageDiv = document.createElement('div');
      messageDiv.className = msg.className;
      messageDiv.textContent = msg.textContent;
      chatHistory.appendChild(messageDiv);
    });
  }

  chatHistory.context = obj.context;
  document.getElementById("system-prompt").value = obj.system;
  updateModelInQueryString(obj.model)
  document.getElementById('chat-container').style.display = 'block';
}

function startNewChat() {
    const chatHistory = document.getElementById("chat-history");
    // Clear chat history safely
    while (chatHistory.firstChild) {
      chatHistory.removeChild(chatHistory.firstChild);
    }
    chatHistory.context = null;
    document.getElementById('chat-container').style.display = 'none';
    updateChatList();
}

// Function to update chat list dropdown
function updateChatList() {
  const chatList = document.getElementById("chat-select");
  // Clear existing options
  while (chatList.firstChild) {
    chatList.removeChild(chatList.firstChild);
  }
  // Add default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.disabled = true;
  defaultOption.selected = true;
  defaultOption.textContent = 'Select a chat';
  chatList.appendChild(defaultOption);
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key === "host-address" || key == "system-prompt") continue;
    const option = document.createElement("option");
    option.value = key;
    option.text = key;
    chatList.add(option);
  }
}

function autoGrow(element) {
    const maxHeight = 200;  // This should match the max-height set in CSS

    // Count the number of lines in the textarea based on newline characters
    const numberOfLines = $(element).val().split('\n').length;

    // Temporarily reset the height to auto to get the actual scrollHeight
    $(element).css("height", "auto");
    let newHeight = element.scrollHeight;

    // If content is one line, set the height to baseHeight
    if (numberOfLines === 1) {
        newHeight = textBoxBaseHeight;
    } else if (newHeight > maxHeight) {
        newHeight = maxHeight;
    }

    $(element).css("height", newHeight + "px");
}
