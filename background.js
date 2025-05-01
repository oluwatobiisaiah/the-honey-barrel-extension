chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Hello World")
})

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeProductData' }, (response) => {
        if (response && response.productData) {
            console.log('Scraped Product Data:', response.productData);
            // Here you can handle the scraped data (e.g., match it with BAXUS API)
        }
    });
});