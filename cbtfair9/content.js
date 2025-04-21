// URL observer to detect URL changes
let lastUrl = location.href;
const urlObserver = new MutationObserver(async () => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (lastUrl.includes("cbtfair9")) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      attachClickListeners();
      updateMaxBetValues();
    }
  } 
});

urlObserver.observe(document.querySelector("body"), {
  childList: true,
  subtree: true
});

const maxBetValues = new Map();

const maxBetContainerSelectors = [
  '.market-container', '.bet-option', '.event-container',
  '.match-odds', '.market-area', '.odds-container', '.bet-table-header'
];

const maxBetElementSelectors = [
  '.max-bet', '.max-stake', '.maximum-bet', '.max-value',
  '[data-max-bet]', '[data-max-stake]', '.limit-value',
  '.max-bet.d-none-desktop', '.fancy-min-max', '.fancy-min-max-box',
  '.market-nation-name',
  '.country-name.box-4.text-info b',
  '.box-2.float-left.text-right.min-max'
];

function convertToNumeric(value) {
  if (!value) return 0;
  const cleanValue = value.toString().trim().replace(/[^\dLK.]/gi, '');
  if (cleanValue.toUpperCase().includes('L')) {
    return parseFloat(cleanValue.toUpperCase().replace('L', '')) * 100000;
  }
  if (cleanValue.toUpperCase().includes('K')) {
    return parseFloat(cleanValue.toUpperCase().replace('K', '')) * 1000;
  }
  return parseFloat(cleanValue);
}

function extractMaxBetValue(element, selector) {
  if (!element) return null;
  
  const getMaxValue = (text) => {
    if (!text.includes('Max:')) return text;
    return text.split('Max:')[1].trim().split(/\s+/)[0];
  };

  let extractedValue = null;
  
  if (selector === '.fancy-min-max-box') {
    const maxSpan = element.querySelector('.fancy-min-max span:nth-child(2)');
    if (maxSpan) {
      extractedValue = getMaxValue(maxSpan.textContent.trim());
    }
  }
  else if (selector === '.market-nation-name') {
    extractedValue = getMaxValue(element.textContent.trim());
  }
  else if (selector === '.max-bet.d-none-desktop') {
    if (element.textContent.includes('Max:')) {
      const spans = element.querySelectorAll('span');
      for (let i = 0; i < spans.length; i++) {
        if (spans[i].textContent.trim() === 'Max:' && i+1 < spans.length) {
          extractedValue = spans[i+1].textContent.trim();
          break;
        }
      }
      if (!extractedValue) {
        extractedValue = getMaxValue(element.textContent);
      }
    }
  }
  else if (selector === '.fancy-min-max') {
    if (element.textContent.includes('Max:')) {
      const maxSpan = element.querySelector('span:nth-child(2)');
      extractedValue = maxSpan ? maxSpan.textContent.trim() : getMaxValue(element.textContent);
    }
  }
  else if (selector === '.country-name.box-4.text-info b') {
    const maxSpan = element.querySelector('span:nth-child(2)');
    if (maxSpan) {
      extractedValue = maxSpan.textContent.trim();
    }
  }
  else if (selector === '.box-2.float-left.text-right.min-max') {
    const maxSpan = element.querySelector('span:nth-child(2) span');
    if (maxSpan) {
      extractedValue = maxSpan.textContent.trim();
    }
  }
  
  return extractedValue ? convertToNumeric(extractedValue) : null;
}

