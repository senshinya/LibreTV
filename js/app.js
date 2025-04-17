// 全局变量
let selectedAPIs = JSON.parse(localStorage.getItem('selectedAPIs') || '["heimuer"]'); // 默认选中黑木耳
let customAPIs = JSON.parse(localStorage.getItem('customAPIs') || '[]'); // 存储自定义API列表

// 添加当前播放的集数索引
let currentEpisodeIndex = 0;
// 添加当前视频的所有集数
let currentEpisodes = [];
// 添加当前视频的标题
let currentVideoTitle = '';
// 全局变量用于倒序状态
let episodesReversed = false;

// 豆瓣榜单URL列表
const DOUBAN_RANKINGS = [
    {
        title: "每月推荐电影",
        url: "https://douban-api.shinya.click/recommended_movie"
    },
    {
        title: "每月推荐剧集",
        url: "https://douban-api.shinya.click/recommended_tv"
    },
    {
        title: "影院热映",
        url: "https://douban-api.shinya.click/movie_showing"
    },
    {
        title: "实时热门电影",
        url: "https://douban-api.shinya.click/movie_real_time_hotest"
    },
    {
        title: "实时热门剧集",
        url: "https://douban-api.shinya.click/tv_real_time_hotest"
    },
    {
        title: "一周口碑电影榜",
        url: "https://douban-api.shinya.click/movie_weekly_best"
    },
    {
        title: "华语口碑剧集榜",
        url: "https://douban-api.shinya.click/tv_chinese_best_weekly"
    },
    {
        title: "全球口碑剧集榜",
        url: "https://douban-api.shinya.click/tv_global_best_weekly"
    },
    {
        title: "热播新剧国产剧",
        url: "https://douban-api.shinya.click/tv_domestic"
    },
    {
        title: "热播新剧欧美剧",
        url: "https://douban-api.shinya.click/tv_american"
    },
    {
        title: "热播新剧日剧",
        url: "https://douban-api.shinya.click/tv_japanese"
    },
    {
        title: "热播新剧韩剧",
        url: "https://douban-api.shinya.click/tv_korean"
    },
    {
        title: "热播新剧动画",
        url: "https://douban-api.shinya.click/tv_animation"
    }
];

// 页面初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化API复选框
    initAPICheckboxes();
    
    // 初始化自定义API列表
    renderCustomAPIsList();
    
    // 初始化显示选中的API数量
    updateSelectedApiCount();
    
    // 渲染搜索历史
    renderSearchHistory();
    
    // 加载豆瓣榜单
    loadDoubanRankings();
    
    // 设置默认API选择（如果是第一次加载）
    if (!localStorage.getItem('hasInitializedDefaults')) {
        // 仅选择黑木耳源
        selectedAPIs = ["heimuer"];
        localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
        
        // 默认选中过滤开关
        localStorage.setItem('yellowFilterEnabled', 'true');
        localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, 'true');
        
        // 标记已初始化默认值
        localStorage.setItem('hasInitializedDefaults', 'true');
    }
    
    // 设置黄色内容过滤开关初始状态
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.checked = localStorage.getItem('yellowFilterEnabled') === 'true';
    }
    
    // 设置广告过滤开关初始状态
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.checked = localStorage.getItem(PLAYER_CONFIG.adFilteringStorage) !== 'false'; // 默认为true
    }
    
    // 设置事件监听器
    setupEventListeners();
    
    // 初始检查成人API选中状态
    setTimeout(checkAdultAPIsSelected, 100);
});

// 加载豆瓣榜单
async function loadDoubanRankings() {
    const rankingsContainer = document.querySelector('#doubanRankings .grid');
    if (!rankingsContainer) return;
    
    // 清空容器
    rankingsContainer.innerHTML = '';
    
    // 为每个榜单创建占位容器
    DOUBAN_RANKINGS.forEach((ranking, index) => {
        const rankingElement = document.createElement('div');
        rankingElement.className = 'bg-[#111] rounded-lg p-4 shadow-lg';
        rankingElement.id = `ranking-${index}`;
        
        // 添加骨架屏
        rankingElement.innerHTML = `
            <h4 class="text-lg font-semibold mb-3 text-center">${ranking.title}</h4>
            <div class="grid grid-cols-3 gap-2">
                ${Array(9).fill(0).map(() => `
                    <div class="animate-pulse">
                        <div class="aspect-[2/3] bg-gray-700 rounded-lg"></div>
                        <div class="mt-1 h-3 bg-gray-700 rounded w-3/4 mx-auto"></div>
                    </div>
                `).join('')}
            </div>
        `;
        
        rankingsContainer.appendChild(rankingElement);
        
        // 异步加载每个榜单
        loadSingleRanking(ranking, index);
    });
}

