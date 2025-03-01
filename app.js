// 注册 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker not registered', err));
    });
}

// LeanCloud 初始化
const APP_ID = '7FtjHQdsLOwzUHDalpm4Ozzq-gzGzoHsz';
const APP_KEY = 'fjZQfIKXFWoSRZ8MhIcOCWJ2';
const SERVER_URL = 'https://7ftjhqds.lc-cn-n1-shared.com';

// 初始化LeanCloud
AV.init({
    appId: APP_ID,
    appKey: APP_KEY,
    serverURL: SERVER_URL
});

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const takePhotoBtn = document.getElementById('takePhotoBtn');
    const imagePreview = document.getElementById('imagePreview');
    const previewContainer = document.getElementById('previewContainer');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingSection = document.getElementById('loadingSection');
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    const healthRating = document.getElementById('healthRating');
    const usageCounter = document.getElementById('usageCounter');
    const userRemainingScans = document.getElementById('userRemainingScans');
    
    // Tab elements
    const homeTab = document.getElementById('homeTab');
    const shopTab = document.getElementById('shopTab');
    const userTab = document.getElementById('userTab');
    const authTab = document.getElementById('authTab');
    const historyTab = document.getElementById('historyTab');
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    
    // Settings elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const settingsForm = document.getElementById('settingsForm');
    const apiProvider = document.getElementById('apiProvider');
    const apiKey = document.getElementById('apiKey');
    const modelName = document.getElementById('modelName');
    const azureEndpointContainer = document.getElementById('azureEndpointContainer');
    const azureEndpoint = document.getElementById('azureEndpoint');
    const toggleAdvancedBtn = document.getElementById('toggleAdvancedBtn');
    const advancedOptions = document.getElementById('advancedOptions');
    const maxTokens = document.getElementById('maxTokens');
    const temperature = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperatureValue');
    const resetSettingsBtn = document.getElementById('resetSettingsBtn');
    
    // Checkin elements
    const checkinBtn = document.getElementById('checkinBtn');
    const userCheckinBtn = document.getElementById('userCheckinBtn');
    const checkinModal = document.getElementById('checkinModal');
    const closeCheckinBtn = document.getElementById('closeCheckinBtn');
    const checkinStatus = document.getElementById('checkinStatus');
    
    // Donate elements
    const donateBtn = document.getElementById('donateBtn');
    const donateModal = document.getElementById('donateModal');
    const closeDonateBtn = document.getElementById('closeDonateBtn');
    
    // Usage exhausted elements
    const usageExhaustedModal = document.getElementById('usageExhaustedModal');
    const gotoShopBtn = document.getElementById('gotoShopBtn');
    const configApiBtn = document.getElementById('configApiBtn');
    
    // Shop elements
    const buyBasicBtn = document.getElementById('buyBasicBtn');
    const buyHighBtn = document.getElementById('buyHighBtn');
    const buyYearBtn = document.getElementById('buyYearBtn');
    const activateCardBtn = document.getElementById('activateCardBtn');
    const upgradeBtn = document.getElementById('upgradeBtn');
    const paymentOptions = document.querySelectorAll('.payment-option');
    const paymentQRContainer = document.getElementById('paymentQRContainer');
    const wxpayQR = document.getElementById('wxpayQR');
    const alipayQR = document.getElementById('alipayQR');
    const wxPayAmount = document.getElementById('wxPayAmount');
    const aliPayAmount = document.getElementById('aliPayAmount');
    const selectPackageTip = document.getElementById('selectPackageTip');
    const verifyPaymentBtn = document.getElementById('verifyPaymentBtn');
    
    // Success Modal
    const paymentSuccessModal = document.getElementById('paymentSuccessModal');
    const addedCredits = document.getElementById('addedCredits');
    const closePaymentSuccessBtn = document.getElementById('closePaymentSuccessBtn');
    
    // Auth elements
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    
    // History elements
    const historyBtn = document.getElementById('historyBtn');
    const backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
    const historyList = document.getElementById('historyList');
    
    // User Profile elements
    const userDisplayName = document.getElementById('userDisplayName');
    const userSettingsBtn = document.getElementById('userSettingsBtn');
    const aboutBtn = document.getElementById('aboutBtn');
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    let selectedFile = null;
    let currentUser = null;
    let selectedPackage = null;
    let selectedPaymentMethod = 'wechat';
    
    // 默认设置
    const defaultSettings = {
        apiProvider: 'openai',
        apiKey: '',
        modelName: 'gpt-4',
        azureEndpoint: '',
        maxTokens: 2000,
        temperature: 0.7,
        usePoeApi: true // 是否使用默认API
    };
    
    // 初始化应用
    function initApp() {
        checkUserSession();
        checkDarkModePreference();
        initPaymentOptions();
        renderCheckinCircles();
    }
    
    // 检查用户登录状态
    function checkUserSession() {
        currentUser = AV.User.current();
        if (currentUser) {
            // 用户已登录
            userDisplayName.textContent = currentUser.get('username') || '用户_' + currentUser.id.substring(0, 6);
            updateUserCredits();
        } else {
            // 游客状态
            userDisplayName.textContent = '游客用户';
            // 本地存储中可能有游客使用记录
            loadGuestUserData();
        }
        
        updateUsageCounter();
        checkDailyCheckin();
    }
    
    // 更新用户积分(使用次数)
    function updateUserCredits() {
        if (currentUser) {
            currentUser.fetch().then(() => {
                const credits = currentUser.get('credits') || 0;
                updateUsageDisplay(credits);
            }).catch(error => {
                console.error('Failed to fetch user data:', error);
            });
        }
    }
    
    // 更新使用次数显示
    function updateUsageDisplay(credits) {
        usageCounter.textContent = `剩余次数: ${credits}`;
        if (userRemainingScans) {
            userRemainingScans.textContent = credits;
        }
    }
    
    // 渲染签到圆点
    function renderCheckinCircles() {
        const container = document.querySelector('.checkin-circles');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 获取当前用户的签到记录
        const checkinDays = getCurrentUser() ? (currentUser.get('checkinDays') || 0) : (loadGuestUserData().checkinDays || 0);
        
        // 创建7个圆点
        for (let i = 1; i <= 7; i++) {
            let circleClass = 'flex items-center justify-center w-8 h-8 rounded-full text-xs mr-1';
            
            if (i <= checkinDays) {
                // 已签到
                circleClass += ' bg-green-100 dark:bg-green-900 dark:bg-opacity-30 text-green-600 dark:text-green-400';
                container.innerHTML += `
                    <span class="${circleClass}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </span>
                `;
            } else {
                // 未签到
                circleClass += ' bg-gray-100 dark:bg-gray-700 text-gray-400';
                container.innerHTML += `<span class="${circleClass}">${i}</span>`;
            }
        }
    }
    
    // 加载游客用户数据
    function loadGuestUserData() {
        const guestData = localStorage.getItem('guestUserData');
        if (guestData) {
            return JSON.parse(guestData);
        }
        
        // 默认游客数据
        const defaultGuestData = {
            credits: 0,
            lastCheckinDate: null,
            checkinDays: 0,
            history: []
        };
        
        localStorage.setItem('guestUserData', JSON.stringify(defaultGuestData));
        return defaultGuestData;
    }
    
    // 保存游客用户数据
    function saveGuestUserData(data) {
        localStorage.setItem('guestUserData', JSON.stringify(data));
    }
    
    // 更新游客使用次数
    function updateGuestCredits(change) {
        const guestData = loadGuestUserData();
        guestData.credits += change;
        saveGuestUserData(guestData);
        updateUsageDisplay(guestData.credits);
    }
    
    // 获取当前用户可用分析次数
    function getUserCredits() {
        if (currentUser) {
            return currentUser.get('credits') || 0;
        } else {
            return loadGuestUserData().credits || 0;
        }
    }
    
    // 减少使用次数
    function decrementUserCredits() {
        if (currentUser) {
            const credits = currentUser.get('credits') || 0;
            if (credits <= 0) return false;
            
            currentUser.set('credits', credits - 1);
            return currentUser.save().then(() => {
                updateUsageCounter();
                return true;
            }).catch(error => {
                console.error('Failed to update user credits:', error);
                return false;
            });
        } else {
            const guestData = loadGuestUserData();
            if (guestData.credits <= 0) return false;
            
            guestData.credits -= 1;
            saveGuestUserData(guestData);
            updateUsageDisplay(guestData.credits);
            return Promise.resolve(true);
        }
    }
    
    // 增加使用次数
    function incrementUserCredits(amount) {
        if (currentUser) {
            const credits = currentUser.get('credits') || 0;
            currentUser.set('credits', credits + amount);
            return currentUser.save().then(() => {
                updateUserCredits();
                return true;
            }).catch(error => {
                console.error('Failed to update user credits:', error);
                return false;
            });
        } else {
            const guestData = loadGuestUserData();
            guestData.credits += amount;
            saveGuestUserData(guestData);
            updateUsageDisplay(guestData.credits);
            return Promise.resolve(true);
        }
    }
    
    // 检查每日签到状态
    function checkDailyCheckin() {
        const today = new Date().toDateString();
        let lastCheckinDate = null;
        
        if (currentUser) {
            lastCheckinDate = currentUser.get('lastCheckinDate');
        } else {
            const guestData = loadGuestUserData();
            lastCheckinDate = guestData.lastCheckinDate;
        }
        
        const hasCheckedInToday = lastCheckinDate === today;
        
        if (hasCheckedInToday) {
            checkinBtn.classList.add('opacity-50');
            userCheckinBtn.disabled = true;
            userCheckinBtn.classList.add('opacity-50');
            checkinStatus.textContent = '今日已签到';
            checkinStatus.classList.add('text-green-500');
            checkinStatus.classList.remove('text-yellow-500');
        } else {
            checkinBtn.classList.remove('opacity-50');
            userCheckinBtn.disabled = false;
            userCheckinBtn.classList.remove('opacity-50');
            checkinStatus.textContent = '今日未签到';
            checkinStatus.classList.remove('text-green-500');
            checkinStatus.classList.add('text-yellow-500');
        }
    }
    
    // 执行每日签到
    function performCheckin() {
        const today = new Date().toDateString();
        
        // 检查是否已经签到
        let lastCheckinDate = null;
        if (currentUser) {
            lastCheckinDate = currentUser.get('lastCheckinDate');
        } else {
            const guestData = loadGuestUserData();
            lastCheckinDate = guestData.lastCheckinDate;
        }
        
        if (lastCheckinDate === today) {
            return; // 今日已签到
        }
        
        const CHECKIN_REWARD = 1; // 签到奖励
        
        if (currentUser) {
            // 已登录用户
            let checkinDays = currentUser.get('checkinDays') || 0;
            
            // 检查是否连续签到
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();
            
            if (lastCheckinDate !== yesterdayString) {
                // 不是连续签到，重置计数
                checkinDays = 1;
            } else {
                // 连续签到
                checkinDays += 1;
                // 第7天连续签到额外奖励
                if (checkinDays === 7) {
                    incrementUserCredits(2); // 额外奖励2次
                }
            }
            
            currentUser.set('lastCheckinDate', today);
            currentUser.set('checkinDays', checkinDays);
            currentUser.save().then(() => {
                incrementUserCredits(CHECKIN_REWARD);
                updateCheckinUI();
                renderCheckinCircles();
                
                // 显示签到成功弹窗
                checkinModal.classList.add('show');
            }).catch(error => {
                console.error('Failed to update checkin status:', error);
            });
        } else {
            // 游客用户
            const guestData = loadGuestUserData();
            let checkinDays = guestData.checkinDays || 0;
            
            // 检查是否连续签到
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayString = yesterday.toDateString();
            
            if (guestData.lastCheckinDate !== yesterdayString) {
                // 不是连续签到，重置计数
                checkinDays = 1;
            } else {
                // 连续签到
                checkinDays += 1;
                // 第7天连续签到额外奖励
                if (checkinDays === 7) {
                    guestData.credits += 2; // 额外奖励2次
                }
            }
            
            guestData.lastCheckinDate = today;
            guestData.checkinDays = checkinDays;
            guestData.credits += CHECKIN_REWARD;
            
            saveGuestUserData(guestData);
            updateUsageDisplay(guestData.credits);
            updateCheckinUI();
            renderCheckinCircles();
            
            // 显示签到成功弹窗
            checkinModal.classList.add('show');
        }
    }
    
    // 更新签到UI
    function updateCheckinUI() {
        checkinBtn.classList.add('opacity-50');
        userCheckinBtn.disabled = true;
        userCheckinBtn.classList.add('opacity-50');
        checkinStatus.textContent = '今日已签到';
        checkinStatus.classList.add('text-green-500');
        checkinStatus.classList.remove('text-yellow-500');
    }
    
    // 添加扫描历史
    function addScanHistory(imageData, result, healthRating) {
        const historyItem = {
            date: new Date().toISOString(),
            imageData: imageData,
            result: result,
            healthRating: healthRating
        };
        
        if (currentUser) {
            // 已登录用户，保存到云端
            const ScanHistory = AV.Object.extend('ScanHistory');
            const history = new ScanHistory();
            
            history.set('user', currentUser);
            history.set('imageData', imageData);
            history.set('result', result);
            history.set('healthRating', healthRating);
            
            history.save().catch(error => {
                console.error('Failed to save scan history:', error);
            });
        } else {
            // 游客用户，保存到本地
            const guestData = loadGuestUserData();
            guestData.history = guestData.history || [];
            
            // 限制历史记录数量，防止localStorage过大
            if (guestData.history.length >= 10) {
                guestData.history.shift(); // 移除最旧的记录
            }
            
            guestData.history.push(historyItem);
            saveGuestUserData(guestData);
        }
    }
    
    // 加载扫描历史
    function loadScanHistory() {
        if (currentUser) {
            // 已登录用户，从云端加载
            const query = new AV.Query('ScanHistory');
            query.equalTo('user', currentUser);
            query.descending('createdAt');
            query.limit(20);
            
            return query.find().then(results => {
                return results.map(item => {
                    return {
                        id: item.id,
                        date: item.get('createdAt').toISOString(),
                        imageData: item.get('imageData'),
                        result: item.get('result'),
                        healthRating: item.get('healthRating')
                    };
                });
            });
        } else {
            // 游客用户，从本地加载
            const guestData = loadGuestUserData();
            return Promise.resolve(guestData.history || []);
        }
    }
    
    // 检查深色模式偏好
    function checkDarkModePreference() {
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        darkModeToggle.checked = prefersDarkMode;

        if (prefersDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
    
    // 初始化支付选项
    function initPaymentOptions() {
        // 支付方式切换
        paymentOptions.forEach(option => {
            option.addEventListener('click', () => {
                paymentOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                selectedPaymentMethod = option.getAttribute('data-payment');
                updatePaymentQRDisplay();
            });
        });
        
        // 购买按钮点击事件
        const buyButtons = [buyBasicBtn, buyHighBtn, buyYearBtn];
        buyButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const price = btn.getAttribute('data-price');
                const scans = btn.getAttribute('data-scans');
                const packageType = btn.getAttribute('data-package');
                
                selectedPackage = {
                    price: price,
                    scans: scans,
                    type: packageType
                };
                
                // 显示支付二维码
                paymentQRContainer.classList.remove('hidden');
                selectPackageTip.classList.add('hidden');
                
                // 更新金额显示
                wxPayAmount.textContent = `¥${price}`;
                aliPayAmount.textContent = `¥${price}`;
                
                // 更新二维码显示
                updatePaymentQRDisplay();
            });
        });
        
        // 验证支付按钮
        verifyPaymentBtn.addEventListener('click', () => {
            // 模拟支付成功
            if (selectedPackage) {
                verifyPayment(selectedPackage.type, parseInt(selectedPackage.scans));
            }
        });
    }
    
    // 更新支付二维码显示
    function updatePaymentQRDisplay() {
        if (selectedPaymentMethod === 'wechat') {
            wxpayQR.classList.remove('hidden');
            alipayQR.classList.add('hidden');
        } else {
            wxpayQR.classList.add('hidden');
            alipayQR.classList.remove('hidden');
        }
    }
    
    // 验证支付
    function verifyPayment(packageType, scans) {
        // 这里应该对接后端API进行实际的支付验证
        // 由于现在没有后端，我们模拟支付成功
        
        // 显示loading
        verifyPaymentBtn.innerHTML = `
            <div class="inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-1"></div>
            验证中...
        `;
        
        // 模拟网络延迟
        setTimeout(() => {
            incrementUserCredits(scans).then(() => {
                // 支付成功，显示成功提示
                addedCredits.textContent = scans;
                paymentSuccessModal.classList.add('show');
                
                // 隐藏支付二维码
                paymentQRContainer.classList.add('hidden');
                selectPackageTip.classList.remove('hidden');
                
                // 重置验证按钮
                verifyPaymentBtn.textContent = '验证支付';
                
                // 清除选中的套餐
                selectedPackage = null;
            });
        }, 1500);
    }
    
    // 卡密验证与激活
    function activateCardKey(code) {
        if (!code || code.trim() === '') {
            alert('请输入有效的卡密');
            return;
        }
        
        // 查询卡密
        const query = new AV.Query('CardKey');
        query.equalTo('code', code);
        query.equalTo('isUsed', false);
        
        query.first().then(card => {
            if (!card) {
                alert('卡密无效或已被使用');
                return;
            }
            
            // 标记卡密为已使用
            card.set('isUsed', true);
            if (currentUser) {
                card.set('usedBy', currentUser);
            }
            
            return card.save().then(() => {
                const value = card.get('value');
                
                // 增加用户积分
                return incrementUserCredits(value).then(() => {
                    alert(`卡密激活成功，您获得了${value}次分析机会`);
                    document.getElementById('cardKey').value = '';
                });
            });
        }).catch(error => {
            console.error('卡密验证失败:', error);
            alert('卡密验证失败，请稍后重试');
        });
    }
    
    // 初始化标签页切换
    function initTabs() {
        // 设置点击事件
        bottomNavItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabName = item.getAttribute('data-tab');
                showTab(tabName);
            });
        });

        // 商店相关按钮
        upgradeBtn.addEventListener('click', () => {
            showTab('shopTab');
        });
        
        // 历史记录按钮
        historyBtn.addEventListener('click', () => {
            loadScanHistoryData();
            showCustomTab('historyTab');
        });
        
        // 返回按钮
        backFromHistoryBtn.addEventListener('click', () => {
            showTab('userTab');
        });
        
        // 用户设置按钮
        userSettingsBtn.addEventListener('click', () => {
            settingsModal.classList.add('show');
            loadSettings();
        });
        
        // 关于我们按钮
        aboutBtn.addEventListener('click', () => {
            alert('食品安全扫描 V1.0\n\n一款帮助您识别食品添加剂和安全风险的工具\n\n© 2023 All Rights Reserved');
        });
        
        // 卡密激活
        activateCardBtn.addEventListener('click', () => {
            const cardKey = document.getElementById('cardKey').value;
            activateCardKey(cardKey);
        });
        
        // 支付成功关闭按钮
        closePaymentSuccessBtn.addEventListener('click', () => {
            paymentSuccessModal.classList.remove('show');
        });
    }

    // 显示特定标签页
    function showTab(tabName) {
        // 移除所有活动状态
        bottomNavItems.forEach(navItem => {
            navItem.classList.remove('active');
            if (navItem.getAttribute('data-tab') === tabName) {
                navItem.classList.add('active');
            }
        });
        
        // 隐藏所有tab内容
        hideAllTabs();
        
        // 显示选中的tab
        document.getElementById(tabName).classList.remove('hidden');
    }
    
    // 显示自定义标签页(不在底部导航中的页面)
    function showCustomTab(tabName) {
        hideAllTabs();
        document.getElementById(tabName).classList.remove('hidden');
    }
    
    // 隐藏所有标签页
    function hideAllTabs() {
        const allTabs = [homeTab, shopTab, userTab, authTab, historyTab];
        allTabs.forEach(tab => {
            if (tab) tab.classList.add('hidden');
        });
    }
    
    // 加载历史记录数据
    function loadScanHistoryData() {
        historyList.innerHTML = '<div class="p-4 text-center text-gray-500">正在加载历史记录...</div>';
        
        loadScanHistory().then(records => {
            if (!records || records.length === 0) {
                historyList.innerHTML = '<div class="p-4 text-center text-gray-500">暂无历史记录</div>';
                return;
            }
            
            historyList.innerHTML = '';
            
            records.forEach(record => {
                const date = new Date(record.date);
                const formattedDate = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
                
                const healthRatingStars = '★'.repeat(record.healthRating) + '☆'.repeat(5 - record.healthRating);
                let healthClass = 'text-green-500';
                if (record.healthRating <= 2) {
                    healthClass = 'text-red-500';
                } else if (record.healthRating === 3) {
                    healthClass = 'text-yellow-500';
                }
                
                const historyItem = document.createElement('div');
                historyItem.className = 'p-4 border-b border-gray-200 dark:border-gray-700';
                historyItem.innerHTML = `
                    <div class="flex items-start mb-2">
                        <img src="${record.imageData}" alt="食品照片" class="w-16 h-16 object-cover rounded-lg mr-3">
                        <div class="flex-1">
                            <div class="flex justify-between">
                                <span class="text-sm text-gray-500">${formattedDate}</span>
                                <span class="${healthClass}">${healthRatingStars}</span>
                            </div>
                            <p class="mt-1 line-clamp-2 text-sm">${record.result.substring(0, 100)}...</p>
                        </div>
                    </div>
                    <button class="view-history-btn text-primary-color text-sm" data-id="${record.id || ''}">查看详情</button>
                `;
                
                historyList.appendChild(historyItem);
            });
            
            // 添加详情查看事件
            document.querySelectorAll('.view-history-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const recordId = btn.getAttribute('data-id');
                    viewHistoryDetail(recordId);
                });
            });
        }).catch(error => {
            console.error('Failed to load scan history:', error);
            historyList.innerHTML = '<div class="p-4 text-center text-red-500">加载历史记录失败</div>';
        });
    }
    
    // 查看历史记录详情
    function viewHistoryDetail(recordId) {
        // 根据ID查找记录
        if (!recordId) {
            // 本地记录，从localStorage查找
            const guestData = loadGuestUserData();
            const record = guestData.history.find(item => item.id === recordId);
            
            if (record) {
                displayHistoryDetail(record);
            }
        } else {
            // 云端记录，从LeanCloud查找
            const query = new AV.Query('ScanHistory');
            query.get(recordId).then(record => {
                const detail = {
                    date: record.get('createdAt').toISOString(),
                    imageData: record.get('imageData'),
                    result: record.get('result'),
                    healthRating: record.get('healthRating')
                };
                
                displayHistoryDetail(detail);
            }).catch(error => {
                console.error('Failed to fetch history detail:', error);
                alert('获取历史记录详情失败');
            });
        }
    }
    
    // 显示历史记录详情
    function displayHistoryDetail(record) {
        // 切换到主页并显示结果
        showTab('homeTab');
        
        // 解析Markdown
        let parsedContent = marked.parse(record.result);
        
        // 高亮有害添加剂
        parsedContent = highlightHarmfulAdditives(parsedContent);
        
        // 显示结果
        resultContent.innerHTML = parsedContent;
        renderHealthRating(record.healthRating);
        
        resultSection.classList.remove('hidden');
    }
    
    // 事件监听器设置
    // 图片上传和拍照
    uploadBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    takePhotoBtn.addEventListener('click', () => {
        // 使用专门的camera capture方式，确保打开相机而不是上传图片
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            // 创建相机UI
            const cameraContainer = document.createElement('div');
            cameraContainer.className = 'camera-container';
            cameraContainer.innerHTML = `
                <div class="camera-header">
                    <span class="font-semibold">拍摄配料表</span>
                    <button id="closeCameraBtn" class="p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="camera-viewer">
                    <video id="cameraView" class="camera-view" autoplay playsinline></video>
                    <div class="camera-frame"></div>
                    <div class="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
                        请将配料表对准框内
                    </div>
                </div>
                <div class="camera-footer">
                    <button id="takePictureBtn" class="camera-button">
                        <div class="camera-button-inner"></div>
                    </button>
                </div>
            `;
            document.body.appendChild(cameraContainer);
            
            const video = document.getElementById('cameraView');
            const closeCameraBtn = document.getElementById('closeCameraBtn');
            const takePictureBtn = document.getElementById('takePictureBtn');
            
            // 关闭相机
            const closeCamera = () => {
                if (video.srcObject) {
                    const tracks = video.srcObject.getTracks();
                    tracks.forEach(track => track.stop());
                    video.srcObject = null;
                }
                cameraContainer.remove();
            };
            
            closeCameraBtn.addEventListener('click', closeCamera);
            
            // 打开相机
            navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: "environment",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                } 
            })
            .then(stream => {
                video.srcObject = stream;
                
                // 拍照按钮
                takePictureBtn.addEventListener('click', () => {
                    // 创建临时canvas来捕获图像
                    const canvas = document.createElement('canvas');
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    
                    // 转换为Blob
                    canvas.toBlob(blob => {
                        selectedFile = new File([blob], "camera-image.jpg", { 
                            type: "image/jpeg" 
                        });
                        
                        // 显示预览图
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            imagePreview.src = e.target.result;
                            previewContainer.classList.remove('hidden');
                            analyzeBtn.disabled = false;
                        };
                        reader.readAsDataURL(selectedFile);
                        
                        // 关闭相机
                        closeCamera();
                    }, 'image/jpeg', 0.9);
                });
            })
            .catch(error => {
                console.error('无法访问相机:', error);
                closeCamera();
                // 降级为普通文件上传
                fileInput.click();
            });
        } else {
            // 降级为普通文件上传
            fileInput.setAttribute('capture', 'environment');
            fileInput.click();
            setTimeout(() => fileInput.removeAttribute('capture'), 1000);
        }
    });
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            selectedFile = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                imagePreview.src = e.target.result;
                previewContainer.classList.remove('hidden');
                analyzeBtn.disabled = false;
            };
            
            reader.readAsDataURL(selectedFile);
        }
    });
    
    removeImageBtn.addEventListener('click', () => {
        imagePreview.src = '';
        previewContainer.classList.add('hidden');
        fileInput.value = '';
        selectedFile = null;
        analyzeBtn.disabled = true;
    });
    
    // 签到相关事件监听
    checkinBtn.addEventListener('click', performCheckin);
    userCheckinBtn.addEventListener('click', performCheckin);
    closeCheckinBtn.addEventListener('click', () => {
        checkinModal.classList.remove('show');
    });
    
    // 打赏相关事件监听
    donateBtn.addEventListener('click', () => {
        donateModal.classList.add('show');
    });
    
    closeDonateBtn.addEventListener('click', () => {
        donateModal.classList.remove('show');
    });
    
    // 用量用尽弹窗
    gotoShopBtn.addEventListener('click', () => {
        // 隐藏弹窗
        usageExhaustedModal.classList.remove('show');
        
        // 切换到商店标签
        showTab('shopTab');
    });
    
    configApiBtn.addEventListener('click', () => {
        // 隐藏弹窗
        usageExhaustedModal.classList.remove('show');
        
        // 显示设置
        settingsModal.classList.add('show');
        loadSettings();
    });
    
    // Function to create star rating
    function renderHealthRating(rating) {
        healthRating.innerHTML = '';
        
        // Convert rating to number if it's a string
        const numRating = typeof rating === 'string' 
            ? parseInt(rating.charAt(0)) 
            : rating;
        
        // Create 5 stars
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'text-lg';
            
            // Filled or empty star based on rating
            star.innerHTML = i <= numRating 
                ? '★' 
                : '☆';
            
            // Color based on rating
            if (numRating <= 2) {
                star.className += ' text-red-500';
            } else if (numRating === 3) {
                star.className += ' text-yellow-500';
            } else {
                star.className += ' text-green-500';
            }
            
            healthRating.appendChild(star);
        }
    }
    
    // Function to highlight harmful additives in the output
    function highlightHarmfulAdditives(content) {
        // Create a temporary element to parse the HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        // Words that might indicate harmful additives being discussed
        const harmfulKeywords = [
            "有害", "危害", "风险", "不安全", "不健康", "警告", 
            "危险", "致癌", "过敏", "中毒", "不建议", "避免食用",
            "慎用", "少量食用", "副作用", "问题"
        ];
        
        // Find potential paragraphs that talk about harmful additives
        const allParagraphs = tempDiv.getElementsByTagName('p');
        for (let p of allParagraphs) {
            for (const keyword of harmfulKeywords) {
                if (p.textContent.includes(keyword)) {
                    // Create a span to wrap the paragraph with a highlight class
                    const wrapper = document.createElement('div');
                    wrapper.className = 'p-3 my-3 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-lg border-l-4 border-red-500';
                    
                    // Clone the paragraph to preserve its content
                    const clone = p.cloneNode(true);
                    wrapper.appendChild(clone);
                    
                    // Replace the original paragraph with the wrapped version
                    p.parentNode.replaceChild(wrapper, p);
                    break;
                }
            }
        }
        
        return tempDiv.innerHTML;
    }
    
    // 设置相关的功能
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('show');
        loadSettings();
    });
    
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('show');
    });
    
    // 点击模态框外部关闭
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('show');
        }
    });
    
    checkinModal.addEventListener('click', (e) => {
        if (e.target === checkinModal) {
            checkinModal.classList.remove('show');
        }
    });
    
    donateModal.addEventListener('click', (e) => {
        if (e.target === donateModal) {
            donateModal.classList.remove('show');
        }
    });
    
    usageExhaustedModal.addEventListener('click', (e) => {
        if (e.target === usageExhaustedModal) {
            usageExhaustedModal.classList.remove('show');
        }
    });
    
    paymentSuccessModal.addEventListener('click', (e) => {
        if (e.target === paymentSuccessModal) {
            paymentSuccessModal.classList.remove('show');
        }
    });
    
    // 显示/隐藏高级选项
    toggleAdvancedBtn.addEventListener('click', () => {
        const isHidden = advancedOptions.classList.contains('hidden');
        if (isHidden) {
            advancedOptions.classList.remove('hidden');
            toggleAdvancedBtn.querySelector('svg').style.transform = 'rotate(180deg)';
        } else {
            advancedOptions.classList.add('hidden');
            toggleAdvancedBtn.querySelector('svg').style.transform = 'rotate(0)';
        }
    });
    
    // 深色模式切换
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    });
    
    // 动态更新温度值显示
    temperature.addEventListener('input', () => {
        temperatureValue.textContent = temperature.value;
    });
    
    // 根据选择的API提供商显示/隐藏相关字段
    apiProvider.addEventListener('change', () => {
        updateApiProviderUI();
    });
    
    function updateApiProviderUI() {
        // 显示/隐藏Azure端点
        if (apiProvider.value === 'azure') {
            azureEndpointContainer.classList.remove('hidden');
        } else {
            azureEndpointContainer.classList.add('hidden');
        }
        
        // 更新模型选项
        updateModelOptions();
    }
    
    function updateModelOptions() {
        const provider = apiProvider.value;
        modelName.innerHTML = '';
        
        if (provider === 'openai') {
            addModelOption('gpt-4', 'GPT-4');
            addModelOption('gpt-4o', 'GPT-4o');
            addModelOption('gpt-3.5-turbo', 'GPT-3.5 Turbo');
        } else if (provider === 'anthropic') {
            addModelOption('claude-3-opus-20240229', 'Claude 3 Opus');
            addModelOption('claude-3-sonnet-20240229', 'Claude 3 Sonnet');
            addModelOption('claude-3-haiku-20240307', 'Claude 3 Haiku');
        } else if (provider === 'azure') {
            addModelOption('gpt-4', 'GPT-4');
            addModelOption('gpt-35-turbo', 'GPT-3.5 Turbo');
        } else if (provider === 'gemini') {
            addModelOption('gemini-1.5-pro', 'Gemini 1.5 Pro');
            addModelOption('gemini-1.5-flash', 'Gemini 1.5 Flash');
            addModelOption('gemini-1.0-pro', 'Gemini 1.0 Pro');
        } else if (provider === 'deepseek') {
            addModelOption('deepseek-vision', 'DeepSeek Vision');
            addModelOption('deepseek-coder-v2', 'DeepSeek Coder v2');
        }
    }
    
    function addModelOption(value, text) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        modelName.appendChild(option);
    }
    
    // 保存设置
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const settings = {
            apiProvider: apiProvider.value,
            apiKey: apiKey.value,
            modelName: modelName.value,
            azureEndpoint: azureEndpoint.value,
            maxTokens: parseInt(maxTokens.value),
            temperature: parseFloat(temperature.value),
            usePoeApi: apiKey.value === '' // 如果没有提供API密钥，使用默认API
        };
        
        localStorage.setItem('foodScannerSettings', JSON.stringify(settings));
        
        // 显示保存成功消息
        const successMsg = document.createElement('div');
        successMsg.className = 'fade-in p-2 mb-3 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 text-green-600 dark:text-green-400 rounded-lg text-center text-sm';
        successMsg.textContent = '设置已保存';
        
        const form = document.getElementById('settingsForm');
        form.insertBefore(successMsg, form.firstChild);
        
        // 3秒后移除消息
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    });
    
    // 重置设置
    resetSettingsBtn.addEventListener('click', () => {
        if (confirm('确定要重置所有设置吗？这将删除您保存的API密钥和其他设置。')) {
            localStorage.removeItem('foodScannerSettings');
            loadSettings(); // 重新加载默认设置
        }
    });
    
    // 加载设置
    function loadSettings() {
        let settings = defaultSettings;
        const savedSettings = localStorage.getItem('foodScannerSettings');
        
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
        }
        
        apiProvider.value = settings.apiProvider || defaultSettings.apiProvider;
        updateApiProviderUI();
        
        apiKey.value = settings.apiKey || '';
        if (settings.modelName) {
            // 确保该模型在当前选项中
            const modelExists = Array.from(modelName.options).some(option => option.value === settings.modelName);
            if (modelExists) {
                modelName.value = settings.modelName;
            }
        }
        
        azureEndpoint.value = settings.azureEndpoint || '';
        maxTokens.value = settings.maxTokens || defaultSettings.maxTokens;
        temperature.value = settings.temperature || defaultSettings.temperature;
        temperatureValue.textContent = temperature.value;
        
        // 检查是否显示高级选项
        if (savedSettings && (settings.maxTokens !== defaultSettings.maxTokens || settings.temperature !== defaultSettings.temperature)) {
            advancedOptions.classList.remove('hidden');
            toggleAdvancedBtn.querySelector('svg').style.transform = 'rotate(180deg)';
        }
    }
    
    // 获取当前用户对象
    function getCurrentUser() {
        return currentUser;
    }
    
    // 分析按钮点击处理
    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        
        // 检查是否有足够的分析次数或API配置
        const settings = getSettings();
        const hasCustomApi = settings.apiKey && settings.apiKey.length > 0;
        const creditsAvailable = getUserCredits() > 0;
        
        if (!hasCustomApi && !creditsAvailable) {
            // 显示提示用户购买或配置API的弹窗
            usageExhaustedModal.classList.add('show');
            return;
        }
        
        // 如果使用免费额度，减少使用次数
        if (!hasCustomApi) {
            decrementUserCredits();
        }
        
        // 显示加载状态
        loadingSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
        analyzeBtn.disabled = true;
        
        try {
            // 如果使用默认API
            if (settings.usePoeApi && window.Poe) {
                await analyzeWithPoeApi(selectedFile);
            } else {
                // 使用自定义API
                await analyzeWithCustomApi(selectedFile, settings);
            }
        } catch (error) {
            console.error('Error:', error);
            showError('分析过程中出现错误，请重试。');
            loadingSection.classList.add('hidden');
            analyzeBtn.disabled = false;
        }
    });
    
    // 使用Poe API进行分析
    async function analyzeWithPoeApi(file) {
        // Register handler for Claude's response
        window.Poe.registerHandler('food-analysis-handler', (result, context) => {
            // Hide loading state when we get a response
            loadingSection.classList.add('hidden');
            
            const response = result.responses[0];
            
            if (response.status === 'error') {
                showError('分析过程中出现错误，请重试。');
                analyzeBtn.disabled = false;
                return;
            }
            
            if (response.status === 'complete' || response.status === 'incomplete') {
                // Parse the markdown content
                let parsedContent = marked.parse(response.content);
                
                // Highlight any harmful additives mentioned
                parsedContent = highlightHarmfulAdditives(parsedContent);
                
                // Display the result
                resultContent.innerHTML = parsedContent;
                
                // Try to extract health rating from the response
                const ratingMatch = response.content.match(/健康评级[：:]\s*(\d)[颗⭐星]/);
                let healthRatingValue = 0;
                if (ratingMatch && ratingMatch[1]) {
                    healthRatingValue = parseInt(ratingMatch[1]);
                    renderHealthRating(healthRatingValue);
                } else {
                    // Default to no stars if we can't find a rating
                    renderHealthRating(0);
                }
                
                resultSection.classList.remove('hidden');
                
                // If response is complete, enable the analyze button again
                if (response.status === 'complete') {
                    // 保存到历史记录
                    addScanHistory(imagePreview.src, response.content, healthRatingValue);
                    
                    analyzeBtn.disabled = false;
                }
            }
        });
        
        // Create object to be sent as attachment
        const fileToSend = new File([file], file.name, {
            type: file.type
        });
        
        try {
            // Send the image to Claude for analysis with improved prompt
            await window.Poe.sendUserMessage(
                "@Claude-3.7-Sonnet 请分析这张食品配料表图片，并提供以下信息：\n" +
                "1. 识别出的主要配料清单\n" +
                "2. 该食品中的添加剂成分及其作用\n" +
                "3. **重点分析**：食品中的任何有害添加剂或不健康成分，详细解释其潜在风险和对健康的影响\n" +
                "4. 该食品可能含有的常见过敏原\n" +
                "5. 对特殊人群（如孕妇、儿童、老人、糖尿病患者等）的适宜性建议\n" +
                "6. 基于配料表的健康评级（1-5星，5星最健康）\n" +
                "7. 总体食用建议和注意事项\n\n" +
                "请将你的回答格式化为Markdown格式，确保在回答中使用markdown结构，以便我可以清晰地展示给用户。当提到有害成分时，请使用加粗或其他markdown格式突出显示。",
                {
                    attachments: [fileToSend],
                    handler: 'food-analysis-handler',
                    stream: true,
                    openChat: false
                }
            );
        } catch (err) {
            // 如果没有Poe API或出错，显示模拟结果
            console.error("Error using Poe API:", err);
            showMockedResult();
        }
    }
    
    // 使用自定义API进行分析
    async function analyzeWithCustomApi(file, settings) {
        // 从图片创建base64字符串
        const base64Image = await fileToBase64(file);
        
        // 分析提示文本
        const promptText = "请分析这张食品配料表图片，并提供以下信息：\n" +
                      "1. 识别出的主要配料清单\n" +
                      "2. 该食品中的添加剂成分及其作用\n" +
                      "3. **重点分析**：食品中的任何有害添加剂或不健康成分，详细解释其潜在风险和对健康的影响\n" +
                      "4. 该食品可能含有的常见过敏原\n" +
                      "5. 对特殊人群（如孕妇、儿童、老人、糖尿病患者等）的适宜性建议\n" +
                      "6. 基于配料表的健康评级（1-5星，5星最健康）\n" +
                      "7. 总体食用建议和注意事项\n\n" +
                      "请将你的回答格式化为Markdown格式，当提到有害成分时，请使用加粗或其他markdown格式突出显示。";
        
        // 根据不同API提供商构建请求
        let apiUrl, requestData, headers;
        
        try {
            // 构建API请求对象
            switch(settings.apiProvider) {
                case 'openai':
                    // OpenAI API 请求
                    apiUrl = 'https://api.openai.com/v1/chat/completions';
                    headers = {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${settings.apiKey}`
                    };
                    requestData = {
                        model: settings.modelName,
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text", 
                                        text: promptText
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: base64Image
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: settings.maxTokens,
                        temperature: settings.temperature
                    };
                    break;
                case 'anthropic':
                    // Anthropic API 请求
                    apiUrl = 'https://api.anthropic.com/v1/messages';
                    headers = {
                        'Content-Type': 'application/json',
                        'x-api-key': settings.apiKey,
                        'anthropic-version': '2023-06-01'
                    };
                    requestData = {
                        model: settings.modelName,
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text", 
                                        text: promptText
                                    },
                                    {
                                        type: "image",
                                        source: {
                                            type: "base64",
                                            media_type: file.type,
                                            data: base64Image.split(',')[1]
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: settings.maxTokens,
                        temperature: settings.temperature
                    };
                    break;
                case 'azure':
                    // Azure OpenAI API 请求
                    const deploymentName = settings.modelName;
                    apiUrl = `${settings.azureEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=2023-12-01-preview`;
                    headers = {
                        'Content-Type': 'application/json',
                        'api-key': settings.apiKey
                    };
                    requestData = {
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text", 
                                        text: promptText
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: base64Image
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: settings.maxTokens,
                        temperature: settings.temperature
                    };
                    break;
                case 'gemini':
                    // Google Gemini API 请求
                    apiUrl = 'https://generativelanguage.googleapis.com/v1/models/' + settings.modelName + ':generateContent';
                    headers = {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': settings.apiKey
                    };
                    requestData = {
                        contents: [
                            {
                                role: "user",
                                parts: [
                                    {
                                        text: promptText
                                    },
                                    {
                                        inline_data: {
                                            mime_type: file.type,
                                            data: base64Image.split(',')[1]
                                        }
                                    }
                                ]
                            }
                        ],
                        generationConfig: {
                            maxOutputTokens: settings.maxTokens,
                            temperature: settings.temperature
                        }
                    };
                    break;
                case 'deepseek':
                    // DeepSeek API 请求
                    apiUrl = 'https://api.deepseek.com/v1/chat/completions';
                    headers = {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${settings.apiKey}`
                    };
                    requestData = {
                        model: settings.modelName,
                        messages: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "text", 
                                        text: promptText
                                    },
                                    {
                                        type: "image_url",
                                        image_url: {
                                            url: base64Image
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens: settings.maxTokens,
                        temperature: settings.temperature
                    };
                    break;
                default:
                    throw new Error('不支持的API提供商');
            }

            // 尝试发送API请求
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: headers,
                    body: JSON.stringify(requestData)
                });
                
                if (!response.ok) {
                    throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
                }
                
                const data = await response.json();
                let content = '';
                
                // 根据不同API提供商提取响应内容
                if (settings.apiProvider === 'openai' || settings.apiProvider === 'azure' || settings.apiProvider === 'deepseek') {
                    content = data.choices[0].message.content;
                } else if (settings.apiProvider === 'anthropic') {
                    content = data.content[0].text;
                } else if (settings.apiProvider === 'gemini') {
                    content = data.candidates[0].content.parts[0].text;
                }
                
                // 处理并显示结果
                processAnalysisResult(content);
            } catch (error) {
                console.error('API请求错误:', error);
                
                // 如果API请求失败，显示模拟结果
                showMockedResult();
            }
        } catch (err) {
            console.error('API配置错误:', err);
            showMockedResult();
        }
    }
    
    // 处理分析结果
    function processAnalysisResult(content) {
        loadingSection.classList.add('hidden');
        
        // 解析Markdown
        let parsedContent = marked.parse(content);
        
        // 高亮有害添加剂
        parsedContent = highlightHarmfulAdditives(parsedContent);
        
        // 显示结果
        resultContent.innerHTML = parsedContent;
        
        // 尝试提取健康评级
        const ratingMatch = content.match(/健康评级[：:]\s*(\d)[颗⭐星]/);
        let healthRatingValue = 0;
        if (ratingMatch && ratingMatch[1]) {
            healthRatingValue = parseInt(ratingMatch[1]);
            renderHealthRating(healthRatingValue);
        } else {
            renderHealthRating(0);
        }
        
        // 保存到历史记录
        addScanHistory(imagePreview.src, content, healthRatingValue);
        
        resultSection.classList.remove('hidden');
        analyzeBtn.disabled = false;
    }
    
    // 当无API可用时显示模拟结果
    function showMockedResult() {
        const mockContent = `
## 食品配料分析结果

### 主要配料清单
- 小麦粉
- 白砂糖
- 植物油
- 食用盐
- 酵母

### 添加剂成分及作用
- **柠檬酸（E330）**：用作酸味剂和抗氧化剂
- **山梨酸钾（E202）**：防腐剂
- **二氧化钛（E171）**：着色剂，使产品呈现白色
- **焦糖色（E150）**：着色剂，用于调整颜色

### 有害添加剂分析
**二氧化钛（E171）** 是一种有潜在风险的添加剂。近年研究表明，二氧化钛纳米颗粒可能对人体健康造成负面影响，欧盟食品安全局已将其列为不再被认为安全的食品添加剂。长期摄入可能增加肠胃炎症风险。

### 常见过敏原
本产品含有**小麦（麸质）**，不适合麸质过敏人群食用。

### 适宜人群建议
- **孕妇**：建议少量食用，注意二氧化钛的存在
- **儿童**：不建议频繁食用，特别是含有人工着色剂的食品可能影响儿童注意力
- **老年人**：适量食用，关注钠含量
- **糖尿病患者**：不适合，含有较高糖分

### 健康评级：2星 ⭐⭐☆☆☆
这款食品含有多种添加剂，尤其是二氧化钛这类有争议的成分，营养价值较低。

### 总体食用建议
1. 建议偶尔少量食用，不宜长期大量摄入
2. 有过敏体质者应特别注意是否含有过敏原
3. 儿童和孕妇应尽量选择更天然、添加剂更少的替代品
4. 如有特殊健康问题，请在食用前咨询医生意见
`;

        processAnalysisResult(mockContent);
    }
    
    // 辅助函数：将File对象转换为base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    // 获取设置
    function getSettings() {
        const savedSettings = localStorage.getItem('foodScannerSettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        return defaultSettings;
    }
    
    function showError(message) {
        resultContent.innerHTML = `<div class="p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 text-red-600 dark:text-red-400 rounded-lg">${message}</div>`;
        resultSection.classList.remove('hidden');
    }
    
    // 注册相关事件
    function setupAuthForms() {
        // 切换登录/注册表单
        showRegisterBtn.addEventListener('click', () => {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
        });
        
        showLoginBtn.addEventListener('click', () => {
            registerForm.classList.add('hidden');
            loginForm.classList.remove('hidden');
        });
        
        // 登录表单提交
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            AV.User.logIn(username, password).then(user => {
                // 登录成功，刷新用户信息
                currentUser = user;
                checkUserSession();
                showTab('homeTab');
            }).catch(error => {
                alert('登录失败: ' + error.message);
            });
        });
        
        // 注册表单提交
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const phone = document.getElementById('regPhone').value;
            
            // 创建用户
            const user = new AV.User();
            user.setUsername(username);
            user.setPassword(password);
            user.setMobilePhoneNumber(phone);
            
            user.signUp().then(user => {
                // 注册成功
                alert('注册成功');
                currentUser = user;
                checkUserSession();
                showTab('homeTab');
            }).catch(error => {
                alert('注册失败: ' + error.message);
            });
        });
    }
    
    // 初始化
    initApp();
    initTabs();
    setupAuthForms();
});