function updateMaxBetValues() {
  maxBetValues.clear();
  
  const containers = Array.from(maxBetContainerSelectors.reduce((acc, selector) => {
    const found = document.querySelectorAll(selector);
    return found && found.length ? [...acc, ...found] : acc;
  }, [])) || [document.body];
  
  containers.forEach((container, index) => {
    const maxBetElements = Array.from(maxBetElementSelectors.reduce((acc, selector) => {
      const elements = container.querySelectorAll(selector);
      return elements && elements.length ? [...acc, ...elements] : acc;
    }, []));
    
    if (maxBetElements.length) {
      const contextId = container.id || container.dataset.marketId || 
                       container.dataset.eventId || `context-${index}`;
      
      for (const element of maxBetElements) {
        let parsedValue = null;
        
        if (element.classList.contains('max-bet') && element.classList.contains('d-none-desktop')) {
          parsedValue = extractMaxBetValue(element, '.max-bet.d-none-desktop');
        } 
        else if (element.classList.contains('fancy-min-max')) {
          parsedValue = extractMaxBetValue(element, '.fancy-min-max');
        }
        else {
          const extractedValue = element.tagName === 'INPUT' ? element.value :
                               element.dataset.maxBet || element.dataset.maxStake || 
                               element.textContent.trim();
          parsedValue = extractedValue ? convertToNumeric(extractedValue) : null;
        }
        
        if (parsedValue && !isNaN(parsedValue) && parsedValue > 0) {
          maxBetValues.set(contextId, parsedValue);
          if (element.className) {
            maxBetValues.set(`${contextId}-${element.className.trim().replace(/\s+/g, '-')}`, parsedValue);
          }
          break;
        }
      }
    }
  });
  
  const specificSelectors = ['.max-bet.d-none-desktop', '.fancy-min-max'];
  specificSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach((element, idx) => {
      const parsedValue = extractMaxBetValue(element, selector);
      if (parsedValue && !isNaN(parsedValue) && parsedValue > 0) {
        maxBetValues.set(`specific-${selector.replace(/\./g, '-')}-${idx}`, parsedValue);
      }
    });
  });
}

function getMaxBetValue(contextElement = null) {
  if (!contextElement) {
    return maxBetValues.size > 0 ? Array.from(maxBetValues.values())[0] : 0;
  }
  
  const specificSelectors = ['.max-bet.d-none-desktop', '.fancy-min-max'];
  for (const selector of specificSelectors) {
    if (contextElement.matches?.(selector)) {
      const parsedValue = extractMaxBetValue(contextElement, selector);
      if (!isNaN(parsedValue) && parsedValue > 0) return parsedValue;
    }
    
    let parent = contextElement.closest('.bet-table-header, .market-container') || contextElement.parentElement;
    let depth = 0;
    const maxDepth = 5;
    
    while (parent && depth < maxDepth) {
      const element = parent.querySelector(selector);
      if (element) {
        const parsedValue = extractMaxBetValue(element, selector);
        if (!isNaN(parsedValue) && parsedValue > 0) return parsedValue;
      }
      parent = parent.parentElement;
      depth++;
    }
  }
  
  let currentElement = contextElement;
  while (currentElement) {
    const contextId = currentElement.id || currentElement.dataset.marketId || currentElement.dataset.eventId;
    if (contextId && maxBetValues.has(contextId)) {
      return maxBetValues.get(contextId);
    }
    currentElement = currentElement.parentElement;
  }
  
  return maxBetValues.size > 0 ? Array.from(maxBetValues.values())[0] : 0;
}