// 加载单个榜单
async function loadSingleRanking(ranking, index) {
    try {
        const response = await fetch(ranking.url);
        const data = await response.json();
        
        // 获取榜单容器
        const rankingElement = document.getElementById(`ranking-${index}`);
        if (!rankingElement) return;
        
        // 保留标题
        const title = ranking.title;
        
        // 创建电影列表
        const moviesList = document.createElement('div');
        moviesList.className = 'grid grid-cols-3 gap-2';
        
        // 最多显示9部电影
        const moviesToShow = data.items?.slice(0, 9) || [];
        
        moviesToShow.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.className = 'relative cursor-pointer transition-transform hover:scale-105';
            movieCard.setAttribute('data-title', movie.title);
            movieCard.setAttribute('data-description', movie.description || '');
            
            // 添加点击事件，将电影名称填入搜索框并发起搜索
            movieCard.addEventListener('click', () => {
                const searchInput = document.getElementById('searchInput');
                if (searchInput) {
                    searchInput.value = movie.title;
                    search();
                }
            });
            
            // 电影海报
            const posterUrl = movie.posterUrl || `data:image/png;base64,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`;
            movieCard.innerHTML = `
                <div class="aspect-[2/3] overflow-hidden rounded-lg">
                    <img src="${posterUrl}" alt="${movie.title}" 
                         class="w-full h-full object-cover" 
                         onerror="this.onerror=null;">
                </div>
                <div class="mt-1 text-center">
                    <p class="text-xs truncate" title="${movie.title}">${movie.title}</p>
                </div>
                <div class="absolute inset-0 bg-black bg-opacity-80 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center p-2 rounded-lg">
                    <p class="text-xs text-center text-white">${movie.description || movie.title}</p>
                </div>
            `;
            
            moviesList.appendChild(movieCard);
        });
        
        // 更新榜单内容
        rankingElement.innerHTML = '';
        
        // 添加榜单标题
        const titleElement = document.createElement('h4');
        titleElement.className = 'text-lg font-semibold mb-3 text-center';
        titleElement.textContent = title;
        rankingElement.appendChild(titleElement);
        
        // 添加电影列表
        rankingElement.appendChild(moviesList);
        
    } catch (error) {
        console.error(`获取榜单 ${ranking.title} 失败:`, error);
        
        // 获取榜单容器
        const rankingElement = document.getElementById(`ranking-${index}`);
        if (!rankingElement) return;
        
        // 显示错误信息
        rankingElement.innerHTML = `
            <h4 class="text-lg font-semibold mb-3 text-center">${ranking.title}</h4>
            <div class="text-center py-4">
                <p class="text-gray-400">获取榜单数据失败，请稍后再试</p>
            </div>
        `;
    }
}

// 初始化API复选框
function initAPICheckboxes() {
    const container = document.getElementById('apiCheckboxes');
    container.innerHTML = '';

    // 添加普通API组标题
    const normalTitle = document.createElement('div');
    normalTitle.className = 'api-group-title';
    normalTitle.textContent = '普通资源';
    container.appendChild(normalTitle);
    
    // 创建普通API源的复选框
    Object.keys(API_SITES).forEach(apiKey => {
        const api = API_SITES[apiKey];
        if (api.adult) return; // 跳过成人内容API，稍后添加
        
        const checked = selectedAPIs.includes(apiKey);
        
        const checkbox = document.createElement('div');
        checkbox.className = 'flex items-center';
        checkbox.innerHTML = `
            <input type="checkbox" id="api_${apiKey}" 
                   class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333]" 
                   ${checked ? 'checked' : ''} 
                   data-api="${apiKey}">
            <label for="api_${apiKey}" class="ml-1 text-xs text-gray-400 truncate">${api.name}</label>
        `;
        container.appendChild(checkbox);
        
        // 添加事件监听器
        checkbox.querySelector('input').addEventListener('change', function() {
            updateSelectedAPIs();
            checkAdultAPIsSelected();
        });
    });
    
    // 仅在隐藏设置为false时添加成人API组
    if (!HIDE_BUILTIN_ADULT_APIS) {
        // 添加成人API组标题
        const adultTitle = document.createElement('div');
        adultTitle.className = 'api-group-title adult';
        adultTitle.innerHTML = `黄色资源采集站 <span class="adult-warning">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        </span>`;
        container.appendChild(adultTitle);
        
        // 创建成人API源的复选框
        Object.keys(API_SITES).forEach(apiKey => {
            const api = API_SITES[apiKey];
            if (!api.adult) return; // 仅添加成人内容API
            
            const checked = selectedAPIs.includes(apiKey);
            
            const checkbox = document.createElement('div');
            checkbox.className = 'flex items-center';
            checkbox.innerHTML = `
                <input type="checkbox" id="api_${apiKey}" 
                       class="form-checkbox h-3 w-3 text-blue-600 bg-[#222] border border-[#333] api-adult" 
                       ${checked ? 'checked' : ''} 
                       data-api="${apiKey}">
                <label for="api_${apiKey}" class="ml-1 text-xs text-pink-400 truncate">${api.name}</label>
            `;
            container.appendChild(checkbox);
            
            // 添加事件监听器
            checkbox.querySelector('input').addEventListener('change', function() {
                updateSelectedAPIs();
                checkAdultAPIsSelected();
            });
        });
    }
    
    // 初始检查成人内容状态
    checkAdultAPIsSelected();
}

