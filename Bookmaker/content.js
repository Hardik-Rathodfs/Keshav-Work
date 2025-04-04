// URL observer to detect URL changes
let lastUrl = location.href;
const urlObserver = new MutationObserver(async () => {
  console.log("urlObserver");
  console.log(location.href);
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log('URL changed to:', lastUrl);
    // Handle URL change here
    if (lastUrl.includes("bookmaker9")) {
      // URL matches the target pattern
      console.log("URL matches the target pattern");
      
      attachClickListeners();
      updateMaxBetValues(); // Update all max bet values when URL changes
    }
  }
});

// Start observing URL changes
urlObserver.observe(document.querySelector("body"), {
  childList: true,
  subtree: true
});

// Store all the maximum bet values with their context identifiers
const maxBetValues = new Map();

// Define possible selectors for max bet containers
const maxBetContainerSelectors = [
  '.flex.items-center.justify-between.mx-[2px]',
  '.text-[#C10930].text-[12px].my-2.font-bold'
];

// Additional selectors to find max bet elements - adding your specific selectors
const maxBetElementSelectors = [
  '.text-[#C10930].text-[12px].my-2.font-bold',
  'div:contains("Max Bet:")',
  '.flex.items-center.justify-between.mx-[2px] div:last-child'
];

// Function to convert shorthand values (like "1L", "5K") to numeric values
function convertToNumeric(value) {
  if (!value) return 0;
  
  // Clean the value string
  const cleanValue = value.toString().trim().replace(/[^\dLK.]/gi, '');
  
  console.log("Converting value:", value, "Cleaned:", cleanValue);
  
  // Convert if it contains L (lakh)
  if (cleanValue.toUpperCase().includes('L')) {
    const number = parseFloat(cleanValue.toUpperCase().replace('L', ''));
    return number * 100000; // 1L = 100,000
  }
  
  // Convert if it contains K (thousand)
  if (cleanValue.toUpperCase().includes('K')) {
    const number = parseFloat(cleanValue.toUpperCase().replace('K', ''));
    return number * 1000; // 1K = 1,000
  }
  
  // If it's just a number, return it
  return parseFloat(cleanValue);
}

// Function to extract max value from specific elements
function extractMaxBetValue(element, selector) {
  if (!element) return null;
  
  let extractedValue = null;
  
  // For the new max bet text format
  if (element.textContent.includes('Max Bet:')) {
    const maxText = element.textContent.split('Max Bet:')[1];
    if (maxText) {
      extractedValue = maxText.trim().split(/\s+/)[0];
      console.log("Found Max value in text:", extractedValue);
    }
  }
  
  console.log(`Raw extracted value for ${selector}:`, extractedValue);
  
  if (extractedValue) {
    // Convert the value, handling L and K formats
    const parsedValue = convertToNumeric(extractedValue);
    console.log(`Converted value for ${selector}:`, parsedValue);
    return parsedValue;
  }
  
  return null;
}

