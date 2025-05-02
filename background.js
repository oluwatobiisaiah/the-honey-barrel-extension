chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    try {
        if (request.action === "BOTTLE_DATA") {
            const { name, price, description, imageUrl, abv, size } = request.payload;
            const baxusResults = await fetch(`https://services.baxus.co/api/search/listings?from=0&size=1000&listed=true&query=${name}`)
                .then(res => res.json());

            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                const tab = tabs[0];

                if (!tab) {
                    console.error("No active tab found.");
                    return;
                }

                chrome.scripting.executeScript({
                    target: { tabId: tab.id},
                    files: ['utils/matcher.js']
                }, () => {
                    chrome.tabs.sendMessage(tab.id, {
                        type: "baxus-api-results",
                        data: { baxusResults, bottleData: request.payload }
                    });
                });
            });

        }

        if (request.type === 'FETCH_IMAGE') {
            const response = await fetch(request.url);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                sendResponse({ success: true, dataUrl: reader.result });
            };
            reader.readAsDataURL(blob);
            return true;
        }

    } catch (error) {
        sendResponse({ success: false, error: error.toString() });

    }

});


chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed.");
});
