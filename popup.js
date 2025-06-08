class TikTokUnfollower {
    constructor() {
        this.isRunning = false;
        this.shouldStop = false;
        this.stats = {
            totalFollowing: 0,
            totalFollowers: 0,
            nonFollowBacks: 0,
            processed: 0
        };
        
        this.initializeElements();
        this.bindEvents();
        this.loadSettings();
        this.checkTikTokTab();
    }
    
    initializeElements() {
        this.elements = {
            analyzeBtn: document.getElementById('analyzeBtn'),
            unfollowBtn: document.getElementById('unfollowBtn'),
            stopBtn: document.getElementById('stopBtn'),
            delayCheckbox: document.getElementById('delayCheckbox'),
            maxUnfollow: document.getElementById('maxUnfollow'),
            totalFollowing: document.getElementById('totalFollowing'),
            totalFollowers: document.getElementById('totalFollowers'),
            nonFollowBacks: document.getElementById('nonFollowBacks'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            progress: document.querySelector('.progress'),
            log: document.getElementById('log')
        };
    }
    
    bindEvents() {
        this.elements.analyzeBtn.addEventListener('click', () => this.analyzeFollowing());
        this.elements.unfollowBtn.addEventListener('click', () => this.startUnfollowing());
        this.elements.stopBtn.addEventListener('click', () => this.stopProcess());
        this.elements.delayCheckbox.addEventListener('change', () => this.saveSettings());
        this.elements.maxUnfollow.addEventListener('change', () => this.saveSettings());
    }
    
    async checkTikTokTab() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab.url.includes('tiktok.com')) {
                this.addLog('❌ Lütfen TikTok sayfasında olduğunuzdan emin olun', 'error');
                this.elements.analyzeBtn.disabled = true;
                return;
            }
            
            if (!tab.url.includes('/following')) {
                this.addLog('⚠️ "Takip Ediliyor" sekmesine gidin', 'info');
            }
        } catch (error) {
            this.addLog('❌ Sekme kontrolü başarısız', 'error');
        }
    }
    
    async analyzeFollowing() {
        this.setButtonLoading(this.elements.analyzeBtn, true);
        this.addLog('🔍 Takip listesi analiz ediliyor...', 'info');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'analyzeFollowing'
            });
            
            if (response.success) {
                this.stats = response.data;
                this.updateStats();
                this.elements.unfollowBtn.disabled = this.stats.nonFollowBacks === 0;
                this.addLog(`✅ Analiz tamamlandı: ${this.stats.nonFollowBacks} kişi sizi takip etmiyor`, 'success');
            } else {
                this.addLog(`❌ Analiz hatası: ${response.error}`, 'error');
            }
        } catch (error) {
            this.addLog('❌ Analiz sırasında hata oluştu', 'error');
        }
        
        this.setButtonLoading(this.elements.analyzeBtn, false);
    }
    
    async startUnfollowing() {
        if (this.stats.nonFollowBacks === 0) {
            this.addLog('❌ Takipten çıkarılacak kimse yok', 'error');
            return;
        }
        
        this.isRunning = true;
        this.shouldStop = false;
        this.stats.processed = 0;
        
        this.setButtonLoading(this.elements.unfollowBtn, true);
        this.elements.stopBtn.style.display = 'block';
        this.elements.progress.style.display = 'block';
        
        const maxUnfollow = parseInt(this.elements.maxUnfollow.value);
        const useDelay = this.elements.delayCheckbox.checked;
        
        this.addLog(`🚀 Takipten çıkarma işlemi başlatıldı (Maksimum: ${maxUnfollow === -1 ? 'Sınırsız' : maxUnfollow})`, 'info');
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'startUnfollowing',
                options: {
                    maxUnfollow: maxUnfollow,
                    useDelay: useDelay,
                    delayMs: useDelay ? 3000 : 1000
                }
            });
            
            if (response.success) {
                this.addLog('✅ İşlem başarıyla tamamlandı', 'success');
            } else {
                this.addLog(`❌ İşlem hatası: ${response.error}`, 'error');
            }
        } catch (error) {
            this.addLog('❌ İşlem sırasında hata oluştu', 'error');
        }
        
        this.stopProcess();
    }
    
    stopProcess() {
        this.isRunning = false;
        this.shouldStop = true;
        
        this.setButtonLoading(this.elements.unfollowBtn, false);
        this.elements.stopBtn.style.display = 'none';
        
        this.addLog('⏹️ İşlem durduruldu', 'info');
    }
    
    updateStats() {
        this.elements.totalFollowing.textContent = this.stats.totalFollowing;
        this.elements.totalFollowers.textContent = this.stats.totalFollowers;
        this.elements.nonFollowBacks.textContent = this.stats.nonFollowBacks;
    }
    
    updateProgress(processed, total) {
        const percentage = total > 0 ? (processed / total) * 100 : 0;
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.progressText.textContent = `${processed} / ${total}`;
    }
    
    setButtonLoading(button, loading) {
        const text = button.querySelector('.btn-text');
        const loader = button.querySelector('.loader');
        
        if (loading) {
            text.style.display = 'none';
            loader.style.display = 'block';
            button.disabled = true;
        } else {
            text.style.display = 'block';
            loader.style.display = 'none';
            button.disabled = false;
        }
    }
    
    addLog(message, type = 'info') {
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
        
        this.elements.log.appendChild(logEntry);
        this.elements.log.scrollTop = this.elements.log.scrollHeight;
        
        // Maksimum 50 log girişi tut
        while (this.elements.log.children.length > 50) {
            this.elements.log.removeChild(this.elements.log.firstChild);
        }
    }
    
    saveSettings() {
        const settings = {
            useDelay: this.elements.delayCheckbox.checked,
            maxUnfollow: this.elements.maxUnfollow.value
        };
        
        chrome.storage.local.set({ tiktokUnfollowerSettings: settings });
    }
    
    async loadSettings() {
        try {
            const result = await chrome.storage.local.get('tiktokUnfollowerSettings');
            const settings = result.tiktokUnfollowerSettings || {};
            
            if (settings.useDelay !== undefined) {
                this.elements.delayCheckbox.checked = settings.useDelay;
            }
            
            if (settings.maxUnfollow !== undefined) {
                this.elements.maxUnfollow.value = settings.maxUnfollow;
            }
        } catch (error) {
            console.error('Ayarlar yüklenemedi:', error);
        }
    }
}

// Popup yüklendiğinde başlat
document.addEventListener('DOMContentLoaded', () => {
    new TikTokUnfollower();
});

// Content script'ten gelen mesajları dinle
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'updateProgress') {
        const unfollower = window.tiktokUnfollower;
        if (unfollower) {
            unfollower.updateProgress(message.processed, message.total);
            unfollower.addLog(message.message, message.type || 'info');
        }
    }
});