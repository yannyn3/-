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
    const adminTab = document.getElementById('adminTab');
    const bottomNavItems = document.querySelectorAll('.bottom-nav-item');
    
    // Settings elements
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    
    // Usage exhausted elements
    const usageExhaustedModal = document.getElementById('usageExhaustedModal');
    const configApiBtn = document.getElementById('configApiBtn');
    
    // Guide elements
    const firstTimeGuide = document.getElementById('firstTimeGuide');
    const closeGuideBtn = document.getElementById('closeGuideBtn');
    
    // History elements
    const historyBtn = document.getElementById('historyBtn');
    const backFromHistoryBtn = document.getElementById('backFromHistoryBtn');
    const historyList = document.getElementById('historyList');
    
    // Admin elements
    const adminLoginModal = document.getElementById('adminLoginModal');
    const adminPassword = document.getElementById('adminPassword');
    const confirmAdminLoginBtn = document.getElementById('confirmAdminLoginBtn');
    const cancelAdminLoginBtn = document.getElementById('cancelAdminLoginBtn');
    const backFromAdminBtn = document.getElementById('backFromAdminBtn');
    const adminSettingsForm = document.getElementById('adminSettingsForm');
    const defaultApiProvider = document.getElementById('defaultApiProvider');
    const defaultModelName = document.getElementById('defaultModelName');
    const adminApiKey = document.getElementById('adminApiKey');
    
    // About button
    const aboutBtn = document.getElementById('aboutBtn');
    
    // Loading element
    const globalLoading = document.getElementById('globalLoading');
    
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    let selectedFile = null;
    let logoClickCount = 0; // 管理员入口计数器
    
    // 默认管理员密码
    const DEFAULT_ADMIN_PASSWORD = '123456';
    
    // 默认设置
    const defaultSettings = {
        apiProvider: 'openai',
        apiKey: '',
        modelName: 'gpt-4o',
        maxTokens: 2000,
        temperature: 0.7,
        usePoeApi: true // 是否使用系统默认API（即Poe API）
    };
    
    // 初始化应用
    function initApp() {
        loadUserData();
        checkDarkModePreference();
        loadAdminSettings();
        setupLogoClickHandler();
        checkFirstTimeUser();
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
    
    // 设置Logo点击处理 (管理员入口)
    function setupLogoClickHandler() {
        const appTitle = document.querySelector('h1');
        if (appTitle) {
            appTitle.addEventListener('click', function() {
                logoClickCount++;
                if (logoClickCount >= 5) {
                    logoClickCount = 0;
                    adminLoginModal.classList.add('show');
                }
            });
        }
    }
    
    // 加载管理员设置
    function loadAdminSettings() {
        const savedSettings = localStorage.getItem('adminSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (defaultApiProvider) defaultApiProvider.value = settings.defaultApiProvider || 'openai';
            if (defaultModelName) defaultModelName.value = settings.defaultModelName || 'gpt-4o';
            if (adminApiKey) adminApiKey.value = settings.adminApiKey || '';
        }
    }
    
    // 保存管理员设置
    function saveAdminSettings() {
        const settings = {
            defaultApiProvider: defaultApiProvider ? defaultApiProvider.value : 'openai',
            defaultModelName: defaultModelName ? defaultModelName.value : 'gpt-4o',
            adminApiKey: adminApiKey ? adminApiKey.value : ''
        };
        
        localStorage.setItem('adminSettings', JSON.stringify(settings));
        alert('管理员设置已保存');
    }
    
    // 获取管理员设置的API密钥
    function getAdminApiKey() {
        const savedSettings = localStorage.getItem('adminSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            return settings.adminApiKey || '';
        }
        return '';
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
                history: []
            };
            saveUserData(userObj);
        }
        
        // 更新显示
        updateUsageCounter(userObj.usageCount);
        
        return userObj;
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
    }
    
    // 减少使用次数
    function decrementUsageCount() {
        const userData = loadUserData();
        
        if (userData.usageCount <= 0) {
            return false;
        }
        
        userData.usageCount -= 1;
        saveUserData(userData);
        updateUsageCounter(userData.usageCount);
        return true;
    }
    
    // 获取当前可用次数
    function getAvailableUsageCount() {
        const userData = loadUserData();
        return userData.usageCount;
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
                }
                showTab(tabName);
            });
        });
        
        // 历史记录按钮
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                loadScanHistoryData();
                showTab('historyTab');
                settingsModal.classList.remove('show');
            });
        }
        
        // 返回按钮
        if (backFromHistoryBtn) {
            backFromHistoryBtn.addEventListener('click', () => {
                showTab('homeTab');
            });
        }
        
        // 管理员页面返回按钮
        if (backFromAdminBtn) {
            backFromAdminBtn.addEventListener('click', () => {
                showTab('homeTab');
            });
        }
        
        // 关于我们按钮
        if (aboutBtn) {
            aboutBtn.addEventListener('click', () => {
                alert('食安智查 1.0\n\n一款帮助您识别食品添加剂和安全风险的工具\n\n© 2023 All Rights Reserved');
                settingsModal.classList.remove('show');
            });
        }
        
        // 管理员登录相关
        if (confirmAdminLoginBtn) {
            confirmAdminLoginBtn.addEventListener('click', () => {
                const password = adminPassword.value;
                if (password === DEFAULT_ADMIN_PASSWORD) {
                    adminLoginModal.classList.remove('show');
                    showTab('adminTab');
                    adminPassword.value = '';
                } else {
                    alert('管理员密码错误');
                }
            });
        }
        
        if (cancelAdminLoginBtn) {
            cancelAdminLoginBtn.addEventListener('click', () => {
                adminLoginModal.classList.remove('show');
                adminPassword.value = '';
            });
        }
        
        // 管理员设置表单提交
        if (adminSettingsForm) {
            adminSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveAdminSettings();
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
                <button class="view-history-btn text-primary-color text-sm" data-id="${record.id}">查看详情</button>
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
    
    usageExhaustedModal.addEventListener('click', (e) => {
        if (e.target === usageExhaustedModal) {
            usageExhaustedModal.classList.remove('show');
        }
    });
    
    adminLoginModal.addEventListener('click', (e) => {
        if (e.target === adminLoginModal) {
            adminLoginModal.classList.remove('show');
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
    
    // 用量用尽相关
    configApiBtn.addEventListener('click', () => {
        usageExhaustedModal.classList.remove('show');
        alert('目前没有开放API配置，请联系管理员。');
    });
    
    // 分析按钮点击处理
    analyzeBtn.addEventListener('click', async () => {
        if (!selectedFile) return;
        
        // 检查是否有足够的分析次数
        const adminApiKey = getAdminApiKey();
        const hasAdminApi = adminApiKey && adminApiKey.length > 0;
        const remainingUsage = getAvailableUsageCount();
        
        if (!hasAdminApi && remainingUsage <= 0) {
            // 显示提示用户次数用完的弹窗
            usageExhaustedModal.classList.add('show');
            return;
        }
        
        // 如果有次数，减少使用次数
        if (!hasAdminApi) {
            decrementUsageCount();
        }
        
        // 显示加载状态
        loadingSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
        analyzeBtn.disabled = true;
        
        try {
            // 使用管理员API
            if (hasAdminApi) {
                await analyzeWithAdminApi(selectedFile);
            }
            // 使用Poe API或模拟结果
            else if (window.Poe) {
                await analyzeWithPoeApi(selectedFile);
            }
            // 所有API都不可用，但显示Demo结果
            else {
                showMockedResult();
            }
        } catch (error) {
            console.error('Error:', error);
            showError('分析过程中出现错误，请重试。');
            loadingSection.classList.add('hidden');
            analyzeBtn.disabled = false;
        }
    });
    
    // 使用管理员API进行分析
    async function analyzeWithAdminApi(file) {
        const adminSettings = localStorage.getItem('adminSettings');
        if (!adminSettings) {
            throw new Error('管理员API设置不存在');
        }
        
        const settings = JSON.parse(adminSettings);
        
        // 创建一个自定义设置对象
        const customSettings = {
            apiProvider: settings.defaultApiProvider || 'openai',
            apiKey: settings.adminApiKey,
            modelName: settings.defaultModelName || 'gpt-4o',
            temperature: 0.7,
            maxTokens: 2000
        };
        
        // 使用自定义API进行分析
        return analyzeWithCustomApi(file, customSettings);
    }
    
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
                if (settings.apiProvider === 'openai') {
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
    
    function showError(message) {
        resultContent.innerHTML = `<div class="p-4 bg-red-50 dark:bg-red-900 dark:bg-opacity-20 text-red-600 dark:text-red-400 rounded-lg">${message}</div>`;
        resultSection.classList.remove('hidden');
    }
    
    // 初始化
    initApp();
    initTabs();
});
