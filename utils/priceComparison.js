const comparePrice = (baxusPrice, priceOnSite) => {
    const priceDifference = priceOnSite - baxusPrice;
    const percentageSaved = priceDifference / priceOnSite * 100;
    return { priceDifference, percentageSaved };
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("message",message)
    if (message.type == "matched-bottle") {
        console.log("in pricecomparison")
        const { baxusPrice, priceOnSite } = message.data;
        const { priceDifference, percentageSaved } = comparePrice(baxusPrice, priceOnSite);
        console.log("pri",{ priceDifference, percentageSaved })

        // sendResponse({ priceDifference, percentageSaved });
        return new Promise((resolve, reject)=>{
            console.log("pri",{ priceDifference, percentageSaved })
            resolve(sendResponse({ priceDifference, percentageSaved }));
        })
    }
    // return true
})