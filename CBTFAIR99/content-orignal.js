// URL observer to detect URL changes
let lastUrl = location.href;
const urlObserver = new MutationObserver(async () => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    if (lastUrl.includes("cbtfair99")) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
      attachClickListeners();
      updateMaxBetValues();
    }
  }
});

urlObserver.observe(document.querySelector("body"), {
  childList: true,
  subtree: true,
});

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

const maxBetValues = new Map();

const maxBetContainerSelectors = [
  ".market-container",
  ".bet-option",
  ".event-container",
  ".match-odds",
  ".market-area",
  ".odds-container",
  ".bet-table-header",
];

const maxBetElementSelectors = [
  ".max-bet",
  ".max-stake",
  ".maximum-bet",
  ".max-value",
  "[data-max-bet]",
  "[data-max-stake]",
  ".limit-value",
  ".max-bet.d-none-desktop",
  ".fancy-min-max",
  ".fancy-min-max-box",
  ".market-nation-name",
  ".country-name.box-4.text-info b",
  ".box-2.float-left.text-right.min-max",
  ".min-max",
  ".float-left.country-name.box-6.min-max b"
];

// Function to convert string value to number (handling k and L suffixes)
function convertValueToNumber(value) {
  if (!value) return 0;
  
  // Remove any whitespace and convert to lowercase
  value = value.toString().trim().toLowerCase();
  
  // Handle lakh (L) values
  if (value.includes('l')) {
    const num = parseFloat(value.replace('l', '').trim());
    return num * 100000; // Convert lakh to actual number
  }
  
  // Handle thousand (k) values
  if (value.includes('k')) {
    const num = parseFloat(value.replace('k', '').trim());
    return num * 1000; // Convert thousand to actual number
  }
  
  // Handle regular numbers
  return parseFloat(value) || 0;
}

// Function to find max value element using parent-child traversal
function findMaxValueElement(element) {
  if (!element) return null;

  // First try to find in parent elements
  let currentElement = element;
  let maxValueElement = null;
  let maxValue = 0;

  // Traverse up to 5 parent levels
  for (let i = 0; i < 5 && currentElement; i++) {
    // Look for max value elements in current parent
    const maxElements = currentElement.querySelectorAll('.min-max b, .max-bet, .max-stake, [data-max-bet]');
    
    for (const el of maxElements) {
      const text = el.textContent.trim();
      if (text.includes('Max:')) {
        const match = text.match(/Max:([\d.]+[kKlL]?)/i);
        if (match) {
          const value = convertValueToNumber(match[1]);
          if (value > maxValue) {
            maxValue = value;
            maxValueElement = el;
          }
        }
      }
    }

    // If we found a max value, no need to go further up
    if (maxValue > 0) break;

    // Move to next parent
    currentElement = currentElement.parentElement;
  }

  // If no max value found in parents, try children
  if (!maxValueElement) {
    const childMaxElements = element.querySelectorAll('.min-max b, .max-bet, .max-stake, [data-max-bet]');
    for (const el of childMaxElements) {
      const text = el.textContent.trim();
      if (text.includes('Max:')) {
        const match = text.match(/Max:([\d.]+[kKlL]?)/i);
        if (match) {
          const value = convertValueToNumber(match[1]);
          if (value > maxValue) {
            maxValue = value;
            maxValueElement = el;
          }
        }
      }
    }
  }

  return {
    element: maxValueElement,
    value: maxValue,
    path: maxValueElement ? getElementPath(maxValueElement) : null
  };
}

// Function to handle negative values and convert to max
function handleNegativeValue(value, element) {
  if (parseFloat(value) >= 0) return value;

  const maxValueInfo = findMaxValueElement(element);
  if (maxValueInfo.value > 0) {
    console.log("Found max value:", maxValueInfo.value, "from element:", maxValueInfo.path);
    return maxValueInfo.value.toString();
  }

  return value;
}

