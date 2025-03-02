// 注册 Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker registered'))
            .catch(err => console.log('Service Worker not registered', err));
    });
}

// LeanCloud 初始化 - 使用您的信息
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
    
    // Tab elements
    const homeTab = document.getElementById('homeTab');
    const historyTab = document.getElementById('historyTab');
    const userTab = document.getElementById('userTab');
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    
    // Settings elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const apiConfigForm = document.getElementById('apiConfigForm');
    const apiProvider = document.getElementById('apiProvider');
    const apiKey = document.getElementById('apiKey');
    const modelName = document.getElementById('modelName');
    const azureSettings = document.getElementById('azureSettings');
    const deepseekSettings = document.getElementById('deepseekSettings');
    const azureEndpoint = document.getElementById('azureEndpoint');
    const toggleAdvancedBtn = document.getElementById('toggleAdvancedBtn');
    const advancedOptions = document.getElementById('advancedOptions');
    const maxTokens = document.getElementById('maxTokens');
    const temperature = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperatureValue');
    const resetApiSettingsBtn = document.getElementById('resetApiSettingsBtn');
    
    // Usage exhausted elements
    const usageExhaustedModal = document.getElementById('usageExhaustedModal');
    const configApiBtn = document.getElementById('configApiBtn');
    const dailyCheckinBtn = document.getElementById('dailyCheckinBtn');
    
    // Guide elements
    const firstTimeGuide = document.getElementById('firstTimeGuide');
    const closeGuideBtn = document.getElementById('closeGuideBtn');
    
    // History elements
    const backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
    const historyList = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const clearHistoryConfirmModal = document.getElementById('clearHistoryConfirmModal');
    const cancelClearHistoryBtn = document.getElementById('cancelClearHistoryBtn');
    const confirmClearHistoryBtn = document.getElementById('confirmClearHistoryBtn');
    const userHistoryBtn = document.getElementById('userHistoryBtn');
    
    // User profile elements
    const userRemainingScans = document.getElementById('userRemainingScans');
    const totalScans = document.getElementById('totalScans');
    
    // Checkin elements
    const userCheckinBtn = document.getElementById('userCheckinBtn');
    const checkinStatus = document.getElementById('checkinStatus');
    const checkinModal = document.getElementById('checkinModal');
    const closeCheckinBtn = document.getElementById('closeCheckinBtn');
    
    // About button
    const aboutBtn = document.getElementById('aboutBtn');
    const settingsAboutBtn = document.getElementById('settingsAboutBtn');
    
    // Loading element
    const globalLoading = document.getElementById('globalLoading');
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    let selectedFile = null;
    
    // 内置API密钥（替换为您的实际API密钥）
    // 注意：实际应用中，最好从服务器获取API密钥，而不是硬编码
    const BUILT_IN_API = {
        provider: 'openai',
        key: 'sk-your-openai-api-key-here', // 替换为您的实际API密钥
        model: 'gpt-4o'
    };
    
    // 默认设置
    const defaultApiSettings = {
        apiProvider: 'openai',
        apiKey: '',
        modelName: 'gpt-4o',
        azureEndpoint: '',
        maxTokens: 2000,
        temperature: 0.7
    };
    
    // 初始化应用
    function initApp() {
        loadUserData();
        checkDarkModePreference();
        checkFirstTimeUser();
        checkDailyCheckin(); // 检查签到状态
        updateCheckinButton(); // 更新签到按钮状态
        updateUserStats(); // 更新用户统计信息
    }
    
    // 检查是否首次使用
    function checkFirstTimeUser() {
        const isFirstTime = localStorage.getItem('hasSeenGuide') !== 'true';
        if (isFirstTime) {
            firstTimeGuide.classList.remove('hidden');
            localStorage.setItem('hasSeenGuide', 'true');
        }
    }
    
    // 关闭使用指南
    if (closeGuideBtn) {
        closeGuideBtn.addEventListener('click', () => {
            firstTimeGuide.classList.add('hidden');
        });
    }
    
    // 显示或隐藏全局加载状态
    function showLoading() {
        if (globalLoading) globalLoading.classList.remove('hidden');
    }
    
    function hideLoading() {
        if (globalLoading) globalLoading.classList.add('hidden');
    }
    
    // 加载用户数据
    function loadUserData() {
        // 从本地存储获取用户数据
        const userData = localStorage.getItem('userData');
        let userObj;
        
        if (userData) {
            userObj = JSON.parse(userData);
        } else {
            // 初始化新用户数据
            userObj = {
                usageCount: 10, // 每个新用户有10次免费使用机会
                history: [],
                lastCheckin: null, // 上次签到时间
                totalScansCount: 0, // 累计扫描次数
                checkinDays: 0 // 签到天数
            };
            saveUserData(userObj);
        }
        
        // 更新显示
        updateUsageCounter(userObj.usageCount);
        
        return userObj;
    }
    
    // 更新用户统计信息
    function updateUserStats() {
        const userData = loadUserData();
        
        // 更新剩余次数
        if (userRemainingScans) {
            userRemainingScans.textContent = userData.usageCount;
        }
        
        // 更新累计扫描次数
        if (totalScans) {
            totalScans.textContent = userData.totalScansCount || 0;
        }
        
        // 更新签到圆点
        renderCheckinCircles(userData.checkinDays || 0);
    }
    
    // 保存用户数据
    function saveUserData(userObj) {
        localStorage.setItem('userData', JSON.stringify(userObj));
    }
    
    // 更新使用次数显示
    function updateUsageCounter(count) {
        if (usageCounter) {
            usageCounter.textContent = `剩余次数: ${count}`;
        }
        
        if (userRemainingScans) {
            userRemainingScans.textContent = count;
        }
    }
    
    // 减少使用次数
    function decrementUsageCount() {
        const userData = loadUserData();
        
        if (userData.usageCount <= 0) {
            return false;
        }
        
        userData.usageCount -= 1;
        userData.totalScansCount = (userData.totalScansCount || 0) + 1;
        saveUserData(userData);
        updateUsageCounter(userData.usageCount);
        updateUserStats();
        return true;
    }
    
    // 增加使用次数
    function incrementUsageCount(amount = 1) {
        const userData = loadUserData();
        userData.usageCount += amount;
        saveUserData(userData);
        updateUsageCounter(userData.usageCount);
        updateUserStats();
        return true;
    }
    
    // 获取当前可用次数
    function getAvailableUsageCount() {
        const userData = loadUserData();
        return userData.usageCount;
    }
    
    // 检查是否可以签到（每天只能签到一次）
    function canCheckin() {
        const userData = loadUserData();
        const now = new Date();
        const today = now.toDateString();
        
        if (!userData.lastCheckin) {
            return true;
        }
        
        const lastCheckinDate = new Date(userData.lastCheckin);
        const lastCheckinDay = lastCheckinDate.toDateString();
        
        return lastCheckinDay !== today;
    }
    
    // 执行签到操作
    function performCheckin() {
        if (!canCheckin()) {
            alert('今天已经签到过了，明天再来吧！');
            return;
        }
        
        const userData = loadUserData();
        const now = new Date();
        const today = now.toDateString();
        
        // 检查是否连续签到
        let isConsecutive = false;
        if (userData.lastCheckin) {
            const lastCheckinDate = new Date(userData.lastCheckin);
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastCheckinDate.toDateString() === yesterday.toDateString()) {
                isConsecutive = true;
            }
        }
        
        userData.lastCheckin = now.toISOString();
        
        // 更新签到天数
        if (isConsecutive) {
            userData.checkinDays = (userData.checkinDays || 0) + 1;
        } else {
            userData.checkinDays = 1;
        }
        
        // 计算签到奖励
        let reward = 1; // 基础奖励1次
        
        // 连续签到7天额外奖励
        if (userData.checkinDays === 7) {
            reward += 2;
            userData.checkinDays = 0; // 重置签到周期
        }
        
        // 增加使用次数
        userData.usageCount += reward;
        saveUserData(userData);
        
        // 更新UI
        updateUsageCounter(userData.usageCount);
        updateCheckinButton();
        updateUserStats();
        
        // 显示签到成功弹窗
        checkinModal.classList.add('show');
    }
    
    // 更新签到按钮状态
    function updateCheckinButton() {
        if (!canCheckin()) {
            if (userCheckinBtn) {
                userCheckinBtn.disabled = true;
                userCheckinBtn.classList.add('opacity-50');
                userCheckinBtn.classList.add('cursor-not-allowed');
            }
            if (checkinStatus) {
                checkinStatus.textContent = '今日已签到';
                checkinStatus.classList.remove('bg-yellow-100', 'text-yellow-600');
                checkinStatus.classList.add('bg-green-100', 'text-green-600');
            }
        } else {
            if (userCheckinBtn) {
                userCheckinBtn.disabled = false;
                userCheckinBtn.classList.remove('opacity-50');
                userCheckinBtn.classList.remove('cursor-not-allowed');
            }
            if (checkinStatus) {
                checkinStatus.textContent = '今日未签到';
                checkinStatus.classList.remove('bg-green-100', 'text-green-600');
                checkinStatus.classList.add('bg-yellow-100', 'text-yellow-600');
            }
        }
    }
    
    // 检查每日签到状态
    function checkDailyCheckin() {
        updateCheckinButton();
    }
    
    // 渲染签到圆点
    function renderCheckinCircles(checkinDays) {
        const circlesContainer = document.querySelector('.checkin-circles');
        if (!circlesContainer) return;
        
        circlesContainer.innerHTML = '';
        
        // 创建7个圆点代表一周
        for (let i = 1; i <= 7; i++) {
            const circle = document.createElement('div');
            
            if (i <= checkinDays) {
                // 已签到
                circle.className = 'w-7 h-7 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600 dark:text-green-400';
                circle.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                `;
            } else {
                // 未签到
                circle.className = 'w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 text-xs';
                circle.textContent = i;
            }
            
            circlesContainer.appendChild(circle);
        }
    }
    
    // 添加扫描历史
    function addScanHistory(imageData, result, healthRating) {
        const userData = loadUserData();
        
        const historyItem = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            imageData: imageData,
            result: result,
            healthRating: healthRating
        };
        
        // 限制历史记录数量，防止localStorage过大
        userData.history = userData.history || [];
        if (userData.history.length >= 20) {
            userData.history.shift(); // 移除最旧的记录
        }
        
        userData.history.push(historyItem);
        saveUserData(userData);
    }
    
    // 删除单条历史记录
    function deleteHistoryItem(id) {
        const userData = loadUserData();
        userData.history = userData.history.filter(item => item.id !== id);
        saveUserData(userData);
        loadScanHistoryData(); // 重新加载历史记录
    }
    
    // 清空所有历史记录
    function clearAllHistory() {
        const userData = loadUserData();
        userData.history = [];
        saveUserData(userData);
        loadScanHistoryData(); // 重新加载历史记录
    }
    
    // 加载扫描历史
    function loadScanHistory() {
        const userData = loadUserData();
        return userData.history || [];
    }
    
    // 检查深色模式偏好
    function checkDarkModePreference() {
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedMode = localStorage.getItem('darkMode');
        
        if (savedMode) {
            const isDarkMode = savedMode === 'dark';
            darkModeToggle.checked = isDarkMode;
            
            if (isDarkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        } else {
            darkModeToggle.checked = prefersDarkMode;
            
            if (prefersDarkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }
    
    // 初始化标签页切换和按钮事件
    function initTabs() {
        // 设置底部导航点击事件
        bottomNavItems.forEach(item => {
            item.addEventListener('click', () => {
                const tabName = item.getAttribute('data-tab');
                if (tabName === 'historyTab') {
                    // 如果是点击历史记录，先加载数据
                    loadScanHistoryData();
                } else if (tabName === 'userTab') {
                    // 如果是点击用户页面，更新用户统计信息
                    updateUserStats();
                }
                showTab(tabName);
            });
        });
        
        // 用户页面中的历史记录按钮
        if (userHistoryBtn) {
            userHistoryBtn.addEventListener('click', () => {
                loadScanHistoryData();
                showTab('historyTab');
            });
        }
        
        // 返回按钮
        if (backFromHistoryBtn) {
            backFromHistoryBtn.addEventListener('click', () => {
                showTab('homeTab');
            });
        }
        
        // 清空历史记录按钮
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                clearHistoryConfirmModal.classList.add('show');
            });
        }
        
        // 清空历史记录确认按钮
        if (confirmClearHistoryBtn) {
            confirmClearHistoryBtn.addEventListener('click', () => {
                clearAllHistory();
                clearHistoryConfirmModal.classList.remove('show');
            });
        }
        
        // 取消清空历史记录按钮
        if (cancelClearHistoryBtn) {
            cancelClearHistoryBtn.addEventListener('click', () => {
                clearHistoryConfirmModal.classList.remove('show');
            });
        }
        
        // 关于我们按钮
        if (aboutBtn) {
            aboutBtn.addEventListener('click', () => {
                alert('食安智查 1.0\n\n一款帮助您识别食品添加剂和安全风险的工具\n\n© 2023 All Rights Reserved');
            });
        }
        
        if (settingsAboutBtn) {
            settingsAboutBtn.addEventListener('click', () => {
                alert('食安智查 1.0\n\n一款帮助您识别食品添加剂和安全风险的工具\n\n© 2023 All Rights Reserved');
                settingsModal.classList.remove('show');
            });
        }
        
        // 签到相关事件
        if (userCheckinBtn) {
            userCheckinBtn.addEventListener('click', performCheckin);
        }
        
        if (closeCheckinBtn) {
            closeCheckinBtn.addEventListener('click', () => {
                checkinModal.classList.remove('show');
            });
        }
        
        if (dailyCheckinBtn) {
            dailyCheckinBtn.addEventListener('click', () => {
                usageExhaustedModal.classList.remove('show');
                performCheckin();
            });
        }
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
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.remove('hidden');
        }
    }
    
    // 隐藏所有标签页
    function hideAllTabs() {
        const allTabs = document.querySelectorAll('[id$="Tab"]');
        allTabs.forEach(tab => {
            if (tab) tab.classList.add('hidden');
        });
    }
    
    // 加载历史记录数据
    function loadScanHistoryData() {
        historyList.innerHTML = '<div class="p-4 text-center text-gray-500">正在加载历史记录...</div>';
        
        const records = loadScanHistory();
        
        if (!records || records.length === 0) {
            historyList.innerHTML = '<div class="p-4 text-center text-gray-500">暂无历史记录</div>';
            return;
        }
        
        historyList.innerHTML = '';
        
        // 按时间倒序排序
        records.sort((a, b) => new Date(b.date) - new Date(a.date));
        
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
            historyItem.className = 'p-4 border-b border-gray-200 dark:border-gray-700 relative';
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
                <div class="flex justify-between items-center">
                    <button class="view-history-btn text-primary-color text-sm" data-id="${record.id}">查看详情</button>
                    <button class="delete-history-btn text-red-500 text-sm" data-id="${record.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
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
        
        // 添加删除事件
        document.querySelectorAll('.delete-history-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const recordId = btn.getAttribute('data-id');
                if (confirm('确定要删除这条记录吗？')) {
                    deleteHistoryItem(recordId);
                }
            });
        });
    }
    
    // 查看历史记录详情
    function viewHistoryDetail(recordId) {
        const userData = loadUserData();
        const record = userData.history.find(item => item.id === recordId);
        
        if (record) {
            displayHistoryDetail(record);
        }
    }
    
    // 显示历史记录详情
    function displayHistoryDetail(record) {
        // 切换到主页并显示结果
        showTab('homeTab');
        
        // 显示图片预览
        imagePreview.src = record.imageData;
        previewContainer.classList.remove('hidden');
        
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
        loadApiSettings();
    });
    
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('show');
    });
    
    // API设置事件
    apiProvider.addEventListener('change', () => {
        updateApiSettings();
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
    
    usageExhaustedModal.addEventListener('click', (e) => {
        if (e.target === usageExhaustedModal) {
            usageExhaustedModal.classList.remove('show');
        }
    });
    
    clearHistoryConfirmModal.addEventListener('click', (e) => {
        if (e.target === clearHistoryConfirmModal) {
            clearHistoryConfirmModal.classList.remove('show');
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
            localStorage.setItem('darkMode', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('darkMode', 'light');
        }
    });
    
    // 动态更新温度值显示
    temperature.addEventListener('input', () => {
        temperatureValue.textContent = temperature.value;
    });
    
    // 用量用尽相关
    configApiBtn.addEventListener('click', () => {
        usageExhaustedModal.classList.remove('show');
        settingsModal.classList.add('show');
        loadApiSettings();
    });
    
    // 更新API设置UI
    function updateApiSettings() {
        // 隐藏所有特殊设置
        azureSettings.classList.add('hidden');
        deepseekSettings.classList.add('hidden');
        
        // 根据提供商显示特殊设置
        if (apiProvider.value === 'azure') {
            azureSettings.classList.remove('hidden');
        } else if (apiProvider.value === 'deepseek') {
            deepseekSettings.classList.remove('hidden');
        }
        
        // 更新模型选项
        updateModelOptions();
    }
    
    // 根据API提供商更新模型选项
    function updateModelOptions() {
        modelName.innerHTML = ''; // 清空现有选项
        
        switch(apiProvider.value) {
            case 'openai':
                addModelOption('gpt-4o', 'GPT-4o');
                addModelOption('gpt-4', 'GPT-4');
                addModelOption('gpt-3.5-turbo', 'GPT-3.5 Turbo');
                break;
            case 'anthropic':
                addModelOption('claude-3-opus', 'Claude 3 Opus');
                addModelOption('claude-3-sonnet', 'Claude 3 Sonnet');
                addModelOption('claude-3-haiku', 'Claude 3 Haiku');
                break;
            case 'gemini':
                addModelOption('gemini-1.5-pro', 'Gemini 1.5 Pro');
                addModelOption('gemini-1.5-flash', 'Gemini 1.5 Flash');
                break;
            case 'azure':
                addModelOption('gpt-4', 'GPT-4');
                addModelOption('gpt-4o', 'GPT-4o');
                addModelOption('gpt-35-turbo', 'GPT-3.5 Turbo');
                break;
            case 'deepseek':
                addModelOption('deepseek-vision', 'DeepSeek Vision');
                addModelOption('deepseek-chat', 'DeepSeek Chat');
                break;
        }
    }
    
    // 添加模型选项
    function addModelOption(value, text) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = text;
        modelName.appendChild(option);
    }
    
    // 加载API设置
    function loadApiSettings() {
        const savedSettings = localStorage.getItem('apiSettings');
        let settings = defaultApiSettings;
        
        if (savedSettings) {
            settings = JSON.parse(savedSettings);
        }
        
        // 设置表单值
        apiProvider.value = settings.apiProvider || defaultApiSettings.apiProvider;
        apiKey.value = settings.apiKey || '';
        
        // 更新UI
        updateApiSettings();
        
        // 尝试设置模型（可能需要等待选项加载）
        setTimeout(() => {
            try {
                modelName.value = settings.modelName || defaultApiSettings.modelName;
            } catch (e) {
                console.log('无法设置模型名称，使用默认值');
            }
        }, 100);
        
        azureEndpoint.value = settings.azureEndpoint || '';
        maxTokens.value = settings.maxTokens || defaultApiSettings.maxTokens;
        temperature.value = settings.temperature || defaultApiSettings.temperature;
        temperatureValue.textContent = temperature.value;
    }
    
    // 保存API设置
    apiConfigForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const settings = {
            apiProvider: apiProvider.value,
            apiKey: apiKey.value,
            modelName: modelName.value,
            azureEndpoint: azureEndpoint.value,
            maxTokens: parseInt(maxTokens.value),
            temperature: parseFloat(temperature.value)
        };
        
        localStorage.setItem('apiSettings', JSON.stringify(settings));
        showSuccessMessage(apiConfigForm, 'API设置已保存');
    });
    
    // 显示成功消息
    function showSuccessMessage(container, message) {
        const successMsg = document.createElement('div');
        successMsg.className = 'fade-in p-2 mb-3 bg-green-50 dark:bg-green-900 dark:bg-opacity-20 text-green-600 dark:text-green-400 rounded-lg text-center text-sm';
        successMsg.textContent = message;
        
        // 如果已经有成功消息，先删除
        const existingMsg = container.querySelector('.fade-in');
        if (existingMsg) {
            existingMsg.remove();
        }
        
        container.insertBefore(successMsg, container.firstChild);
        
        // 3秒后移除消息
        setTimeout(() => {
            successMsg.remove();
        }, 3000);
    }
    
    // 重置API设置
    resetApiSettingsBtn.addEventListener('click', () => {
        if (confirm('确定要重置API设置吗？所有自定义设置将丢失。')) {
            localStorage.removeItem('apiSettings');
            loadApiSettings();
        }
    });
    
    // 获取用户API设置
    function getUserApiSettings() {
        const savedSettings = localStorage.getItem('apiSettings');
        if (savedSettings) {
            return JSON.parse(savedSettings);
        }
        return null;
    }
    
    // 分析按钮点击处理
    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        
        // 检查是否有足够的分析次数或API配置
        const userApiSettings = getUserApiSettings();
        const hasUserApi = userApiSettings && userApiSettings.apiKey && userApiSettings.apiKey.length > 0;
        const remainingUsage = getAvailableUsageCount();
        
        // 如果没有用户API且次数用完
        if (!hasUserApi && remainingUsage <= 0) {
            // 显示提示用户次数用完的弹窗
            usageExhaustedModal.classList.add('show');
            return;
        }
        
        // 如果使用的是免费次数，减少计数
        if (!hasUserApi) {
            decrementUsageCount();
        }
        
        // 显示加载状态
        loadingSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
        analyzeBtn.disabled = true;
        
        try {
            // 优先使用用户配置的API
            if (hasUserApi) {
                await analyzeWithCustomApi(selectedFile, userApiSettings);
            }
            // 否则使用内置API
            else if (window.Poe) {
                await analyzeWithPoeApi(selectedFile);
            }
            // 如果上述方法都不可用，则使用内置的OpenAI API
            else {
                await analyzeWithBuiltInApi(selectedFile);
            }
        } catch (error) {
            console.error('分析错误:', error);
            showError('分析过程中出现错误：' + (error.message || '未知错误'));
            loadingSection.classList.add('hidden');
            analyzeBtn.disabled = false;
        }
    });
    
    // 使用内置的API进行分析
    async function analyzeWithBuiltInApi(file) {
        // 使用预设的API密钥
        const settings = {
            apiProvider: BUILT_IN_API.provider,
            apiKey: BUILT_IN_API.key,
            modelName: BUILT_IN_API.model,
            temperature: 0.7,
            maxTokens: 2000
        };
        
        // 使用自定义API进行分析
        return analyzeWithCustomApi(file, settings);
    }
    
    // 使用Poe API进行分析
    async function analyzeWithPoeApi(file) {
        // Register handler for response
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
            console.error("Error using Poe API:", err);
            throw new Error("Poe API调用失败: " + err.message);
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
                        max_tokens: settings.maxTokens || 2000,
                        temperature: settings.temperature || 0.7
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
                        max_tokens: settings.maxTokens || 2000,
                        temperature: settings.temperature || 0.7
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
                            maxOutputTokens: settings.maxTokens || 2000,
                            temperature: settings.temperature || 0.7
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
                        max_tokens: settings.maxTokens || 2000,
                        temperature: settings.temperature || 0.7
                    };
                    break;
                case 'azure':
                    // Azure OpenAI API 请求
                    const azureEndpoint = settings.azureEndpoint.endsWith('/') ? 
                        settings.azureEndpoint.slice(0, -1) : settings.azureEndpoint;
                    
                    apiUrl = `${azureEndpoint}/openai/deployments/${settings.modelName}/chat/completions?api-version=2023-12-01-preview`;
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
                        max_tokens: settings.maxTokens || 2000,
                        temperature: settings.temperature || 0.7
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
                
                // 如果API请求失败，尝试使用Poe API
                if (window.Poe) {
                    console.log('尝试使用Poe API作为备选...');
                    await analyzeWithPoeApi(file);
                } else {
                    throw new Error(`API请求错误: ${error.message}`);
                }
            }
        } catch (err) {
            console.error('API配置错误:', err);
            throw new Error(`API配置错误: ${err.message}`);
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
    
    // 辅助函数：将File对象转换为base64
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }
    
    // 显示错误信息
    function showError(message) {
        loadingSection.classList.add('hidden');
        resultContent.innerHTML = `
            <div class="p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 text-red-600 dark:text-red-400 rounded-lg">
                <h3 class="font-semibold mb-2">分析失败</h3>
                <p>${message}</p>
                <p class="mt-2 text-sm">您可以尝试：</p>
                <ul class="list-disc ml-5 mt-1 text-sm">
                    <li>检查您的网络连接</li>
                    <li>确保上传的是清晰的配料表图片</li>
                    <li>在设置中配置API密钥</li>
                    <li>在"我的"页面签到获取更多分析次数</li>
                </ul>
            </div>
        `;
        resultSection.classList.remove('hidden');
        analyzeBtn.disabled = false;
    }
    
    // 初始化
    initApp();
    initTabs();
});
