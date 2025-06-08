class TikTokFollowManager {
    constructor() {
        this.followingList = [];
        this.followersList = [];
        this.nonFollowBacks = [];
        this.isProcessing = false;
        this.shouldStop = false;
        
        this.selectors = {
            followingTab: '[data-e2e="following-tab"]',
            followersTab: '[data-e2e="followers-tab"]',
            userContainer: '.css-14xr620-DivUserContainer',
            followButton: '[data-e2e="follow-button"]',
            unfollowButton: 'button[data-e2e="follow-button"]:contains("Takip ediliyor")',
            username: '.css-3gbgjv-PUniqueId',
            nickname: '.css-k0d282-SpanNickname',
            loadMoreBtn: '[data-e2e="load-more"]',
            userList: '[data-e2e="user-list"]',
            modal: '[data-e2e="modal"]',
            closeBtn: '[data-e2e="close"]',
            tabsContainer: '[data-e2e="tabs-container"]'
        };
        
        this.init();
    }
    
    init() {
        this.setupMessageListener();
        this.log('TikTok Takip Yöneticisi hazır');
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.action) {
                case 'analyzeFollowing':
                    this.analyzeFollowing().then(sendResponse);
                    return true;
                    
                case 'startUnfollowing':
                    this.startUnfollowing(message.options).then(sendResponse);
                    return true;
                    
                default:
                    sendResponse({ success: false, error: 'Bilinmeyen işlem' });
            }
        });
    }
    
    async analyzeFollowing() {
        try {
            this.log('Takip listesi analizi başlatılıyor...');
            
            // Sayfa kontrolü
            if (!this.checkIfOnTikTok()) {
                throw new Error('TikTok sayfasında değilsiniz');
            }
            
            // Modal kontrolü - daha esnek seçiciler
            const modalSelectors = [
                '[data-e2e="modal"]',
                '[role="dialog"]',
                '.css-1ye7vu0',
                '.css-1h2u3ol',
                'div[class*="Modal"]',
                'div[class*="dialog"]'
            ];
            
            let modal = null;
            for (const selector of modalSelectors) {
                modal = document.querySelector(selector);
                if (modal) {
                    this.log(`Modal bulundu: ${selector}`);
                    break;
                }
            }
            
            // Eğer modal bulunamazsa, sayfa yapısını kontrol et
            if (!modal) {
                // Takip ediliyor linkinin varlığını kontrol et
                const followingLinks = document.querySelectorAll('a, span, div');
                let hasFollowingSection = false;
                
                for (const element of followingLinks) {
                    const text = element.textContent.toLowerCase();
                    if (text.includes('takip ediliyor') || text.includes('following')) {
                        hasFollowingSection = true;
                        this.log('Takip ediliyor bölümü sayfada mevcut');
                        break;
                    }
                }
                
                if (!hasFollowingSection) {
                    throw new Error('Takip/Takipçi modalı açık değil. Lütfen profilinizde "Takip Ediliyor" veya "Takipçiler" sekmesine tıklayın.');
                } else {
                    this.log('Modal bulunamadı ama takip bölümü mevcut, devam ediliyor...');
                }
            }
            
            // Önce takip edilen listesini al
            this.log('Takip edilen listesine geçiliyor...');
            await this.navigateToFollowingTab();
            await this.wait(3000);
            
            this.followingList = await this.scrapeUserList('following');
            this.log(`${this.followingList.length} takip edilen kullanıcı bulundu`);
            
            if (this.followingList.length === 0) {
                throw new Error('Takip edilen kullanıcı bulunamadı. Lütfen "Takip Ediliyor" sekmesinde olduğunuzdan emin olun.');
            }
            
            // Sonra takipçi listesini al
            this.log('Takipçi listesine geçiliyor...');
            await this.navigateToFollowersTab();
            await this.wait(3000);
            
            this.followersList = await this.scrapeUserList('followers');
            this.log(`${this.followersList.length} takipçi bulundu`);
            
            // Takip etmeyenleri bul
            this.findNonFollowBacks();
            
            // Takip edilen sekmesine geri dön
            await this.navigateToFollowingTab();
            
            return {
                success: true,
                data: {
                    totalFollowing: this.followingList.length,
                    totalFollowers: this.followersList.length,
                    nonFollowBacks: this.nonFollowBacks.length
                }
            };
        } catch (error) {
            this.log(`Analiz hatası: ${error.message}`);
            console.error('TikTok Unfollower Analiz Hatası:', error);
            return { success: false, error: error.message };
        }
    }
    
    async startUnfollowing(options) {
        try {
            if (this.nonFollowBacks.length === 0) {
                return { success: false, error: 'Takipten çıkarılacak kimse yok' };
            }
            
            this.isProcessing = true;
            this.shouldStop = false;
            
            const maxUnfollow = options.maxUnfollow === -1 ? this.nonFollowBacks.length : Math.min(options.maxUnfollow, this.nonFollowBacks.length);
            let processed = 0;
            let successful = 0;
            
            this.log(`${maxUnfollow} kişiyi takipten çıkarma işlemi başlatılıyor...`);
            
            for (let i = 0; i < maxUnfollow && !this.shouldStop; i++) {
                const user = this.nonFollowBacks[i];
                
                try {
                    const result = await this.unfollowUser(user);
                    
                    if (result) {
                        successful++;
                        this.sendProgressUpdate(processed + 1, maxUnfollow, `✅ ${user.nickname} (@${user.username}) takipten çıkarıldı`, 'success');
                    } else {
                        this.sendProgressUpdate(processed + 1, maxUnfollow, `❌ ${user.nickname} takipten çıkarılamadı`, 'error');
                    }
                    
                    processed++;
                    
                    // Güvenli bekleme
                    if (options.useDelay && i < maxUnfollow - 1) {
                        await this.wait(options.delayMs);
                    }
                    
                } catch (error) {
                    this.sendProgressUpdate(processed + 1, maxUnfollow, `❌ ${user.nickname} işlem hatası: ${error.message}`, 'error');
                    processed++;
                }
            }
            
            this.isProcessing = false;
            
            return {
                success: true,
                data: {
                    processed: processed,
                    successful: successful,
                    failed: processed - successful
                }
            };
            
        } catch (error) {
            this.isProcessing = false;
            return { success: false, error: error.message };
        }
    }
    
    async navigateToFollowingTab() {
        try {
            this.log('Takip ediliyor sekmesi aranıyor...');
            
            // Farklı tab container seçicileri dene
            const tabContainerSelectors = [
                '.css-1fc036k-DivTabs',
                '.edpgb5h4',
                '[data-e2e="tabs-container"]',
                'div[class*="Tab"]',
                'div[class*="tab"]'
            ];
            
            let tabsContainer = null;
            for (const selector of tabContainerSelectors) {
                tabsContainer = document.querySelector(selector);
                if (tabsContainer) {
                    this.log(`Tab container bulundu: ${selector}`);
                    break;
                }
            }
            
            let followingTab = null;
            
            if (tabsContainer) {
                // Tab container içinde ara
                const tabSelectors = [
                    '.css-h1t3qn-DivTabItem',
                    '.css-1a4lsg3-DivTabItem',
                    '.edpgb5h5',
                    'div[class*="DivTabItem"]',
                    'div[class*="TabItem"]',
                    'div[class*="tab-item"]',
                    'button[class*="tab"]',
                    'a[class*="tab"]'
                ];
                
                for (const tabSelector of tabSelectors) {
                    const tabs = tabsContainer.querySelectorAll(tabSelector);
                    for (const tab of tabs) {
                        const text = tab.textContent.toLowerCase();
                        if (text.includes('takip ediliyor') || text.includes('following')) {
                            followingTab = tab;
                            this.log(`Takip ediliyor sekmesi bulundu: ${tabSelector}`);
                            break;
                        }
                    }
                    if (followingTab) break;
                }
                
                // Eğer metin ile bulamazsa, ilk tab'ı al
                if (!followingTab) {
                    const allTabs = tabsContainer.querySelectorAll('div, button, a');
                    if (allTabs.length > 0) {
                        followingTab = allTabs[0];
                        this.log('İlk sekme seçildi');
                    }
                }
            } else {
                // Tab container bulunamazsa, tüm sayfada ara
                this.log('Tab container bulunamadı, tüm sayfada aranıyor...');
                const allElements = document.querySelectorAll('div, button, a, span');
                for (const element of allElements) {
                    const text = element.textContent.toLowerCase();
                    if (text.includes('takip ediliyor') || text.includes('following')) {
                        // Tıklanabilir element olup olmadığını kontrol et
                        if (element.tagName === 'BUTTON' || element.tagName === 'A' || 
                            element.onclick || element.style.cursor === 'pointer') {
                            followingTab = element;
                            this.log('Takip ediliyor elementi bulundu');
                            break;
                        }
                    }
                }
            }
            
            if (followingTab) {
                this.log('Takip ediliyor sekmesine tıklanıyor...');
                followingTab.click();
                await this.wait(2000);
            } else {
                this.log('Takip ediliyor sekmesi bulunamadı, zaten doğru sekmede olabilirsiniz');
            }
        } catch (error) {
            this.log(`Takip ediliyor sekmesine geçiş hatası: ${error.message}`);
            // Hata durumunda devam et
        }
    }
    
    async navigateToFollowersTab() {
        try {
            this.log('Takipçiler sekmesi aranıyor...');
            
            // Farklı tab container seçicileri dene
            const tabContainerSelectors = [
                '.css-1fc036k-DivTabs',
                '.edpgb5h4',
                '[data-e2e="tabs-container"]',
                'div[class*="Tab"]',
                'div[class*="tab"]'
            ];
            
            let tabsContainer = null;
            for (const selector of tabContainerSelectors) {
                tabsContainer = document.querySelector(selector);
                if (tabsContainer) {
                    this.log(`Tab container bulundu: ${selector}`);
                    break;
                }
            }
            
            let followersTab = null;
            
            if (tabsContainer) {
                // Tab container içinde ara
                const tabSelectors = [
                    '.css-h1t3qn-DivTabItem',
                    '.css-1a4lsg3-DivTabItem',
                    '.edpgb5h5',
                    'div[class*="DivTabItem"]',
                    'div[class*="TabItem"]',
                    'div[class*="tab-item"]',
                    'button[class*="tab"]',
                    'a[class*="tab"]'
                ];
                
                for (const tabSelector of tabSelectors) {
                    const tabs = tabsContainer.querySelectorAll(tabSelector);
                    for (const tab of tabs) {
                        const text = tab.textContent.toLowerCase();
                        if (text.includes('takipçiler') || text.includes('followers')) {
                            followersTab = tab;
                            this.log(`Takipçiler sekmesi bulundu: ${tabSelector}`);
                            break;
                        }
                    }
                    if (followersTab) break;
                }
                
                // Eğer metin ile bulamazsa, ikinci tab'ı al
                if (!followersTab) {
                    const allTabs = tabsContainer.querySelectorAll('div, button, a');
                    if (allTabs.length > 1) {
                        followersTab = allTabs[1];
                        this.log('İkinci sekme seçildi');
                    }
                }
            } else {
                // Tab container bulunamazsa, tüm sayfada ara
                this.log('Tab container bulunamadı, tüm sayfada aranıyor...');
                const allElements = document.querySelectorAll('div, button, a, span');
                for (const element of allElements) {
                    const text = element.textContent.toLowerCase();
                    if (text.includes('takipçiler') || text.includes('followers')) {
                        // Tıklanabilir element olup olmadığını kontrol et
                        if (element.tagName === 'BUTTON' || element.tagName === 'A' || 
                            element.onclick || element.style.cursor === 'pointer') {
                            followersTab = element;
                            this.log('Takipçiler elementi bulundu');
                            break;
                        }
                    }
                }
            }
            
            if (followersTab) {
                this.log('Takipçiler sekmesine tıklanıyor...');
                followersTab.click();
                await this.wait(2000);
            } else {
                this.log('Takipçiler sekmesi bulunamadı, zaten doğru sekmede olabilirsiniz');
            }
        } catch (error) {
            this.log(`Takipçiler sekmesine geçiş hatası: ${error.message}`);
            // Hata durumunda devam et
        }
    }
    
    async scrapeUserList(type) {
        const users = [];
        let previousCount = 0;
        let stableCount = 0;
        let maxAttempts = 10;
        let attempts = 0;
        
        this.log(`${type} listesi kazınıyor...`);
        
        while (stableCount < 3 && attempts < maxAttempts) {
            attempts++;
            
            // Kullanıcı container'larını bul
            const userElements = document.querySelectorAll(this.selectors.userContainer);
            this.log(`${userElements.length} kullanıcı elementi bulundu (deneme ${attempts})`);
            
            if (userElements.length === 0) {
                this.log('Kullanıcı elementi bulunamadı, farklı seçiciler deneniyor...');
                
                // Alternatif seçiciler
                const altSelectors = [
                    '[data-e2e="user-item"]',
                    'div[class*="DivUserContainer"]',
                    'div[class*="user-item"]',
                    'div[class*="UserItem"]'
                ];
                
                for (const selector of altSelectors) {
                    const altElements = document.querySelectorAll(selector);
                    if (altElements.length > 0) {
                        this.log(`Alternatif seçici ile ${altElements.length} element bulundu: ${selector}`);
                        break;
                    }
                }
            }
            
            for (const element of userElements) {
                try {
                    // Kullanıcı adını bul
                    let usernameEl = element.querySelector(this.selectors.username);
                    if (!usernameEl) {
                        // Alternatif username seçicileri
                        const altUsernameSelectors = [
                            '[data-e2e="user-title"]',
                            'span[class*="SpanUserTitle"]',
                            'p[class*="user-title"]',
                            'div[class*="user-title"]'
                        ];
                        
                        for (const selector of altUsernameSelectors) {
                            usernameEl = element.querySelector(selector);
                            if (usernameEl) break;
                        }
                    }
                    
                    if (usernameEl) {
                        const username = usernameEl.textContent.trim().replace('@', '');
                        
                        // Nickname bul
                        let nicknameEl = element.querySelector(this.selectors.nickname);
                        if (!nicknameEl) {
                            const altNicknameSelectors = [
                                '[data-e2e="user-subtitle"]',
                                'span[class*="SpanUserSubTitle"]',
                                'p[class*="user-subtitle"]'
                            ];
                            
                            for (const selector of altNicknameSelectors) {
                                nicknameEl = element.querySelector(selector);
                                if (nicknameEl) break;
                            }
                        }
                        
                        const nickname = nicknameEl ? nicknameEl.textContent.trim() : '';
                        
                        if (username && !users.find(u => u.username === username)) {
                            users.push({ username, nickname, element });
                        }
                    }
                } catch (error) {
                    console.warn('Kullanıcı elementi işlenirken hata:', error);
                }
            }
            
            if (users.length === previousCount) {
                stableCount++;
            } else {
                stableCount = 0;
                this.log(`${users.length} kullanıcı bulundu`);
            }
            
            previousCount = users.length;
            
            // Daha fazla yükle
            const loadMoreBtn = document.querySelector(this.selectors.loadMoreBtn);
            if (loadMoreBtn && loadMoreBtn.offsetParent !== null) {
                this.log('Daha fazla yükle butonuna tıklanıyor...');
                loadMoreBtn.click();
                await this.wait(2000);
            } else {
                // Scroll to bottom
                const userList = document.querySelector(this.selectors.userList);
                if (userList) {
                    userList.scrollTop = userList.scrollHeight;
                    await this.wait(1500);
                } else {
                    // Modal içinde scroll
                    const modal = document.querySelector(this.selectors.modal);
                    if (modal) {
                        modal.scrollTop = modal.scrollHeight;
                        await this.wait(1500);
                    }
                }
            }
        }
        
        this.log(`${type} listesi tamamlandı: ${users.length} kullanıcı`);
        return users;
    }
    
    findNonFollowBacks() {
        this.nonFollowBacks = this.followingList.filter(following => {
            return !this.followersList.find(follower => follower.username === following.username);
        });
        
        this.log(`${this.nonFollowBacks.length} kişi sizi takip etmiyor`);
    }
    
    async unfollowUser(user) {
        try {
            // Takip ediliyor butonunu bul - çoklu seçici dene
            const buttonSelectors = [
                '[data-e2e="follow-button"]',
                'button[class*="follow"]',
                'button[class*="Follow"]',
                'div[class*="follow"]',
                'span[class*="follow"]',
                'button',
                'div[role="button"]'
            ];
            
            let unfollowBtn = null;
            
            // Her seçici ile butonları ara
            for (const selector of buttonSelectors) {
                const buttons = user.element.querySelectorAll(selector);
                for (const btn of buttons) {
                    const btnText = btn.textContent.trim();
                    if (btnText.includes('Takip ediliyor') || btnText.includes('Following')) {
                        unfollowBtn = btn;
                        this.log(`Takip butonu bulundu: ${selector}`);
                        break;
                    }
                }
                if (unfollowBtn) break;
            }
            
            if (unfollowBtn) {
                this.log(`${user.username} takipten çıkarılıyor...`);
                
                // Butona scroll et
                unfollowBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                await this.wait(500);
                
                // Farklı tıklama yöntemleri dene
                try {
                    unfollowBtn.click();
                } catch (e) {
                    // Manuel event dispatch
                    const clickEvent = new MouseEvent('click', {
                        view: window,
                        bubbles: true,
                        cancelable: true
                    });
                    unfollowBtn.dispatchEvent(clickEvent);
                }
                
                await this.wait(1500);
                
                // Onay popup'ı varsa onayla
                await this.wait(1000); // Popup'ın açılması için daha uzun bekle
                
                const confirmSelectors = [
                    '[data-e2e="unfollow-confirm"]',
                    '[data-e2e="confirm-button"]',
                    'button[class*="confirm"]',
                    'button[class*="Confirm"]',
                    'button[class*="primary"]',
                    'button[class*="Primary"]',
                    'div[role="button"][class*="confirm"]',
                    'div[role="button"][class*="primary"]'
                ];
                
                let confirmed = false;
                for (const selector of confirmSelectors) {
                    const confirmBtn = document.querySelector(selector);
                    if (confirmBtn && confirmBtn.offsetParent !== null) {
                        this.log(`Onay butonu bulundu: ${selector}`);
                        confirmBtn.click();
                        confirmed = true;
                        await this.wait(1500);
                        break;
                    }
                }
                
                // Eğer seçici ile bulamazsa, metin tabanlı arama yap
                if (!confirmed) {
                    const allButtons = document.querySelectorAll('button, div[role="button"], span[role="button"]');
                    for (const btn of allButtons) {
                        if (btn.offsetParent === null) continue; // Görünür olmayan butonları atla
                        
                        const btnText = btn.textContent.trim().toLowerCase();
                        if (btnText.includes('takipten çık') || btnText.includes('unfollow') || 
                            btnText.includes('onayla') || btnText.includes('confirm') ||
                            btnText.includes('evet') || btnText.includes('yes') ||
                            btnText.includes('tamam') || btnText.includes('ok')) {
                            this.log(`Metin ile onay butonu bulundu: "${btnText}"`);
                            btn.click();
                            confirmed = true;
                            await this.wait(1500);
                            break;
                        }
                    }
                }
                
                // Son çare: popup içindeki ilk görünür butona tıkla
                if (!confirmed) {
                    const modals = document.querySelectorAll('[role="dialog"], div[class*="modal"], div[class*="Modal"], div[class*="popup"], div[class*="Popup"]');
                    for (const modal of modals) {
                        if (modal.offsetParent !== null) {
                            const modalButtons = modal.querySelectorAll('button, div[role="button"]');
                            if (modalButtons.length > 0) {
                                const firstBtn = modalButtons[0];
                                this.log('Modal içindeki ilk butona tıklanıyor');
                                firstBtn.click();
                                confirmed = true;
                                await this.wait(1500);
                                break;
                            }
                        }
                    }
                }
                
                if (confirmed) {
                    this.log(`${user.username} onay verildi`);
                } else {
                    this.log(`${user.username} için onay butonu bulunamadı, işlem tamamlanmış olabilir`);
                }
                
                this.log(`${user.username} başarıyla takipten çıkarıldı`);
                return true;
            } else {
                this.log(`${user.username} için takip ediliyor butonu bulunamadı`);
                return false;
            }
        } catch (error) {
            this.log(`${user.username} takipten çıkarılırken hata: ${error.message}`);
            return false;
        }
    }
    
    async scrollToUser(username) {
        let found = false;
        let attempts = 0;
        
        while (!found && attempts < 10) {
            const userElements = document.querySelectorAll(this.selectors.userContainer);
            
            for (const element of userElements) {
                const usernameEl = element.querySelector(this.selectors.username);
                if (usernameEl && usernameEl.textContent.includes(username)) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                await this.scrollToBottom();
                await this.wait(1000);
                attempts++;
            }
        }
    }
    
    async scrollToBottom() {
        const userList = document.querySelector(this.selectors.userList);
        if (userList) {
            userList.scrollTop = userList.scrollHeight;
        } else {
            window.scrollTo(0, document.body.scrollHeight);
        }
    }
    
    sendProgressUpdate(processed, total, message, type = 'info') {
        chrome.runtime.sendMessage({
            action: 'updateProgress',
            processed: processed,
            total: total,
            message: message,
            type: type
        });
    }
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    checkIfOnTikTok() {
        return window.location.hostname.includes('tiktok.com');
    }
    
    log(message) {
        console.log(`[TikTok Unfollower] ${message}`);
    }
}

// Content script yüklendiğinde başlat
if (window.location.hostname.includes('tiktok.com')) {
    const manager = new TikTokFollowManager();
    window.tiktokFollowManager = manager;
}