// Function to attach click listeners to betting buttons
function attachClickListeners() {
  console.log("Attaching click listeners");
  // Try multiple possible selectors for betting buttons
  const selectors = [
    ".bl-box", 
    ".back", 
    ".lay", 
    ".bl-box", 
    "[data-bet='back']", 
    "[data-bet='lay']", 
    ".odds-box", 
    ".odds-button",
    ".back-btn",
    ".lay-btn",
    ".bet-button",
    ".bet-btn",
    ".back-odds",
    ".lay-odds",
    ".back-option",
    ".lay-option"
  ];
  
  let elementsFound = 0;
  
  selectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    if (elements && elements.length > 0) {
      elementsFound += elements.length;
      elements.forEach((element) => {
        // Remove existing listener to avoid duplicates
        element.removeEventListener("click", handleBetButtonClick);
        // Add the click listener
        element.addEventListener("click", handleBetButtonClick);
        console.log(`Added click listener to ${selector} element`);
      });
    }
  });
  
  console.log(`Attached click listeners to ${elementsFound} elements`);
  
  // Also try to find elements by their text content
  const textSelectors = [
    "button:contains('Back')",
    "button:contains('Lay')",
    "div:contains('Back')",
    "div:contains('Lay')"
  ];
  
  // This is a fallback method since :contains is not standard CSS
  const allButtons = document.querySelectorAll('button, div, span, a');
  allButtons.forEach(element => {
    const text = element.textContent.trim();
    if (text === 'Back' || text === 'Lay') {
      element.removeEventListener("click", handleBetButtonClick);
      element.addEventListener("click", handleBetButtonClick);
      console.log(`Added click listener to element with text: ${text}`);
      elementsFound++;
    }
  });
  
  updateMaxBetValues();
}

function findElementBySelectors(selectors) {
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      console.log(`Found element with selector: ${selector}`, element);
      return element;
    }
  }
  return null;
}

// Initialize the script when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded, initializing script");
  attachClickListeners();
  updateMaxBetValues();
});

// Also initialize when the window loads (as a fallback)
window.addEventListener('load', function() {
  console.log("Window loaded, initializing script");
  attachClickListeners();
  updateMaxBetValues();
});

// Initialize immediately if the document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log("Document already loaded, initializing script immediately");
  attachClickListeners();
  updateMaxBetValues();
}

// Set up a periodic check to re-attach listeners (in case of dynamic content)
setInterval(() => {
  console.log("Periodic check: re-attaching click listeners");
  attachClickListeners();
  updateMaxBetValues();
}, 5000);

const typeValue = async (element, value) => {
  if (!element) return false;
  
  try {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    nativeInputValueSetter.call(element, value);
    
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
    
    const changeEvent = new Event('change', { bubbles: true });
    element.dispatchEvent(changeEvent);
    
    return true;
  } catch (error) {
    console.error("Error setting input value:", error);
    
    try {
      element.value = value;
      
      element.focus();
      document.execCommand("selectAll", false, null);
      document.execCommand("insertText", false, value);
      
      return true;
    } catch (fallbackError) {
      console.error("Fallback methods also failed:", fallbackError);
      return false;
    }
  }
};

console.log("content.js loaded");

const popup = document.createElement("div");
popup.className = "golden-exchange-popup";
popup.innerHTML = `
    <div id="draggable-popup" style="
        position: fixed;
        bottom: 20px;
        right: 655px;
        width: 200px;
        background: linear-gradient(145deg, #2c3e50, #3498db);
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        cursor: move;
    ">
        <input type="number" id="global-stake-input" placeholder="Enter stake amount" style="
            width: 100%;
            padding: 8px;
            border: none;
            border-radius: 5px;
            margin-bottom: 5px;
            text-align: center;
            font-size: 14px;
        ">
        <div id="bet-message" style="
            margin-top: 10px;
            color: white;
            font-size: 12px;
            text-align: center;
        "></div>
    </div>
`;
document.body.appendChild(popup);

// Store the last entered amount
let lastEnteredAmount = "";
// Flag to track if we're using maximum bet value instead of negative number
let usingMaxValue = false;
// Store the clicked element for context
let lastClickedElement = null;

// Function to wait for an element to appear
function waitForElement(selector, maxWait = 5000) {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    
    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Set a timeout to stop waiting after maxWait ms
    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, maxWait);
  });
}

// Set up a mutation observer to watch for changes to max bet elements
const maxBetObserver = new MutationObserver(() => {
  updateMaxBetValues();
});

// Start observing the document for when max bet elements appear or change
maxBetObserver.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true
});

