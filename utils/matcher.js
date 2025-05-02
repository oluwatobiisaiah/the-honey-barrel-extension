const parseVolume = (str) => {
    const match = str.match(/([\d.]+)\s*(ml|cl|l)\b/i);
    if (!match) return null;

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    // Convert all to ml for comparison
    const valueInMl =
        unit === 'ml' ? value :
            unit === 'cl' ? value * 10 :
                unit === 'l' ? value * 1000 : null;

    return valueInMl;
};

const containsEquivalentVolume = (targetVolume, inputString) => {
    const targetMl = parseVolume(targetVolume);
    if (targetMl === null) return false;

    const regex = /\b([\d.]+)\s*(ml|cl|l)\b/gi;
    let match;
    while ((match = regex.exec(inputString)) !== null) {
        const currentMl = parseVolume(match[0]);
        if (currentMl !== null && currentMl === targetMl) {
            return true;
        }
    }

    return false;
};


const levenshteinDistance = (a, b) => {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);

    for (let j = 1; j <= b.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;

            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    return matrix[a.length][b.length];
}

const isBaxusImageUrl = (url) => {
    const baxusDomain = "assets.baxus.co";
    return url && typeof url === "string" && url.includes(baxusDomain) && /\.(jpg|jpeg|png|webp)$/i.test(url);
}

function fetchImageAsDataUrl(url) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type: 'FETCH_IMAGE', url }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Runtime error:", chrome.runtime.lastError.message);
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }

            if (response?.success) {
                resolve(response.dataUrl);
            } else {
                reject(new Error(response?.error || "Unknown error"));
            }
        });
    });
}

const getImageBase64 = async (url) => {
    try {

        if (isBaxusImageUrl(url)) {
            let fetchedImage = await fetchImageAsDataUrl(url);
            return fetchedImage;
        } else {
            const response = await fetch(url);
            const blob = await response.blob();

            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result); // returns base64
                reader.readAsDataURL(blob);
            });
        }

    } catch (error) {
        console.error(error)
    }

}

const compareImages = async (imageUrl1, imageUrl2) => {
    const base64Image1 = await getImageBase64(imageUrl1);
    const base64Image2 = await getImageBase64(imageUrl2);

    return new Promise((resolve) => {
        resemble(base64Image1)
            .compareTo(base64Image2)
            .ignoreColors()
            .onComplete(function (data) {
                console.log("Mismatch %:", data.misMatchPercentage);
                resolve(data);
            });
    });
}

const findClosestImageMatch = async (scrapedImageUrl, baxusResults) => {
    const comparisons = await Promise.all(
        baxusResults.map(async (result) => {
            const baxusImageUrl = result._source.imageUrl;
            const comparison = await compareImages(scrapedImageUrl, baxusImageUrl);
            return {
                result,
                misMatch: parseFloat(comparison.misMatchPercentage),
            };
        })
    );

    comparisons.sort((a, b) => a.misMatch - b.misMatch);
    return comparisons;
}

const comparePrice = (baxusPrice, priceOnSite) => {
    const priceDifference = priceOnSite - baxusPrice;
    const percentageSaved = priceDifference / priceOnSite * 100;
    return { priceDifference, percentageSaved };
}

const generatedSessionKeyFromUrl = (url = window.location.href) => {
    const parsedUrl = new URL(url);
    const path = parsedUrl.pathname;
    const cleanKey = path
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();

    return `baxus_scrape_${cleanKey}`;
  }



chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    if (message.type === "baxus-api-results") {
        const baxusResults = message.data.baxusResults;
        const { name, price, description, imageUrl, spiritType, abv, size } = message.data.bottleData
        let refinedData = baxusResults.filter((result) => {
            // Keep only results with matching size
            return size ? containsEquivalentVolume(size, result._source.attributes.Size) : true;
        })
            .map((result) => {
                const baxusName = result._source.name || '';
                const baxusDescription = result._source.description || '';
                const baxusAbv = parseFloat(result._source.attributes.ABV);

                const nameDistance = levenshteinDistance(baxusName.toLowerCase(), name.toLowerCase());
                const descriptionDistance = levenshteinDistance(baxusDescription.toLowerCase(), description.toLowerCase());

                let abvPenalty = 0;
                if (abv && !isNaN(baxusAbv)) {
                    abvPenalty = Math.abs(parseFloat(abv) - baxusAbv) * 2;
                    //the multiplier (2) can be tweaked to control how much ABV difference affects the match
                }

                const totalScore = nameDistance + descriptionDistance + abvPenalty;

                return {
                    ...result,
                    matchScore: totalScore,
                };
            })
            .sort((a, b) => a.matchScore - b.matchScore);


        // refinedData = await findClosestImageMatch(imageUrl, refinedData);
        const chosenData = refinedData[0];
        const { priceDifference, percentageSaved } = comparePrice(chosenData._source.price, price);

        chrome.storage.session.set(generatedSessionKeyFromUrl(), {originalName: name, originalPrice:price,baxusPrice:chosenData._source.price,priceDifference,percentageSaved,id:chosenData._source.id})
        console.log("pri",{ priceDifference, percentageSaved })


        console.log("refined data", refinedData)

    }
});