// 检查是否有成人API被选中
function checkAdultAPIsSelected() {
    // 查找所有内置成人API复选框
    const adultBuiltinCheckboxes = document.querySelectorAll('#apiCheckboxes .api-adult:checked');
    
    // 查找所有自定义成人API复选框
    const customApiCheckboxes = document.querySelectorAll('#customApisList .api-adult:checked');
    
    const hasAdultSelected = adultBuiltinCheckboxes.length > 0 || customApiCheckboxes.length > 0;
    
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    const yellowFilterContainer = yellowFilterToggle.closest('div').parentNode;
    const filterDescription = yellowFilterContainer.querySelector('p.filter-description');
    
    // 如果选择了成人API，禁用黄色内容过滤器
    if (hasAdultSelected) {
        yellowFilterToggle.checked = false;
        yellowFilterToggle.disabled = true;
        localStorage.setItem('yellowFilterEnabled', 'false');
        
        // 添加禁用样式
        yellowFilterContainer.classList.add('filter-disabled');
        
        // 修改描述文字
        if (filterDescription) {
            filterDescription.innerHTML = '<strong class="text-pink-300">选中黄色资源站时无法启用此过滤</strong>';
        }
        
        // 移除提示信息（如果存在）
        const existingTooltip = yellowFilterContainer.querySelector('.filter-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    } else {
        // 启用黄色内容过滤器
        yellowFilterToggle.disabled = false;
        yellowFilterContainer.classList.remove('filter-disabled');
        
        // 恢复原来的描述文字
        if (filterDescription) {
            filterDescription.innerHTML = '过滤"伦理片"等黄色内容';
        }
        
        // 移除提示信息
        const existingTooltip = yellowFilterContainer.querySelector('.filter-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
    }
}

// 渲染自定义API列表
function renderCustomAPIsList() {
    const container = document.getElementById('customApisList');
    if (!container) return;
    
    if (customAPIs.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-500 text-center my-2">未添加自定义API</p>';
        return;
    }
    
    container.innerHTML = '';
    customAPIs.forEach((api, index) => {
        const apiItem = document.createElement('div');
        apiItem.className = 'flex items-center justify-between p-1 mb-1 bg-[#222] rounded';
        
        // 根据是否是成人内容设置不同的样式
        const textColorClass = api.isAdult ? 'text-pink-400' : 'text-white';
        
        // 将(18+)标记移到最前面
        const adultTag = api.isAdult ? '<span class="text-xs text-pink-400 mr-1">(18+)</span>' : '';
        
        apiItem.innerHTML = `
            <div class="flex items-center flex-1 min-w-0">
                <input type="checkbox" id="custom_api_${index}" 
                       class="form-checkbox h-3 w-3 text-blue-600 mr-1 ${api.isAdult ? 'api-adult' : ''}" 
                       ${selectedAPIs.includes('custom_' + index) ? 'checked' : ''} 
                       data-custom-index="${index}">
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium ${textColorClass} truncate">
                        ${adultTag}${api.name}
                    </div>
                    <div class="text-xs text-gray-500 truncate">${api.url}</div>
                </div>
            </div>
            <div class="flex items-center">
                <button class="text-blue-500 hover:text-blue-700 text-xs px-1" onclick="editCustomApi(${index})">✎</button>
                <button class="text-red-500 hover:text-red-700 text-xs px-1" onclick="removeCustomApi(${index})">✕</button>
            </div>
        `;
        container.appendChild(apiItem);
        
        // 添加事件监听器
        apiItem.querySelector('input').addEventListener('change', function() {
            updateSelectedAPIs();
            checkAdultAPIsSelected();
        });
    });
}

// 编辑自定义API
function editCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    
    const api = customAPIs[index];
    
    // 填充表单数据
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const isAdultInput = document.getElementById('customApiIsAdult');
    
    nameInput.value = api.name;
    urlInput.value = api.url;
    if (isAdultInput) isAdultInput.checked = api.isAdult || false;
    
    // 显示表单
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
        
        // 替换表单按钮操作
        const buttonContainer = form.querySelector('div:last-child');
        buttonContainer.innerHTML = `
            <button onclick="updateCustomApi(${index})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">更新</button>
            <button onclick="cancelEditCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
        `;
    }
}

