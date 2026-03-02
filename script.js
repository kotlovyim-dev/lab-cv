const VARIANT_NUMBER = 1;
const STORAGE_KEY_SYSTEM_INFO = "cv_system_info";
const STORAGE_KEY_THEME = "cv_theme";

const commentsList = document.getElementById("comments-list");
const localStorageList = document.getElementById("localstorage-list");
const feedbackModal = document.getElementById("feedback-modal");
const feedbackBackdrop = document.getElementById("feedback-modal-backdrop");
const themeToggle = document.getElementById("theme-toggle");

function getCurrentThemeByTime() {
    const hour = new Date().getHours();
    return hour >= 7 && hour < 21 ? "day" : "night";
}

function applyTheme(theme) {
    document.body.classList.remove("cv-theme-day", "cv-theme-night");
    document.body.classList.add(
        theme === "night" ? "cv-theme-night" : "cv-theme-day",
    );
    if (themeToggle) {
        themeToggle.checked = theme === "night";
    }
    localStorage.setItem(STORAGE_KEY_THEME, theme);
}

function initTheme() {
    const autoTheme = getCurrentThemeByTime();
    applyTheme(autoTheme);

    if (themeToggle) {
        themeToggle.addEventListener("change", (event) => {
            const isNight = event.target.checked;
            applyTheme(isNight ? "night" : "day");
            renderAllLocalStorage();
        });
    }
}

function collectSystemInfo() {
    const userAgentData = navigator.userAgentData || {};

    return {
        collectedAt: new Date().toISOString(),
        browser: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory || null,
            maxTouchPoints: navigator.maxTouchPoints,
            userAgentData: {
                brands: userAgentData.brands || [],
                mobile: userAgentData.mobile || false,
                platform: userAgentData.platform || null,
            },
        },
        system: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                colorDepth: window.screen.colorDepth,
                pixelDepth: window.screen.pixelDepth,
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight,
            },
        },
    };
}

function saveSystemInfoToLocalStorage() {
    const info = collectSystemInfo();
    localStorage.setItem(
        STORAGE_KEY_SYSTEM_INFO,
        JSON.stringify(info, null, 2),
    );
}

function valueToDisplay(value) {
    if (typeof value === "string") {
        return value;
    }

    try {
        return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
        return String(value);
    }
}

function renderAllLocalStorage() {
    if (!localStorageList) {
        return;
    }

    localStorageList.innerHTML = "";

    if (localStorage.length === 0) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "cv-list-item";
        emptyItem.textContent = "No data in localStorage yet.";
        localStorageList.appendChild(emptyItem);
        return;
    }

    for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key) {
            continue;
        }

        const rawValue = localStorage.getItem(key);
        const item = document.createElement("li");
        item.className = "cv-list-item";

        const title = document.createElement("strong");
        title.className = "cv-strong";
        title.textContent = `${key}: `;

        const value = document.createElement("pre");
        value.className = "cv-storage-value";
        value.textContent = valueToDisplay(rawValue);

        item.appendChild(title);
        item.appendChild(value);
        localStorageList.appendChild(item);
    }
}

async function loadEmployerComments() {
    if (!commentsList) {
        return;
    }

    commentsList.innerHTML = "";

    try {
        const response = await fetch(
            `https://jsonplaceholder.typicode.com/posts/${VARIANT_NUMBER}/comments`,
        );
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const comments = await response.json();

        comments.forEach((comment) => {
            const item = document.createElement("li");
            item.className = "cv-list-item";
            item.innerHTML = `<strong class="cv-strong">${comment.name}</strong> (${comment.email})<br>${comment.body}`;
            commentsList.appendChild(item);
        });
    } catch (error) {
        const item = document.createElement("li");
        item.className = "cv-list-item";
        item.textContent = `Failed to load comments: ${error.message}`;
        commentsList.appendChild(item);
    }
}

function showFeedbackModalAfterDelay() {
    setTimeout(() => {
        if (!feedbackModal || !feedbackBackdrop) {
            return;
        }

        feedbackModal.classList.remove("cv-hidden");
        feedbackBackdrop.classList.remove("cv-hidden");
    }, 60_000);
}

function init() {
    initTheme();
    saveSystemInfoToLocalStorage();
    renderAllLocalStorage();
    loadEmployerComments();
    showFeedbackModalAfterDelay();
}

init();