function convertToNumeric(value) {
  if (!value) return 0;
  
  // Remove any non-numeric characters except k, K, l, L, and decimal point
  const cleanValue = value.toString().trim().replace(/[^\d.kKlL]/gi, "");
  
  // Convert to uppercase for consistent handling
  const upperValue = cleanValue.toUpperCase();
  
  if (upperValue.includes('L')) {
    // Convert L to 00000 (hundred thousand)
    return parseFloat(upperValue.replace('L', '')) * 100000;
  }
  if (upperValue.includes('K')) {
    // Convert K to 000 (thousand)
    return parseFloat(upperValue.replace('K', '')) * 1000;
  }
  return parseFloat(cleanValue);
}

function extractMaxBetValue(element, selector) {
  if (!element) return null;

  const getMaxValue = (text) => {
    // Handle the format "Min:100 Max:500k"
    const maxMatch = text.match(/Max:([\d.]+[kKlL]?)/i);
    if (maxMatch) {
      return maxMatch[1].trim();
    }
    return null;
  };

  let extractedValue = null;

  if (selector === '.float-left.country-name.box-6.min-max b') {
    extractedValue = getMaxValue(element.textContent.trim());
  } else if (selector === '.fancy-min-max-box') {
    const maxSpan = element.querySelector('.fancy-min-max span:nth-child(2)');
    if (maxSpan) {
      extractedValue = getMaxValue(maxSpan.textContent.trim());
    }
  } else if (selector === '.market-nation-name') {
    extractedValue = getMaxValue(element.textContent.trim());
  } else if (selector === '.max-bet.d-none-desktop') {
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
  } else if (selector === '.fancy-min-max') {
    if (element.textContent.includes('Max:')) {
      const maxSpan = element.querySelector('span:nth-child(2)');
      extractedValue = maxSpan ? maxSpan.textContent.trim() : getMaxValue(element.textContent);
    }
  } else if (selector === '.country-name.box-4.text-info b') {
    const maxSpan = element.querySelector('span:nth-child(2)');
    if (maxSpan) {
      extractedValue = maxSpan.textContent.trim();
    }
  } else if (selector === '.box-2.float-left.text-right.min-max') {
    const maxSpan = element.querySelector('span:nth-child(2) span');
    if (maxSpan) {
      extractedValue = maxSpan.textContent.trim();
    }
  } else if (selector === '.min-max') {
    if (element.textContent.includes('Max:')) {
      extractedValue = getMaxValue(element.textContent.trim());
    }
  }

  return extractedValue ? convertToNumeric(extractedValue) : null;
}

function updateMaxBetValues() {
  maxBetValues.clear();

  const containers = Array.from(
    maxBetContainerSelectors.reduce((acc, selector) => {
      const found = document.querySelectorAll(selector);
      return found && found.length ? [...acc, ...found] : acc;
    }, [])
  ) || [document.body];

  containers.forEach((container, index) => {
    const maxBetElements = Array.from(
      maxBetElementSelectors.reduce((acc, selector) => {
        const elements = container.querySelectorAll(selector);
        return elements && elements.length ? [...acc, ...elements] : acc;
      }, [])
    );

    if (maxBetElements.length) {
      const contextId =
        container.id ||
        container.dataset.marketId ||
        container.dataset.eventId ||
        `context-${index}`;

      for (const element of maxBetElements) {
        let parsedValue = null;

        if (
          element.classList.contains("max-bet") &&
          element.classList.contains("d-none-desktop")
        ) {
          parsedValue = extractMaxBetValue(element, ".max-bet.d-none-desktop");
        } else if (element.classList.contains("fancy-min-max")) {
          parsedValue = extractMaxBetValue(element, ".fancy-min-max");
        } else {
          const extractedValue =
            element.tagName === "INPUT"
              ? element.value
              : element.dataset.maxBet ||
                element.dataset.maxStake ||
                element.textContent.trim();
          parsedValue = extractedValue
            ? convertToNumeric(extractedValue)
            : null;
        }

        if (parsedValue && !isNaN(parsedValue) && parsedValue > 0) {
          maxBetValues.set(contextId, parsedValue);
          if (element.className) {
            maxBetValues.set(
              `${contextId}-${element.className.trim().replace(/\s+/g, "-")}`,
              parsedValue
            );
          }
          break;
        }
      }
    }
  });

  const specificSelectors = [".max-bet.d-none-desktop", ".fancy-min-max"];
  specificSelectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element, idx) => {
      const parsedValue = extractMaxBetValue(element, selector);
      if (parsedValue && !isNaN(parsedValue) && parsedValue > 0) {
        maxBetValues.set(
          `specific-${selector.replace(/\./g, "-")}-${idx}`,
          parsedValue
        );
      }
    });
  });
}