// 更新自定义API
function updateCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const isAdultInput = document.getElementById('customApiIsAdult');
    
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const isAdult = isAdultInput ? isAdultInput.checked : false;
    
    if (!name || !url) {
        showToast('请输入API名称和链接', 'warning');
        return;
    }
    
    // 确保URL格式正确
    if (!/^https?:\/\/.+/.test(url)) {
        showToast('API链接格式不正确，需以http://或https://开头', 'warning');
        return;
    }
    
    // 移除URL末尾的斜杠
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
    // 更新API信息
    customAPIs[index] = { name, url, isAdult };
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    
    // 重新渲染自定义API列表
    renderCustomAPIsList();
    
    // 重新检查成人API选中状态
    checkAdultAPIsSelected();
    
    // 恢复添加按钮
    restoreAddCustomApiButtons();
    
    // 清空表单并隐藏
    nameInput.value = '';
    urlInput.value = '';
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    
    showToast('已更新自定义API: ' + name, 'success');
}

// 取消编辑自定义API
function cancelEditCustomApi() {
    // 清空表单
    document.getElementById('customApiName').value = '';
    document.getElementById('customApiUrl').value = '';
    const isAdultInput = document.getElementById('customApiIsAdult');
    if (isAdultInput) isAdultInput.checked = false;
    
    // 隐藏表单
    document.getElementById('addCustomApiForm').classList.add('hidden');
    
    // 恢复添加按钮
    restoreAddCustomApiButtons();
}

// 恢复自定义API添加按钮
function restoreAddCustomApiButtons() {
    const form = document.getElementById('addCustomApiForm');
    const buttonContainer = form.querySelector('div:last-child');
    buttonContainer.innerHTML = `
        <button onclick="addCustomApi()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">添加</button>
        <button onclick="cancelAddCustomApi()" class="bg-[#444] hover:bg-[#555] text-white px-3 py-1 rounded text-xs">取消</button>
    `;
}

// 更新选中的API列表
function updateSelectedAPIs() {
    // 获取所有内置API复选框
    const builtInApiCheckboxes = document.querySelectorAll('#apiCheckboxes input:checked');
    
    // 获取选中的内置API
    const builtInApis = Array.from(builtInApiCheckboxes).map(input => input.dataset.api);
    
    // 获取选中的自定义API
    const customApiCheckboxes = document.querySelectorAll('#customApisList input:checked');
    const customApiIndices = Array.from(customApiCheckboxes).map(input => 'custom_' + input.dataset.customIndex);
    
    // 合并内置和自定义API
    selectedAPIs = [...builtInApis, ...customApiIndices];
    
    // 保存到localStorage
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    
    // 更新显示选中的API数量
    updateSelectedApiCount();
}

// 更新选中的API数量显示
function updateSelectedApiCount() {
    const countEl = document.getElementById('selectedApiCount');
    if (countEl) {
        countEl.textContent = selectedAPIs.length;
    }
}

// 全选或取消全选API
function selectAllAPIs(selectAll = true, excludeAdult = false) {
    const checkboxes = document.querySelectorAll('#apiCheckboxes input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        if (excludeAdult && checkbox.classList.contains('api-adult')) {
            checkbox.checked = false;
        } else {
            checkbox.checked = selectAll;
        }
    });
    
    updateSelectedAPIs();
    checkAdultAPIsSelected();
}

// 显示添加自定义API表单
function showAddCustomApiForm() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.remove('hidden');
    }
}

// 取消添加自定义API - 修改函数来重用恢复按钮逻辑
function cancelAddCustomApi() {
    const form = document.getElementById('addCustomApiForm');
    if (form) {
        form.classList.add('hidden');
        document.getElementById('customApiName').value = '';
        document.getElementById('customApiUrl').value = '';
        const isAdultInput = document.getElementById('customApiIsAdult');
        if (isAdultInput) isAdultInput.checked = false;
        
        // 确保按钮是添加按钮
        restoreAddCustomApiButtons();
    }
}

