
const findByTextPattern = (pattern) => {
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
        if (el.innerText && el.innerText.toLowerCase().includes(pattern.toLowerCase())) {
            return el;
        }
    }
    return null;
}

const findElementByKeywords = (keywordList, parent = document) => {
    const elements = Array.from(parent.querySelectorAll('*'));
    const keywordRegex = new RegExp(keywordList.join('|'), 'i');

    for (const el of elements) {
        const text = el.innerText?.trim();
        if (!text || text.length > 300) continue;

        const classList = Array.from(el.classList || []);
        const id = el.id || '';
        const all = [...classList, id];

        if (all.some(cls => keywordRegex.test(cls))) {
            return el;
        }
    }

    return null;
}

const findWordsUnderElementByKeywords = (keywordList = [], parent = document, fallbackTags = ['p', 'h1', 'h2', 'span']) => {
    const keywordRegex = keywordList.length ? new RegExp(keywordList.join('|'), 'i') : null;
    const collectedTexts = [];

    for (const tag of fallbackTags) {
        const fallbackElements = Array.from(parent?.getElementsByTagName(tag));
        for (const el of fallbackElements) {
            const text = el.innerText?.trim();
            if (!text || !/\w/.test(text)) continue;
            if (!keywordRegex || keywordRegex.test(text)) {
                collectedTexts.push(text);
            }
        }
    }

    return collectedTexts.length > 0 ? collectedTexts.join('\n') : null;
}


const findPrice = () => {
    const elements = Array.from(document.querySelectorAll('*'));
    const keywordRegex = /price|cost|amount|value/i; // case-insensitive

    for (const el of elements) {
        const text = el.innerText?.trim();
        if (!text || text.length > 100 || !/[0-9]/.test(text)) continue;

        const classList = Array.from(el.classList || []);
        const id = el.id || '';

        const hasPriceKeyword = classList.some(cls => keywordRegex.test(cls)) || keywordRegex.test(id);
        const hasCurrency = /[$€£¥₹]\s?\d/.test(text);

        if (hasPriceKeyword && hasCurrency) {
            // return el;
        }

        if (hasPriceKeyword) {
            const priceWithCentInArray = text.split(" ");
            if (priceWithCentInArray.length == 2) {
                if (!isNaN(priceWithCentInArray[0]) && !isNaN(priceWithCentInArray[1])) {
                    return Number(`${priceWithCentInArray[0]}.${priceWithCentInArray[1]}`);
                }
                if (!isNaN(text)) {
                    return Number(text);
                }
            }
        }

    }

    const fallback = document.body.innerText.match(/[$€£¥₹]\s?\d[\d,.]*/);
    return fallback ? { innerText: fallback[0] } : null;
}