// Add rate limiting variables
let lastApiCallTime = 0;
const API_CALL_INTERVAL = 2000; // Minimum 2 seconds between API calls
let isProcessingBet = false;

// Function to track bet result
async function trackBetResult(amount, betType) {
  console.log("Tracking bet result");
  
  // Prevent duplicate processing
  if (isProcessingBet) {
    console.log("Bet is already being processed");
    return;
  }
  
  isProcessingBet = true;
  
  try {
    // Find the odds input using various selectors
    const oddsInputSelectors = [
      '.form-control:not([placeholder="Amount"])',
      '.place-bet-odds .form-control',
      'input.odds',
      '.odds-input',
      '[data-type="odds"]',
      '.odds-value',
      '.bet-odds',
      '.selected-odds'
    ];
    
    const oddsInputElement = findElementBySelectors(oddsInputSelectors);
    const oddsValue = oddsInputElement ? oddsInputElement.value : "";
    
    // Wait for toast notifications or success/error indicators
    let checkCount = 0;
    let successToast = null;
    let errorToast = null;
    let successIndicator = null;
    let errorIndicator = null;
    
    // Define possible success and error indicators
    const successIndicators = [
      '.go3958317564', 
      '.toast-success',
      '.success-message',
      '.bet-success',
      '.bet-confirmed',
      '.bet-placed',
      '.bet-accepted',
      '.bet-completed',
      '.bet-successful',
      '.bet-success-message',
      '.bet-confirmation',
      '.bet-placed-message',
      '.bet-accepted-message',
      '.bet-completed-message',
      '.bet-successful-message'
    ];
    
    const errorIndicators = [
      '.toast-error',
      '.error-message',
      '.bet-error',
      '.bet-failed',
      '.bet-rejected',
      '.bet-declined',
      '.bet-error-message',
      '.bet-failed-message',
      '.bet-rejected-message',
      '.bet-declined-message'
    ];
    
    // Check for success/error indicators
    while ((!successToast && !errorToast && !successIndicator && !errorIndicator) && checkCount < 25) {
      // Check for success toast
      for (const selector of successIndicators) {
        successToast = document.querySelector(selector);
        if (successToast) break;
      }
      
      // Check for error toast
      for (const selector of errorIndicators) {
        errorToast = document.querySelector(selector);
        if (errorToast) break;
      }
      
      // Check for success indicator in the DOM
      successIndicator = document.querySelector('.success, .confirmed, .placed, .accepted, .completed, .successful');
      
      // Check for error indicator in the DOM
      errorIndicator = document.querySelector('.error, .failed, .rejected, .declined');
      
      if (successToast || errorToast || successIndicator || errorIndicator) {
        break;
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 200));
      checkCount++;
    }
    
    // If error toast or indicator found, stop execution
    if (errorToast || errorIndicator) {
      console.log("Error indicator found, stopping bet history creation");
      return;
    }
    
    // If success toast or indicator found, create bet history
    if (successToast || successIndicator) {
      console.log("Success indicator found, creating bet history");
      
      // Create bet history
      const betDetails = {
        stake: amount,
        odds: oddsValue,
        value: amount,
        url_id: "10", 
        type: betType,
        timestamp: new Date().toISOString()
      };
      
      // Implement rate limiting
      const now = Date.now();
      const timeSinceLastCall = now - lastApiCallTime;
      
      if (timeSinceLastCall < API_CALL_INTERVAL) {
        // Wait for the remaining time
        await new Promise(resolve => setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall));
      }
      
      try {
        const response = await fetch("https://keshavinfotechdemo2.com/keshav/KG2/SpeedUp/public/api/create-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "authorization": "Bearer 325|TGgQwHqj5m79wnlaM2GHAV94UagWerT3t43h1FKb",
          },
          body: JSON.stringify(betDetails)
        });
        
        // Update last API call time
        lastApiCallTime = Date.now();
        
        if (response.status === 401) {
          console.error("API request limit exceeded. Please wait before making more requests.");
          return;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log("Bet history created:", result);
      } catch (error) {
        console.error("Failed to create bet history:", error);
      }
    }
  } finally {
    // Reset the processing flag
    isProcessingBet = false;
  }
}