// 添加自定义API
function addCustomApi() {
    const nameInput = document.getElementById('customApiName');
    const urlInput = document.getElementById('customApiUrl');
    const isAdultInput = document.getElementById('customApiIsAdult');
    
    const name = nameInput.value.trim();
    let url = urlInput.value.trim();
    const isAdult = isAdultInput ? isAdultInput.checked : false;
    
    if (!name || !url) {
        showToast('请输入API名称和链接', 'warning');
        return;
    }
    
    // 确保URL格式正确
    if (!/^https?:\/\/.+/.test(url)) {
        showToast('API链接格式不正确，需以http://或https://开头', 'warning');
        return;
    }
    
    // 移除URL末尾的斜杠
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    
    // 添加到自定义API列表 - 增加isAdult属性
    customAPIs.push({ name, url, isAdult });
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    
    // 默认选中新添加的API
    const newApiIndex = customAPIs.length - 1;
    selectedAPIs.push('custom_' + newApiIndex);
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    
    // 重新渲染自定义API列表
    renderCustomAPIsList();
    
    // 更新选中的API数量
    updateSelectedApiCount();
    
    // 重新检查成人API选中状态
    checkAdultAPIsSelected();
    
    // 清空表单并隐藏
    nameInput.value = '';
    urlInput.value = '';
    if (isAdultInput) isAdultInput.checked = false;
    document.getElementById('addCustomApiForm').classList.add('hidden');
    
    showToast('已添加自定义API: ' + name, 'success');
}

// 移除自定义API
function removeCustomApi(index) {
    if (index < 0 || index >= customAPIs.length) return;
    
    const apiName = customAPIs[index].name;
    
    // 从列表中移除API
    customAPIs.splice(index, 1);
    localStorage.setItem('customAPIs', JSON.stringify(customAPIs));
    
    // 从选中列表中移除此API
    const customApiId = 'custom_' + index;
    selectedAPIs = selectedAPIs.filter(id => id !== customApiId);
    
    // 更新大于此索引的自定义API索引
    selectedAPIs = selectedAPIs.map(id => {
        if (id.startsWith('custom_')) {
            const currentIndex = parseInt(id.replace('custom_', ''));
            if (currentIndex > index) {
                return 'custom_' + (currentIndex - 1);
            }
        }
        return id;
    });
    
    localStorage.setItem('selectedAPIs', JSON.stringify(selectedAPIs));
    
    // 重新渲染自定义API列表
    renderCustomAPIsList();
    
    // 更新选中的API数量
    updateSelectedApiCount();
    
    // 重新检查成人API选中状态
    checkAdultAPIsSelected();
    
    showToast('已移除自定义API: ' + apiName, 'info');
}

// 设置事件监听器
function setupEventListeners() {
    // 回车搜索
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            search();
        }
    });

    // 点击外部关闭设置面板
    document.addEventListener('click', function(e) {
        const panel = document.getElementById('settingsPanel');
        const settingsButton = document.querySelector('button[onclick="toggleSettings(event)"]');
        
        if (!panel.contains(e.target) && !settingsButton.contains(e.target) && panel.classList.contains('show')) {
            panel.classList.remove('show');
        }
    });
    
    // 黄色内容过滤开关事件绑定
    const yellowFilterToggle = document.getElementById('yellowFilterToggle');
    if (yellowFilterToggle) {
        yellowFilterToggle.addEventListener('change', function(e) {
            localStorage.setItem('yellowFilterEnabled', e.target.checked);
        });
    }
    
    // 广告过滤开关事件绑定
    const adFilterToggle = document.getElementById('adFilterToggle');
    if (adFilterToggle) {
        adFilterToggle.addEventListener('change', function(e) {
            localStorage.setItem(PLAYER_CONFIG.adFilteringStorage, e.target.checked);
        });
    }
}

// 重置搜索区域
function resetSearchArea() {
    // 清理搜索结果
    document.getElementById('results').innerHTML = '';
    document.getElementById('searchInput').value = '';
    
    // 恢复搜索区域的样式
    document.getElementById('searchArea').classList.add('flex-1');
    document.getElementById('searchArea').classList.remove('mb-8');
    document.getElementById('resultsArea').classList.add('hidden');

    // 显示豆瓣榜单区域
    const doubanRankings = document.getElementById('doubanRankings');
    if (doubanRankings) {
        doubanRankings.classList.remove('hidden');
    }
    
    // 确保页脚正确显示，移除相对定位
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.style.position = '';
    }
}

// 获取自定义API信息
function getCustomApiInfo(customApiIndex) {
    const index = parseInt(customApiIndex);
    if (isNaN(index) || index < 0 || index >= customAPIs.length) {
        return null;
    }
    return customAPIs[index];
}

