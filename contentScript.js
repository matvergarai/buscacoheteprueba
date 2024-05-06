const restricted_sites = new Set();

// Normalize URL by removing 'www.' from the beginning
function normalizeURL(url) {
    return url.replace(/^www\./i, "");
}

// Retrieve the blockedWebsitesArray for the current profile
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "getBlockedWebsitesArray") {
        const profileUsername = message.profile.username;
        chrome.storage.sync.get("blockedWebsitesArray_" + profileUsername, function (data) {
            const blockedWebsitesArray = data["blockedWebsitesArray_" + profileUsername] || [];
            // Add the items from blockedWebsitesArray to the set restricted_sites to avoid duplicates
            blockedWebsitesArray.forEach((item) => {
                // Convert to lowercase and add both versions of the URL
                restricted_sites.add(item.toLowerCase());
                restricted_sites.add(normalizeURL(item.toLowerCase()));
            });
        });
    }
});

// Listener para detectar cambios en la URL del navegador
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "urlChanged") {
        check_if_restricted();
    }
});

// Verificar si la página actual debe ser bloqueada
function check_if_restricted() {
    if (shouldBlockWebsite()) {
        redirectBlockedPage();
    }
}

// Redirigir a la página bloqueada
function redirectBlockedPage() {
    chrome.runtime.sendMessage({ action: "blockPage" });
}

// Check if the current website should be blocked
function shouldBlockWebsite() {
    const currentHostname = normalizeURL(window.location.hostname);
    return restricted_sites.has(currentHostname);
}

// Listener para recibir mensajes de background script
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "blockPage") {
        createBlockedPage();
    }
});

// Create the blocked page dynamically
function createBlockedPage() {
    const blockedPage = generateHTML();
    const style = generateSTYLING();
    // Inject the styles and blocked page into the current document
    const head = document.head || document.getElementsByTagName("head")[0];
    head.insertAdjacentHTML("beforeend", style);
    document.body.innerHTML = blockedPage;
}

// Generate styling for the blocked page
function generateSTYLING() {
    return `
    <style>
    body {
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        height: 100vh !important;
        margin: 0 !important;
        background-color: #ffcc00 !important;
        font-family: 'Comic Neue', cursive !important;
    }
    h1 {
        font-size: 3em !important;
        margin-top: -10vh !important;
        color: #ff0040 !important;
        text-align: center !important;
        text-shadow: 2px 2px 4px #000000;
    }
    </style>
  `;
}

// Generate HTML for the blocked page
function generateHTML() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sitio Bloqueado</title>
        <link href="https://fonts.googleapis.com/css2?family=YourSelectedFont&display=swap" rel="stylesheet">
    </head>
    <body>
        <h1>Sitio Bloqueado</h1>
    </body>
    </html>
  `;
}

// Retrieve the blockedWebsitesArray from Chrome storage
chrome.storage.sync.get("blockedWebsitesArray", function (data) {
    const blockedWebsitesArray = data.blockedWebsitesArray || [];
    if (blockedWebsitesArray && blockedWebsitesArray.length > 0) {
        // Add the items from blockedWebsitesArray to the set restricted_sites to avoid duplicates
        blockedWebsitesArray.forEach((item) => {
            // Convert to lowercase and add both versions of the URL
            restricted_sites.add(item.toLowerCase());
            restricted_sites.add(normalizeURL(item.toLowerCase()));
        });
    }
});