let isProcessingInput = false;
let lastProcessedValue = "";

// Function to handle global input changes
function handleGlobalInput(event) {
  if (isProcessingInput) {
    return;
  }

  const value = event.target.value;
  
  // If the value hasn't changed, don't process it again
  if (value === lastProcessedValue) {
    return;
  }

  isProcessingInput = true;
  
  try {
    // Store the entered value exactly as is
    lastEnteredAmount = value;
    lastProcessedValue = value;
    
    // For negative values, just store the value without any processing
    if (parseFloat(value) < 0) {
      // Store the value as is, no automatic changes
      return;
    }
  } finally {
    isProcessingInput = false;
  }
}

// Add event listeners
document
  .getElementById("global-stake-input")
  .addEventListener("input", handleGlobalInput);

// Make popup draggable
const draggablePopup = document.getElementById("draggable-popup");
let isDragging = false;
let currentX;
let currentY;
let initialX;
let initialY;
let xOffset = 0;
let yOffset = 0;

draggablePopup.addEventListener("mousedown", dragStart);
document.addEventListener("mousemove", drag);
document.addEventListener("mouseup", dragEnd);

function dragStart(e) {
  initialX = e.clientX - xOffset;
  initialY = e.clientY - yOffset;
  if (e.target === draggablePopup) {
    isDragging = true;
  }
}

function drag(e) {
  if (isDragging) {
    e.preventDefault();
    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;
    xOffset = currentX;
    yOffset = currentY;
    setTranslate(currentX, currentY, draggablePopup);
  }
}

function dragEnd() {
  initialX = currentX;
  initialY = currentY;
  isDragging = false;
}

function setTranslate(xPos, yPos, el) {
  el.style.transform = `translate(${xPos}px, ${yPos}px)`;
}

// Add media query for mobile devices
const style = document.createElement("style");
style.innerHTML = `
  @media (max-width: 768px) {
      #draggable-popup {
          width: 80% !important;
          bottom: 49px !important;
          right: auto !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
      }
  }
`;
document.head.appendChild(style);

// Function to directly click the Place Bet button
function clickPlaceBetButton() {
  console.log("Attempting to click Place Bet button directly");
  
  // Get the value from the global input
  const globalInput = document.getElementById("global-stake-input");
  const betAmount = globalInput.value;
  
  if (!betAmount || betAmount === "") {
    console.log("No amount entered in global input");
    return false;
  }
  
  // First, try to find the specific "Place Bet" button with class "btn btn-success"
  let placeBetButton = document.querySelector('.place-bet-btn-box .btn-success');
  
  // If not found, try to find by text content
  if (!placeBetButton) {
    const allButtons = document.querySelectorAll('button');
    for (const button of allButtons) {
      if (button.textContent.trim() === 'Place Bet') {
        placeBetButton = button;
        break;
      }
    }
  }
  
  // If still not found, try other selectors
  if (!placeBetButton) {
    // Try other common selectors
    const selectors = [
      'button.btn-primary',
      'button[type="submit"]',
      '.place-bet-button',
      '.confirm-bet',
      '.place-bet',
      '.bet-submit',
      '.betting-button'
    ];
    
    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button) {
        placeBetButton = button;
        break;
      }
    }
  }
  
  if (placeBetButton) {
    console.log("Found Place Bet button:", placeBetButton);
    
    // Enable the button if it's disabled
    if (placeBetButton.disabled) {
      placeBetButton.disabled = false;
    }
    
    // Try multiple methods to click the button
    try {
      // Method 1: Direct click
      placeBetButton.click();
      
      // Method 2: Create and dispatch a click event
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      placeBetButton.dispatchEvent(clickEvent);
      
      // Method 3: Focus and press Enter
      placeBetButton.focus();
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      placeBetButton.dispatchEvent(enterEvent);
      
      // Method 4: Use the submit() method if it's a form
      const form = placeBetButton.closest('form');
      if (form) {
        form.submit();
      }
      
      // Method 5: Try to find and fill the stake input first
      const stakeInputSelectors = [
        '.form-control[placeholder="Amount"]',
        '.place-bet-btn .form-control',
        'input[name="Amount"]',
        '.bet-stake input',
        '.stake-input',
        'input.stake',
        '.place-bet-stake input',
        'input[type="number"]',
        '.betslip-stake input',
        'input[placeholder="Stake"]',
        'input[placeholder="Amount"]',
        'input[placeholder="Enter Amount"]',
        'input[placeholder="Enter Stake"]'
      ];
      
      const stakeInput = findElementBySelectors(stakeInputSelectors);
      if (stakeInput) {
        console.log("Found stake input:", stakeInput);
        typeValue(stakeInput, betAmount).then(success => {
          if (success) {
            console.log("Filled stake input with:", betAmount);
            // Try clicking the button again after filling the input
            placeBetButton.click();
          }
        });
      }
      
      return true;
    } catch (e) {
      console.error("Error clicking Place Bet button:", e);
      return false;
    }
  } else {
    console.log("Place Bet button not found");
    return false;
  }
}