// 搜索功能 - 修改为支持多选API
async function search() {
    const query = document.getElementById('searchInput').value.trim();
    
    if (!query) {
        showToast('请输入搜索内容', 'info');
        return;
    }
    
    if (selectedAPIs.length === 0) {
        showToast('请至少选择一个API源', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        // 保存搜索历史
        saveSearchHistory(query);

        // 隐藏豆瓣榜单区域
        const doubanRankings = document.getElementById('doubanRankings');
        if (doubanRankings) {
            doubanRankings.classList.add('hidden');
        }
        
        // 从所有选中的API源搜索
        let allResults = [];
        const searchPromises = selectedAPIs.map(async (apiId) => {
            try {
                let apiUrl, apiName;
                
                // 处理自定义API
                if (apiId.startsWith('custom_')) {
                    const customIndex = apiId.replace('custom_', '');
                    const customApi = getCustomApiInfo(customIndex);
                    if (!customApi) return [];
                    
                    apiUrl = customApi.url + API_CONFIG.search.path + encodeURIComponent(query);
                    apiName = customApi.name;
                } else {
                    // 内置API
                    if (!API_SITES[apiId]) return [];
                    apiUrl = API_SITES[apiId].api + API_CONFIG.search.path + encodeURIComponent(query);
                    apiName = API_SITES[apiId].name;
                }
                
                // 添加超时处理
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(PROXY_URL + encodeURIComponent(apiUrl), {
                    headers: API_CONFIG.search.headers,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    return [];
                }
                
                const data = await response.json();
                
                if (!data || !data.list || !Array.isArray(data.list) || data.list.length === 0) {
                    return [];
                }
                
                // 添加源信息到每个结果
                const results = data.list.map(item => ({
                    ...item,
                    source_name: apiName,
                    source_code: apiId,
                    api_url: apiId.startsWith('custom_') ? getCustomApiInfo(apiId.replace('custom_', ''))?.url : undefined
                }));
                
                return results;
            } catch (error) {
                console.warn(`API ${apiId} 搜索失败:`, error);
                return [];
            }
        });
        
        // 等待所有搜索请求完成
        const resultsArray = await Promise.all(searchPromises);
        
        // 合并所有结果
        resultsArray.forEach(results => {
            if (Array.isArray(results) && results.length > 0) {
                allResults = allResults.concat(results);
            }
        });
        
        // 显示结果区域，调整搜索区域
        document.getElementById('searchArea').classList.remove('flex-1');
        document.getElementById('searchArea').classList.add('mb-8');
        document.getElementById('resultsArea').classList.remove('hidden');
        
        const resultsDiv = document.getElementById('results');
        
        // 如果没有结果
        if (!allResults || allResults.length === 0) {
            resultsDiv.innerHTML = `
                <div class="col-span-full text-center py-16">
                    <svg class="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="mt-2 text-lg font-medium text-gray-400">没有找到匹配的结果</h3>
                    <p class="mt-1 text-sm text-gray-500">请尝试其他关键词或更换数据源</p>
                </div>
            `;
            hideLoading();
            return;
        }

        // 处理搜索结果过滤：如果启用了黄色内容过滤，则过滤掉分类含有敏感内容的项目
        const yellowFilterEnabled = localStorage.getItem('yellowFilterEnabled') === 'true';
        if (yellowFilterEnabled) {
            const banned = ['伦理片','门事件','萝莉少女','制服诱惑','国产传媒','cosplay','黑丝诱惑','无码','日本无码','有码','日本有码','SWAG','网红主播', '色情片','同性片','福利视频','福利片'];
            allResults = allResults.filter(item => {
                const typeName = item.type_name || '';
                return !banned.some(keyword => typeName.includes(keyword));
            });
        }

        // 添加XSS保护，使用textContent和属性转义
        resultsDiv.innerHTML = allResults.map(item => {
            const safeId = item.vod_id ? item.vod_id.toString().replace(/[^\w-]/g, '') : '';
            const safeName = (item.vod_name || '').toString()
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
            const sourceInfo = item.source_name ? 
                `<span class="bg-[#222] text-xs px-2 py-1 rounded-full">${item.source_name}</span>` : '';
            const sourceCode = item.source_code || '';
            
            // 添加API URL属性，用于详情获取
            const apiUrlAttr = item.api_url ? 
                `data-api-url="${item.api_url.replace(/"/g, '&quot;')}"` : '';
            
            // 重新设计的卡片布局 - 支持更好的封面图显示
            const hasCover = item.vod_pic && item.vod_pic.startsWith('http');
            
            return `
                <div class="card-hover bg-[#111] rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] h-full" 
                     onclick="showDetails('${safeId}','${safeName}','${sourceCode}')" ${apiUrlAttr}>
                    <div class="md:flex">
                        ${hasCover ? `
                        <div class="md:w-1/4 relative overflow-hidden">
                            <div class="w-full h-40 md:h-full">
                                <img src="${item.vod_pic}" alt="${safeName}" 
                                     class="w-full h-full object-cover transition-transform hover:scale-110" 
                                     onerror="this.onerror=null; this.classList.add('object-contain');" 
                                     loading="lazy">
                                <div class="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent opacity-60"></div>
                            </div>
                        </div>` : ''}
                        
                        <div class="p-3 flex flex-col flex-grow ${hasCover ? 'md:w-3/4' : 'w-full'}">
                            <div class="flex-grow">
                                <h3 class="text-lg font-semibold mb-2 break-words">${safeName}</h3>
                                
                                <div class="flex flex-wrap gap-1 mb-2">
                                    ${(item.type_name || '').toString().replace(/</g, '&lt;') ? 
                                      `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-blue-500 text-blue-300">
                                          ${(item.type_name || '').toString().replace(/</g, '&lt;')}
                                      </span>` : ''}
                                    ${(item.vod_year || '') ? 
                                      `<span class="text-xs py-0.5 px-1.5 rounded bg-opacity-20 bg-purple-500 text-purple-300">
                                          ${item.vod_year}
                                      </span>` : ''}
                                </div>
                                <p class="text-gray-400 text-xs h-9 overflow-hidden">
                                    ${(item.vod_remarks || '暂无介绍').toString().replace(/</g, '&lt;')}
                                </p>
                            </div>
                            
                            <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-800">
                                ${sourceInfo ? `<div>${sourceInfo}</div>` : '<div></div>'}
                                <div>
                                    <span class="text-xs text-gray-500 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        点击播放
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('搜索错误:', error);
        if (error.name === 'AbortError') {
            showToast('搜索请求超时，请检查网络连接', 'error');
        } else {
            showToast('搜索请求失败，请稍后重试', 'error');
        }
    } finally {
        hideLoading();
    }
}

// 显示详情 - 修改为支持自定义API
async function showDetails(id, vod_name, sourceCode) {
    if (!id) {
        showToast('视频ID无效', 'error');
        return;
    }
    
    showLoading();
    try {
        // 构建API参数
        let apiParams = '';
        
        // 处理自定义API源
        if (sourceCode.startsWith('custom_')) {
            const customIndex = sourceCode.replace('custom_', '');
            const customApi = getCustomApiInfo(customIndex);
            if (!customApi) {
                showToast('自定义API配置无效', 'error');
                hideLoading();
                return;
            }
            
            apiParams = '&customApi=' + encodeURIComponent(customApi.url) + '&source=custom';
        } else {
            // 内置API
            apiParams = '&source=' + sourceCode;
        }
        
        const response = await fetch('/api/detail?id=' + encodeURIComponent(id) + apiParams);
        
        const data = await response.json();
        
        // ...existing code for showing details...
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        // 显示来源信息
        const sourceName = data.videoInfo && data.videoInfo.source_name ? 
            ` <span class="text-sm font-normal text-gray-400">(${data.videoInfo.source_name})</span>` : '';
        
        // 不对标题进行截断处理，允许完整显示
        modalTitle.innerHTML = `<span class="break-words">${vod_name || '未知视频'}</span>${sourceName}`;
        currentVideoTitle = vod_name || '未知视频';
        
        if (data.episodes && data.episodes.length > 0) {
            // 安全处理集数URL
            const safeEpisodes = data.episodes.map(url => {
                try {
                    // 确保URL是有效的并且是http或https开头
                    return url && (url.startsWith('http://') || url.startsWith('https://'))
                        ? url.replace(/"/g, '&quot;')
                        : '';
                } catch (e) {
                    return '';
                }
            }).filter(url => url); // 过滤掉空URL
            
            // 保存当前视频的所有集数
            currentEpisodes = safeEpisodes;
            episodesReversed = false; // 默认正序
            modalContent.innerHTML = `
                <div class="flex justify-end mb-2">
                    <button onclick="toggleEpisodeOrder()" class="px-4 py-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clip-rule="evenodd" />
                        </svg>
                        <span>倒序排列</span>
                    </button>
                </div>
                <div id="episodesGrid" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                    ${renderEpisodes(vod_name)}
                </div>
            `;
        } else {
            modalContent.innerHTML = '<p class="text-center text-gray-400 py-8">没有找到可播放的视频</p>';
        }
        
        modal.classList.remove('hidden');
    } catch (error) {
        console.error('获取详情错误:', error);
        showToast('获取详情失败，请稍后重试', 'error');
    } finally {
        hideLoading();
    }
}

// 更新播放视频函数，修改为在新标签页中打开播放页面，并保存到历史记录
function playVideo(url, vod_name, episodeIndex = 0) {
    if (!url) {
        showToast('无效的视频链接', 'error');
        return;
    }
    
    // 获取当前视频来源名称（从模态框标题中提取）
    let sourceName = '';
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        const sourceSpan = modalTitle.querySelector('span.text-gray-400');
        if (sourceSpan) {
            // 提取括号内的来源名称, 例如从 "(黑木耳)" 提取 "黑木耳"
            const sourceText = sourceSpan.textContent;
            const match = sourceText.match(/\(([^)]+)\)/);
            if (match && match[1]) {
                sourceName = match[1].trim();
            }
        }
    }
    
    // 保存当前状态到localStorage，让播放页面可以获取
    localStorage.setItem('currentVideoTitle', currentVideoTitle);
    localStorage.setItem('currentEpisodeIndex', episodeIndex);
    localStorage.setItem('currentEpisodes', JSON.stringify(currentEpisodes));
    localStorage.setItem('episodesReversed', episodesReversed);
    
    // 构建视频信息对象，使用标题作为唯一标识
    const videoTitle = vod_name || currentVideoTitle;
    const videoInfo = {
        title: videoTitle,
        url: url,
        episodeIndex: episodeIndex,
        sourceName: sourceName,
        timestamp: Date.now()
    };
    
    // 保存到观看历史，添加sourceName
    if (typeof addToViewingHistory === 'function') {
        addToViewingHistory(videoInfo);
    }
    
    // 构建播放页面URL，传递必要参数
    const playerUrl = `player.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(videoTitle)}&index=${episodeIndex}&source=${encodeURIComponent(sourceName)}`;
    
    // 在新标签页中打开播放页面
    window.open(playerUrl, '_blank');
}

// 播放上一集
function playPreviousEpisode() {
    if (currentEpisodeIndex > 0) {
        const prevIndex = currentEpisodeIndex - 1;
        const prevUrl = currentEpisodes[prevIndex];
        playVideo(prevUrl, currentVideoTitle, prevIndex);
    }
}

// 播放下一集
function playNextEpisode() {
    if (currentEpisodeIndex < currentEpisodes.length - 1) {
        const nextIndex = currentEpisodeIndex + 1;
        const nextUrl = currentEpisodes[nextIndex];
        playVideo(nextUrl, currentVideoTitle, nextIndex);
    }
}

// 处理播放器加载错误
function handlePlayerError() {
    hideLoading();
    showToast('视频播放加载失败，请尝试其他视频源', 'error');
}

// 辅助函数用于渲染剧集按钮（使用当前的排序状态）
function renderEpisodes(vodName) {
    const episodes = episodesReversed ? [...currentEpisodes].reverse() : currentEpisodes;
    return episodes.map((episode, index) => {
        // 根据倒序状态计算真实的剧集索引
        const realIndex = episodesReversed ? currentEpisodes.length - 1 - index : index;
        return `
            <button id="episode-${realIndex}" onclick="playVideo('${episode}','${vodName.replace(/"/g, '&quot;')}', ${realIndex})" 
                    class="px-4 py-2 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg transition-colors text-center episode-btn">
                第${realIndex + 1}集
            </button>
        `;
    }).join('');
}

// 切换排序状态的函数
function toggleEpisodeOrder() {
    episodesReversed = !episodesReversed;
    // 重新渲染剧集区域，使用 currentVideoTitle 作为视频标题
    const episodesGrid = document.getElementById('episodesGrid');
    if (episodesGrid) {
        episodesGrid.innerHTML = renderEpisodes(currentVideoTitle);
    }
    
    // 更新按钮文本和箭头方向
    const toggleBtn = document.querySelector('button[onclick="toggleEpisodeOrder()"]');
    if (toggleBtn) {
        toggleBtn.querySelector('span').textContent = episodesReversed ? '正序排列' : '倒序排列';
        const arrowIcon = toggleBtn.querySelector('svg');
        if (arrowIcon) {
            arrowIcon.style.transform = episodesReversed ? 'rotate(180deg)' : 'rotate(0deg)';
        }
    }
}

// app.js 或路由文件中
const authMiddleware = require('./middleware/auth');
const config = require('./config');

// 对所有请求启用鉴权（按需调整作用范围）
if (config.auth.enabled) {
  app.use(authMiddleware);
}

// 或者针对特定路由
app.use('/api', authMiddleware);
