let lastUrl = location.href;
const urlObserver = new MutationObserver(async () => {
  console.log("urlObserver");
  console.log(location.href);
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log('URL changed to:', lastUrl);
    if (lastUrl.includes("pdm999")) {
      console.log("URL matches the target pattern");
      attachClickListeners();
      updateMaxBetValues();
    }
  }
});

urlObserver.observe(document.querySelector("body"), {
  childList: true,
  subtree: true
});

const waitForElement = (selector, timeout = 10000) => {
    return new Promise((resolve, reject) => {
        const interval = 100;
        let elapsedTime = 0;

        const checkExist = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(checkExist);
                resolve(element);
            } else if (elapsedTime >= timeout) {
                clearInterval(checkExist);
                reject(new Error("Element not found: " + selector));
            }
            elapsedTime += interval;
        }, interval);
    });
};

const waitForElementAll = (selector, timeout = 10000) => {
  return new Promise((resolve, reject) => {
      const interval = 100;
      let elapsedTime = 0;

      const checkExist = setInterval(() => {
          const element = document.querySelectorAll(selector);
          if (element) {
              clearInterval(checkExist);
              resolve(element);
          } else if (elapsedTime >= timeout) {
              clearInterval(checkExist);
              reject(new Error("Element not found: " + selector));
          }
          elapsedTime += interval;
      }, interval);
  });
};

const maxBetValues = new Map();

const maxBetContainerSelectors = [
  '.market-container', '.bet-option', '.event-container',
  '.match-odds', '.market-area', '.odds-container', '.bet-table-header'
];

const maxBetElementSelectors = [
  '.max-bet', '.max-stake', '.maximum-bet', '.max-value',
  '[data-max-bet]', '[data-max-stake]', '.limit-value',
  '.max-bet.d-none-desktop', '.fancy-min-max'
];

function convertToNumeric(value) {
  if (!value) return 0;
  const cleanValue = value.toString().trim().replace(/[^\dLK.]/gi, '');
  console.log("Converting value:", value, "Cleaned:", cleanValue);
  if (cleanValue.toUpperCase().includes('L')) {
    const number = parseFloat(cleanValue.toUpperCase().replace('L', ''));
    return number * 100000; 
  }
  if (cleanValue.toUpperCase().includes('K')) {
    const number = parseFloat(cleanValue.toUpperCase().replace('K', ''));
    return number * 1000; 
  }
  return parseFloat(cleanValue);
}

function extractMaxBetValue(element, selector) {
  if (!element) return null;
  let extractedValue = null;
  if (selector === '.max-bet.d-none-desktop') {
    if (element.textContent.includes('Max:')) {
      const spans = element.querySelectorAll('span');
      for (let i = 0; i < spans.length; i++) {
        if (spans[i].textContent.trim() === 'Max:' && i+1 < spans.length) {
          extractedValue = spans[i+1].textContent.trim();
          console.log("Found Max value in spans:", extractedValue);
          break;
        }
      }
      if (!extractedValue) {
        const maxText = element.textContent.split('Max:')[1];
        if (maxText) {
          extractedValue = maxText.trim().split(/\s+/)[0];
          console.log("Found Max value using text split:", extractedValue);
        }
      }
    }
  } 
  else if (selector === '.fancy-min-max') {
    if (element.textContent.includes('Max:')) {
      const maxSpan = element.querySelector('span:nth-child(2)');
      if (maxSpan) {
        extractedValue = maxSpan.textContent.trim();
      } else {
        extractedValue = element.textContent.split('Max:')[1].trim().split(/\s+/)[0];
      }
    }
  }
  console.log(`Raw extracted value for ${selector}:`, extractedValue);
  if (extractedValue) {
    const parsedValue = convertToNumeric(extractedValue);
    console.log(`Converted value for ${selector}:`, parsedValue);
    return parsedValue;
  }
  return null;
}