// Function to get all maximum bet values from different contexts
function updateMaxBetValues() {
  // Clear existing values
  maxBetValues.clear();
  
  // Try to find containers first
  let containers = [];
  maxBetContainerSelectors.forEach(selector => {
    const found = document.querySelectorAll(selector);
    if (found && found.length > 0) {
      containers = [...containers, ...Array.from(found)];
    }
  });
  
  // If no containers found, use body as the only container
  if (containers.length === 0) {
    containers = [document.body];
  }
  
  console.log(`Found ${containers.length} potential max bet containers`);
  
  // Process each container
  containers.forEach((container, index) => {
    // Try all possible max bet element selectors
    let maxBetElements = [];
    
    maxBetElementSelectors.forEach(selector => {
      const elements = container.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        maxBetElements = [...maxBetElements, ...Array.from(elements)];
      }
    });
    
    if (maxBetElements.length > 0) {
      // Generate a context identifier
      let contextId;
      
      // Try to use a meaningful identifier
      if (container.id) {
        contextId = container.id;
      } else if (container.dataset.marketId) {
        contextId = container.dataset.marketId;
      } else if (container.dataset.eventId) {
        contextId = container.dataset.eventId;
      } else {
        // Use container index as fallback
        contextId = `context-${index}`;
      }
      
      // Process max bet elements
      for (const element of maxBetElements) {
        let parsedValue = null;
        
        // Special handling for specific classes
        if (element.classList.contains('max-bet') && element.classList.contains('d-none-desktop')) {
          parsedValue = extractMaxBetValue(element, '.max-bet.d-none-desktop');
        } 
        else if (element.classList.contains('fancy-min-max')) {
          parsedValue = extractMaxBetValue(element, '.fancy-min-max');
        }
        // Regular handling for other elements
        else {
          // Try different ways to extract the value
          let extractedValue;
          
          // Check if it's an input element
          if (element.tagName === 'INPUT') {
            extractedValue = element.value;
          } 
          // Check if it has a data attribute
          else if (element.dataset.maxBet) {
            extractedValue = element.dataset.maxBet;
          }
          else if (element.dataset.maxStake) {
            extractedValue = element.dataset.maxStake;
          }
          // Check if it has text content with a number
          else {
            extractedValue = element.textContent.trim();
          }
          
          if (extractedValue) {
            parsedValue = convertToNumeric(extractedValue);
          }
        }
        
        if (parsedValue && !isNaN(parsedValue) && parsedValue > 0) {
          // Store this max bet value with its context
          maxBetValues.set(contextId, parsedValue);
          console.log(`Found max bet value for ${contextId} (${element.className}):`, parsedValue);
          
          // Also store by element class for more specific targeting
          if (element.className) {
            const className = element.className.trim().replace(/\s+/g, '-');
            maxBetValues.set(`${contextId}-${className}`, parsedValue);
            console.log(`Also stored as ${contextId}-${className}:`, parsedValue);
          }
          break;
        }
      }
    }
  });
  
  // Also directly search for your specific elements outside of containers
  const specificSelectors = ['.max-bet.d-none-desktop', '.fancy-min-max'];
  specificSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, idx) => {
      const parsedValue = extractMaxBetValue(element, selector);
      
      if (parsedValue && !isNaN(parsedValue) && parsedValue > 0) {
        const specificId = `specific-${selector.replace(/\./g, '-')}-${idx}`;
        maxBetValues.set(specificId, parsedValue);
        console.log(`Stored specific max value for ${specificId}:`, parsedValue);
      }
    });
  });
  
  // Log all the max bet values we found
  console.log("All max bet values:", Object.fromEntries(maxBetValues));
  return maxBetValues;
}

// Function to get the maximum bet value for a specific context
function getMaxBetValue(contextElement = null) {
  if (!contextElement) {
    // Instead of using a default value, try to find any max bet value
    if (maxBetValues.size > 0) {
      // Use the first available max bet value
      return Array.from(maxBetValues.values())[0];
    }
    
    // If no max bet values are found, return a fallback
    console.error("No max bet values found in the system");
    return 0;
  }
  
  // First, check specific max-bet.d-none-desktop or fancy-min-max elements
  const specificSelectors = ['.max-bet.d-none-desktop', '.fancy-min-max'];
  for (const selector of specificSelectors) {
    // Check direct match
    if (contextElement.matches && contextElement.matches(selector)) {
      const parsedValue = extractMaxBetValue(contextElement, selector);
      
      if (!isNaN(parsedValue) && parsedValue > 0) {
        console.log(`Direct match for ${selector}:`, parsedValue);
        return parsedValue;
      }
    }
    
    // Check if any parent has this selector
    let parent = contextElement.closest('.bet-table-header, .market-container');
    if (!parent) {
      parent = contextElement.parentElement;
    }
    
    let depth = 0;
    const maxDepth = 5; // Limit how far up we search to avoid performance issues
    
    while (parent && depth < maxDepth) {
      const element = parent.querySelector(selector);
      if (element) {
        const parsedValue = extractMaxBetValue(element, selector);
        
        if (!isNaN(parsedValue) && parsedValue > 0) {
          console.log(`Found ${selector} in parent:`, parsedValue);
          return parsedValue;
        }
      }
      parent = parent.parentElement;
      depth++;
    }
  }
  
  // Try to find the context ID for this element
  let currentElement = contextElement;
  let maxValue = null;
  
  // Search up the DOM tree to find a container with a max bet value
  while (currentElement && !maxValue) {
    // Check if this element is one of our containers
    const contextId = currentElement.id || 
                     currentElement.dataset.marketId || 
                     currentElement.dataset.eventId;
    
    if (contextId && maxBetValues.has(contextId)) {
      maxValue = maxBetValues.get(contextId);
      console.log(`Found context-specific max bet for ${contextId}:`, maxValue);
      break;
    }
    
    // Try all max bet element selectors for this element
    for (const selector of maxBetElementSelectors) {
      const directMaxBet = currentElement.querySelector(selector);
      if (directMaxBet) {
        let parsedValue;
        
        // Handle different element types based on selector
        if (selector === '.max-bet.d-none-desktop' || selector === '.fancy-min-max') {
          parsedValue = extractMaxBetValue(directMaxBet, selector);
        } else {
          let extractedValue;
          
          // Handle different element types
          if (directMaxBet.tagName === 'INPUT') {
            extractedValue = directMaxBet.value;
          } else if (directMaxBet.dataset.maxBet) {
            extractedValue = directMaxBet.dataset.maxBet;
          } else if (directMaxBet.dataset.maxStake) {
            extractedValue = directMaxBet.dataset.maxStake;
          } else {
            extractedValue = directMaxBet.textContent.trim();
          }
          
          console.log(`Found direct max bet text: "${extractedValue}"`);
          parsedValue = convertToNumeric(extractedValue);
        }
        
        if (!isNaN(parsedValue) && parsedValue > 0) {
          maxValue = parsedValue;
          console.log("Found direct max bet value:", maxValue);
          break;
        }
      }
    }
    
    if (maxValue) break;
    currentElement = currentElement.parentElement;
  }
  
  // If no context-specific value was found, use any available max value
  if (!maxValue) {
    if (maxBetValues.size > 0) {
      maxValue = Array.from(maxBetValues.values())[0];
      console.log("Using first available max bet value:", maxValue);
    } else {
      // Last resort - log this as an error and return 0
      console.error("No max bet values found anywhere");
      maxValue = 0;
    }
  }
  
  console.log("Using max bet value:", maxValue);
  return maxValue;
}

