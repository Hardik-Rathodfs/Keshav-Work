// URL observer to detect URL changes
let lastUrl = location.href;
const urlObserver = new MutationObserver(async () => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log('URL changed to:', lastUrl);
    
    // Check if we're on a game view page
    if (isGameViewPage(lastUrl)) {
      console.log("Game view page detected");
      showStakePopup();
      attachBetButtonListeners();
    }
  }
});

// Start observing URL changes
urlObserver.observe(document.querySelector("body"), {
  childList: true,
  subtree: true
});

// Check if current URL is a game view page
function isGameViewPage(url) {
  return url.includes("ananta247");
}

// Function to attach listeners to bet buttons
function attachBetButtonListeners() {
  const betButtons = document.querySelectorAll(".market-odd-box, .back, .lay");
  console.log(`Found ${betButtons.length} bet buttons`);
  
  
  betButtons.forEach((element) => {
    if (!element.hasAttribute('data-bet-listener')) {
      element.setAttribute('data-bet-listener', 'true');
      element.addEventListener("click", handleBetButtonClick);
    }
  });
}

// Improved popup show function
function showStakePopup() {
  // Remove existing popup if any
  const existingPopup = document.querySelector(".golden-exchange-popup");
  if (existingPopup) {
    existingPopup.remove();
  }

  // Create and append popup HTML
  const popup = document.createElement("div");
  popup.className = "golden-exchange-popup";
  popup.innerHTML = `
    <div id="draggable-popup" style="
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 250px;
        background: linear-gradient(145deg, #2c3e50, #3498db);
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 99999;
        cursor: move;
        color: white;
    ">
        <h4 style="margin: 0 0 10px 0; text-align: center;">Quick Stake</h4>
        <input type="number" id="global-stake-input" placeholder="Enter stake amount" style="
            width: 100%;
            padding: 8px;
            border: none;
            border-radius: 5px;
            margin-bottom: 10px;
            text-align: center;
            font-size: 14px;
            color: black;
        ">
        <div style="display: flex; justify-content: space-between; gap: 5px;">
            <button class="quick-amount" data-amount="10" style="flex: 1; padding: 5px; border: none; border-radius: 5px; background: #2ecc71; color: white;">10</button>
            <button class="quick-amount" data-amount="20" style="flex: 1; padding: 5px; border: none; border-radius: 5px; background: #2ecc71; color: white;">20</button>
            <button class="quick-amount" data-amount="50" style="flex: 1; padding: 5px; border: none; border-radius: 5px; background: #2ecc71; color: white;">50</button>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 5px; margin-top: 5px;">
            <button class="quick-amount" data-amount="100" style="flex: 1; padding: 5px; border: none; border-radius: 5px; background: #2ecc71; color: white;">100</button>
            <button class="quick-amount" data-amount="200" style="flex: 1; padding: 5px; border: none; border-radius: 5px; background: #2ecc71; color: white;">200</button>
            <button class="quick-amount" data-amount="500" style="flex: 1; padding: 5px; border: none; border-radius: 5px; background: #2ecc71; color: white;">500</button>
        </div>
        <div style="margin-top: 10px; font-size: 12px; text-align: center;">
            Amount will auto-bet when you click Back/Lay
        </div>
    </div>
  `;
  document.body.appendChild(popup);
  console.log("Stake popup displayed");

  // Initialize popup functionality
  initializePopupFunctionality();
  makePopupDraggable();
}

// Initialize popup functionality
function initializePopupFunctionality() {
  // Function to handle global input changes
  function handleGlobalInput(event) {
    const amount = event.target.value;
    if (amount) {
      lastEnteredAmount = amount;
    }
  }

  // Add event listeners
  const globalInput = document.getElementById("global-stake-input");
  if (globalInput) {
    globalInput.addEventListener("input", handleGlobalInput);
    globalInput.focus();
  }

  // Add quick amount button handlers
  document.querySelectorAll('.quick-amount').forEach(button => {
    button.addEventListener('click', (e) => {
      const amount = e.target.getAttribute('data-amount');
      const input = document.getElementById('global-stake-input');
      if (input) {
        input.value = amount;
        lastEnteredAmount = amount;
        input.focus();
      }
    });
  });
}

// Make popup draggable
function makePopupDraggable() {
  const draggablePopup = document.getElementById("draggable-popup");
  if (!draggablePopup) return;

  let isDragging = false;
  let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;

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
}

// Function to handle bet button clicks
async function handleBetButtonClick(event) {
  console.log("Bet button clicked");
  
  const globalInput = document.getElementById("global-stake-input");
  const amount = globalInput ? globalInput.value : "";
  
  if (!amount || amount <= 0) {
    console.log("No valid amount set in popup, skipping bet");
    return;
  }
  
  lastEnteredAmount = amount;
  
  // Place the bet
  await fillAndSubmitStake(amount);
}

// Function to fill and submit stake
async function fillAndSubmitStake(amount) {
  if (!amount || amount <= 0) {
    console.log("Invalid amount, skipping bet");
    return;
  }

  console.log("Placing bet with amount:", amount);
  
  // Try different selectors for stake input
  const stakeInput = document.querySelector(".stake-input, input[type='number'][placeholder*='Stake'], .bet-stake-input");
  const submitButton = document.querySelector(".submit-bet, .place-bet-button, .btn-confirm");
  
  if (stakeInput) {
    stakeInput.value = amount;
    stakeInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (submitButton) {
      submitButton.click();
      console.log("Bet placed successfully");
    }
  } else {
    console.log("Stake input not found");
  }
}

// Initialize everything when the page loads
function initialize() {
  if (isGameViewPage(location.href)) {
    showStakePopup();
    attachBetButtonListeners();
  }
}

// Run initialization after a short delay to allow page to load
setTimeout(initialize, 1000);