document.addEventListener('DOMContentLoaded', async () => {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
  
    chrome.storage.local.get('theme', (data) => {
      const savedTheme = data.theme || 'light';
      applyTheme(savedTheme);
      themeToggle.checked = savedTheme === 'dark';
    });
  
    themeToggle.addEventListener('change', () => {
      const newTheme = themeToggle.checked ? 'dark' : 'light';
      applyTheme(newTheme);
      chrome.storage.local.set({ theme: newTheme });
    });
  
    function applyTheme(theme) {
        if (theme === 'dark') {
          body.classList.remove('light');
          body.classList.add('dark');
          themeIcon.src = '../assets/icons/moon.svg';
        } else {
          body.classList.remove('dark');
          body.classList.add('light');
          themeIcon.src = '../assets/icons/sun.svg';
        }
      }
      
  
    chrome.storage.local.get('matchResult', (data) => {
      const match = data.matchResult;
      const bottleInfo = match?.originalName || "Unknown Bottle";
      const retailPrice = match?.originalPrice || "N/A";
  
      document.querySelector("#retail-name span").textContent = bottleInfo;
      document.querySelector("#retail-price span").textContent = retailPrice ? `$${retailPrice}` : "N/A";
  
      const resultDiv = document.getElementById("result");
      const loadingDiv = document.getElementById("loading");
  
      setTimeout(() => {
        loadingDiv.classList.add('hidden');
        resultDiv.classList.remove('hidden');
  
        if (match?.baxusPrice) {
          const savings = (parseFloat(retailPrice) - parseFloat(match.baxusPrice)).toFixed(2);
          resultDiv.innerHTML = `
            <p class="match">✅ Match Found!</p>
            <p>🔸 BAXUS Price: $${match.baxusPrice}</p>
            <p>🔹 You Save: $${savings}</p>
            <p><a href="${match.url}" target="_blank">🔗 View on BAXUS</a></p>
          `;
        } else {
          resultDiv.innerHTML = `
            <p class="no-match">❌ No match found on BAXUS.</p>
          `;
        }
      }, 1200);
    });
  });
  