// Function to attach click listeners to betting buttons
function attachClickListeners() {
  console.log("Attaching click listeners");
  
  // Function to handle clicks on any element within the betting box
  function handleClick(event) {
    // Find the closest bl-box parent
    const blBox = event.target.closest('.bl-box');
    if (blBox) {
      handleBetButtonClick(event);
    }
  }

  // Try multiple possible selectors for betting containers
  const containerSelectors = [
    ".min-h-[37px].w-full",
    ".bl-box",
    "div[style*='background: rgb(199, 238, 255)']",
    "div[style*='background: rgb(148, 223, 255)']",
    "div[style*='background: rgb(249, 200, 211)']",
    "div[style*='background: rgb(239, 225, 229)']"
  ];
  
  // Add click listeners to containers
  containerSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach((container) => {
      container.removeEventListener("click", handleClick);
      container.addEventListener("click", handleClick);
    });
  });
  
  // Update all max bet values when attaching listeners
  updateMaxBetValues();
}

// Helper function to find an element by trying multiple selectors
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

// Run initial attachment
attachClickListeners();
updateMaxBetValues();

// FIXED: Updated typeValue function to properly set stake input value
const typeValue = async (element, value) => {
  if (!element) return false;
  
  try {
    // Clear the input first
    element.value = '';
    element.dispatchEvent(new Event('input', { bubbles: true }));
    
    // Method 1: Direct value assignment
    element.value = value;
    
    // Method 2: Create proper keyboard events to simulate actual typing
    element.dispatchEvent(new Event('focus', { bubbles: true }));
    
    // Dispatch both input and change events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Method 3: Trigger React's onChange event handler if present
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, 'value'
    ).set;
    
    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(element, value);
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    console.log(`Successfully set input value to ${value}`);
    return true;
  } catch (error) {
    console.error("Error setting input value:", error);
    return false;
  }
};

console.log("content.js loaded");

// Create and append popup HTML
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

