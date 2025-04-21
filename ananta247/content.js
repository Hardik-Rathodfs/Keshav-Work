// URL observer to detect URL changes
let lastUrl = location.href;
const urlObserver = new MutationObserver(async () => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log('URL changed to:', lastUrl);
    
    if (lastUrl.includes("ananta247")) {
      console.log("URL matches the target pattern");
      await new Promise(resolve => setTimeout(resolve, 4000));
      setupEventListeners();
    }
  }
});


// Start observing URL changes
urlObserver.observe(document.querySelector("body"), {
  childList: true,
  subtree: true
});

const typeValue = async (element, value) => {
  element.focus();
  try {
    document.execCommand("insertText", false, value);
    
    if (element.value !== value) {
      element.value = value;
      element.dispatchEvent(new Event('input', { bubbles: true }));
    }
  } catch (e) {
    console.error("Error setting value:", e);
    element.value = value;
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
        <input type="number" id="global-stake-input" placeholder="Enter amount" style="
            width: 100%;
            padding: 8px;
            border: none;
            border-radius: 5px;
            margin-bottom: 5px;
            text-align: center;
            font-size: 14px;
        ">
        <div style="display: flex; justify-content: space-between; margin-top: 5px;">
            <button id="debug-back" style="background: #27ae60; color: white; border: none; border-radius: 3px; padding: 5px 10px;display:none;">Test Back</button>
            <button id="debug-lay" style="background: #e74c3c; color: white; border: none; border-radius: 3px; padding: 5px 10px; display:none;">Test Lay</button>
        </div>
    </div>
`;
document.body.appendChild(popup);

function findBettingElements(isLay = false) {
  const possibleStakeSelectors = isLay ? [
    '.quantity.layBackground[placeholder="Stake"]',
    'input.layBackground[placeholder="Stake"]',
    'input.layBackground',
    '.layBackground[type="number"]',
    'input[type="number"].layBackground',
    '.quantity[placeholder="Stake"]',
    '.place-bet-stake input[type="number"]',
    'input.stakeinput',
    '.layContainer input[type="number"]'
  ] : [
    '.quantity.backBackground[placeholder="Stake"]',
    'input.backBackground[placeholder="Stake"]',
    'input.backBackground',
    '.backBackground[type="number"]',
    'input[type="number"].backBackground',
    '.quantity[placeholder="Stake"]',
    '.place-bet-stake input[type="number"]',
    'input.stakeinput',
    '.backContainer input[type="number"]'
  ];
  
  let stakeInput = null;
  for (let selector of possibleStakeSelectors) {
    stakeInput = document.querySelector(selector);
    if (stakeInput) break;
  }
  
  const possibleSubmitSelectors = [
    ".subminmt-bet .Place_bet",
    ".Place_bet",
    "button.Place_bet",
    ".place-bet-action-buttons .btn-success",
    ".place-bet-btn-box .btn-success",
    ".placeBetBtn",
    "button.placeBetBtn",
    ".lay-slip .place-bet-btn",
    ".back-slip .place-bet-btn",
    ".place-bet-btn",
    "button.submit-bet"
  ];
  
  let submitButton = null;
  for (let selector of possibleSubmitSelectors) {
    submitButton = document.querySelector(selector);
    if (submitButton) break;
  }
  
  return { stakeInput, submitButton };
}

// Find max value from the page
function findMaxBetValue() {
  // Try different possible selectors for max bet value
  const possibleMaxValueSelectors = [
    '.max-bet-value',
    '.maximum-stake',
    '.max-stake',
    '.stake-limit',
    '.max-bet-limit',
    '.bet-max-value',
    '.limit-value'
  ];
  
  let maxValueElement = null;
  for (let selector of possibleMaxValueSelectors) {
    maxValueElement = document.querySelector(selector);
    if (maxValueElement) break;
  }
  
  if (maxValueElement) {
    // Extract number from text (remove currency symbols, commas, etc.)
    const maxText = maxValueElement.textContent;
    const numberMatch = maxText.match(/[\d,.]+/);
    if (numberMatch) {
      return numberMatch[0].replace(/,/g, '');
    }
  }
  
  // Check for tooltip or title attribute that might contain max value
  const elementsWithTitle = document.querySelectorAll('[title*="max"], [data-tooltip*="max"]');
  for (let element of elementsWithTitle) {
    const titleText = element.getAttribute('title') || element.getAttribute('data-tooltip');
    const numberMatch = titleText.match(/[\d,.]+/);
    if (numberMatch) {
      return numberMatch[0].replace(/,/g, '');
    }
  }
  
  // Default max value if we can't find it
  return "25000";
}

async function handleBetButtonClick(isLay = false) {
  const betType = isLay ? "Lay" : "Back";
  console.log(`${betType} bet clicked`);
  
  const globalInput = document.getElementById("global-stake-input");
  let amount = globalInput.value || "";
  
  if (!amount) {
    console.error("No stake amount entered");
    return;
  }
  
  // Handle negative values
  if (parseFloat(amount) < 0) {
    const maxValue = findMaxBetValue();
    console.log(`Negative value detected (${amount}), converting to maximum: ${maxValue}`);
    amount = maxValue;
  }
  
  // Wait for betting slip to appear
  for (let i = 0; i < 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const { stakeInput, submitButton } = findBettingElements(isLay);
    
    if (stakeInput && submitButton) {
      try {
        await typeValue(stakeInput, amount);
        
        if (submitButton.disabled) {
          submitButton.disabled = false;
        }
        
        submitButton.click();
        logBetDetails(betType, amount);
        return;
      } catch (error) {
        console.error("Error filling stake:", error);
      }
    } else {
      console.log(`Attempt ${i+1}: Betting elements not found yet, retrying...`);
    }
  }
  
  console.error("Failed to find betting elements after multiple attempts");
}

async function logBetDetails(betType, amount) {
  let successToast = null;
  let errorToast = null;
  
  let attempts = 0;
  const maxAttempts = 15;
  
  while (!successToast && !errorToast && attempts < maxAttempts) {
    successToast = document.querySelector('.go3958317564');
    errorToast = document.querySelector('.toast-error');
    if (!successToast && !errorToast) {
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }
  }
  
  if (errorToast) {
    console.log("Error toast found, stopping bet history creation");
    return;
  }
  
  const oddsSelectors = betType === "Lay" 
    ? ['.quantity.layBackground:not([placeholder="Stake"])', 'input.layBackground:not([placeholder="Stake"])']
    : ['.quantity.backBackground:not([placeholder="Stake"])', 'input.backBackground:not([placeholder="Stake"])'];
  
  let oddsInput = null;
  for (let selector of oddsSelectors) {
    oddsInput = document.querySelector(selector);
    if (oddsInput) break;
  }
  
  const odds = oddsInput ? oddsInput.value : "";
  
  const betDetails = {
    stake: amount,
    ods: odds,
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

function setupEventListeners() {
  // Back button event listeners
  document.querySelectorAll(".back, .match-price-first").forEach(element => {
    element.removeEventListener("click", () => handleBetButtonClick(false));
    element.addEventListener("click", () => handleBetButtonClick(false));
  });
  
  // Lay button event listeners
  document.querySelectorAll(".lay, .match-price-second").forEach(element => {
    element.removeEventListener("click", () => handleBetButtonClick(true));
    element.addEventListener("click", () => handleBetButtonClick(true));
  });
}

// Add global input event listener
document
  .getElementById("global-stake-input")
  .addEventListener("input", e => {
    // Optional: You could add real-time validation here
    if (parseFloat(e.target.value) < 0) {
      console.log("Negative value entered: " + e.target.value);
      // Optionally provide visual feedback that max value will be used
    }
  });

// Add debug button listeners
document.getElementById("debug-back").addEventListener("click", () => handleBetButtonClick(false));
document.getElementById("debug-lay").addEventListener("click", () => handleBetButtonClick(true));

// Set up initial event listeners
(async () => {
  await new Promise(resolve => setTimeout(resolve, 2000));
  setupEventListeners();
  
  // Add a DOM mutation observer to continue adding listeners as new elements appear
  const betButtonsObserver = new MutationObserver(() => {
    setupEventListeners();
  });
  
  betButtonsObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
})();

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