function updateMaxBetValues() {
  maxBetValues.clear();
  let containers = [];
  maxBetContainerSelectors.forEach(selector => {
    const found = document.querySelectorAll(selector);
    if (found && found.length > 0) {
      containers = [...containers, ...Array.from(found)];
    }
  });
  if (containers.length === 0) {
    containers = [document.body];
  }
  console.log(`Found ${containers.length} potential max bet containers`);
  containers.forEach((container, index) => {
    let maxBetElements = [];
    maxBetElementSelectors.forEach(selector => {
      const elements = container.querySelectorAll(selector);
      if (elements && elements.length > 0) {
        maxBetElements = [...maxBetElements, ...Array.from(elements)];
      }
    });
    if (maxBetElements.length > 0) {
      let contextId;
      if (container.id) {
        contextId = container.id;
      } else if (container.dataset.marketId) {
        contextId = container.dataset.marketId;
      } else if (container.dataset.eventId) {
        contextId = container.dataset.eventId;
      } else {
        contextId = `context-${index}`;
      }
      for (const element of maxBetElements) {
        let parsedValue = null;
        if (element.classList.contains('max-bet') && element.classList.contains('d-none-desktop')) {
          parsedValue = extractMaxBetValue(element, '.max-bet.d-none-desktop');
        } 
        else if (element.classList.contains('fancy-min-max')) {
          parsedValue = extractMaxBetValue(element, '.fancy-min-max');
        }
        else {
          let extractedValue;
          if (element.tagName === 'INPUT') {
            extractedValue = element.value;
          } 
          else if (element.dataset.maxBet) {
            extractedValue = element.dataset.maxBet;
          }
          else if (element.dataset.maxStake) {
            extractedValue = element.dataset.maxStake;
          }
          else {
            extractedValue = element.textContent.trim();
          }
          if (extractedValue) {
            parsedValue = convertToNumeric(extractedValue);
          }
        }
        if (parsedValue && !isNaN(parsedValue) && parsedValue > 0) {
          maxBetValues.set(contextId, parsedValue);
          console.log(`Found max bet value for ${contextId} (${element.className}):`, parsedValue);
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
  console.log("All max bet values:", Object.fromEntries(maxBetValues));
  return maxBetValues;
}

function getMaxBetValue(contextElement = null) {
  if (!contextElement) {
    if (maxBetValues.size > 0) {
      return Array.from(maxBetValues.values())[0];
    }
    console.error("No max bet values found in the system");
    return 0;
  }
  const specificSelectors = ['.max-bet.d-none-desktop', '.fancy-min-max'];
  for (const selector of specificSelectors) {
    if (contextElement.matches && contextElement.matches(selector)) {
      const parsedValue = extractMaxBetValue(contextElement, selector);
      if (!isNaN(parsedValue) && parsedValue > 0) {
        console.log(`Direct match for ${selector}:`, parsedValue);
        return parsedValue;
      }
    }
    let parent = contextElement.closest('.bet-table-header, .market-container');
    if (!parent) {
      parent = contextElement.parentElement;
    }
    let depth = 0;
    const maxDepth = 5; 
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
  let currentElement = contextElement;
  let maxValue = null;
  while (currentElement && !maxValue) {
    const contextId = currentElement.id || 
                     currentElement.dataset.marketId || 
                     currentElement.dataset.eventId;
    if (contextId && maxBetValues.has(contextId)) {
      maxValue = maxBetValues.get(contextId);
      console.log(`Found context-specific max bet for ${contextId}:`, maxValue);
      break;
    }
    for (const selector of maxBetElementSelectors) {
      const directMaxBet = currentElement.querySelector(selector);
      if (directMaxBet) {
        let parsedValue;
        if (selector === '.max-bet.d-none-desktop' || selector === '.fancy-min-max') {
          parsedValue = extractMaxBetValue(directMaxBet, selector);
        } else {
          let extractedValue;
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
    currentElement = currentElement.parentElement;
  }
  if (!maxValue) {
    if (maxBetValues.size > 0) {
      maxValue = Array.from(maxBetValues.values())[0];
      console.log("Using first available max bet value:", maxValue);
    } else {
      console.error("No max bet values found anywhere");
      maxValue = 0;
    }
  }
  console.log("Using max bet value:", maxValue);
  return maxValue;
}

async function attachClickListeners() {
  console.log("Attaching click listeners");
  const selectors = [
    ".back_oddsbox.bhav_box", 
    ".Lay_oddsbox.bhav_box"
  ];
  selectors.forEach(async (selector) => {
    const elements = await waitForElementAll(selector);
    elements.forEach((element) => {
      element.removeEventListener("click", handleBetButtonClick); 
      element.addEventListener("click", handleBetButtonClick);
    });
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

setTimeout(() => {
  attachClickListeners();
  updateMaxBetValues();
}, 3000);

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

let lastEnteredAmount = "";
let usingMaxValue = false;
let lastClickedElement = null;

const maxBetObserver = new MutationObserver(() => {
  updateMaxBetValues();
});

maxBetObserver.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
  attributes: true
});

function extractMaxValueFromMinMax(element) {
  if (!element) return null;
  const maxSpan = element.querySelector('span:last-child');
  if (maxSpan && maxSpan.textContent.includes('Max:')) {
    const maxValue = maxSpan.textContent.split('Max:')[1].trim();
    return parseFloat(maxValue);
  }
  return null;
}

function findRelevantMaxValue(clickedElement) {
  // Check if the clicked element is in a back or lay oddsbox with specific classes
  const isBackBet = clickedElement.closest('.back_oddsbox.bhav_box.bco') || 
                   clickedElement.closest('.back_oddsbox.bhav_box');
  const isLayBet = clickedElement.closest('.Lay_oddsbox.bhav_box.lyo') || 
                  clickedElement.closest('.Lay_oddsbox.bhav_box');

  // For back bets, use BOOKMAKER panel (headingTwo)
  if (isBackBet) {
    const bookmakerPanel = document.querySelector('#headingTwo.panel-heading');
    if (bookmakerPanel) {
      const minMaxElement = bookmakerPanel.querySelector('.min-max');
      if (minMaxElement) {
        const maxSpans = minMaxElement.querySelectorAll('span');
        for (const span of maxSpans) {
          if (span.textContent.includes('Max:')) {
            const maxValue = span.textContent.split('Max:')[1].trim();
            console.log("Found max value for back bet in BOOKMAKER panel:", maxValue);
            return parseFloat(maxValue);
          }
        }
      }
    }
  }
  
  // For lay bets, use Winner panel (headingOne)
  if (isLayBet) {
    const winnerPanel = document.querySelector('#headingOne.panel-heading');
    if (winnerPanel) {
      const minMaxElement = winnerPanel.querySelector('.min-max');
      if (minMaxElement) {
        const maxSpans = minMaxElement.querySelectorAll('span');
        for (const span of maxSpans) {
          if (span.textContent.includes('Max:')) {
            const maxValue = span.textContent.split('Max:')[1].trim();
            console.log("Found max value for lay bet in Winner panel:", maxValue);
            return parseFloat(maxValue);
          }
        }
      }
    }
  }

  // If we couldn't determine the bet type or find the value, try both panels
  const bookmakerPanel = document.querySelector('#headingTwo.panel-heading');
  if (bookmakerPanel) {
    const minMaxElement = bookmakerPanel.querySelector('.min-max');
    if (minMaxElement) {
      const maxSpans = minMaxElement.querySelectorAll('span');
      for (const span of maxSpans) {
        if (span.textContent.includes('Max:')) {
          const maxValue = span.textContent.split('Max:')[1].trim();
          console.log("Found fallback max value in BOOKMAKER panel:", maxValue);
          return parseFloat(maxValue);
        }
      }
    }
  }

  const winnerPanel = document.querySelector('#headingOne.panel-heading');
  if (winnerPanel) {
    const minMaxElement = winnerPanel.querySelector('.min-max');
    if (minMaxElement) {
      const maxSpans = minMaxElement.querySelectorAll('span');
      for (const span of maxSpans) {
        if (span.textContent.includes('Max:')) {
          const maxValue = span.textContent.split('Max:')[1].trim();
          console.log("Found fallback max value in Winner panel:", maxValue);
          return parseFloat(maxValue);
        }
      }
    }
  }

  return null;
}

async function handleBetButtonClick(event) {
  console.log("handleBetButtonClick triggered");
  lastClickedElement = event.target;
  try {
    event.preventDefault();
    event.stopPropagation();
  } catch (e) {
    console.log("Could not prevent default behavior:", e);
  }
  const globalInput = document.getElementById("global-stake-input");
  let displayAmount = globalInput.value;
  console.log("Global input value:", displayAmount);
  
  // Handle negative value case
  if (displayAmount && parseFloat(displayAmount) < 0) {
    const maxValue = findRelevantMaxValue(event.target);
    if (maxValue) {
      displayAmount = maxValue.toString();
      console.log("Using max value from panel:", displayAmount);
    } else {
      console.log("No max value found in any panel");
      return;
    }
  }

  if (!displayAmount || displayAmount === "") {
    console.log("No amount entered in global input");
    return; 
  }

  // Find the size element within the clicked oddsbox
  const sizeElement = event.target.closest('.back_oddsbox.bhav_box.bco, .back_oddsbox.bhav_box, .Lay_oddsbox.bhav_box.lyo, .Lay_oddsbox.bhav_box')?.querySelector('.size span');
  if (sizeElement) {
    sizeElement.textContent = displayAmount;
    console.log("Updated size element with value:", displayAmount);
  }

  // Find and set the value in the pl-1 ng-valid element
  const stakeInput = document.querySelector('.pl-1 .ng-valid');
  if (stakeInput) {
    console.log("Found stake input with class .pl-1 .ng-valid, setting value:", displayAmount);
    stakeInput.value = displayAmount;
    stakeInput.dispatchEvent(new Event('input', { bubbles: true }));
    stakeInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Verify the value was set
    if (stakeInput.value === displayAmount) {
      console.log("Value successfully set in stake input");
      
      // Wait a moment for the value to be processed
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Find and click the place bet button
      const placeBetButton = document.querySelector('button.btn.betplace-btn');
      if (placeBetButton) {
        console.log("Found place bet button");
        placeBetButton.removeAttribute('disabled');
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!placeBetButton.disabled) {
          console.log("Button is enabled, clicking...");
          placeBetButton.click();
        }
      }
    } else {
      console.log("Failed to set value in stake input");
    }
  } else {
    console.log("Could not find stake input with class .pl-1 .ng-valid");
  }
}

async function trackBetResult(amount, betType) {
  console.log("Tracking bet result");
  
  const oddsElement = lastClickedElement.closest('.back_oddsbox, .Lay_oddsbox')?.querySelector('.odds.ng-binding');
  const oddsValue = oddsElement ? oddsElement.textContent.trim() : "";
  
  console.log("Odds value:", oddsValue);
  
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

function handleGlobalInput(event) {
  const value = event.target.value;
  
  lastEnteredAmount = value;
  
  if (parseFloat(value) < 0) {
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
  } else {
    // Clear any message
    document.getElementById("bet-message").textContent = "";
  }
}

document
  .getElementById("global-stake-input")
  .addEventListener("input", handleGlobalInput);


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

setInterval(async () => {
  await attachClickListeners();
  updateMaxBetValues();
}, 5000);