const findImageUrl = (parent = document, keywords = ['image', 'product', 'main', 'hero', 'bottle', "picture", "img"]) => {
    const keywordRegex = new RegExp(keywords.join('|'), 'i');
    const candidates = [];

    const imgTags = Array.from(parent.querySelectorAll('img'));

    for (const img of imgTags) {
        const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
        if (!src || !src.startsWith('http')) continue;

        const classList = Array.from(img.classList || []);
        const alt = img.getAttribute('alt') || '';
        const title = img.getAttribute('title') || '';
        const all = [...classList, alt, title];

        const score = all.filter(item => keywordRegex.test(item)).length;

        candidates.push({
            src,
            score,
            length: src.length,
        });
    }

    candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.length - a.length;
    });

    if (candidates.length > 0) return candidates[0].src;

    const allElements = Array.from(parent.querySelectorAll('*'));
    for (const el of allElements) {
        const bg = window.getComputedStyle(el).getPropertyValue('background-image');
        if (bg && bg.includes('url(')) {
            const match = bg.match(/url\(["']?(.*?)["']?\)/);
            if (match && match[1].startsWith('http')) {
                return match[1];
            }
        }
    }

    return null;
}

const findABV = () => {
    const abvRegex = /\b(abv)\b/i;
    const percentRegex = /(\d+(\.\d+)?\s*%)/;
    const numberRegex = /(\d+(\.\d+)?)/;

    const allElements = Array.from(document.querySelectorAll('*'));

    for (const el of allElements) {
        const text = el.innerText?.trim();
        if (!text || text.length > 200) continue;

        if (abvRegex.test(text)) {
            // Case 1: ABV + % in the same element
            const percentMatch = text.match(percentRegex);
            if (percentMatch) return percentMatch[1];

            const numberMatch = text.match(numberRegex);
            if (numberMatch) return numberMatch[1];

            // Case 2: Check children for a percentage or number
            for (const child of el.querySelectorAll("*")) {
                const childText = child.innerText?.trim();
                if (!childText) continue;

                const match = childText.match(percentRegex) || childText.match(numberRegex);
                if (match) return match[1];
            }

            // Case 3: Check siblings (next and previous)
            const next = el.nextElementSibling;
            if (next && next.innerText) {
                const siblingMatch = next.innerText.match(percentRegex) || next.innerText.match(numberRegex);
                if (siblingMatch) return siblingMatch[1];
            }

            const prev = el.previousElementSibling;
            if (prev && prev.innerText) {
                const siblingMatch = prev.innerText.match(percentRegex) || prev.innerText.match(numberRegex);
                if (siblingMatch) return siblingMatch[1];
            }
        }
    }

    return null;
};

const findBottleVolume = () => {
    const sizeKeywords = /\b(size|volume|bottle|ml|l|cl)\b/i;
    const volumeRegex = /(\d+(\.\d+)?)(\s?)(ml|cl|l|liters?|litres?)/i;

    const allElements = Array.from(document.querySelectorAll('*'));

    for (const el of allElements) {
        const text = el.innerText?.trim();
        if (!text || text.length > 200) continue;

        if (sizeKeywords.test(text)) {
            const match = text.match(volumeRegex);
            if (match) return `${match[1]}${match[4]}`;

            // Search inside child elements
            for (const child of el.querySelectorAll("*")) {
                const childText = child.innerText?.trim();
                if (!childText) continue;

                const childMatch = childText.match(volumeRegex);
                if (childMatch) return `${childMatch[1]}${childMatch[4]}`;
            }

            const siblings = [el.previousElementSibling, el.nextElementSibling];
            for (const sib of siblings) {
                if (sib && sib.innerText) {
                    const sibMatch = sib.innerText.match(volumeRegex);
                    if (sibMatch) return `${sibMatch[1]}${sibMatch[4]}`;
                }
            }
        }
    }

    // Fallback: Try whole document
    const fallbackMatch = document.body.innerText.match(volumeRegex);
    if (fallbackMatch) return `${fallbackMatch[1]}${fallbackMatch[4]}`;

    return null;
};



const scrapeProductData = () => {
    const nameElement = findElementByKeywords(['pipName']);
    const name = nameElement ? nameElement.innerText.trim() : 'No name available';

    const price = findPrice();
    const descriptionParentElement = document.querySelector(".pipProdMakerNote_copy");
    const description = findWordsUnderElementByKeywords([], descriptionParentElement, ['p']) ?? 'No description available';

    const imageParentElement = document.querySelector('picture');
    const imageUrl = findImageUrl(imageParentElement);
    const spiritTypeElement = findByTextPattern('spirit') || findByTextPattern('liqueur') || findByTextPattern('whisky') || findByTextPattern('whiskey') || findByTextPattern("scotch");
    const spiritType = spiritTypeElement ? spiritTypeElement.innerText.trim() : 'N/A';
    let abv = findABV();
    let size = findBottleVolume();

    if (abv && abv.includes("%")) {
        abv = abv.trim().split("").slice(0, -1).join("");
        abv = Number(abv);
    }

    return {
        name,
        price,
        description,
        imageUrl,
        spiritType,
        abv,
        size
    };
}

const scrapedProductData = scrapeProductData();

chrome.runtime.sendMessage({
    action: "BOTTLE_DATA",
    payload: scrapedProductData
});