// URL observer to detect URL changes
let lastUrl = location.href;
const urlObserver = new MutationObserver(async () => {
  console.log("urlObserver");
  console.log(location.href);
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log('URL changed to:', lastUrl);
    // Handle URL change here
    if (lastUrl.includes("ananta247")) {
      // URL matches the target pattern
      console.log("URL matches the target pattern");
      
      await new Promise((resolve) => setTimeout(resolve, 4000));
      document.querySelectorAll(".match-price-first").forEach((element) => {
        console.log("element", element);
        element.addEventListener("click", handleBetButtonClick);
      });
      // await new Promise((resolve) => setTimeout(resolve, 2000));
      // document.querySelectorAll(".lay").forEach((element) => {
      //   element.addEventListener("click", handleBetButtonClick);
      // });
      // alert("Matched URL pattern");
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
  document.execCommand("insertText", false, value);
};

console.log("content.js loaded");
// alert("HEllo World!!");
// if (window.location.href.includes("parker777.io/event/detail")) {
  // Create and append popup HTML
  const popup = document.createElement("div");
  popup.className = "golden-exchange-popup";
  popup.innerHTML = `
      // <style>
      // .place-bet-container {
      //   display: none !important;
      // }
      // .lay-slip {
      //   display: none !important;
      // }
      // </style>
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
        </div>
    `;
  document.body.appendChild(popup);

  // Store the last entered amount
  let lastEnteredAmount = "";

  async function fillAndSubmitStake(amount) {

    // if (amount === "-1") {
    //   console.log("Special case: -1 entered, using maximum bet amount");
      
    //   // Find the max bet amount from the market-nation-detail div
    //   const marketNationName = document.querySelector(".modal-body .d-flex");
    //   if (marketNationName) {
    //     const text = marketNationName.textContent || "";
    //     console.log("Market nation text:", text);
        
    //     // Extract the max amount using regex - handle "Range: 100 to 1L" format
    //     const rangeMatch = text.match(/Range:.*?to\s+(\d+L|\d+)/i);
    //     if (rangeMatch && rangeMatch[1]) {
    //       let maxAmount = rangeMatch[1];
    //       console.log("Extracted max amount:", maxAmount);
          
    //       // Convert L notation to actual number
    //       if (maxAmount.includes('L')) {
    //         maxAmount = maxAmount.replace('L', '');
    //         maxAmount = parseInt(maxAmount) * 100000; // 1L = 100,000
    //       } else {
    //         maxAmount = parseInt(maxAmount.replace(/,/g, '')); // Remove commas
    //       }
          
    //       console.log("Converted max amount:", maxAmount);
          
    //       // Use the extracted max amount
    //       const stakeInput = document.querySelector('input[type="number"].stakeinput') || 
    //                         document.querySelector(".place-bet-stake .form-control");
    //       const submitButton = document.querySelector(".place-bet-btn-box .btn-success") || 
    //                           document.querySelector(".place-bet-action-buttons .btn-success");
          
    //       if (stakeInput && submitButton) {
    //         console.log("Found stake input and submit button, filling with:", maxAmount);
    //         await typeValue(stakeInput, maxAmount.toString());
            
    //         if (submitButton.disabled) {
    //           submitButton.disabled = false;
    //         }
    //         submitButton.click();
    //         console.log("Clicked submit button with max amount");
    //         return;
    //       }
    //     }
    //   } 
    // }


    const stakeInput = document.querySelector('.quantity.backBackground[placeholder="Stake"]') || 
    document.querySelector(".place-bet-stake .form-control");// Website's stake input
    const submitButton = document.querySelector(".subminmt-bet .Place_bet")

    console.log("stakeInput", stakeInput);
    console.log("submitButton", submitButton);
    
    if (stakeInput && submitButton) {
      await typeValue(stakeInput,amount)
     
      if (submitButton.disabled) {
        submitButton.disabled = false;
      }
      submitButton.click();
    }
  }

  // Function to handle "Back" or "Lay" button clicks
  async function handleBetButtonClick(event) {
    console.log("handleBetButtonClick");
    await new Promise(resolve => setTimeout(resolve, 100));
  
    const globalInput = document.getElementById("global-stake-input");
    const amount = globalInput.value || "";
    lastEnteredAmount = amount;
    const oddsInput = document.querySelector('.quantity.backBackground:not([placeholder="Stake"])').value || 
                  document.querySelector('.place-bet-odds .form-control');

    // const odds = oddsInput ? oddsInput.value : "";
  
    const betType = event.target.classList.contains('back') ? 'Back' : 'Lay';
    fillAndSubmitStake(amount);
  
    // Keep checking for toasts until either success or error is found
    let successToast = null;
    let errorToast = null;
    
    while (!successToast && !errorToast) {
      successToast = document.querySelector('.go3958317564');
      errorToast = document.querySelector('.toast-error');
      if (!successToast && !errorToast) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  
    // If error toast found, stop execution
    if (errorToast) {
      console.log("Error toast found, stopping bet history creation");
      return;
    }
  
    const betDetails = {
      stake: amount,
      ods: oddsInput,
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
  
  
  
  

  // Function to handle global input changes
  function handleGlobalInput(event) {
    const amount = event.target.value;
    if (amount) {
      lastEnteredAmount = amount;
    }
  }

  // Add event listeners
  document
    .getElementById("global-stake-input")
    .addEventListener("input", handleGlobalInput);

  // document.addEventListener('click', handleBetButtonClick);
  console.log("document");
  // alert("document");

  // (async () => {
  //   await new Promise((resolve) => setTimeout(resolve, 2000));
  //   document.querySelectorAll(".back").forEach((element) => {
  //     element.addEventListener("click", handleBetButtonClick);
  //   });
  //   await new Promise((resolve) => setTimeout(resolve, 2000));
  //   document.querySelectorAll(".lay").forEach((element) => {
  //     element.addEventListener("click", handleBetButtonClick);
  //   });
  // })();

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
// }