// Modify the handleBetButtonClick function to remove showMessage calls
async function handleBetButtonClick(event) {
  console.log("handleBetButtonClick triggered");
  
  // Store the clicked element for context
  lastClickedElement = event.target;
  
  // Try to prevent default behavior but catch any errors
  try {
    event.preventDefault();
    event.stopPropagation();
  } catch (e) {
    console.log("Could not prevent default behavior:", e);
  }
  
  // Get the value from the global input
  const globalInput = document.getElementById("global-stake-input");
  let displayAmount = globalInput.value;
  let betAmount = displayAmount;
  
  console.log("Global input value:", displayAmount);
  
  if (!displayAmount || displayAmount === "") {
    console.log("No amount entered in global input");
    return; // Exit if no amount is entered
  }

  // Find the clicked bl-box element
  const blBox = event.target.closest('.bl-box');
  if (!blBox) {
    console.log("No bl-box found in click target");
    return;
  }

  // Get the background color of the bl-box
  const style = window.getComputedStyle(blBox);
  const backgroundColor = style.backgroundColor;
  
  // Determine bet type based on background color
  let betType = "Unknown";
  if (backgroundColor === 'rgb(199, 238, 255)' || backgroundColor === 'rgb(148, 223, 255)') {
    betType = 'Back';
  } else if (backgroundColor === 'rgb(249, 200, 211)' || backgroundColor === 'rgb(239, 225, 229)') {
    betType = 'Lay';
  }
  
  console.log("Bet type:", betType);

  // Get the max bet value
  const maxValue = getMaxBetValue(blBox);
  
  // Handle negative values
  if (parseFloat(displayAmount) < 0) {
    if (maxValue > 0) {
      betAmount = maxValue.toString();
      usingMaxValue = true;
      console.log("Negative value detected, using maximum:", betAmount, "but displaying:", displayAmount);
    } else {
      console.log("Negative value detected but no max value found");
      return;
    }
  } else {
    usingMaxValue = false;
  }

  // Create a function to try filling the stake input
  const tryFillStakeInput = async () => {
    // Array of possible selectors for stake input
    const stakeInputSelectors = [
      'input[type="number"][min="0"][placeholder="0"]',
      'input[type="number"].h-\\[35px\\].w-full',
      'input[type="number"].text-center.bg-\\[\\#ffffff\\]',
      'input[placeholder="Stake"]',
      'input.stake-input',
      'input[data-testid="stake-input"]'
    ];
    
    // Find the stake input
    const stakeInput = findElementBySelectors(stakeInputSelectors);
    
    if (stakeInput) {
      console.log("Found stake input:", stakeInput);
      
      // Fill in the stake amount
      const inputSuccess = await typeValue(stakeInput, betAmount);
      console.log("Filled stake input with:", betAmount, "Success:", inputSuccess);
      
      if (inputSuccess) {
        // Array of possible selectors for submit button
        const submitButtonSelectors = [
          'button.bg-[#52b202]',
          'button.rounded-md.font-bold.text-[#ffffff]',
          'button:has(div:contains("Placebet"))',
          'button.place-bet-button',
          'button.submit-button',
          'button[type="submit"]'
        ];
        
        // Find and click the submit button
        const submitButton = findElementBySelectors(submitButtonSelectors);
        
        if (submitButton) {
          console.log("Found submit button:", submitButton);
          
          // Enable the button if it's disabled
          if (submitButton.disabled) {
            submitButton.disabled = false;
            // Trigger a change event to notify the app that the button is now enabled
            submitButton.dispatchEvent(new Event('change', { bubbles: true }));
          }
          
          console.log("Clicking submit button");
          submitButton.click();
          
          // Track the bet success/failure
          trackBetResult(betAmount, betType);
          return true;
        }
      }
    }
    return false;
  };

  // Try immediately without delays
  let success = await tryFillStakeInput();
  
  if (!success) {
    console.log("Failed to place bet");
  }
}

// Function to track bet result
async function trackBetResult(amount, betType) {
  console.log("Tracking bet result");
  
  // Find the odds input using various selectors
  const oddsInputSelectors = [
    'input[type="number"].h-\\[35px\\].w-full',
    'input[type="number"].text-center.bg-\\[\\#ffffff\\]',
    'input[type="number"][min="0"][placeholder="0"]'
  ];
  
  const oddsInputElement = findElementBySelectors(oddsInputSelectors);
  const oddsValue = oddsInputElement ? oddsInputElement.value : "";
  
  // Wait for toast notifications
  let checkCount = 0;
  let successToast = null;
  let errorToast = null;
  

  while (!successToast && !errorToast && checkCount < 25) {
    successToast = document.querySelector('.go3958317564') || 
                  document.querySelector('.toast-success') ||
                  document.querySelector('.success-message');
    
    errorToast = document.querySelector('.toast-error') ||
                document.querySelector('.error-message');
    
    if (!successToast && !errorToast) {
      await new Promise(resolve => setTimeout(resolve, 200));
      checkCount++;
    }
  }
  
  // If error toast found, stop execution
  if (errorToast) {
    console.log("Error toast found, stopping bet history creation");
    return;
  }
  
  console.log("Bet appears successful, creating history");
  
  const betDetails = {
    stake: amount,
    ods: oddsValue,
    value: amount,
    url_id: "10", 
    type: betType,
    timestamp: new Date().toISOString()
  };
  
  try {
    const response = await fetch("https://keshavinfotechdemo2.com/keshav/KG2/SpeedUp/public/api/create-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authorization": "Bearer 325|TGgQwHqj5m79wnlaM2GHAV94UagWerT3t43h1FKb",
      },
      body: JSON.stringify(betDetails)
    });
  
    const result = await response.json();
    console.log("Bet history created:", result);
  } catch (error) {
    console.error("Failed to create bet history:", error);
  }
}