function getMaxBetValue(contextElement = null) {
  if (!contextElement) {
    return maxBetValues.size > 0 ? Array.from(maxBetValues.values())[0] : 0;
  }

  const specificSelectors = [".max-bet.d-none-desktop", ".fancy-min-max"];
  for (const selector of specificSelectors) {
    if (contextElement.matches?.(selector)) {
      const parsedValue = extractMaxBetValue(contextElement, selector);
      if (!isNaN(parsedValue) && parsedValue > 0) return parsedValue;
    }

    let parent =
      contextElement.closest(".bet-table-header, .market-container") ||
      contextElement.parentElement;
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
    const contextId =
      currentElement.id ||
      currentElement.dataset.marketId ||
      currentElement.dataset.eventId;
    if (contextId && maxBetValues.has(contextId)) {
      return maxBetValues.get(contextId);
    }
    currentElement = currentElement.parentElement;
  }

  return maxBetValues.size > 0 ? Array.from(maxBetValues.values())[0] : 0;
}

// Function to attach click listeners to betting buttons
function attachClickListeners() {
  console.log("Attaching click listeners for cbtfair99");
  // Try multiple possible selectors for betting buttons
  const selectors = [
    ".box-1",
    ".box-2",
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
    ".lay-option",
    ".back.box-1.float-left.lock.text-center",
    ".box-1.float-left.lay.text-center",
  ];

  let elementsFound = 0;

  selectors.forEach((selector) => {
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
  const allButtons = document.querySelectorAll("button, div, span, a");
  allButtons.forEach((element) => {
    const text = element.textContent.trim();
    if (text === "Back" || text === "Lay") {
      element.removeEventListener("click", handleBetButtonClick);
      element.addEventListener("click", handleBetButtonClick);
      console.log(`Added click listener to element with text: ${text}`);
      elementsFound++;
    }
  });

  updateMaxBetValues();
}

// Function to find elements by selectors
function findElementBySelectors(selectors) {
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements && elements.length > 0) {
      // If multiple elements found, try to find the most likely stake input
      if (elements.length > 1) {
        for (const element of elements) {
          // Skip elements that are likely odds inputs
          if (
            element.placeholder?.includes("Odds") ||
            element.name?.includes("Odds") ||
            element.className?.includes("odds") ||
            element.id?.includes("odds")
          ) {
            continue;
          }

          // Prefer elements with stake/amount related attributes
          if (
            element.placeholder?.includes("Amount") ||
            element.placeholder?.includes("Stake") ||
            element.name?.includes("Amount") ||
            element.className?.includes("stake") ||
            element.className?.includes("amount")
          ) {
            return element;
          }
        }
      }
      // If no specific element found or only one element, return the first one
      // but only if it's not an odds input
      const element = elements[0];
      if (
        !element.placeholder?.includes("Odds") &&
        !element.name?.includes("Odds") &&
        !element.className?.includes("odds") &&
        !element.id?.includes("odds")
      ) {
        return element;
      }
    }
  }
  return null;
}

// Initialize the script when the DOM is fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM fully loaded, initializing script for cbtfair99");
  attachClickListeners();
  updateMaxBetValues();
});

// Also initialize when the window loads (as a fallback)
window.addEventListener("load", function () {
  console.log("Window loaded, initializing script for cbtfair99");
  attachClickListeners();
  updateMaxBetValues();
});

// Initialize immediately if the document is already loaded
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  console.log(
    "Document already loaded, initializing script immediately for cbtfair99"
  );
  attachClickListeners();
  updateMaxBetValues();
}

