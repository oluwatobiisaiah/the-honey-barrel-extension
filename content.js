
console.log("hello world")

const findByTextPattern = (pattern) => {
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
        if (el.innerText && el.innerText.toLowerCase().includes(pattern.toLowerCase())) {
            return el;
        }
    }
    return null;
}

const extractPrice = () => {
    const pricePattern = /(\$|€|£|¥|₹|₣)?\s?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/;  // Regex to detect price (supports $, €, etc.)
    const bodyText = document.body.innerText;  // Get all text on the page
    const match = pricePattern.exec(bodyText);
    console.log("matched",match)
    return match ? parseFloat(match[2].replace(/[^0-9.-]+/g, "")) : null;
}

const scrapeProductData = () => {
    const nameElement = findByTextPattern('name') || findByTextPattern('product');
    const name = nameElement ? nameElement.innerText.trim() : 'No name available';

    const price = extractPrice();
    const descriptionElement = findByTextPattern('description') || findByTextPattern('details');
    const description = descriptionElement ? descriptionElement.innerText.trim() : 'No description available';
    const imageElement = document.querySelector('img[alt*="image"], img[src*="product"], img[src*="bottle"]');
    const imageUrl = imageElement ? imageElement.src : '';
    const spiritTypeElement = findByTextPattern('spirit') || findByTextPattern('liqueur') || findByTextPattern('whisky') || findByTextPattern('whiskey') || findByTextPattern("scotch");
    const spiritType = spiritTypeElement ? spiritTypeElement.innerText.trim() : 'N/A';

    return {
        name,
        price,
        description,
        imageUrl,
        spiritType
    };
}

const scrapedProductData = scrapeProductData();
console.log("data",{scrapedProductData});
chrome.runtime.sendMessage({ type: 'BOTTLE_DATA', payload: scrapeProductData() });