// Modify the handleGlobalInput function to remove showMessage calls
function handleGlobalInput(event) {
  const value = parseFloat(event.target.value);
  
  // For negative values, we'll keep the display as is but note that max will be used
  if (value < 0) {
    // If we have a last clicked element, use it for context
    let contextMaxValue;
    if (lastClickedElement) {
      // Special handling for specific class elements
      let specificMaxValue = null;
      const specificSelectors = ['.max-bet.d-none-desktop', '.fancy-min-max'];
      
      // Search for specific max elements near the last clicked element
      let element = lastClickedElement;
      let depth = 0;
      const maxDepth = 10;
      
      while (element && depth < maxDepth && !specificMaxValue) {
        for (const selector of specificSelectors) {
          const maxElement = element.querySelector(selector);
          if (maxElement) {
            const rawValue = maxElement.textContent.trim();
            const cleanedValue = rawValue.replace(/[^\d.]/g, '');
            const parsedValue = parseFloat(cleanedValue);
            
            if (!isNaN(parsedValue) && parsedValue > 0) {
              specificMaxValue = parsedValue;
              break;
            }
          }
        }
        
        element = element.parentElement;
        depth++;
      }
      
      // Get the context max value
      contextMaxValue = specificMaxValue || getMaxBetValue(lastClickedElement);
    } else {
      // No context yet, check if we have any max values
      if (maxBetValues.size > 0) {
        contextMaxValue = Array.from(maxBetValues.values())[0];
      }
    }
  }
  
  if (event.target.value) {
    lastEnteredAmount = event.target.value;
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

function findAllInputs() {
  // Find all inputs in the document
  let inputs = Array.from(document.querySelectorAll('input[type="number"], input[placeholder="0"], input[placeholder="Stake"]'));
  
  // Try to find inputs in any iframes
  try {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        if (iframe.contentDocument) {
          const iframeInputs = Array.from(iframe.contentDocument.querySelectorAll('input[type="number"], input[placeholder="0"], input[placeholder="Stake"]'));
          inputs = [...inputs, ...iframeInputs];
        }
      } catch (e) {
        console.log("Could not access iframe content:", e);
      }
    });
  } catch (e) {
    console.log("Error accessing iframes:", e);
  }
  
  return inputs;
}

// Add this to the end of your script to enhance the betting process
// Find input elements more aggressively after a bet is clicked
document.addEventListener('click', async (event) => {
  // Check if the clicked element is the max stake button
  if (event.target.closest('button.transfer-bg-color')) {
    console.log("Max stake button clicked");
    
    const stakeInput = document.querySelector('input.h-\\[35px\\].w-full.text-center.bg-\\[\\#ffffff\\].text-\\[12px\\]');
    if (stakeInput) {
      // Get the max stake value
      const maxStakeValue = getMaxBetValue(stakeInput);
      if (maxStakeValue > 0) {
        await typeValue(stakeInput, maxStakeValue);
        
        const placeBetBtn = document.querySelector('button.bg-\\[\\#52b202\\]');
        if (placeBetBtn) {
          placeBetBtn.click();
          // Track the bet result
          trackBetResult(maxStakeValue, "Max Stake");
        }
      }
    }
  }
  
  // Existing bet button click handling
  const betButtons = ['.bl-box', '.back-button', '.lay-button', '.bet-button'];
  const isBetClick = betButtons.some(selector => event.target.closest(selector));
  
  if (isBetClick) {
    const stakeInput = document.querySelector('input.h-\\[35px\\].w-full.text-center.bg-\\[\\#ffffff\\].text-\\[12px\\]');
    const globalInput = document.getElementById("global-stake-input");
    
    if (globalInput?.value && stakeInput) {
      const betAmount = globalInput.value;
      
      if (parseFloat(betAmount) < 0) {
        const maxStakeBtn = document.querySelector('button.transfer-bg-color');
        if (maxStakeBtn) {
          maxStakeBtn.click();
        }
      } else {
        await typeValue(stakeInput, betAmount);
      }
      
      const placeBetBtn = document.querySelector('button.bg-\\[\\#52b202\\]');
      if (placeBetBtn) {
        placeBetBtn.click();
      }
    }
  }
});

// Re-attach listeners and update max bet values periodically to handle dynamic content
setInterval(() => {
  attachClickListeners();
  updateMaxBetValues();
}, 1000);