// Set up a periodic check to re-attach listeners (in case of dynamic content)
// setInterval(() => {
//   console.log("Periodic check: re-attaching click listeners for cbtfair99");
//   attachClickListeners();
//   updateMaxBetValues();
// }, 5000);

// Function to set input value
const typeValue = async (element, value) => {
  if (!element) return false;

  try {
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      "value"
    ).set;
    nativeInputValueSetter.call(element, value);

    const inputEvent = new Event("input", { bubbles: true });
    element.dispatchEvent(inputEvent);

    const changeEvent = new Event("change", { bubbles: true });
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

console.log("cbtfair99.js loaded");

// Function to handle global input changes
async function handleGlobalInput(event) {
  const input = event.target;
  const value = input.value;
  
  // Store the last entered amount
  lastEnteredAmount = value;
  
  // Check if the value is negative
  if (value && parseFloat(value) < 0) {
    usingMaxValue = true;
    
    // If we have a last clicked element, use it for context
    let maxValue = null;
    if (lastClickedElement) {
      const maxValueInfo = findMaxValueElement(lastClickedElement);
      if (maxValueInfo.value > 0) {
        maxValue = maxValueInfo.value;
        console.log("Found max value:", maxValue, "from element:", maxValueInfo.path);
      }
    }
    
    // If we found a max value, update the stake input
    if (maxValue && !isNaN(maxValue) && maxValue > 0) {
      const stakeInput = document.querySelector('input[type="number"][placeholder="00"].form-control.ng-untouched.ng-pristine.ng-valid');
      if (stakeInput) {
        await typeValue(stakeInput, maxValue);
        console.log("Updated stake input with max value:", maxValue);
      }
    }
  } else {
    usingMaxValue = false;
    // For non-negative values, update the stake input with the global input value
    const stakeInput = document.querySelector('input[type="number"][placeholder="00"].form-control.ng-untouched.ng-pristine.ng-valid');
    if (stakeInput) {
      await typeValue(stakeInput, value);
      console.log("Updated stake input with value:", value);
    }
  }
}

// Add event listener for global input
document.getElementById("global-stake-input").addEventListener("input", handleGlobalInput);

// Function to handle "Back" or "Lay" button clicks
async function handleBetButtonClick(event) {
  console.log("handleBetButtonClick triggered for cbtfair99");

  // Get the clicked element
  const clickedElement = event.target;
  
  // Store the clicked element for context
  lastClickedElement = clickedElement;
  
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
    const maxValueInfo = findMaxValueElement(clickedElement);
    if (maxValueInfo.value > 0) {
      betAmount = maxValueInfo.value;
      console.log("Using max value for bet:", betAmount);
    }
  }

  // Find the closest market container
  const marketContainer = clickedElement.closest('.market-container, .bet-option, .event-container');
  if (!marketContainer) {
    console.log("No market container found");
    return;
  }

  // Get the stake input
  const stakeInput = marketContainer.querySelector('input[type="number"], .stake-input, [data-stake]');
  if (stakeInput) {
    // Update the stake input with the bet amount
    await typeValue(stakeInput, betAmount);
    console.log("Updated stake input with value:", betAmount);
  }

  // Get detailed element information
  const elementDetails = getElementDetails(clickedElement);
  console.log("Element Details:", elementDetails);

  // Log closest matches
  console.log("Closest Matches:", {
    marketContainer: elementDetails.closestMatches.marketContainer ? getElementPath(elementDetails.closestMatches.marketContainer) : null,
    betOption: elementDetails.closestMatches.betOption ? getElementPath(elementDetails.closestMatches.betOption) : null,
    eventContainer: elementDetails.closestMatches.eventContainer ? getElementPath(elementDetails.closestMatches.eventContainer) : null,
    oddsContainer: elementDetails.closestMatches.oddsContainer ? getElementPath(elementDetails.closestMatches.oddsContainer) : null,
    stakeContainer: elementDetails.closestMatches.stakeContainer ? getElementPath(elementDetails.closestMatches.stakeContainer) : null
  });

  // Log found values
  console.log("Found Values:", elementDetails.values);

  // Determine bet type by checking various class possibilities
  let betType = "Unknown";
  const target = clickedElement;

  if (
    target.classList.contains("back") ||
    target.closest(".back") ||
    target.getAttribute("data-bet") === "back"
  ) {
    betType = "Back";
  } else if (
    target.classList.contains("lay") ||
    target.closest(".lay") ||
    target.getAttribute("data-bet") === "lay"
  ) {
    betType = "Lay";
  }

  console.log("Bet type:", betType);

  // Allow the default behavior to occur first
  // This will open the bet slip

  // Wait for the bet slip to appear - try different timings
  for (let delay of [500, 1000, 2000, 3000]) {
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Array of possible selectors for stake input
    const stakeInput =
      document.querySelector(
        'input[type="number"][placeholder="00"].form-control.ng-untouched.ng-pristine.ng-valid'
      ) ||
      document.querySelector('input[type="number"].form-control') ||
      document.querySelector('input[type="number"][min="0"]') ||
      document.querySelector(".stake-amount-input");

    // Find the stake input
    // const stakeInput = findElementBySelectors(stakeInputSelectors);

    if (stakeInput) {
      console.log("Found stake input:", stakeInput);

      // Fill in the stake amount
      const inputSuccess = await typeValue(stakeInput, betAmount);
      console.log(
        "Filled stake input with:",
        betAmount,
        "Success:",
        inputSuccess
      );

      if (inputSuccess) {
        // First, try to find the specific "Place Bet" button with class "btn btn-success"
        let placeBetButton = document.querySelector(
          "button.new-placebet-button"
        );

        // If not found, try to find by text content
        if (!placeBetButton) {
          const allButtons = document.querySelectorAll("button");
          for (const button of allButtons) {
            if (button.textContent.trim() === "Submit") {
              placeBetButton = button;
              break;
            }
          }
        }

        // If still not found, try other selectors
        if (!placeBetButton) {
          // Array of possible selectors for submit button
          const submitButtonSelectors = [
            "button.btn.btn-sm.btn-success.float-right.m-b-5",
            'button[type="submit"]',
            ".place-bet-button",
            ".confirm-bet",
            ".place-bet",
            ".bet-submit",
            ".betting-button",
            "button.btn-success",
            "button.btn-primary",
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
            const clickEvent = new MouseEvent("click", {
              view: window,
              bubbles: true,
              cancelable: true,
            });
            placeBetButton.dispatchEvent(clickEvent);

            // Method 3: Focus and press Enter
            placeBetButton.focus();
            const enterEvent = new KeyboardEvent("keydown", {
              key: "Enter",
              code: "Enter",
              keyCode: 13,
              which: 13,
              bubbles: true,
            });
            placeBetButton.dispatchEvent(enterEvent);

            // Method 4: Use the submit() method if it's a form
            const form = placeBetButton.closest("form");
            if (form) {
              form.submit();
            }
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

// Set up a mutation observer to watch for changes to max bet elements
const maxBetObserver = new MutationObserver(() => {
  updateMaxBetValues();
});

// Start observing the document for when max bet elements appear or change
maxBetObserver.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true,
});

// Add rate limiting variables
let lastApiCallTime = 0;
const API_CALL_INTERVAL = 2000; // Minimum 2 seconds between API calls
let isProcessingBet = false;

// Function to track bet result
async function trackBetResult(amount, betType) {
  console.log("Tracking bet result for cbtfair99");

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
      ".place-bet-odds .form-control",
      "input.odds",
      ".odds-input",
      '[data-type="odds"]',
      ".odds-value",
      ".bet-odds",
      ".selected-odds",
      ".input-group .ng-valid",
      ".bet-odds .amountint",
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
      ".go3958317564",
      ".toast-success",
      ".success-message",
      ".bet-success",
      ".bet-confirmed",
      ".bet-placed",
      ".bet-accepted",
      ".bet-completed",
      ".bet-successful",
      ".bet-success-message",
      ".bet-confirmation",
      ".bet-placed-message",
      ".bet-accepted-message",
      ".bet-completed-message",
      ".bet-successful-message",
    ];

    const errorIndicators = [
      ".toast-error",
      ".error-message",
      ".bet-error",
      ".bet-failed",
      ".bet-rejected",
      ".bet-declined",
      ".bet-error-message",
      ".bet-failed-message",
      ".bet-rejected-message",
      ".bet-declined-message",
    ];

    // Check for success/error indicators
    while (
      !successToast &&
      !errorToast &&
      !successIndicator &&
      !errorIndicator &&
      checkCount < 25
    ) {
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
      successIndicator = document.querySelector(
        ".success, .confirmed, .placed, .accepted, .completed, .successful"
      );

      // Check for error indicator in the DOM
      errorIndicator = document.querySelector(
        ".error, .failed, .rejected, .declined"
      );

      if (successToast || errorToast || successIndicator || errorIndicator) {
        break;
      }

      // Wait a bit before checking again
      await new Promise((resolve) => setTimeout(resolve, 200));
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
        url_id: "11",
        type: betType,
        timestamp: new Date().toISOString(),
      };

      // Implement rate limiting
      const now = Date.now();
      const timeSinceLastCall = now - lastApiCallTime;

      if (timeSinceLastCall < API_CALL_INTERVAL) {
        // Wait for the remaining time
        await new Promise((resolve) =>
          setTimeout(resolve, API_CALL_INTERVAL - timeSinceLastCall)
        );
      }

      try {
        const response = await fetch(
          "https://keshavinfotechdemo2.com/keshav/KG2/SpeedUp/public/api/create-history",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              authorization:
                "Bearer 325|TGgQwHqj5m79wnlaM2GHAV94UagWerT3t43h1FKb",
            },
            body: JSON.stringify(betDetails),
          }
        );

        // Update last API call time
        lastApiCallTime = Date.now();

        if (response.status === 401) {
          console.error(
            "API request limit exceeded. Please wait before making more requests."
          );
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

// Function to find specific values using closest()
function findBettingValues(element) {
  if (!element) return null;

  const values = {
    odds: null,
    stake: null,
    maxBet: null,
    marketName: null,
    selectionName: null
  };

  // Find odds value
  const oddsElement = element.closest('.market-container, .bet-option, .event-container')?.querySelector('.odds, [data-odds], .price, .decimal');
  if (oddsElement) {
    values.odds = oddsElement.textContent.trim();
  }

  // Find stake input
  const stakeElement = element.closest('.market-container, .bet-option, .event-container')?.querySelector('input[type="number"], .stake-input, [data-stake]');
  if (stakeElement) {
    values.stake = stakeElement.value || stakeElement.textContent.trim();
  }

  // Find max bet value using the new function
  const maxValueInfo = findMaxValueElement(element);
  if (maxValueInfo.value > 0) {
    values.maxBet = maxValueInfo.value;
    console.log("Max bet value found:", maxValueInfo.value, "from element:", maxValueInfo.path);
  }

  // Find market name
  const marketElement = element.closest('.market-container, .event-container')?.querySelector('.market-name, .event-name, [data-market]');
  if (marketElement) {
    values.marketName = marketElement.textContent.trim();
  }

  // Find selection name
  const selectionElement = element.closest('.bet-option, .selection')?.querySelector('.selection-name, .runner-name, [data-selection]');
  if (selectionElement) {
    values.selectionName = selectionElement.textContent.trim();
  }

  return values;
}

// Function to get element details with closest matches
function getElementDetails(element) {
  if (!element) return null;

  const details = {
    element: element,
    path: getElementPath(element),
    closestMatches: {
      marketContainer: element.closest('.market-container'),
      betOption: element.closest('.bet-option'),
      eventContainer: element.closest('.event-container'),
      oddsContainer: element.closest('.odds-container'),
      stakeContainer: element.closest('.stake-container')
    },
    values: findBettingValues(element)
  };

  return details;
}