// Add a keyboard shortcut to trigger the Place Bet button
document.addEventListener('keydown', function(event) {
  // Check for Ctrl+Enter or Cmd+Enter
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    console.log("Keyboard shortcut detected: Ctrl+Enter");
    clickPlaceBetButton();
  }
});

// Function to handle "Back" or "Lay" button clicks
async function handleBetButtonClick(event) {
  console.log("handleBetButtonClick triggered");
  
  // Store the clicked element for context
  lastClickedElement = event.target;
  
  // Get the value from the global input
  const globalInput = document.getElementById("global-stake-input");
  let displayAmount = globalInput.value;
  let betAmount = displayAmount;
  
  console.log("Global input value:", displayAmount);
  
  if (!displayAmount || displayAmount === "") {
    console.log("No amount entered in global input");
    return;
  }
  
  // If the input amount is negative, find and use the max value
  if (parseFloat(displayAmount) < 0) {
    console.log("Negative value detected, searching for max value");
    
    // Try to find max value in nearby elements first
    const specificSelectors = [
      '.country-name.box-4.text-info b', 
      '.box-2.float-left.text-right.min-max',
      '.fancy-min-max-box', 
      '.market-nation-name', 
      '.max-bet.d-none-desktop', 
      '.fancy-min-max'
    ];
    
    let maxValue = null;
    
    // Search in parent elements
    let element = event.target;
    let depth = 0;
    const maxDepth = 10;
    
    while (element && depth < maxDepth && !maxValue) {
      for (const selector of specificSelectors) {
        const maxElement = element.querySelector(selector);
        if (maxElement) {
          const parsedValue = extractMaxBetValue(maxElement, selector);
          if (parsedValue && !isNaN(parsedValue) && parsedValue > 0) {
            maxValue = parsedValue;
            console.log("Found max value:", maxValue, "from selector:", selector);
            break;
          }
        }
      }
      
      element = element.parentElement;
      depth++;
    }
    
    if (!maxValue) {
      maxValue = getMaxBetValue(event.target);
    }
    
    if (maxValue && !isNaN(maxValue) && maxValue > 0) {
      betAmount = maxValue;
    }
  }
  
  // Determine bet type by checking various class possibilities
  let betType = "Unknown";
  const target = event.target;
  
  if (target.classList.contains('back') || 
      target.closest('.back') || 
      target.getAttribute('data-bet') === 'back') {
    betType = 'Back';
  } else if (target.classList.contains('lay') || 
             target.closest('.lay') || 
             target.getAttribute('data-bet') === 'lay') {
    betType = 'Lay';
  }
  
  console.log("Bet type:", betType);
  
  // Allow the default behavior to occur first
  // This will open the bet slip
  
  // Wait for the bet slip to appear - try different timings
  for (let delay of [500, 1000, 2000, 3000]) {
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Array of possible selectors for stake input
    const stakeInputSelectors = [
      'input.stakeinput.w-100',  // Prioritize this selector
      '.form-control[placeholder="Amount"]',
      '.place-bet-btn .form-control',
      'input[name="Amount"]',
      '.bet-stake input',
      '.stake-input',
      'input.stake',
      '.place-bet-stake input',
      'input[type="number"]',
      '.betslip-stake input',
      'input[placeholder="Stake"]',
      'input[placeholder="Amount"]',
      'input[placeholder="Enter Amount"]',
      'input[placeholder="Enter Stake"]'
    ];
    
    // Find the stake input
    const stakeInput = findElementBySelectors(stakeInputSelectors);
    
    if (stakeInput) {
      console.log("Found stake input:", stakeInput);
      
      // Fill in the stake amount
      const inputSuccess = await typeValue(stakeInput, betAmount);
      console.log("Filled stake input with:", betAmount, "Success:", inputSuccess);
      
      if (inputSuccess) {
        // First, try to find the specific "Place Bet" button with class "btn btn-success"
        let placeBetButton = document.querySelector('.place-bet-btn-box .btn-success');
        
        // If not found, try to find by text content
        if (!placeBetButton) {
          const allButtons = document.querySelectorAll('button');
          for (const button of allButtons) {
            if (button.textContent.trim() === 'Place Bet') {
              placeBetButton = button;
              break;
            }
          }
        }
        
        // If still not found, try other selectors
        if (!placeBetButton) {
          // Array of possible selectors for submit button
          const submitButtonSelectors = [
            '.btn.btn-primary.btn-block',
            'button[type="submit"]',
            '.place-bet-button',
            '.confirm-bet',
            '.place-bet',
            '.bet-submit',
            '.betting-button',
            'button.place-bet',
            'button.confirm-bet',
            'button.submit-bet',
            'button.btn-success',
            'button.btn-primary'
          ];
          
          // Find and click the submit button
          placeBetButton = findElementBySelectors(submitButtonSelectors);
        }
        
        if (placeBetButton) {
          console.log("Found Place Bet button:", placeBetButton);
          
          // Enable the button if it's disabled
          if (placeBetButton.disabled) {
            placeBetButton.disabled = false;
          }
          
          console.log("Clicking Place Bet button");
          
          // Try multiple methods to click the button
          try {
            // Method 1: Direct click
            placeBetButton.click();
            
            // Method 2: Create and dispatch a click event
            // const clickEvent = new MouseEvent('click', {
            //   view: window,
            //   bubbles: true,
            //   cancelable: true
            // });
            // placeBetButton.dispatchEvent(clickEvent);
            
            // // Method 3: Focus and press Enter
            // placeBetButton.focus();
            // const enterEvent = new KeyboardEvent('keydown', {
            //   key: 'Enter',
            //   code: 'Enter',
            //   keyCode: 13,
            //   which: 13,
            //   bubbles: true
            // });
            // placeBetButton.dispatchEvent(enterEvent);
            
            // // Method 4: Use the submit() method if it's a form
            // const form = placeBetButton.closest('form');
            // if (form) {
            //   form.submit();
            // }
          } catch (e) {
            console.error("Error clicking Place Bet button:", e);
          }
          
          // Track the bet success/failure
          trackBetResult(betAmount, betType);
          return; // Exit function after successful bet placement
        }
      }
    }
  }
  
  // If we get here, all attempts failed
  console.log("Failed to place bet after all attempts");
}