// DOM Elements
const setupView = document.getElementById('setup-view');
const dashboardView = document.getElementById('dashboard-view');
const setupForm = document.getElementById('setup-form');
const nameInput = document.getElementById('name-input');
const instanceInput = document.getElementById('instance-input');

const welcomeMessage = document.getElementById('welcome-message');
const displayInstanceId = document.getElementById('display-instance-id');
const clockElement = document.getElementById('clock');
const btnStart = document.getElementById('btn-start');
const btnStop = document.getElementById('btn-stop');

const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');
const toastIcon = document.getElementById('toast-icon');
const mobileMenu = document.getElementById('mobile-menu');

// AWS API Configuration
const API_URL = 'https://y7prsbu9z0.execute-api.ap-south-1.amazonaws.com/ec2';

// --- Initialization ---
function init() {
    document.getElementById('year').textContent = new Date().getFullYear();

    const savedName = localStorage.getItem('durgesh_devops_name');
    const savedInstance = localStorage.getItem('durgesh_devops_instance');

    if (savedName && savedInstance) {
        showDashboard(savedName, savedInstance);
        startUptimeCounter();
    } else {
        showSetup();
    }
}

// --- View Logic ---
function showSetup() {
    setupView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    // Pre-fill form if data exists
    nameInput.value = localStorage.getItem('durgesh_devops_name') || '';
    instanceInput.value = localStorage.getItem('durgesh_devops_instance') || '';
}

function showDashboard(name, instanceId) {
    welcomeMessage.textContent = `Welcome, ${name}`;
    displayInstanceId.textContent = instanceId;
    setupView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    updateServerState();
}

function resetSetup() {
    showSetup();
}

// --- Form Handling ---
setupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const instanceId = instanceInput.value.trim();

    if (name && instanceId) {
        localStorage.setItem('durgesh_devops_name', name);
        localStorage.setItem('durgesh_devops_instance', instanceId);
        showDashboard(name, instanceId);
        showToast('Configuration saved successfully', 'success');
    }
});

// --- API Integration ---
async function controlInstance(action) {
    const instanceId = localStorage.getItem('durgesh_devops_instance');
    if (!instanceId) {
        showToast('Configuration error. Please set Instance ID.', 'error');
        return resetSetup();
    }

    const payload = {
        instance_id: instanceId,
        action: action
    };

    const targetBtn = action === 'start' ? btnStart : btnStop;
    const originalContent = targetBtn.innerHTML;
    
    setButtonLoading(targetBtn, true);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Parse response safely
        const contentType = response.headers.get("content-type");
        let data;
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (response.ok) {
            showToast(`Success: Server ${action} signal sent.`, 'success');
            if (action === 'start') {
                localStorage.setItem('durgesh_devops_start_time', Date.now());
                startUptimeCounter();
            } else if (action === 'stop') {
                stopUptimeCounter();
            }
        } else {
            const errorMsg = data.message || data || `Failed to ${action} server.`;
            showToast(`API Error: ${errorMsg}`, 'error');
        }
    } catch (error) {
        console.error("API Call Failed:", error);
        showToast(`Network Error: Check console for details.`, 'error');
    } finally {
        setButtonLoading(targetBtn, false, originalContent);
    }
}

// --- Utility Functions ---
function setButtonLoading(button, isLoading, originalContent = '') {
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<div class="spinner"></div> Processing...';
        btnStart.disabled = true;
        btnStop.disabled = true;
    } else {
        button.innerHTML = originalContent;
        updateServerState();
    }
}

function updateServerState() {
    const isRunning = !!localStorage.getItem('durgesh_devops_start_time');
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    
    if (isRunning) {
        btnStart.disabled = true;
        btnStop.disabled = false;
        if (statusIndicator) { statusIndicator.className = 'status-indicator running'; statusText.textContent = 'Running'; }
    } else {
        btnStart.disabled = false;
        btnStop.disabled = true;
        if (statusIndicator) { statusIndicator.className = 'status-indicator stopped'; statusText.textContent = 'Stopped'; }
    }
}

let toastTimer;
function showToast(message, type) {
    toastMsg.textContent = message;
    toast.className = `show ${type}`;
    
    // Set icon based on type
    if (type === 'success') {
        toastIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else {
        toastIcon.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    }

    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}

let uptimeInterval;

function startUptimeCounter() {
    clearInterval(uptimeInterval);
    const startTime = parseInt(localStorage.getItem('durgesh_devops_start_time'));
    if (!startTime) {
        clockElement.textContent = '00:00:00';
        return;
    }

    function updateClock() {
        const diff = Math.floor((Date.now() - startTime) / 1000);
        if (diff < 0) return;
        const h = String(Math.floor(diff / 3600)).padStart(2, '0');
        const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
        const s = String(diff % 60).padStart(2, '0');
        clockElement.textContent = `${h}:${m}:${s}`;
    }

    updateClock(); // Turant time dikhane ke liye bina 1 sec wait kiye
    uptimeInterval = setInterval(updateClock, 1000);
}

function stopUptimeCounter() {
    clearInterval(uptimeInterval);
    clockElement.textContent = '00:00:00';
    localStorage.removeItem('durgesh_devops_start_time');
}

function toggleMenu() {
    mobileMenu.classList.toggle('active');
}

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    mobileMenu.classList.remove('active');
}

// Run application
document.addEventListener('DOMContentLoaded', init);