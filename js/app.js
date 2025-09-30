// 粤语教学网站主应用文件

// 应用状态管理
const AppState = {
    currentCourse: null,
    currentPart: null,
    courses: [],
    courseContent: new Map(), // 存储课程内容数据

    // 状态变更监听器
    listeners: {
        courseChange: [],
        partChange: [],
        stateChange: []
    },

    // 历史记录支持
    history: [],
    maxHistorySize: 10,

    // URL路由支持
    enableRouting: true,
    routePrefix: '#'
};

// ===== 应用状态管理功能 =====

/**
 * 设置当前选择的课程和部分
 * @param {string} courseId - 课程ID
 * @param {string} part - 部分标识 ('A' 或 'B')
 * @param {boolean} updateURL - 是否更新URL路由
 */
function setCurrentSelection(courseId, part, updateURL = true) {
    const previousCourse = AppState.currentCourse;
    const previousPart = AppState.currentPart;

    // 验证输入参数
    if (!courseId || !part) {
        console.warn('setCurrentSelection: 无效的参数', { courseId, part });
        return false;
    }

    // 验证课程是否存在
    const course = AppState.courses.find(c => c.id === courseId);
    if (!course) {
        console.warn(`setCurrentSelection: 找不到课程 ${courseId}`);
        return false;
    }

    // 验证部分是否存在
    if (part === 'A' && (!course.partA || !Array.isArray(course.partA) || course.partA.length === 0)) {
        console.warn(`setCurrentSelection: 课程 ${courseId} 没有 Part A`);
        return false;
    }

    if (part === 'B' && (!course.partB || course.partB.length === 0)) {
        console.warn(`setCurrentSelection: 课程 ${courseId} 没有 Part B`);
        return false;
    }

    // 更新状态
    AppState.currentCourse = courseId;
    AppState.currentPart = part;

    // 添加到历史记录
    addToHistory(courseId, part);

    // 触发状态变更事件
    if (previousCourse !== courseId) {
        triggerStateEvent('courseChange', {
            previous: previousCourse,
            current: courseId,
            part: part
        });
    }

    if (previousPart !== part) {
        triggerStateEvent('partChange', {
            course: courseId,
            previous: previousPart,
            current: part
        });
    }

    triggerStateEvent('stateChange', {
        courseId: courseId,
        part: part,
        previous: { course: previousCourse, part: previousPart }
    });

    // 更新URL路由
    if (updateURL && AppState.enableRouting) {
        updateURLRoute(courseId, part);
    }

    console.log(`状态更新: ${courseId} - Part ${part}`);
    return true;
}

/**
 * 获取当前选择状态
 * @returns {Object} 当前选择的课程和部分信息
 */
function getCurrentSelection() {
    return {
        courseId: AppState.currentCourse,
        part: AppState.currentPart,
        isValid: AppState.currentCourse && AppState.currentPart,
        course: AppState.currentCourse ? AppState.courses.find(c => c.id === AppState.currentCourse) : null
    };
}

/**
 * 清除当前选择
 */
function clearCurrentSelection() {
    const previous = getCurrentSelection();

    AppState.currentCourse = null;
    AppState.currentPart = null;

    // 触发状态变更事件
    triggerStateEvent('stateChange', {
        courseId: null,
        part: null,
        previous: previous
    });

    // 清除URL路由
    if (AppState.enableRouting) {
        clearURLRoute();
    }

    console.log('已清除当前选择');
}

/**
 * 添加状态变更监听器
 * @param {string} eventType - 事件类型 ('courseChange', 'partChange', 'stateChange')
 * @param {Function} callback - 回调函数
 */
function addStateListener(eventType, callback) {
    if (!AppState.listeners[eventType]) {
        console.warn(`addStateListener: 无效的事件类型 ${eventType}`);
        return;
    }

    if (typeof callback !== 'function') {
        console.warn('addStateListener: 回调函数无效');
        return;
    }

    AppState.listeners[eventType].push(callback);
    console.log(`添加状态监听器: ${eventType}`);
}

/**
 * 移除状态变更监听器
 * @param {string} eventType - 事件类型
 * @param {Function} callback - 回调函数
 */
function removeStateListener(eventType, callback) {
    if (!AppState.listeners[eventType]) {
        return;
    }

    const index = AppState.listeners[eventType].indexOf(callback);
    if (index > -1) {
        AppState.listeners[eventType].splice(index, 1);
        console.log(`移除状态监听器: ${eventType}`);
    }
}

/**
 * 触发状态事件
 * @param {string} eventType - 事件类型
 * @param {Object} data - 事件数据
 */
function triggerStateEvent(eventType, data) {
    if (!AppState.listeners[eventType]) {
        return;
    }

    AppState.listeners[eventType].forEach(callback => {
        try {
            callback(data);
        } catch (error) {
            console.error(`状态事件回调执行失败 (${eventType}):`, error);
        }
    });
}

/**
 * 添加到历史记录
 * @param {string} courseId - 课程ID
 * @param {string} part - 部分标识
 */
function addToHistory(courseId, part) {
    const historyItem = {
        courseId: courseId,
        part: part,
        timestamp: Date.now()
    };

    // 避免重复的历史记录
    const lastItem = AppState.history[AppState.history.length - 1];
    if (lastItem && lastItem.courseId === courseId && lastItem.part === part) {
        return;
    }

    AppState.history.push(historyItem);

    // 限制历史记录大小
    if (AppState.history.length > AppState.maxHistorySize) {
        AppState.history.shift();
    }
}

/**
 * 获取历史记录
 * @returns {Array} 历史记录数组
 */
function getHistory() {
    return [...AppState.history];
}

/**
 * 清除历史记录
 */
function clearHistory() {
    AppState.history = [];
    console.log('已清除历史记录');
}

// ===== URL路由支持 =====

/**
 * 更新URL路由
 * @param {string} courseId - 课程ID
 * @param {string} part - 部分标识
 */
function updateURLRoute(courseId, part) {
    if (!AppState.enableRouting) return;

    const route = `${AppState.routePrefix}${courseId}/${part}`;

    // 使用pushState避免页面刷新
    if (window.history && window.history.pushState) {
        const url = new URL(window.location);
        url.hash = route.substring(1); // 移除#前缀
        window.history.pushState({ courseId, part }, '', url);
    } else {
        // 降级到hash路由
        window.location.hash = route.substring(1);
    }
}

/**
 * 清除URL路由
 */
function clearURLRoute() {
    if (!AppState.enableRouting) return;

    if (window.history && window.history.pushState) {
        const url = new URL(window.location);
        url.hash = '';
        window.history.pushState({}, '', url);
    } else {
        window.location.hash = '';
    }
}

/**
 * 从URL解析路由
 * @returns {Object|null} 解析的路由信息
 */
function parseURLRoute() {
    if (!AppState.enableRouting) return null;

    const hash = window.location.hash;
    if (!hash || hash.length <= 1) return null;

    // 移除#前缀
    const route = hash.substring(1);
    const parts = route.split('/');

    if (parts.length !== 2) return null;

    const [courseId, part] = parts;

    // 验证路由格式
    if (!courseId || !part || !['A', 'B'].includes(part)) {
        return null;
    }

    return { courseId, part };
}

/**
 * 应用URL路由
 */
function applyURLRoute() {
    const route = parseURLRoute();
    if (!route) return false;

    const { courseId, part } = route;

    // 验证课程是否存在
    const course = AppState.courses.find(c => c.id === courseId);
    if (!course) {
        console.warn(`URL路由: 找不到课程 ${courseId}`);
        clearURLRoute();
        return false;
    }

    // 设置当前选择（不更新URL避免循环）
    const success = setCurrentSelection(courseId, part, false);

    if (success) {
        // 更新UI
        updatePartButtonStates(courseId, part);
        updateCourseItemStates(courseId);
        renderContentDisplay(courseId, part);

        console.log(`应用URL路由: ${courseId} - Part ${part}`);
        return true;
    }

    return false;
}

/**
 * 初始化路由支持
 */
function initRouting() {
    if (!AppState.enableRouting) return;

    // 监听浏览器前进后退
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.courseId && event.state.part) {
            // 从popstate事件恢复状态
            setCurrentSelection(event.state.courseId, event.state.part, false);
            updatePartButtonStates(event.state.courseId, event.state.part);
            updateCourseItemStates(event.state.courseId);
            renderContentDisplay(event.state.courseId, event.state.part);
        } else {
            // 尝试从URL解析路由
            applyURLRoute();
        }
    });

    // 监听hash变化（降级支持）
    window.addEventListener('hashchange', () => {
        applyURLRoute();
    });

    console.log('路由支持已初始化');
}

/**
 * 初始化内容切换监听器
 */
function initContentSwitchListeners() {
    // 监听状态变更事件
    addStateListener('stateChange', (data) => {
        console.log('状态变更:', data);

        // 可以在这里添加额外的状态变更处理逻辑
        // 例如：保存用户偏好、更新统计信息等
    });

    // 监听内容切换完成事件
    document.addEventListener('contentSwitchComplete', (event) => {
        const { courseId, part } = event.detail;
        console.log(`内容切换完成事件: ${courseId} - Part ${part}`);

        // 可以在这里添加切换完成后的处理逻辑
        // 例如：预加载下一个内容、更新用户进度等
    });

    // 监听音频播放状态变更
    document.addEventListener('audioStateChange', (event) => {
        const { audioId, state } = event.detail;

        // 更新音频状态显示
        const audioControls = document.querySelector(`[data-audio-id="${audioId}"]`);
        if (audioControls) {
            const statusElement = audioControls.querySelector('.audio-status');
            if (statusElement) {
                statusElement.classList.add('audio-status-change');
                setTimeout(() => {
                    statusElement.classList.remove('audio-status-change');
                }, 500);
            }
        }
    });

    console.log('内容切换监听器已初始化');
}

// 应用初始化
async function initApp() {
    console.log('粤语教学网站初始化中...');

    // 显示加载指示器
    showLoadingIndicator();

    const startTime = performance.now();

    try {
        // 加载课程内容数据（现在包含所有必要信息）
        const contentData = await loadCourseContentData();

        // 直接使用内容数据，添加基本验证
        AppState.courses = contentData.courses.map(course => ({
            ...course,
            hasContent: true
        }));

        console.log('最终课程数据:', AppState.courses);

        // 显示调试信息
        displayDebugInfo();

        // 检查数据完整性
        checkCourseDataIntegrity();

        // 渲染界面
        renderCourseList();

        // 初始化路由支持
        initRouting();

        // 初始化内容切换监听器
        initContentSwitchListeners();

        // 初始化性能优化功能
        initPerformanceOptimizations();

        // 尝试应用URL路由
        setTimeout(() => {
            applyURLRoute();
        }, 100);

        const loadTime = performance.now() - startTime;
        console.log(`应用初始化完成，耗时: ${loadTime.toFixed(2)}ms`);

        // 隐藏加载指示器
        hideLoadingIndicator();

        // 记录性能指标
        recordPerformanceMetrics(loadTime);

        // 测试音频路径解析（开发调试）
        testAudioPathResolution();

        // 检测音频格式支持
        checkBrowserAudioSupport();

    } catch (error) {
        console.error('应用初始化失败:', error);

        // 隐藏加载指示器并显示错误
        hideLoadingIndicator();
        showErrorIndicator('应用初始化失败，请刷新页面重试');

        // 即使出错也要显示基本界面
        renderCourseList();
    }
}

// 文档加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    initHeaderNavigation();
    optimizeAudioUserExperience();
    initUserExperienceEnhancements();
});

// ===== 性能优化功能 =====

// 音频懒加载管理器
const AudioLazyLoader = {
    loadedAudios: new Set(),
    preloadQueue: [],
    maxConcurrentLoads: 3,
    currentLoads: 0,

    // 懒加载音频文件
    async lazyLoadAudio(audioPath) {
        if (this.loadedAudios.has(audioPath)) {
            return true;
        }

        if (this.currentLoads >= this.maxConcurrentLoads) {
            return new Promise((resolve) => {
                this.preloadQueue.push({ audioPath, resolve });
            });
        }

        return this.loadAudio(audioPath);
    },

    // 加载单个音频文件
    async loadAudio(audioPath) {
        this.currentLoads++;

        try {
            const audio = new Audio();

            // 解析音频路径
            const resolvedPath = this.resolveAudioPath(audioPath);
            console.log(`AudioLazyLoader: 解析路径 ${audioPath} -> ${resolvedPath}`);

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('音频加载超时'));
                }, 10000); // 10秒超时

                audio.oncanplaythrough = () => {
                    clearTimeout(timeout);
                    this.loadedAudios.add(audioPath);
                    this.currentLoads--;
                    this.processQueue();
                    console.log(`AudioLazyLoader: 音频加载成功 ${resolvedPath}`);
                    resolve(true);
                };

                audio.onerror = (e) => {
                    clearTimeout(timeout);
                    this.currentLoads--;
                    this.processQueue();
                    console.error(`AudioLazyLoader: 音频加载失败 ${resolvedPath}`, e);
                    reject(new Error(`音频加载失败: ${resolvedPath}`));
                };

                audio.src = resolvedPath;
            });

        } catch (error) {
            this.currentLoads--;
            this.processQueue();
            throw error;
        }
    },

    // 解析音频路径
    resolveAudioPath(audioPath) {
        // 使用全局的路径解析函数，确保一致性
        return resolveAudioFilePath(audioPath);
    },

    // 处理预加载队列
    processQueue() {
        if (this.preloadQueue.length > 0 && this.currentLoads < this.maxConcurrentLoads) {
            const { audioPath, resolve } = this.preloadQueue.shift();
            this.loadAudio(audioPath).then(resolve).catch(resolve);
        }
    },

    // 预加载音频文件
    async preloadAudio(audioPath) {
        if (this.loadedAudios.has(audioPath)) {
            return true;
        }

        try {
            await this.lazyLoadAudio(audioPath);
            console.log(`预加载完成: ${audioPath}`);
            return true;
        } catch (error) {
            console.warn(`预加载失败: ${audioPath}`, error);
            return false;
        }
    },

    // 批量预加载
    async batchPreload(audioPaths) {
        const promises = audioPaths.map(path => this.preloadAudio(path));
        const results = await Promise.allSettled(promises);

        const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
        console.log(`批量预加载完成: ${successful}/${audioPaths.length}`);

        return results;
    },

    // 检查音频是否已加载
    isLoaded(audioPath) {
        return this.loadedAudios.has(audioPath);
    },

    // 清除缓存
    clearCache() {
        this.loadedAudios.clear();
        this.preloadQueue = [];
        console.log('音频缓存已清除');
    }
};

// 加载状态管理器
const LoadingManager = {
    activeLoaders: new Set(),

    // 显示加载指示器
    show(id, message = '加载中...') {
        this.activeLoaders.add(id);
        this.updateGlobalLoadingState();

        // 显示特定加载器
        const loader = document.querySelector(`[data-loader-id="${id}"]`);
        if (loader) {
            loader.style.display = 'flex';
            const messageEl = loader.querySelector('.loading-message');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
    },

    // 隐藏加载指示器
    hide(id) {
        this.activeLoaders.delete(id);
        this.updateGlobalLoadingState();

        // 隐藏特定加载器
        const loader = document.querySelector(`[data-loader-id="${id}"]`);
        if (loader) {
            loader.style.display = 'none';
        }
    },

    // 更新全局加载状态
    updateGlobalLoadingState() {
        const globalLoader = document.getElementById('global-loading-indicator');
        if (globalLoader) {
            if (this.activeLoaders.size > 0) {
                globalLoader.style.display = 'flex';
                globalLoader.querySelector('.loading-count').textContent = this.activeLoaders.size;
            } else {
                globalLoader.style.display = 'none';
            }
        }
    },

    // 检查是否有活动的加载器
    hasActiveLoaders() {
        return this.activeLoaders.size > 0;
    },

    // 获取活动加载器列表
    getActiveLoaders() {
        return Array.from(this.activeLoaders);
    }
};

// 性能监控器
const PerformanceMonitor = {
    metrics: {
        appInitTime: 0,
        audioLoadTimes: [],
        contentSwitchTimes: [],
        errorCounts: {
            audioLoad: 0,
            contentLoad: 0,
            network: 0
        }
    },

    // 记录应用初始化时间
    recordAppInitTime(time) {
        this.metrics.appInitTime = time;
        console.log(`应用初始化性能: ${time.toFixed(2)}ms`);

        // 如果超过3秒，记录警告
        if (time > 3000) {
            console.warn('应用初始化时间超过3秒，可能影响用户体验');
        }
    },

    // 记录音频加载时间
    recordAudioLoadTime(audioPath, time) {
        this.metrics.audioLoadTimes.push({ audioPath, time, timestamp: Date.now() });
        console.log(`音频加载性能: ${audioPath} - ${time.toFixed(2)}ms`);

        // 保持最近100条记录
        if (this.metrics.audioLoadTimes.length > 100) {
            this.metrics.audioLoadTimes.shift();
        }
    },

    // 记录内容切换时间
    recordContentSwitchTime(courseId, part, time) {
        this.metrics.contentSwitchTimes.push({ courseId, part, time, timestamp: Date.now() });
        console.log(`内容切换性能: ${courseId}-${part} - ${time.toFixed(2)}ms`);

        // 保持最近50条记录
        if (this.metrics.contentSwitchTimes.length > 50) {
            this.metrics.contentSwitchTimes.shift();
        }
    },

    // 记录错误
    recordError(type, error) {
        if (this.metrics.errorCounts[type] !== undefined) {
            this.metrics.errorCounts[type]++;
        }
        console.error(`性能监控 - ${type}错误:`, error);
    },

    // 获取性能报告
    getPerformanceReport() {
        const avgAudioLoadTime = this.metrics.audioLoadTimes.length > 0
            ? this.metrics.audioLoadTimes.reduce((sum, item) => sum + item.time, 0) / this.metrics.audioLoadTimes.length
            : 0;

        const avgContentSwitchTime = this.metrics.contentSwitchTimes.length > 0
            ? this.metrics.contentSwitchTimes.reduce((sum, item) => sum + item.time, 0) / this.metrics.contentSwitchTimes.length
            : 0;

        return {
            appInitTime: this.metrics.appInitTime,
            avgAudioLoadTime: avgAudioLoadTime.toFixed(2),
            avgContentSwitchTime: avgContentSwitchTime.toFixed(2),
            totalAudioLoads: this.metrics.audioLoadTimes.length,
            totalContentSwitches: this.metrics.contentSwitchTimes.length,
            errorCounts: { ...this.metrics.errorCounts }
        };
    },

    // 清除性能数据
    clearMetrics() {
        this.metrics = {
            appInitTime: 0,
            audioLoadTimes: [],
            contentSwitchTimes: [],
            errorCounts: {
                audioLoad: 0,
                contentLoad: 0,
                network: 0
            }
        };
        console.log('性能监控数据已清除');
    }
};

// 预加载策略管理器
const PreloadStrategy = {
    // 智能预加载当前课程的相关音频
    async preloadCurrentCourse(courseId) {
        const course = AppState.courses.find(c => c.id === courseId);
        if (!course) return;

        const audioFiles = [];

        // 收集Part A音频
        if (course.partA && Array.isArray(course.partA)) {
            course.partA.forEach(paragraph => {
                if (paragraph.audioFile) {
                    audioFiles.push(paragraph.audioFile);
                }
            });
        }

        // 收集Part B音频
        if (course.partB && course.partB.length > 0) {
            course.partB.forEach(paragraph => {
                if (paragraph.audioFile) {
                    audioFiles.push(paragraph.audioFile);
                }
            });
        }

        if (audioFiles.length > 0) {
            console.log(`开始预加载课程 ${courseId} 的音频文件:`, audioFiles);
            await AudioLazyLoader.batchPreload(audioFiles);
        }
    },

    // 预加载下一个可能访问的课程
    async preloadNextCourse(currentCourseId) {
        const currentIndex = AppState.courses.findIndex(c => c.id === currentCourseId);
        if (currentIndex === -1 || currentIndex >= AppState.courses.length - 1) return;

        const nextCourse = AppState.courses[currentIndex + 1];
        if (nextCourse) {
            console.log(`预加载下一个课程: ${nextCourse.id}`);
            await this.preloadCurrentCourse(nextCourse.id);
        }
    },

    // 基于用户行为的智能预加载
    async intelligentPreload() {
        // 如果用户已经选择了课程，预加载该课程的所有音频
        if (AppState.currentCourse) {
            await this.preloadCurrentCourse(AppState.currentCourse);

            // 延迟预加载下一个课程
            setTimeout(() => {
                this.preloadNextCourse(AppState.currentCourse);
            }, 2000);
        } else {
            // 如果没有选择课程，预加载第一个课程的Part A
            if (AppState.courses.length > 0) {
                const firstCourse = AppState.courses[0];
                if (firstCourse.partA && Array.isArray(firstCourse.partA) && firstCourse.partA.length > 0) {
                    const firstParagraph = firstCourse.partA[0];
                    if (firstParagraph.audioFile) {
                        console.log('预加载第一个课程的Part A音频');
                        await AudioLazyLoader.preloadAudio(firstParagraph.audioFile);
                    }
                }
            }
        }
    }
};

// 初始化性能优化功能
function initPerformanceOptimizations() {
    console.log('初始化性能优化功能...');

    // 创建全局加载指示器
    createGlobalLoadingIndicator();

    // 启动智能预加载
    setTimeout(() => {
        PreloadStrategy.intelligentPreload();
    }, 1000);

    // 监听状态变更以触发预加载
    addStateListener('stateChange', (data) => {
        if (data.courseId && data.courseId !== data.previous?.course) {
            // 课程变更时预加载新课程
            setTimeout(() => {
                PreloadStrategy.preloadCurrentCourse(data.courseId);
            }, 500);
        }
    });

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            // 页面重新可见时，继续预加载
            PreloadStrategy.intelligentPreload();
        }
    });

    console.log('性能优化功能初始化完成');
}

// 显示全局加载指示器
function showLoadingIndicator() {
    LoadingManager.show('app-init', '正在初始化应用...');
}

// 隐藏全局加载指示器
function hideLoadingIndicator() {
    LoadingManager.hide('app-init');
}

// 显示错误指示器
function showErrorIndicator(message) {
    const errorContainer = document.getElementById('error-indicator');
    if (errorContainer) {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';

        // 5秒后自动隐藏
        setTimeout(() => {
            errorContainer.style.display = 'none';
        }, 5000);
    }
}

// 测试音频路径解析（开发调试用）
function testAudioPathResolution() {
    const testPaths = [
        'Sound/Class01/a_1.opus',
        './Sound/Class01/a_1.opus',
        'Class01/a_1.opus',
        'Sound/Class02/b_2.opus'
    ];

    console.log('=== 音频路径解析测试 ===');
    console.log(`当前页面路径: ${window.location.pathname}`);
    console.log(`当前Hash: ${window.location.hash}`);
    console.log(`当前完整URL: ${window.location.href}`);
    console.log(`基础路径: ${getBasePath()}`);
    console.log(`是否为GitHub Pages: ${window.location.origin.includes('github.io')}`);

    // 分析hash路径
    if (window.location.hash && window.location.hash.includes('/')) {
        const hashPath = window.location.hash.substring(1);
        const hashSegments = hashPath.split('/').filter(segment => segment.length > 0);
        console.log(`Hash路径段数: ${hashSegments.length} (${hashSegments.join(', ')})`);
        console.log(`实际使用的相对路径: ../../`);
        console.log(`示例: 如果hash是 #Class01/A，则音频路径应该是 ../../Sound/Class01/a_1.opus`);
    }

    testPaths.forEach(path => {
        try {
            const resolved = resolveAudioFilePath(path);
            console.log(`${path} -> ${resolved}`);
        } catch (error) {
            console.error(`${path} -> ERROR: ${error.message}`);
        }
    });
    console.log('=== 测试结束 ===');
}

// 检测浏览器音频格式支持
function checkBrowserAudioSupport() {
    const audio = new Audio();
    const formats = {
        opus: audio.canPlayType('audio/opus'),
        ogg_opus: audio.canPlayType('audio/ogg; codecs="opus"'),
        webm_opus: audio.canPlayType('audio/webm; codecs="opus"'),
        mp3: audio.canPlayType('audio/mpeg'),
        wav: audio.canPlayType('audio/wav'),
        ogg: audio.canPlayType('audio/ogg'),
        m4a: audio.canPlayType('audio/mp4'),
        aac: audio.canPlayType('audio/aac')
    };

    console.log('=== 浏览器音频格式支持检测 ===');
    console.log(`浏览器: ${navigator.userAgent.split(' ').pop()}`);

    Object.entries(formats).forEach(([format, support]) => {
        const supportLevel = support === 'probably' ? '✅ 完全支持' :
            support === 'maybe' ? '⚠️ 可能支持' : '❌ 不支持';
        console.log(`${format}: ${supportLevel} (${support})`);
    });

    // 特别检查Opus支持
    const opusSupported = formats.opus !== '' || formats.ogg_opus !== '' || formats.webm_opus !== '';
    if (!opusSupported) {
        console.warn('⚠️ 当前浏览器不支持Opus格式！建议提供MP3格式的备用文件。');
        console.log('💡 解决方案：');
        console.log('1. 使用在线转换工具将.opus文件转换为.mp3格式');
        console.log('2. 或者使用支持Opus的现代浏览器（Chrome 33+, Firefox 15+, Edge 14+）');
    } else {
        console.log('✅ 当前浏览器支持Opus格式');
    }

    console.log('=== 检测结束 ===');
    return formats;
}

// 暴露音频格式检测到全局
window.checkAudioSupport = checkBrowserAudioSupport;

// 手动测试音频播放（开发调试用）
window.testAudioPlayback = function (audioPath) {
    console.log(`手动测试音频播放: ${audioPath}`);

    try {
        const resolvedPath = resolveAudioFilePath(audioPath);
        console.log(`解析后路径: ${resolvedPath}`);

        const audio = new Audio();
        audio.src = resolvedPath;

        audio.oncanplaythrough = () => {
            console.log(`音频可以播放: ${resolvedPath}`);
            audio.play().then(() => {
                console.log(`音频播放开始: ${resolvedPath}`);
            }).catch(error => {
                console.error(`音频播放失败: ${resolvedPath}`, error);
            });
        };

        audio.onerror = (e) => {
            console.error(`音频加载失败: ${resolvedPath}`, e);
        };

    } catch (error) {
        console.error(`测试失败: ${audioPath}`, error);
    }
};

// 测试当前页面所有音频控件（开发调试用）
window.testAllAudioControls = function () {
    console.log('=== 测试所有音频控件 ===');

    const audioControls = document.querySelectorAll('.audio-controls[data-audio-id]');
    console.log(`找到 ${audioControls.length} 个音频控件`);

    audioControls.forEach((control, index) => {
        const audioId = control.dataset.audioId;
        const audioFile = control.dataset.audioFile;

        console.log(`控件 ${index + 1}: ID=${audioId}, 文件=${audioFile}`);

        if (AudioPlayerManager) {
            const player = AudioPlayerManager.getPlayer(audioId);
            if (player) {
                console.log(`  播放器状态: ${player.currentState}`);
                console.log(`  音频源: ${player.audio ? player.audio.src : '未设置'}`);
            } else {
                console.log(`  播放器未找到`);
            }
        }
    });

    console.log('=== 测试结束 ===');
};

// 记录性能指标
function recordPerformanceMetrics(loadTime) {
    PerformanceMonitor.recordAppInitTime(loadTime);

    // 如果支持Performance API，记录更多指标
    if (window.performance && window.performance.getEntriesByType) {
        const navigationEntries = window.performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
            const nav = navigationEntries[0];
            console.log('页面性能指标:', {
                DNS查询: `${(nav.domainLookupEnd - nav.domainLookupStart).toFixed(2)}ms`,
                TCP连接: `${(nav.connectEnd - nav.connectStart).toFixed(2)}ms`,
                请求响应: `${(nav.responseEnd - nav.requestStart).toFixed(2)}ms`,
                DOM解析: `${(nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart).toFixed(2)}ms`,
                页面加载: `${(nav.loadEventEnd - nav.loadEventStart).toFixed(2)}ms`
            });
        }
    }
}

// 创建全局加载指示器
function createGlobalLoadingIndicator() {
    // 检查是否已存在
    if (document.getElementById('global-loading-indicator')) return;

    const indicator = document.createElement('div');
    indicator.id = 'global-loading-indicator';
    indicator.className = 'global-loading-indicator';
    indicator.style.display = 'none';

    indicator.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner"></div>
            <div class="loading-message">加载中...</div>
            <div class="loading-details">
                活动任务: <span class="loading-count">0</span>
            </div>
        </div>
    `;

    document.body.appendChild(indicator);

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
        .global-loading-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            padding: 1rem 1.5rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 0.9rem;
            color: #495057;
            min-width: 200px;
            animation: slideInRight 0.3s ease-out;
        }
        
        .global-loading-indicator .loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #e9ecef;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0;
        }
        
        .loading-content {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        
        .loading-message {
            font-weight: 500;
            color: #2c3e50;
        }
        
        .loading-details {
            font-size: 0.8rem;
            color: #7f8c8d;
        }
        
        .loading-count {
            font-weight: 600;
            color: #667eea;
        }
        
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @media (max-width: 768px) {
            .global-loading-indicator {
                top: 10px;
                right: 10px;
                left: 10px;
                min-width: auto;
                padding: 0.75rem 1rem;
            }
        }
    `;

    document.head.appendChild(style);
}



// 发现data目录下的课程文件夹
async function discoverCourses() {
    // 由于浏览器安全限制，无法直接读取文件系统
    // 这里使用预定义的课程列表，基于现有的data目录结构
    const knownCourses = ['Class01', 'Class02'];

    // 验证课程文件夹是否存在（通过尝试加载JSON文件）
    const validCourses = [];
    for (const course of knownCourses) {
        const isValid = await validateCourseFolder(course);
        if (isValid) {
            validCourses.push(course);
        }
    }

    return validCourses;
}

// 验证课程文件夹是否存在有效的JSON文件
async function validateCourseFolder(courseFolder) {
    try {
        // 尝试检查courses.json文件是否存在
        const jsonPath = `data/${courseFolder}/courses.json`;
        const exists = await checkJSONFileExists(jsonPath);
        return exists;
    } catch (error) {
        console.warn(`课程文件夹 ${courseFolder} 验证失败:`, error);
        return false;
    }
}

// 检查音频文件是否存在
function checkAudioFileExists(audioPath) {
    return new Promise((resolve) => {
        const audio = new Audio();

        const timeout = setTimeout(() => {
            resolve(false);
        }, 3000); // 3秒超时

        audio.oncanplaythrough = () => {
            clearTimeout(timeout);
            resolve(true);
        };

        audio.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
        };

        audio.src = audioPath;
    });
}

// 检查JSON文件是否存在
async function checkJSONFileExists(jsonPath) {
    try {
        const response = await fetch(jsonPath);
        return response.ok;
    } catch (error) {
        console.warn(`检查JSON文件失败: ${jsonPath}`, error);
        return false;
    }
}



// 生成课程名称
function generateCourseName(courseFolder) {
    // 将Class01转换为"第一课"等
    const classNumber = courseFolder.replace('Class', '');
    const numberMap = {
        '01': '一',
        '02': '二',
        '03': '三',
        '04': '四',
        '05': '五',
        '06': '六',
        '07': '七',
        '08': '八',
        '09': '九',
        '10': '十'
    };

    const chineseName = numberMap[classNumber] || classNumber;
    return `第${chineseName}课`;
}

// ===== 课程内容数据管理 =====

// 加载课程内容数据
async function loadCourseContentData() {
    try {
        console.log('加载课程内容数据...');

        // 发现data目录下的课程
        const courseIds = await discoverCourses();
        const courses = [];

        // 为每个课程加载JSON数据
        for (const courseId of courseIds) {
            try {
                const courseData = await loadSingleCourseData(courseId);
                if (courseData) {
                    courses.push(courseData);
                }
            } catch (error) {
                console.warn(`加载课程 ${courseId} 数据失败:`, error);
            }
        }

        // 验证数据格式
        const validatedData = validateCourseData({ courses });

        // 将数据存储到Map中以便快速查找
        validatedData.courses.forEach(course => {
            AppState.courseContent.set(course.id, course);
        });

        console.log('课程内容数据加载完成:', validatedData);
        return validatedData;

    } catch (error) {
        console.error('加载课程内容数据失败:', error);

        // 返回默认的空数据结构
        return {
            courses: []
        };
    }
}

// 加载单个课程的数据
async function loadSingleCourseData(courseId) {
    try {
        const response = await fetch(`data/${courseId}/courses.json`);
        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }

        const courseData = await response.json();
        console.log(`课程 ${courseId} 数据加载成功:`, courseData);

        return courseData;

    } catch (error) {
        console.error(`加载课程 ${courseId} 数据失败:`, error);
        return null;
    }
}

// 验证课程数据格式
function validateCourseData(data) {
    if (!data || typeof data !== 'object') {
        throw new Error('课程数据格式无效：不是有效的对象');
    }

    if (!Array.isArray(data.courses)) {
        throw new Error('课程数据格式无效：courses不是数组');
    }

    // 验证每个课程的数据结构
    const validatedCourses = data.courses.filter(course => {
        try {
            return validateSingleCourse(course);
        } catch (error) {
            console.warn(`课程 ${course?.id || '未知'} 数据验证失败:`, error.message);
            return false;
        }
    });

    return {
        courses: validatedCourses
    };
}

// 验证单个课程数据
function validateSingleCourse(course) {
    if (!course || typeof course !== 'object') {
        throw new Error('课程数据不是有效对象');
    }

    // 必需字段验证
    if (!course.id || typeof course.id !== 'string') {
        throw new Error('课程ID无效');
    }

    if (!course.name || typeof course.name !== 'string') {
        throw new Error('课程名称无效');
    }

    // Part A验证（可选）
    if (course.partA && !validatePartAData(course.partA)) {
        throw new Error('Part A数据格式无效');
    }

    // Part B验证（可选）
    if (course.partB && !validatePartBData(course.partB)) {
        throw new Error('Part B数据格式无效');
    }

    // 至少要有Part A或Part B
    if ((!course.partA || course.partA.length === 0) && (!course.partB || course.partB.length === 0)) {
        throw new Error('课程必须包含Part A或Part B内容');
    }

    return true;
}

// 验证Part A数据
function validatePartAData(partA) {
    // Part A现在是段落数组，类似于Part B
    if (!Array.isArray(partA)) {
        return false;
    }

    return partA.every(paragraph => {
        return (
            paragraph &&
            typeof paragraph === 'object' &&
            typeof paragraph.paragraph === 'number' &&
            typeof paragraph.originalText === 'string' &&
            typeof paragraph.jyutping === 'string' &&
            (typeof paragraph.audioFile === 'string' || paragraph.audioFile === undefined)
        );
    });
}

// 验证Part B数据
function validatePartBData(partB) {
    if (!Array.isArray(partB)) {
        return false;
    }

    return partB.every(paragraph => {
        return (
            paragraph &&
            typeof paragraph === 'object' &&
            typeof paragraph.paragraph === 'number' &&
            typeof paragraph.originalText === 'string' &&
            typeof paragraph.jyutping === 'string' &&
            (typeof paragraph.audioFile === 'string' || paragraph.audioFile === undefined)
        );
    });
}

// 获取特定课程的内容数据
function getCourseContent(courseId) {
    const courseContent = AppState.courseContent.get(courseId);
    if (!courseContent) {
        console.warn(`未找到课程 ${courseId} 的内容数据`);
        return null;
    }

    return courseContent;
}

// 获取特定课程和部分的内容
function getPartContent(courseId, part) {
    const courseContent = getCourseContent(courseId);
    if (!courseContent) {
        return null;
    }

    if (part === 'A') {
        return courseContent.partA || [];
    } else if (part === 'B') {
        return courseContent.partB || [];
    }

    console.warn(`无效的部分标识: ${part}`);
    return null;
}



// ===== 错误处理和工具函数 =====

// 处理数据加载错误
function handleDataLoadError(error, context = '数据加载') {
    console.error(`${context}错误:`, error);

    // 可以在这里添加用户通知逻辑
    // 例如显示错误消息给用户

    return {
        success: false,
        error: error.message || '未知错误',
        context: context
    };
}

// 检查课程数据完整性
function checkCourseDataIntegrity() {
    const issues = [];

    AppState.courses.forEach(course => {
        // 检查是否有内容数据
        if (!course.hasContent) {
            issues.push(`课程 ${course.id} 缺少内容数据`);
        }

        // 检查Part A
        if (course.partA && Array.isArray(course.partA)) {
            course.partA.forEach(paragraph => {
                if (paragraph.audioFile && (!paragraph.originalText || !paragraph.jyutping)) {
                    issues.push(`课程 ${course.id} Part A 第${paragraph.paragraph}段有音频但缺少文本内容`);
                }
            });
        }

        // 检查Part B
        if (course.partB && course.partB.length > 0) {
            course.partB.forEach(paragraph => {
                if (paragraph.hasAudio && !paragraph.hasContent) {
                    issues.push(`课程 ${course.id} Part B 第${paragraph.paragraph}段有音频但缺少文本内容`);
                }
            });
        }
    });

    if (issues.length > 0) {
        console.warn('课程数据完整性检查发现问题:', issues);
    } else {
        console.log('课程数据完整性检查通过');
    }

    return issues;
}

// 获取课程统计信息
function getCourseStatistics() {
    const stats = {
        totalCourses: AppState.courses.length,
        coursesWithContent: 0,
        totalPartA: 0,
        totalPartB: 0,
        totalParagraphs: 0
    };

    AppState.courses.forEach(course => {
        if (course.hasContent) {
            stats.coursesWithContent++;
        }

        if (course.partA && Array.isArray(course.partA) && course.partA.length > 0) {
            stats.totalPartA++;
            stats.totalParagraphs += course.partA.length;
        }

        if (course.partB && course.partB.length > 0) {
            stats.totalPartB++;
            stats.totalParagraphs += course.partB.length;
        }
    });

    return stats;
}

// 显示调试信息
function displayDebugInfo() {
    const debugContainer = document.getElementById('debug-container');
    if (!debugContainer) return;

    const stats = getCourseStatistics();
    const issues = checkCourseDataIntegrity();

    let debugHTML = `
        <h4>扫描结果统计</h4>
        <ul>
            <li>总课程数: ${stats.totalCourses}</li>
            <li>有内容数据的课程: ${stats.coursesWithContent}</li>
            <li>Part A 总数: ${stats.totalPartA}</li>
            <li>Part B 总数: ${stats.totalPartB}</li>
            <li>总段落数: ${stats.totalParagraphs}</li>
        </ul>
        
        <h4>课程详情</h4>
        <ul>
    `;

    AppState.courses.forEach(course => {
        debugHTML += `
            <li>
                <strong>${course.name} (${course.id})</strong>
                - 有内容: ${course.hasContent ? '是' : '否'}
                <ul>
        `;

        if (course.partA && Array.isArray(course.partA)) {
            debugHTML += `<li>Part A: ${course.partA.length}段`;
            course.partA.forEach(p => {
                debugHTML += ` [${p.paragraph}: 音频=${p.audioFile ? '是' : '否'}, 内容=${p.originalText && p.jyutping ? '是' : '否'}]`;
            });
            debugHTML += `</li>`;
        }

        if (course.partB && course.partB.length > 0) {
            debugHTML += `<li>Part B: ${course.partB.length}段`;
            course.partB.forEach(p => {
                debugHTML += ` [${p.paragraph}: 音频=${p.hasAudio ? '是' : '否'}, 内容=${p.hasContent ? '是' : '否'}]`;
            });
            debugHTML += `</li>`;
        }

        debugHTML += `</ul></li>`;
    });

    debugHTML += '</ul>';

    if (issues.length > 0) {
        debugHTML += `
            <h4>数据完整性问题</h4>
            <ul style="color: orange;">
        `;
        issues.forEach(issue => {
            debugHTML += `<li>${issue}</li>`;
        });
        debugHTML += '</ul>';
    } else {
        debugHTML += '<p style="color: green;">✓ 数据完整性检查通过</p>';
    }

    debugContainer.innerHTML = debugHTML;
}

// UI渲染功能已通过具体的组件渲染函数实现（renderCourseList, renderContentDisplay等）

// ===== CourseList组件功能 =====

// 渲染课程列表
function renderCourseList() {
    const courseContainer = document.getElementById('course-container');
    if (!courseContainer) {
        console.error('找不到课程容器元素');
        return;
    }

    // 清除加载状态
    courseContainer.innerHTML = '';

    if (AppState.courses.length === 0) {
        renderEmptyCourseList(courseContainer);
        return;
    }

    // 渲染每个课程
    AppState.courses.forEach(course => {
        const courseElement = createCourseElement(course);
        courseContainer.appendChild(courseElement);
    });

    // 初始化课程交互
    initCourseInteractions();
}

// 创建单个课程元素
function createCourseElement(course) {
    const courseDiv = document.createElement('div');
    courseDiv.className = 'course-item';
    courseDiv.dataset.courseId = course.id;

    // 计算课程状态
    const status = calculateCourseStatus(course);

    courseDiv.innerHTML = `
        <div class="course-title">
            <span>${course.name}</span>
            <span class="course-id">(${course.id})</span>
        </div>
        
        <div class="course-status">
            <span class="status-indicator ${status.class}"></span>
            <span>${status.text}</span>
        </div>
        
        <div class="part-selector">
            ${createPartButton(course, 'A')}
            ${createPartButton(course, 'B')}
        </div>
    `;

    return courseDiv;
}

// 创建Part按钮
function createPartButton(course, part) {
    const isPartA = part === 'A';
    const partData = isPartA ? course.partA : course.partB;

    // 检查是否有该部分的内容
    const hasContent = isPartA ?
        (partData && Array.isArray(partData) && partData.length > 0) :
        (partData && partData.length > 0);

    const hasTextContent = isPartA ?
        (partData && Array.isArray(partData) && partData.every(p => p.originalText && p.jyutping)) :
        (partData && partData.some(p => p.originalText && p.jyutping));

    let buttonClass = 'part-btn';
    let buttonText = `Part ${part}`;

    if (!hasContent) {
        buttonClass += ' disabled';
        buttonText += ' (无内容)';
    } else if (!hasTextContent) {
        buttonText += ' (仅音频)';
    }

    // 检查是否为当前选中状态
    if (AppState.currentCourse === course.id && AppState.currentPart === part) {
        buttonClass += ' selected';
    }

    return `
        <button class="${buttonClass}" 
                data-course="${course.id}" 
                data-part="${part}"
                ${!hasContent ? 'disabled' : ''}>
            ${buttonText}
        </button>
    `;
}

// 计算课程状态
function calculateCourseStatus(course) {
    let hasAudio = false;
    let hasText = false;
    let totalParts = 0;
    let completeParts = 0;

    // 检查Part A
    if (course.partA && Array.isArray(course.partA) && course.partA.length > 0) {
        totalParts++;
        const hasPartAAudio = course.partA.some(p => p.audioFile);
        const hasPartAText = course.partA.every(p => p.originalText && p.jyutping);

        if (hasPartAAudio) hasAudio = true;
        if (hasPartAText) {
            hasText = true;
            completeParts++;
        }
    }

    // 检查Part B
    if (course.partB && course.partB.length > 0) {
        totalParts++;
        const hasPartBAudio = course.partB.some(p => p.hasAudio);
        const hasPartBText = course.partB.some(p => p.hasContent);

        if (hasPartBAudio) hasAudio = true;
        if (hasPartBText) {
            hasText = true;
            completeParts++;
        }
    }

    if (completeParts === totalParts && hasText) {
        return { class: 'complete', text: '内容完整' };
    } else if (hasAudio && hasText) {
        return { class: 'partial', text: '部分内容' };
    } else if (hasAudio) {
        return { class: 'partial', text: '仅有音频' };
    } else {
        return { class: 'missing', text: '无内容' };
    }
}

// 渲染空课程列表
function renderEmptyCourseList(container) {
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">📚</div>
            <h3>暂无课程</h3>
            <p>请检查Sound目录是否包含课程文件，或稍后重试。</p>
            <button onclick="location.reload()" class="retry-btn">重新加载</button>
        </div>
    `;
}

// 初始化课程交互
function initCourseInteractions() {
    const partButtons = document.querySelectorAll('.part-btn:not(.disabled)');

    partButtons.forEach(button => {
        button.addEventListener('click', handlePartSelection);
    });
}

// 处理Part选择
function handlePartSelection(event) {
    const button = event.target;
    const courseId = button.dataset.course;
    const part = button.dataset.part;

    // 防止重复点击
    if (ContentSwitcher.isSwitching) {
        console.log('内容正在切换中，忽略点击');
        return;
    }

    // 添加按钮选择动画
    button.classList.add('selecting');

    // 添加课程项目选择动画
    const courseItem = button.closest('.course-item');
    if (courseItem) {
        courseItem.classList.add('selecting');
    }

    // 使用新的状态管理系统
    const success = setCurrentSelection(courseId, part);

    if (success) {
        // 更新按钮选中状态
        updatePartButtonStates(courseId, part);

        // 更新课程项目选中状态
        updateCourseItemStates(courseId);

        // 触发内容显示更新（使用动画）
        renderContentDisplay(courseId, part);

        // 添加视觉反馈
        button.classList.add('clicked');
        setTimeout(() => {
            button.classList.remove('clicked', 'selecting');
        }, 200);

        // 清理课程项目动画
        setTimeout(() => {
            if (courseItem) {
                courseItem.classList.remove('selecting');
            }
        }, 400);

    } else {
        console.error('选择失败:', { courseId, part });

        // 清理动画类
        button.classList.remove('selecting');
        if (courseItem) {
            courseItem.classList.remove('selecting');
        }
    }
}

// 更新Part按钮状态
function updatePartButtonStates(selectedCourse, selectedPart) {
    const allButtons = document.querySelectorAll('.part-btn');

    allButtons.forEach(button => {
        const courseId = button.dataset.course;
        const part = button.dataset.part;

        if (courseId === selectedCourse && part === selectedPart) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });
}

// 更新课程项目状态
function updateCourseItemStates(selectedCourse) {
    const allCourseItems = document.querySelectorAll('.course-item');

    allCourseItems.forEach(item => {
        const courseId = item.dataset.courseId;

        if (courseId === selectedCourse) {
            item.classList.add('has-selection');
        } else {
            item.classList.remove('has-selection');
        }
    });
}

// 获取当前选中的课程和部分
function getCurrentSelection() {
    return {
        courseId: AppState.currentCourse,
        part: AppState.currentPart,
        isValid: AppState.currentCourse && AppState.currentPart
    };
}

// ===== 内容切换逻辑和动画管理 =====

/**
 * 内容切换管理器
 */
const ContentSwitcher = {
    // 当前切换状态
    isSwitching: false,

    // 动画类型配置
    animationTypes: {
        fade: 'fade',
        slide: 'slide',
        scale: 'scale',
        flip: 'flip'
    },

    // 当前动画类型
    currentAnimationType: 'fade',

    // 切换方向（用于滑动动画）
    switchDirection: 'right',

    // 动画持续时间配置
    durations: {
        exit: 300,
        enter: 500,
        total: 800
    }
};

/**
 * 设置动画类型
 * @param {string} type - 动画类型
 */
function setContentAnimationType(type) {
    if (ContentSwitcher.animationTypes[type]) {
        ContentSwitcher.currentAnimationType = type;
        console.log(`内容切换动画类型设置为: ${type}`);
    }
}

/**
 * 确定切换方向
 * @param {string} fromPart - 原部分
 * @param {string} toPart - 目标部分
 * @returns {string} 切换方向
 */
function determineSwitchDirection(fromPart, toPart) {
    if (!fromPart || !toPart) return 'right';

    // A -> B: 向右, B -> A: 向左
    if (fromPart === 'A' && toPart === 'B') return 'right';
    if (fromPart === 'B' && toPart === 'A') return 'left';

    return 'right';
}

/**
 * 增强的内容切换函数
 * @param {string} courseId - 课程ID
 * @param {string} part - 部分标识
 * @param {boolean} animated - 是否使用动画
 */
function switchContentWithAnimation(courseId, part, animated = true) {
    if (ContentSwitcher.isSwitching) {
        console.log('内容正在切换中，忽略新的切换请求');
        return;
    }

    const contentContainer = document.getElementById('content-container');
    const breadcrumb = document.getElementById('content-breadcrumb');

    if (!contentContainer || !breadcrumb) {
        console.error('找不到内容显示容器元素');
        return;
    }

    // 获取当前选择状态
    const currentSelection = getCurrentSelection();
    const fromPart = currentSelection.part;

    // 确定切换方向
    ContentSwitcher.switchDirection = determineSwitchDirection(fromPart, part);

    if (animated && fromPart && fromPart !== part) {
        // 执行动画切换
        performAnimatedSwitch(courseId, part, contentContainer, breadcrumb);
    } else {
        // 直接切换（无动画）
        performDirectSwitch(courseId, part, contentContainer, breadcrumb);
    }
}

/**
 * 执行动画切换
 * @param {string} courseId - 课程ID
 * @param {string} part - 部分标识
 * @param {HTMLElement} contentContainer - 内容容器
 * @param {HTMLElement} breadcrumb - 面包屑导航
 */
function performAnimatedSwitch(courseId, part, contentContainer, breadcrumb) {
    ContentSwitcher.isSwitching = true;

    // 添加切换状态类
    contentContainer.classList.add('content-switching');

    // 停止所有当前播放的音频
    stopAllAudioPlayback();

    // 第一阶段：退出动画
    const exitClass = getExitAnimationClass();
    contentContainer.classList.add(exitClass);

    // 更新面包屑（带动画）
    updateBreadcrumbWithAnimation(courseId, part, breadcrumb);

    setTimeout(() => {
        // 清理退出动画类
        contentContainer.classList.remove(exitClass);

        // 渲染新内容
        renderNewContent(courseId, part, contentContainer);

        // 第二阶段：进入动画
        const enterClass = getEnterAnimationClass();
        contentContainer.classList.add(enterClass);

        setTimeout(() => {
            // 清理进入动画类和切换状态
            contentContainer.classList.remove(enterClass, 'content-switching');
            ContentSwitcher.isSwitching = false;

            console.log(`内容切换完成: ${courseId} - Part ${part}`);

            // 触发切换完成事件
            triggerContentSwitchComplete(courseId, part);

        }, ContentSwitcher.durations.enter);

    }, ContentSwitcher.durations.exit);
}

/**
 * 执行直接切换（无动画）
 * @param {string} courseId - 课程ID
 * @param {string} part - 部分标识
 * @param {HTMLElement} contentContainer - 内容容器
 * @param {HTMLElement} breadcrumb - 面包屑导航
 */
function performDirectSwitch(courseId, part, contentContainer, breadcrumb) {
    // 停止所有当前播放的音频
    stopAllAudioPlayback();

    // 更新面包屑
    updateContentBreadcrumb(courseId, part, breadcrumb);

    // 渲染新内容
    renderNewContent(courseId, part, contentContainer);

    console.log(`内容直接切换完成: ${courseId} - Part ${part}`);
}

/**
 * 获取退出动画类名
 * @returns {string} 动画类名
 */
function getExitAnimationClass() {
    const type = ContentSwitcher.currentAnimationType;
    const direction = ContentSwitcher.switchDirection;

    switch (type) {
        case 'slide':
            return direction === 'left' ? 'content-slide-exit-left' : 'content-slide-exit-right';
        case 'scale':
            return 'content-scale-exit';
        case 'flip':
            return 'content-flip-exit';
        default:
            return 'content-fade-exit';
    }
}

/**
 * 获取进入动画类名
 * @returns {string} 动画类名
 */
function getEnterAnimationClass() {
    const type = ContentSwitcher.currentAnimationType;
    const direction = ContentSwitcher.switchDirection;

    switch (type) {
        case 'slide':
            return direction === 'left' ? 'content-slide-enter-left' : 'content-slide-enter-right';
        case 'scale':
            return 'content-scale-enter';
        case 'flip':
            return 'content-flip-enter';
        default:
            return 'content-fade-enter';
    }
}

/**
 * 更新面包屑导航（带动画）
 * @param {string} courseId - 课程ID
 * @param {string} part - 部分标识
 * @param {HTMLElement} breadcrumb - 面包屑元素
 */
function updateBreadcrumbWithAnimation(courseId, part, breadcrumb) {
    breadcrumb.classList.add('breadcrumb-updating');

    setTimeout(() => {
        updateContentBreadcrumb(courseId, part, breadcrumb);
        breadcrumb.classList.remove('breadcrumb-updating');
        breadcrumb.classList.add('breadcrumb-updated');

        setTimeout(() => {
            breadcrumb.classList.remove('breadcrumb-updated');
        }, 400);
    }, 150);
}

/**
 * 渲染新内容
 * @param {string} courseId - 课程ID
 * @param {string} part - 部分标识
 * @param {HTMLElement} contentContainer - 内容容器
 */
function renderNewContent(courseId, part, contentContainer) {
    // 清理之前的音频控件
    cleanupPreviousAudioControls();

    // 获取课程数据
    const course = AppState.courses.find(c => c.id === courseId);
    if (!course) {
        showContentError(contentContainer, '找不到指定的课程');
        return;
    }

    // 获取内容数据
    const contentData = getPartContent(courseId, part);

    if (part === 'A') {
        renderPartAContent(contentContainer, course, contentData);
    } else if (part === 'B') {
        renderPartBContent(contentContainer, course, contentData);
    } else {
        showContentError(contentContainer, '无效的部分标识');
    }
}

/**
 * 停止所有音频播放
 */
function stopAllAudioPlayback() {
    let stoppedCount = 0;

    // 使用AudioPlayerManager停止所有播放器
    if (window.AudioPlayerManager) {
        AudioPlayerManager.players.forEach((player, audioId) => {
            if (player.currentState === 'playing' || player.currentState === 'paused') {
                try {
                    player.stop();
                    stoppedCount++;
                    console.log(`全局停止音频播放器: ${audioId}`);
                } catch (error) {
                    console.warn(`停止音频播放失败: ${audioId}`, error);
                }
            }
        });
    }

    // 备用方案：直接操作DOM中的音频控件
    const audioControls = document.querySelectorAll('.audio-controls[data-audio-id]');
    audioControls.forEach(control => {
        const audioId = control.dataset.audioId;
        if (audioId && window.AudioPlayerManager) {
            const player = AudioPlayerManager.getPlayer(audioId);
            if (player && player.audio && (player.currentState === 'playing' || player.currentState === 'paused')) {
                try {
                    player.stop();
                    stoppedCount++;
                } catch (error) {
                    console.warn(`停止音频播放失败: ${audioId}`, error);
                }
            }
        }
    });

    console.log(`已停止 ${stoppedCount} 个音频播放器`);
}

/**
 * 触发内容切换完成事件
 * @param {string} courseId - 课程ID
 * @param {string} part - 部分标识
 */
function triggerContentSwitchComplete(courseId, part) {
    // 触发自定义事件
    const event = new CustomEvent('contentSwitchComplete', {
        detail: { courseId, part }
    });
    document.dispatchEvent(event);

    // 触发状态管理事件
    triggerStateEvent('contentSwitch', {
        courseId: courseId,
        part: part,
        timestamp: Date.now()
    });
}

/**
 * 添加段落进入动画
 * @param {HTMLElement} container - 容器元素
 */
function addParagraphEnterAnimations(container) {
    const paragraphs = container.querySelectorAll('.paragraph-item');

    paragraphs.forEach((paragraph, index) => {
        // 添加进入动画类
        paragraph.classList.add('paragraph-enter');

        // 设置动画延迟
        paragraph.style.animationDelay = `${(index + 1) * 0.1}s`;

        // 动画完成后清理类名
        setTimeout(() => {
            paragraph.classList.remove('paragraph-enter');
            paragraph.style.animationDelay = '';
        }, 600 + (index * 100));
    });
}

/**
 * 添加音频控件进入动画
 * @param {HTMLElement} container - 容器元素
 */
function addAudioControlsEnterAnimations(container) {
    const audioControls = container.querySelectorAll('.audio-controls');

    audioControls.forEach((control, index) => {
        control.classList.add('audio-controls-enter');

        setTimeout(() => {
            control.classList.remove('audio-controls-enter');
        }, 400 + (index * 50));
    });
}

// ===== ContentDisplay组件功能 =====

// 渲染内容显示区域（使用新的动画切换系统）
function renderContentDisplay(courseId, part) {
    // 使用增强的内容切换函数
    switchContentWithAnimation(courseId, part, true);
}

// 清理之前的音频控件
function cleanupPreviousAudioControls() {
    // 获取所有当前的音频控件
    const audioControls = document.querySelectorAll('.audio-controls[data-audio-id]');

    audioControls.forEach(control => {
        const audioId = control.dataset.audioId;
        if (audioId) {
            // 清理对应的播放器实例
            AudioPlayerManager.destroyPlayer(audioId);
        }
    });

    console.log(`清理了 ${audioControls.length} 个音频控件`);
}

// 更新面包屑导航
function updateContentBreadcrumb(courseId, part, breadcrumb) {
    const course = AppState.courses.find(c => c.id === courseId);
    const courseName = course ? course.name : courseId;

    breadcrumb.innerHTML = `
        <span class="breadcrumb-item">${courseName}</span>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-item">Part ${part}</span>
    `;
}

// 显示加载状态
function showContentLoading(container) {
    container.innerHTML = `
        <div class="content-loading">
            <div class="loading-spinner"></div>
            <p>正在加载内容...</p>
        </div>
    `;
}

// 显示错误状态
function showContentError(container, message) {
    container.innerHTML = `
        <div class="content-error">
            <div class="error-icon">⚠️</div>
            <h3>加载失败</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="retry-btn">重新加载</button>
        </div>
    `;
}

// 渲染Part A内容
function renderPartAContent(container, course, contentData) {
    const partAData = contentData || [];

    if (partAData.length === 0) {
        showContentError(container, 'Part A 没有可用内容');
        return;
    }

    let paragraphsHTML = '';
    const audioInitTasks = []; // 存储音频初始化任务

    partAData.forEach((paragraphData, index) => {
        const paragraphNum = paragraphData.paragraph || (index + 1);
        const audioFile = paragraphData.audioFile;

        // 验证音频文件路径
        const validAudioFile = audioFile && validateAudioFilePath(audioFile);

        // 获取文本内容
        const originalText = paragraphData.originalText || '暂无原文内容';
        const jyutpingText = paragraphData.jyutping || '暂无粤拼标注';

        const audioId = `part-a-${course.id}-${paragraphNum}`;

        paragraphsHTML += `
            <div class="paragraph-item">
                <div class="paragraph-header">
                    <div class="paragraph-number">${paragraphNum}</div>
                </div>
                
                <div class="text-content">
                    <div class="original-text">${originalText}</div>
                    <div class="jyutping-text">${jyutpingText}</div>
                </div>
                
                ${validAudioFile ? createAudioControls(audioFile, audioId) : createNoAudioMessage(`第${paragraphNum}段`)}
            </div>
        `;

        // 记录需要初始化的音频控件
        if (validAudioFile) {
            audioInitTasks.push({
                audioId: audioId,
                audioFile: audioFile
            });
        }
    });

    container.innerHTML = `
        <div class="part-a-content">
            <div class="part-header">
                <h3 class="part-title">${course.name} - Part A</h3>
                <span class="part-type">${partAData.length}段内容</span>
            </div>
            
            <div class="paragraph-list">
                ${paragraphsHTML}
            </div>
        </div>
    `;

    // 添加段落进入动画
    setTimeout(() => {
        addParagraphEnterAnimations(container);
        addAudioControlsEnterAnimations(container);
    }, 50);

    // 初始化所有音频控件
    if (audioInitTasks.length > 0) {
        // 使用setTimeout确保DOM元素已经渲染
        setTimeout(() => {
            audioInitTasks.forEach(task => {
                initAudioControls(task.audioId, task.audioFile);
            });
        }, 100);
    }
}

// 渲染Part B内容
function renderPartBContent(container, course, contentData) {
    // 确保 contentData 是数组格式
    const partBData = Array.isArray(contentData) ? contentData : [];

    // 验证课程对象
    if (!course || !course.id || !course.name) {
        showContentError(container, 'Part B 课程信息无效');
        return;
    }

    if (partBData.length === 0) {
        showContentError(container, 'Part B 没有可用内容');
        return;
    }

    let paragraphsHTML = '';
    const audioInitTasks = []; // 存储音频初始化任务

    partBData.forEach((paragraphData, index) => {
        // 验证段落数据结构
        if (!paragraphData || typeof paragraphData !== 'object') {
            console.warn(`Part B 段落 ${index + 1} 数据格式无效:`, paragraphData);
            return;
        }

        // 获取段落编号，优先使用数据中的编号，否则使用索引+1
        const paragraphNum = (typeof paragraphData.paragraph === 'number' && paragraphData.paragraph > 0)
            ? paragraphData.paragraph
            : (index + 1);

        const audioFile = paragraphData.audioFile;

        // 验证音频文件路径
        const validAudioFile = audioFile && validateAudioFilePath(audioFile);

        // 获取文本内容，确保有默认值
        const originalText = (paragraphData.originalText && paragraphData.originalText.trim())
            ? paragraphData.originalText.trim()
            : '暂无原文内容';
        const jyutpingText = (paragraphData.jyutping && paragraphData.jyutping.trim())
            ? paragraphData.jyutping.trim()
            : '暂无粤拼标注';

        // 生成唯一的音频ID
        const audioId = `part-b-${course.id}-${paragraphNum}`;

        paragraphsHTML += `
            <div class="paragraph-item" data-paragraph="${paragraphNum}">
                <div class="paragraph-header">
                    <div class="paragraph-number">${paragraphNum}</div>
                </div>
                
                <div class="text-content">
                    <div class="original-text">${originalText}</div>
                    <div class="jyutping-text">${jyutpingText}</div>
                </div>
                
                ${validAudioFile ? createAudioControls(audioFile, audioId) : createNoAudioMessage(`第${paragraphNum}段`)}
            </div>
        `;

        // 记录需要初始化的音频控件
        if (validAudioFile) {
            audioInitTasks.push({
                audioId: audioId,
                audioFile: audioFile,
                paragraphNum: paragraphNum
            });
        }
    });

    // 如果没有有效的段落，显示错误
    if (!paragraphsHTML.trim()) {
        showContentError(container, 'Part B 没有有效的段落内容');
        return;
    }

    container.innerHTML = `
        <div class="part-b-content">
            <div class="part-header">
                <h3 class="part-title">${course.name} - Part B</h3>
                <span class="part-type">${partBData.length}段内容</span>
            </div>
            
            <div class="paragraph-list">
                ${paragraphsHTML}
            </div>
        </div>
    `;

    // 添加段落进入动画
    setTimeout(() => {
        addParagraphEnterAnimations(container);
        addAudioControlsEnterAnimations(container);
    }, 50);

    // 初始化所有音频控件
    if (audioInitTasks.length > 0) {
        // 使用setTimeout确保DOM元素已经渲染
        setTimeout(() => {
            audioInitTasks.forEach(task => {
                try {
                    initAudioControls(task.audioId, task.audioFile);
                    console.log(`Part B 音频控件初始化成功: 段落${task.paragraphNum}, ID: ${task.audioId}`);
                } catch (error) {
                    console.error(`Part B 音频控件初始化失败: 段落${task.paragraphNum}`, error);
                }
            });
        }, 100);
    }

    console.log(`Part B 渲染完成: ${course.name}, ${partBData.length} 个段落, ${audioInitTasks.length} 个音频控件`);
}

// 创建音频控件HTML
function createAudioControls(audioFile, audioId) {
    // 检查音频是否已预加载
    const isPreloaded = AudioLazyLoader.isLoaded(audioFile);
    const statusText = isPreloaded ? '准备就绪' : '点击播放';
    const preloadedClass = isPreloaded ? ' preloaded' : '';

    return `
        <div class="audio-controls enhanced${preloadedClass}" data-audio-id="${audioId}" data-audio-file="${audioFile}">
            <div class="audio-main-controls">
                <button class="audio-btn play-btn" data-action="play" title="播放 (空格键)">
                    <span class="btn-icon">▶️</span>
                    <span class="btn-text">播放</span>
                </button>
                <button class="audio-btn pause-btn" data-action="pause" style="display: none;" title="暂停 (空格键)">
                    <span class="btn-icon">⏸️</span>
                    <span class="btn-text">暂停</span>
                </button>
                <button class="audio-btn stop-btn" data-action="stop" title="停止 (Esc键)">
                    <span class="btn-icon">⏹️</span>
                    <span class="btn-text">停止</span>
                </button>
                <button class="audio-btn volume-btn" data-action="volume" title="音量控制">
                    <span class="btn-icon">🔊</span>
                    <span class="btn-text">音量</span>
                </button>
            </div>
            
            <div class="audio-status">${statusText}</div>
            
            <div class="audio-loading-indicator" style="display: none;">
                <div class="loading-spinner"></div>
                <span class="loading-text">加载中...</span>
            </div>
            
            <div class="audio-progress" style="display: none;">
                <div class="progress-bar" title="点击跳转到指定位置">
                    <div class="progress-fill"></div>
                </div>
                <div class="progress-time">
                    <span class="current-time">0:00</span>
                    <span class="duration">0:00</span>
                </div>
            </div>
        </div>
    `;
}

// 创建无音频消息
function createNoAudioMessage(context = '该部分') {
    return `
        <div class="audio-controls">
            <div class="audio-error">
                <span class="btn-icon">🔇</span>
                ${context}暂无音频文件
            </div>
        </div>
    `;
}

// ===== AudioPlayer类实现 =====

/**
 * 音频播放器类
 * 基于HTML5 Audio API实现，提供播放、暂停、停止控制功能
 * 包含播放状态的UI反馈和错误处理
 */
class AudioPlayer {
    constructor(audioFile, audioId) {
        this.audioFile = audioFile;
        this.audioId = audioId;
        this.audio = null;
        this.isLoading = false;
        this.hasError = false;
        this.currentState = 'stopped'; // 'stopped', 'playing', 'paused', 'loading', 'error'

        // UI元素引用
        this.controlsContainer = null;
        this.playBtn = null;
        this.pauseBtn = null;
        this.stopBtn = null;
        this.statusDiv = null;

        // 事件回调
        this.onStateChange = null;
        this.onError = null;
        this.onLoadStart = null;
        this.onLoadEnd = null;

        this.init();
    }

    /**
     * 初始化音频播放器
     */
    init() {
        try {
            // 创建Audio对象
            this.audio = new Audio();
            this.audio.preload = 'none'; // 改为none，使用懒加载

            // 绑定音频事件
            this.bindAudioEvents();

            // 获取UI元素
            this.getUIElements();

            // 绑定UI事件
            this.bindUIEvents();

            // 初始状态设置
            this.setState('stopped');
            this.updateStatus('点击播放');

            console.log(`AudioPlayer初始化完成: ${this.audioId}`);

        } catch (error) {
            console.error(`AudioPlayer初始化失败: ${this.audioId}`, error);
            this.handleError('初始化失败');
        }
    }

    /**
     * 绑定音频事件
     */
    bindAudioEvents() {
        if (!this.audio) return;

        // 加载开始
        this.audio.addEventListener('loadstart', () => {
            this.setLoadingState(true);
            if (this.onLoadStart) this.onLoadStart();
        });

        // 可以播放
        this.audio.addEventListener('canplay', () => {
            this.setLoadingState(false);
            this.updateStatus('准备就绪');
            if (this.onLoadEnd) this.onLoadEnd();
        });

        // 播放开始
        this.audio.addEventListener('play', () => {
            this.setState('playing');
            this.updateStatus('播放中');
        });

        // 暂停
        this.audio.addEventListener('pause', () => {
            if (this.currentState !== 'stopped') {
                this.setState('paused');
                this.updateStatus('已暂停');
            }
        });

        // 播放结束
        this.audio.addEventListener('ended', () => {
            this.setState('stopped');
            this.updateStatus('播放完成');
        });

        // 错误处理
        this.audio.addEventListener('error', (e) => {
            const errorMsg = this.getAudioErrorMessage(e);
            this.handleError(errorMsg);
        });

        // 加载错误
        this.audio.addEventListener('abort', () => {
            this.handleError('音频加载被中断');
        });

        // 网络状态变化
        this.audio.addEventListener('stalled', () => {
            this.updateStatus('网络缓慢，正在缓冲...');
        });

        // 等待数据
        this.audio.addEventListener('waiting', () => {
            this.updateStatus('正在缓冲...');
        });

        // 可以继续播放
        this.audio.addEventListener('canplaythrough', () => {
            if (this.currentState === 'loading') {
                this.updateStatus('准备就绪');
            }
        });
    }

    /**
     * 获取UI元素引用
     */
    getUIElements() {
        this.controlsContainer = document.querySelector(`[data-audio-id="${this.audioId}"]`);

        if (!this.controlsContainer) {
            console.warn(`找不到音频控件容器: ${this.audioId}`);
            return;
        }

        this.playBtn = this.controlsContainer.querySelector('.play-btn');
        this.pauseBtn = this.controlsContainer.querySelector('.pause-btn');
        this.stopBtn = this.controlsContainer.querySelector('.stop-btn');
        this.statusDiv = this.controlsContainer.querySelector('.audio-status');
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        if (this.playBtn) {
            this.playBtn.addEventListener('click', () => this.play());
        }

        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', () => this.pause());
        }

        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => this.stop());
        }
    }

    /**
     * 设置音频源
     */
    setAudioSource(audioFile) {
        if (!this.audio || !audioFile) return;

        try {
            this.audio.src = audioFile;
            this.audioFile = audioFile;
        } catch (error) {
            console.error(`设置音频源失败: ${audioFile}`, error);
            this.handleError('音频文件无效');
        }
    }

    /**
     * 播放音频（使用懒加载）
     */
    async play() {
        if (!this.audio || this.hasError) {
            console.warn(`无法播放音频: ${this.audioId}`);
            return false;
        }

        try {
            // 首先停止所有其他音频播放
            AudioPlayerManager.stopOtherPlayers(this.audioId);

            this.setState('loading');
            this.updateStatus('正在加载音频...');

            // 记录开始时间用于性能监控
            const startTime = performance.now();

            // 解析并验证音频文件路径
            const resolvedAudioPath = this.resolveAudioFilePath(this.audioFile);
            console.log(`解析音频路径: ${this.audioFile} -> ${resolvedAudioPath}`);

            // 使用懒加载系统加载音频
            const loadSuccess = await AudioLazyLoader.lazyLoadAudio(resolvedAudioPath);

            if (!loadSuccess) {
                throw new Error('音频懒加载失败');
            }

            // 设置音频源（如果还没有设置）
            if (!this.audio.src || !this.audio.src.endsWith(resolvedAudioPath)) {
                this.audio.src = resolvedAudioPath;
            }

            // 等待音频准备就绪
            await this.waitForAudioReady();

            // 播放音频
            await this.audio.play();

            // 记录性能指标
            const loadTime = performance.now() - startTime;
            PerformanceMonitor.recordAudioLoadTime(resolvedAudioPath, loadTime);

            console.log(`音频播放成功: ${this.audioId} - ${resolvedAudioPath}`);
            console.log(`音频实际src: ${this.audio.src}`);
            return true;

        } catch (error) {
            console.error(`播放音频失败: ${this.audioId}`, error);
            PerformanceMonitor.recordError('audioLoad', error);
            this.handleError(this.getPlayErrorMessage(error));
            return false;
        }
    }

    /**
     * 解析音频文件路径
     * 确保路径格式正确，支持新的数据结构
     */
    resolveAudioFilePath(audioFile) {
        // 使用全局的路径解析函数，确保一致性
        return resolveAudioFilePath(audioFile);
    }

    /**
     * 等待音频准备就绪
     */
    async waitForAudioReady() {
        return new Promise((resolve, reject) => {
            if (this.audio.readyState >= 2) { // HAVE_CURRENT_DATA
                resolve();
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('音频准备超时'));
            }, 5000);

            const onCanPlay = () => {
                clearTimeout(timeout);
                this.audio.removeEventListener('canplay', onCanPlay);
                this.audio.removeEventListener('error', onError);
                resolve();
            };

            const onError = (e) => {
                clearTimeout(timeout);
                this.audio.removeEventListener('canplay', onCanPlay);
                this.audio.removeEventListener('error', onError);
                reject(new Error('音频加载错误'));
            };

            this.audio.addEventListener('canplay', onCanPlay);
            this.audio.addEventListener('error', onError);
        });
    }

    /**
     * 暂停音频
     */
    pause() {
        if (!this.audio || this.currentState !== 'playing') {
            return false;
        }

        try {
            this.audio.pause();
            return true;
        } catch (error) {
            console.error(`暂停音频失败: ${this.audioId}`, error);
            this.handleError('暂停失败');
            return false;
        }
    }

    /**
     * 停止音频
     */
    stop() {
        if (!this.audio) {
            return false;
        }

        try {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.setState('stopped');
            this.updateStatus('已停止');
            return true;
        } catch (error) {
            console.error(`停止音频失败: ${this.audioId}`, error);
            this.handleError('停止失败');
            return false;
        }
    }

    /**
     * 设置播放状态
     */
    setState(newState) {
        const oldState = this.currentState;
        this.currentState = newState;

        // 更新UI状态
        this.updateUIState(newState);

        // 触发状态变化回调
        if (this.onStateChange) {
            this.onStateChange(newState, oldState);
        }

        console.log(`AudioPlayer状态变化: ${this.audioId} ${oldState} -> ${newState}`);
    }

    /**
     * 更新UI状态
     */
    updateUIState(state) {
        if (!this.playBtn || !this.pauseBtn) return;

        // 重置所有按钮状态
        this.playBtn.style.display = 'none';
        this.pauseBtn.style.display = 'none';

        // 根据状态显示对应按钮
        switch (state) {
            case 'stopped':
            case 'paused':
            case 'error':
                this.playBtn.style.display = 'inline-flex';
                this.setButtonsEnabled(state !== 'error');
                break;

            case 'playing':
                this.pauseBtn.style.display = 'inline-flex';
                this.setButtonsEnabled(true);
                break;

            case 'loading':
                this.playBtn.style.display = 'inline-flex';
                this.setButtonsEnabled(false);
                break;
        }
    }

    /**
     * 设置按钮启用状态
     */
    setButtonsEnabled(enabled) {
        const buttons = [this.playBtn, this.pauseBtn, this.stopBtn];

        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = !enabled;
                if (enabled) {
                    btn.classList.remove('disabled');
                } else {
                    btn.classList.add('disabled');
                }
            }
        });
    }

    /**
     * 设置加载状态
     */
    setLoadingState(isLoading) {
        this.isLoading = isLoading;

        if (this.controlsContainer) {
            if (isLoading) {
                this.controlsContainer.classList.add('loading');
            } else {
                this.controlsContainer.classList.remove('loading');
            }
        }
    }

    /**
     * 更新状态显示
     */
    updateStatus(message) {
        if (this.statusDiv) {
            this.statusDiv.textContent = message;
        }
    }

    /**
     * 处理错误
     */
    handleError(errorMessage) {
        this.hasError = true;
        this.setState('error');
        this.updateStatus(`错误: ${errorMessage}`);

        if (this.controlsContainer) {
            this.controlsContainer.classList.add('error');
        }

        if (this.onError) {
            this.onError(errorMessage);
        }

        console.error(`AudioPlayer错误: ${this.audioId} - ${errorMessage}`);
    }

    /**
     * 获取音频错误消息
     */
    getAudioErrorMessage(event) {
        if (!this.audio) return '未知错误';

        const error = this.audio.error;
        if (!error) return '音频加载失败';

        switch (error.code) {
            case error.MEDIA_ERR_ABORTED:
                return '音频加载被中断';
            case error.MEDIA_ERR_NETWORK:
                return '网络错误，无法加载音频';
            case error.MEDIA_ERR_DECODE:
                return '音频解码失败';
            case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                return '不支持的音频格式或文件不存在';
            default:
                return '音频播放出现未知错误';
        }
    }

    /**
     * 获取播放错误消息
     */
    getPlayErrorMessage(error) {
        if (error.name === 'NotAllowedError') {
            return '浏览器阻止了音频播放，请手动点击播放';
        } else if (error.name === 'NotSupportedError') {
            return '浏览器不支持该音频格式';
        } else if (error.name === 'AbortError') {
            return '音频播放被中断';
        } else {
            return '播放失败，请重试';
        }
    }

    /**
     * 重置错误状态
     */
    resetError() {
        this.hasError = false;

        if (this.controlsContainer) {
            this.controlsContainer.classList.remove('error');
        }

        this.setState('stopped');
        this.updateStatus('准备就绪');
    }

    /**
     * 重试播放
     */
    async retry() {
        if (!this.audio) {
            console.warn(`无法重试，音频对象不存在: ${this.audioId}`);
            return false;
        }

        try {
            console.log(`重试播放音频: ${this.audioId}`);

            // 重置错误状态
            this.resetError();

            // 重新设置音频源
            this.audio.src = '';
            this.audio.src = this.audioFile;

            // 尝试播放
            return await this.play();

        } catch (error) {
            console.error(`重试播放失败: ${this.audioId}`, error);
            this.handleError('重试失败');
            return false;
        }
    }

    /**
     * 检查浏览器音频支持
     */
    checkBrowserSupport() {
        if (!this.audio) return false;

        const canPlayOpus = this.audio.canPlayType('audio/opus');
        const canPlayMp3 = this.audio.canPlayType('audio/mpeg');
        const canPlayWav = this.audio.canPlayType('audio/wav');
        const canPlayOgg = this.audio.canPlayType('audio/ogg');

        return {
            opus: canPlayOpus !== '',
            mp3: canPlayMp3 !== '',
            wav: canPlayWav !== '',
            ogg: canPlayOgg !== '',
            hasSupport: canPlayOpus !== '' || canPlayMp3 !== '' || canPlayWav !== '' || canPlayOgg !== ''
        };
    }

    /**
     * 获取音频格式建议
     */
    getFormatSuggestion() {
        const support = this.checkBrowserSupport();

        if (!support.hasSupport) {
            return '您的浏览器不支持音频播放，请更新浏览器或使用其他浏览器';
        }

        if (!support.opus) {
            if (support.mp3) {
                return '建议使用MP3格式的音频文件以获得更好的兼容性';
            } else if (support.wav) {
                return '建议使用WAV格式的音频文件';
            } else if (support.ogg) {
                return '建议使用OGG格式的音频文件';
            }
        }

        return null;
    }

    /**
     * 获取当前状态
     */
    getState() {
        return {
            currentState: this.currentState,
            isLoading: this.isLoading,
            hasError: this.hasError,
            audioFile: this.audioFile,
            currentTime: this.audio ? this.audio.currentTime : 0,
            duration: this.audio ? this.audio.duration : 0
        };
    }

    /**
     * 销毁播放器
     */
    destroy() {
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
            this.audio = null;
        }

        // 清除UI引用
        this.controlsContainer = null;
        this.playBtn = null;
        this.pauseBtn = null;
        this.stopBtn = null;
        this.statusDiv = null;

        // 清除回调
        this.onStateChange = null;
        this.onError = null;
        this.onLoadStart = null;
        this.onLoadEnd = null;

        console.log(`AudioPlayer已销毁: ${this.audioId}`);
    }
}

// ===== 音频播放器管理 =====

// 全局音频播放器实例管理
const AudioPlayerManager = {
    players: new Map(),

    /**
     * 创建音频播放器实例
     */
    createPlayer(audioId, audioFile) {
        // 如果已存在，先销毁旧实例
        if (this.players.has(audioId)) {
            this.destroyPlayer(audioId);
        }

        const player = new AudioPlayer(audioFile, audioId);
        this.players.set(audioId, player);

        // 设置播放器事件回调
        player.onStateChange = (newState, oldState) => {
            this.handlePlayerStateChange(audioId, newState, oldState);
        };

        player.onError = (errorMessage) => {
            this.handlePlayerError(audioId, errorMessage);
        };

        return player;
    },

    /**
     * 获取音频播放器实例
     */
    getPlayer(audioId) {
        return this.players.get(audioId);
    },

    /**
     * 销毁音频播放器实例
     */
    destroyPlayer(audioId) {
        const player = this.players.get(audioId);
        if (player) {
            player.destroy();
            this.players.delete(audioId);
        }
    },

    /**
     * 停止所有其他播放器
     */
    stopOtherPlayers(excludeId) {
        let stoppedCount = 0;
        this.players.forEach((player, audioId) => {
            if (audioId !== excludeId && (player.currentState === 'playing' || player.currentState === 'paused')) {
                try {
                    player.stop();
                    stoppedCount++;
                    console.log(`停止音频播放器: ${audioId}`);
                } catch (error) {
                    console.warn(`停止音频播放器失败: ${audioId}`, error);
                }
            }
        });

        if (stoppedCount > 0) {
            console.log(`已停止 ${stoppedCount} 个其他音频播放器`);
        }
    },

    /**
     * 处理播放器状态变化
     */
    handlePlayerStateChange(audioId, newState, oldState) {
        console.log(`播放器状态变化: ${audioId} ${oldState} -> ${newState}`);

        // 当开始播放时，停止其他播放器
        if (newState === 'playing') {
            this.stopOtherPlayers(audioId);
        }
    },

    /**
     * 处理播放器错误
     */
    handlePlayerError(audioId, errorMessage) {
        console.error(`播放器错误: ${audioId} - ${errorMessage}`);

        const player = this.getPlayer(audioId);
        if (!player) return;

        // 检查是否是网络错误，如果是则提供重试选项
        if (this.isNetworkError(errorMessage)) {
            this.showRetryOption(audioId, errorMessage);
        } else if (this.isFormatError(errorMessage)) {
            this.showFormatError(audioId, player);
        } else {
            this.showGenericError(audioId, errorMessage);
        }

        // 记录错误统计
        this.recordError(audioId, errorMessage);
    },

    /**
     * 判断是否为网络错误
     */
    isNetworkError(errorMessage) {
        const networkErrorKeywords = ['网络错误', '无法加载', '加载失败', 'network', 'load'];
        return networkErrorKeywords.some(keyword =>
            errorMessage.toLowerCase().includes(keyword.toLowerCase())
        );
    },

    /**
     * 判断是否为格式错误
     */
    isFormatError(errorMessage) {
        const formatErrorKeywords = ['不支持', '格式', 'format', 'supported'];
        return formatErrorKeywords.some(keyword =>
            errorMessage.toLowerCase().includes(keyword.toLowerCase())
        );
    },

    /**
     * 显示重试选项
     */
    showRetryOption(audioId, errorMessage) {
        const controlsContainer = document.querySelector(`[data-audio-id="${audioId}"]`);
        if (!controlsContainer) return;

        // 添加重试按钮
        const existingRetryBtn = controlsContainer.querySelector('.retry-btn');
        if (existingRetryBtn) return; // 已经有重试按钮了

        const retryBtn = document.createElement('button');
        retryBtn.className = 'audio-btn retry-btn';
        retryBtn.innerHTML = `
            <span class="btn-icon">🔄</span>
            <span class="btn-text">重试</span>
        `;

        retryBtn.addEventListener('click', () => {
            this.retryPlayer(audioId);
        });

        // 插入重试按钮
        const statusDiv = controlsContainer.querySelector('.audio-status');
        if (statusDiv) {
            controlsContainer.insertBefore(retryBtn, statusDiv);
        }
    },

    /**
     * 显示格式错误
     */
    showFormatError(audioId, player) {
        const controlsContainer = document.querySelector(`[data-audio-id="${audioId}"]`);
        if (!controlsContainer) return;

        const suggestion = player.getFormatSuggestion();
        const statusDiv = controlsContainer.querySelector('.audio-status');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="format-error">
                    <div class="error-title">⚠️ 音频格式不支持</div>
                    <div class="format-suggestion">${suggestion || '您的浏览器不支持此音频格式'}</div>
                    <div class="format-help">
                        <small>建议使用最新版本的 Chrome、Firefox 或 Edge 浏览器</small>
                    </div>
                </div>
            `;
            statusDiv.className = 'audio-status format-error';
        }

        // 禁用播放按钮
        const playBtn = controlsContainer.querySelector('.play-btn');
        if (playBtn) {
            playBtn.disabled = true;
            playBtn.classList.add('disabled');
        }
    },

    /**
     * 显示通用错误
     */
    showGenericError(audioId, errorMessage) {
        const controlsContainer = document.querySelector(`[data-audio-id="${audioId}"]`);
        if (!controlsContainer) return;

        const statusDiv = controlsContainer.querySelector('.audio-status');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="generic-error">
                    <div>播放出错</div>
                    <div class="error-details">${errorMessage}</div>
                </div>
            `;
        }
    },

    /**
     * 重试播放器
     */
    async retryPlayer(audioId) {
        const player = this.getPlayer(audioId);
        if (!player) return;

        const controlsContainer = document.querySelector(`[data-audio-id="${audioId}"]`);
        if (controlsContainer) {
            // 移除重试按钮
            const retryBtn = controlsContainer.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.remove();
            }

            // 显示重试状态
            const statusDiv = controlsContainer.querySelector('.audio-status');
            if (statusDiv) {
                statusDiv.textContent = '正在重试...';
            }
        }

        const success = await player.retry();
        if (!success) {
            // 重试失败，重新显示重试按钮
            setTimeout(() => {
                this.showRetryOption(audioId, '重试失败');
            }, 1000);
        }
    },

    /**
     * 记录错误统计
     */
    recordError(audioId, errorMessage) {
        if (!this.errorStats) {
            this.errorStats = new Map();
        }

        const errorKey = `${audioId}:${errorMessage}`;
        const count = this.errorStats.get(errorKey) || 0;
        this.errorStats.set(errorKey, count + 1);

        console.log(`错误统计: ${errorKey} 发生了 ${count + 1} 次`);
    },

    /**
     * 销毁所有播放器
     */
    destroyAllPlayers() {
        this.players.forEach((player, audioId) => {
            player.destroy();
        });
        this.players.clear();
    },

    /**
     * 获取播放器统计信息
     */
    getStats() {
        const stats = {
            totalPlayers: this.players.size,
            playingCount: 0,
            pausedCount: 0,
            stoppedCount: 0,
            errorCount: 0
        };

        this.players.forEach(player => {
            switch (player.currentState) {
                case 'playing':
                    stats.playingCount++;
                    break;
                case 'paused':
                    stats.pausedCount++;
                    break;
                case 'stopped':
                    stats.stoppedCount++;
                    break;
                case 'error':
                    stats.errorCount++;
                    break;
            }
        });

        return stats;
    }
};

// 初始化音频控件
async function initAudioControls(audioId, audioFile) {
    console.log(`初始化音频控件: ${audioId}, 文件: ${audioFile}`);

    // 验证参数
    if (!audioId || !audioFile) {
        console.error('初始化音频控件失败：缺少必要参数');
        return;
    }

    // 调试：显示路径解析过程
    try {
        const resolvedPath = resolveAudioFilePath(audioFile);
        console.log(`音频路径解析: ${audioFile} -> ${resolvedPath}`);
        console.log(`当前页面路径: ${window.location.pathname}`);
        console.log(`基础路径: ${getBasePath()}`);
    } catch (error) {
        console.error(`音频路径解析失败: ${audioFile}`, error);
    }

    // 检查控件容器是否存在
    const controlsContainer = document.querySelector(`[data-audio-id="${audioId}"]`);
    if (!controlsContainer) {
        console.error(`找不到音频控件容器: ${audioId}`);
        return;
    }

    try {
        // 显示初始化状态
        showAudioLoading(controlsContainer, true);

        // 预检查音频文件
        const preCheckResult = await preCheckAudioFile(audioFile);

        if (!preCheckResult.valid) {
            console.warn(`音频文件预检查失败: ${audioId} - ${preCheckResult.error}`);
            showUserFriendlyError(controlsContainer, preCheckResult.error);
            return;
        }

        // 创建AudioPlayer实例
        const player = AudioPlayerManager.createPlayer(audioId, audioFile);

        if (!player) {
            console.error(`创建音频播放器失败: ${audioId}`);
            showAudioError(controlsContainer, '音频播放器初始化失败');
            return;
        }

        // 设置播放器回调
        setupPlayerCallbacks(player, controlsContainer);

        // 隐藏加载状态
        showAudioLoading(controlsContainer, false);

        console.log(`音频播放器创建成功: ${audioId}, 时长: ${preCheckResult.duration || '未知'}秒`);

    } catch (error) {
        console.error(`初始化音频控件时出错: ${audioId}`, error);
        showUserFriendlyError(controlsContainer, '音频控件初始化失败');
    }
}

// 设置播放器回调函数
function setupPlayerCallbacks(player, controlsContainer) {
    const audioId = player.audioId;

    // 状态变化回调
    player.onStateChange = (newState, oldState) => {
        console.log(`播放器状态变化: ${audioId} ${oldState} -> ${newState}`);
        updateAudioControlsUI(controlsContainer, newState);
    };

    // 错误回调
    player.onError = (errorMessage) => {
        console.error(`播放器错误: ${audioId} - ${errorMessage}`);
        showAudioError(controlsContainer, errorMessage);
    };

    // 加载开始回调
    player.onLoadStart = () => {
        showAudioLoading(controlsContainer, true);
    };

    // 加载结束回调
    player.onLoadEnd = () => {
        showAudioLoading(controlsContainer, false);
    };
}

// 更新音频控件UI状态
function updateAudioControlsUI(controlsContainer, state) {
    if (!controlsContainer) return;

    const statusDiv = controlsContainer.querySelector('.audio-status');

    // 更新容器类名
    controlsContainer.className = `audio-controls ${state}`;

    // 更新状态文本
    if (statusDiv) {
        switch (state) {
            case 'playing':
                statusDiv.textContent = '播放中';
                statusDiv.className = 'audio-status playing';
                break;
            case 'paused':
                statusDiv.textContent = '已暂停';
                statusDiv.className = 'audio-status paused';
                break;
            case 'stopped':
                statusDiv.textContent = '已停止';
                statusDiv.className = 'audio-status';
                break;
            case 'loading':
                statusDiv.textContent = '正在加载...';
                statusDiv.className = 'audio-status loading';
                break;
            case 'error':
                statusDiv.textContent = '播放出错';
                statusDiv.className = 'audio-status error';
                break;
            default:
                statusDiv.textContent = '准备就绪';
                statusDiv.className = 'audio-status';
        }
    }
}

// 显示音频加载状态
function showAudioLoading(controlsContainer, isLoading) {
    if (!controlsContainer) return;

    const loadingIndicator = controlsContainer.querySelector('.audio-loading-indicator');
    const statusDiv = controlsContainer.querySelector('.audio-status');

    if (loadingIndicator) {
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }

    if (isLoading) {
        controlsContainer.classList.add('loading');
        if (statusDiv) {
            statusDiv.textContent = '正在加载...';
            statusDiv.className = 'audio-status loading';
        }
    } else {
        controlsContainer.classList.remove('loading');
    }
}

// 显示音频错误
function showAudioError(controlsContainer, errorMessage) {
    if (!controlsContainer) return;

    const statusDiv = controlsContainer.querySelector('.audio-status');

    controlsContainer.classList.add('error');

    if (statusDiv) {
        statusDiv.innerHTML = `
            <div class="error-message">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${errorMessage}</span>
            </div>
        `;
        statusDiv.className = 'audio-status error';
    }

    // 禁用播放和暂停按钮，但保留停止按钮
    const playBtn = controlsContainer.querySelector('.play-btn');
    const pauseBtn = controlsContainer.querySelector('.pause-btn');

    if (playBtn) {
        playBtn.disabled = true;
        playBtn.classList.add('disabled');
    }

    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.classList.add('disabled');
    }
}

// 增强的音频文件存在性检查
async function checkAudioFileExistsEnhanced(audioPath) {
    return new Promise((resolve) => {
        const audio = new Audio();
        let resolved = false;

        const timeout = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                resolve({
                    exists: false,
                    error: '检查超时',
                    canPlay: false
                });
            }
        }, 5000); // 5秒超时

        audio.oncanplaythrough = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve({
                    exists: true,
                    error: null,
                    canPlay: true,
                    duration: audio.duration
                });
            }
        };

        audio.onloadedmetadata = () => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);
                resolve({
                    exists: true,
                    error: null,
                    canPlay: true,
                    duration: audio.duration
                });
            }
        };

        audio.onerror = (e) => {
            if (!resolved) {
                resolved = true;
                clearTimeout(timeout);

                let errorMessage = '未知错误';
                if (audio.error) {
                    switch (audio.error.code) {
                        case audio.error.MEDIA_ERR_ABORTED:
                            errorMessage = '加载被中断';
                            break;
                        case audio.error.MEDIA_ERR_NETWORK:
                            errorMessage = '网络错误';
                            break;
                        case audio.error.MEDIA_ERR_DECODE:
                            errorMessage = '解码失败';
                            break;
                        case audio.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            errorMessage = '文件不存在或格式不支持';
                            break;
                    }
                }

                resolve({
                    exists: false,
                    error: errorMessage,
                    canPlay: false
                });
            }
        };

        audio.src = audioPath;
    });
}

// 音频文件预检查
async function preCheckAudioFile(audioFile) {
    if (!audioFile) {
        return {
            valid: false,
            error: '音频文件路径为空'
        };
    }

    // 解析音频文件路径
    let resolvedPath;
    try {
        resolvedPath = resolveAudioFilePath(audioFile);
        console.log(`预检查音频路径: ${audioFile} -> ${resolvedPath}`);
    } catch (error) {
        return {
            valid: false,
            error: `路径解析失败: ${error.message}`
        };
    }

    // 检查文件扩展名
    if (!validateAudioFilePath(resolvedPath)) {
        return {
            valid: false,
            error: '不支持的音频文件格式'
        };
    }

    // 检查文件是否存在
    const checkResult = await checkAudioFileExistsEnhanced(resolvedPath);

    return {
        valid: checkResult.exists && checkResult.canPlay,
        error: checkResult.error,
        duration: checkResult.duration,
        canPlay: checkResult.canPlay,
        resolvedPath: resolvedPath
    };
}

// 全局音频路径解析函数
function resolveAudioFilePath(audioFile) {
    if (!audioFile) {
        throw new Error('音频文件路径为空');
    }

    // 如果是绝对路径，直接返回
    if (audioFile.startsWith('http://') || audioFile.startsWith('https://') || audioFile.startsWith('/')) {
        return audioFile;
    }

    // 获取当前页面的基础路径，处理GitHub Pages等部署场景
    const basePath = getBasePath();

    // 如果路径已经是完整的相对路径，确保使用正确的基础路径
    if (audioFile.startsWith('Sound/')) {
        return basePath + audioFile;
    }

    if (audioFile.startsWith('./Sound/')) {
        return basePath + audioFile.substring(2); // 移除 './'
    }

    // 否则假设是相对于Sound目录的路径
    return basePath + 'Sound/' + audioFile;
}

// 获取当前页面的基础路径
function getBasePath() {
    const currentPath = window.location.pathname;
    const currentOrigin = window.location.origin;
    const currentHash = window.location.hash;

    // 检测是否为GitHub Pages部署
    const isGitHubPages = currentOrigin.includes('github.io');

    if (isGitHubPages) {
        // 对于GitHub Pages，需要考虑hash路由的影响
        if (currentPath.includes('/jyut')) {
            // 如果有hash路由（如 #Class01/A），使用相对路径
            if (currentHash && currentHash.includes('/')) {
                // 对于 #Class01/A 这样的路由，需要 ../../
                return '../../';
            }

            // 没有hash路由时，使用当前目录
            return './';
        }
        // 如果没有找到 /jyut，假设在根目录
        return './';
    }

    // 对于本地开发或其他部署
    if (currentPath === '/' || currentPath === '/index.html') {
        // 如果有hash路由，需要相对路径
        if (currentHash && currentHash.includes('/')) {
            // 对于本地开发，hash路由需要 ../../
            return '../../';
        }
        return './';
    }

    // 对于子目录部署，使用相对路径
    const pathSegments = currentPath.split('/').filter(segment => segment.length > 0);
    let backSteps = pathSegments.length > 1 ? pathSegments.length - 1 : 0;

    // 如果有hash路由，需要额外的回退步数
    if (currentHash && currentHash.includes('/')) {
        backSteps += 2; // hash路由增加两层（对应 ../../）
    }

    return backSteps > 0 ? '../'.repeat(backSteps) : './';
}

// 用户友好的错误提示
function getUserFriendlyErrorMessage(error) {
    const errorMappings = {
        '文件不存在或格式不支持': '音频文件可能已被移动或删除，请联系管理员',
        '网络错误': '网络连接不稳定，请检查网络连接后重试',
        '解码失败': '音频文件可能已损坏，请尝试重新下载',
        '加载被中断': '音频加载被中断，请重试',
        '不支持的音频文件格式': '您的浏览器不支持此音频格式，建议使用最新版本的Chrome或Firefox',
        '检查超时': '音频文件加载超时，可能是网络问题或文件过大'
    };

    return errorMappings[error] || error;
}

// 显示用户友好的错误提示
function showUserFriendlyError(controlsContainer, originalError) {
    const friendlyMessage = getUserFriendlyErrorMessage(originalError);
    const statusDiv = controlsContainer.querySelector('.audio-status');

    if (statusDiv) {
        statusDiv.innerHTML = `
            <div class="friendly-error">
                <div class="error-title">播放出现问题</div>
                <div class="error-description">${friendlyMessage}</div>
                <div class="error-actions">
                    <button class="error-action-btn" onclick="location.reload()">刷新页面</button>
                </div>
            </div>
        `;
    }
}

// 音频播放用户体验优化
function optimizeAudioUserExperience() {
    // 添加键盘快捷键支持
    document.addEventListener('keydown', (event) => {
        // 只在非输入元素上响应快捷键
        if (event.target.matches('input, textarea, select, [contenteditable]')) {
            return;
        }

        const playingPlayer = Array.from(AudioPlayerManager.players.values())
            .find(player => player.currentState === 'playing');
        const availablePlayer = Array.from(AudioPlayerManager.players.values())
            .find(player => !player.hasError);

        switch (event.code) {
            case 'Space':
                // 空格键：播放/暂停当前音频
                event.preventDefault();
                if (playingPlayer) {
                    playingPlayer.pause();
                    showKeyboardShortcutFeedback('⏸️ 已暂停');
                } else if (availablePlayer) {
                    availablePlayer.play();
                    showKeyboardShortcutFeedback('▶️ 开始播放');
                }
                break;

            case 'Escape':
                // Escape键：停止所有音频
                event.preventDefault();
                let stoppedCount = 0;
                AudioPlayerManager.players.forEach(player => {
                    if (player.currentState === 'playing' || player.currentState === 'paused') {
                        player.stop();
                        stoppedCount++;
                    }
                });
                if (stoppedCount > 0) {
                    showKeyboardShortcutFeedback(`⏹️ 已停止 ${stoppedCount} 个音频`);
                }
                break;

            case 'ArrowLeft':
                // 左箭头：后退5秒
                event.preventDefault();
                if (playingPlayer && playingPlayer.audio) {
                    const newTime = Math.max(0, playingPlayer.audio.currentTime - 5);
                    playingPlayer.audio.currentTime = newTime;
                    showKeyboardShortcutFeedback('⏪ 后退5秒');
                }
                break;

            case 'ArrowRight':
                // 右箭头：前进5秒
                event.preventDefault();
                if (playingPlayer && playingPlayer.audio) {
                    const newTime = Math.min(playingPlayer.audio.duration || 0, playingPlayer.audio.currentTime + 5);
                    playingPlayer.audio.currentTime = newTime;
                    showKeyboardShortcutFeedback('⏩ 前进5秒');
                }
                break;

            case 'ArrowUp':
                // 上箭头：增加音量
                event.preventDefault();
                if (playingPlayer && playingPlayer.audio) {
                    const newVolume = Math.min(1, playingPlayer.audio.volume + 0.1);
                    playingPlayer.audio.volume = newVolume;
                    showKeyboardShortcutFeedback(`🔊 音量: ${Math.round(newVolume * 100)}%`);
                }
                break;

            case 'ArrowDown':
                // 下箭头：降低音量
                event.preventDefault();
                if (playingPlayer && playingPlayer.audio) {
                    const newVolume = Math.max(0, playingPlayer.audio.volume - 0.1);
                    playingPlayer.audio.volume = newVolume;
                    showKeyboardShortcutFeedback(`🔉 音量: ${Math.round(newVolume * 100)}%`);
                }
                break;

            case 'KeyM':
                // M键：静音/取消静音
                event.preventDefault();
                if (playingPlayer && playingPlayer.audio) {
                    playingPlayer.audio.muted = !playingPlayer.audio.muted;
                    showKeyboardShortcutFeedback(playingPlayer.audio.muted ? '🔇 已静音' : '🔊 取消静音');
                }
                break;

            case 'KeyR':
                // R键：重新播放当前音频
                event.preventDefault();
                if (playingPlayer && playingPlayer.audio) {
                    playingPlayer.audio.currentTime = 0;
                    showKeyboardShortcutFeedback('🔄 重新播放');
                }
                break;
        }
    });

    // 添加页面可见性变化处理
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // 页面隐藏时暂停所有音频
            AudioPlayerManager.players.forEach(player => {
                if (player.currentState === 'playing') {
                    player.pause();
                    player._wasPlayingBeforeHidden = true;
                }
            });
        } else {
            // 页面显示时恢复之前播放的音频
            AudioPlayerManager.players.forEach(player => {
                if (player._wasPlayingBeforeHidden) {
                    player.play();
                    player._wasPlayingBeforeHidden = false;
                }
            });
        }
    });

    // 初始化音频进度更新
    initAudioProgressTracking();

    // 初始化音量控制
    initVolumeControls();

    // 显示键盘快捷键帮助
    createKeyboardShortcutHelp();

    console.log('音频用户体验优化已启用');
}

// 显示键盘快捷键反馈
function showKeyboardShortcutFeedback(message) {
    // 移除现有的反馈元素
    const existingFeedback = document.querySelector('.keyboard-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // 创建新的反馈元素
    const feedback = document.createElement('div');
    feedback.className = 'keyboard-feedback';
    feedback.textContent = message;

    // 添加到页面
    document.body.appendChild(feedback);

    // 显示动画
    setTimeout(() => feedback.classList.add('show'), 10);

    // 自动隐藏
    setTimeout(() => {
        feedback.classList.remove('show');
        setTimeout(() => feedback.remove(), 300);
    }, 1500);
}

// 初始化音频进度跟踪
function initAudioProgressTracking() {
    // 为所有音频播放器添加进度更新
    const originalCreatePlayer = AudioPlayerManager.createPlayer;
    AudioPlayerManager.createPlayer = function (audioFile, audioId) {
        const player = originalCreatePlayer.call(this, audioFile, audioId);

        if (player && player.audio) {
            // 添加时间更新监听器
            player.audio.addEventListener('timeupdate', () => {
                updateAudioProgress(audioId, player.audio);
            });

            // 添加加载完成监听器
            player.audio.addEventListener('loadedmetadata', () => {
                updateAudioDuration(audioId, player.audio);
            });
        }

        return player;
    };

    // 添加进度条点击事件监听
    document.addEventListener('click', (event) => {
        if (event.target.matches('.progress-bar, .progress-bar *')) {
            const progressBar = event.target.closest('.progress-bar');
            const controlsContainer = progressBar.closest('.audio-controls');
            const audioId = controlsContainer.dataset.audioId;

            handleProgressBarClick(event, audioId, progressBar);
        }
    });
}

// 处理进度条点击
function handleProgressBarClick(event, audioId, progressBar) {
    const player = AudioPlayerManager.getPlayer(audioId);
    if (!player || !player.audio || !player.audio.duration) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const progressPercent = clickX / rect.width;
    const newTime = progressPercent * player.audio.duration;

    // 设置新的播放位置
    player.audio.currentTime = Math.max(0, Math.min(newTime, player.audio.duration));

    // 显示反馈
    const minutes = Math.floor(newTime / 60);
    const seconds = Math.floor(newTime % 60);
    showKeyboardShortcutFeedback(`⏭️ 跳转到 ${minutes}:${seconds.toString().padStart(2, '0')}`);
}

// 更新音频进度
function updateAudioProgress(audioId, audio) {
    const controlsContainer = document.querySelector(`[data-audio-id="${audioId}"]`);
    if (!controlsContainer) return;

    const progressContainer = controlsContainer.querySelector('.audio-progress');
    if (!progressContainer) return;

    const progressFill = progressContainer.querySelector('.progress-fill');
    const currentTimeSpan = progressContainer.querySelector('.current-time');

    if (audio.duration && !isNaN(audio.duration)) {
        const progress = (audio.currentTime / audio.duration) * 100;

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        if (currentTimeSpan) {
            currentTimeSpan.textContent = formatTime(audio.currentTime);
        }

        // 显示进度条
        progressContainer.style.display = 'flex';
    }
}

// 更新音频时长
function updateAudioDuration(audioId, audio) {
    const controlsContainer = document.querySelector(`[data-audio-id="${audioId}"]`);
    if (!controlsContainer) return;

    const durationSpan = controlsContainer.querySelector('.duration');
    if (durationSpan && audio.duration && !isNaN(audio.duration)) {
        durationSpan.textContent = formatTime(audio.duration);
    }
}

// 格式化时间显示
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 初始化音量控制
function initVolumeControls() {
    // 为每个音频控件添加音量控制
    document.addEventListener('click', (event) => {
        if (event.target.matches('.audio-btn[data-action="volume"]')) {
            const audioId = event.target.closest('.audio-controls').dataset.audioId;
            toggleVolumeControl(audioId);
        }
    });
}

// 切换音量控制显示
function toggleVolumeControl(audioId) {
    const controlsContainer = document.querySelector(`[data-audio-id="${audioId}"]`);
    if (!controlsContainer) return;

    let volumeControl = controlsContainer.querySelector('.volume-control');

    if (!volumeControl) {
        // 创建音量控制
        volumeControl = createVolumeControl(audioId);
        controlsContainer.appendChild(volumeControl);
    }

    // 切换显示状态
    volumeControl.style.display = volumeControl.style.display === 'none' ? 'flex' : 'none';
}

// 创建音量控制元素
function createVolumeControl(audioId) {
    const volumeControl = document.createElement('div');
    volumeControl.className = 'volume-control';
    volumeControl.innerHTML = `
        <div class="volume-slider-container">
            <button class="volume-btn mute-btn" title="静音/取消静音">🔊</button>
            <input type="range" class="volume-slider" min="0" max="100" value="100" title="音量控制">
            <span class="volume-value">100%</span>
        </div>
    `;

    // 绑定事件
    const slider = volumeControl.querySelector('.volume-slider');
    const muteBtn = volumeControl.querySelector('.mute-btn');
    const volumeValue = volumeControl.querySelector('.volume-value');

    const player = AudioPlayerManager.getPlayer(audioId);
    if (player && player.audio) {
        // 音量滑块事件
        slider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            player.audio.volume = volume;
            volumeValue.textContent = `${e.target.value}%`;

            // 更新静音按钮图标
            if (volume === 0) {
                muteBtn.textContent = '🔇';
            } else if (volume < 0.5) {
                muteBtn.textContent = '🔉';
            } else {
                muteBtn.textContent = '🔊';
            }
        });

        // 静音按钮事件
        muteBtn.addEventListener('click', () => {
            player.audio.muted = !player.audio.muted;
            muteBtn.textContent = player.audio.muted ? '🔇' : '🔊';
            slider.style.opacity = player.audio.muted ? '0.5' : '1';
        });
    }

    return volumeControl;
}

// 创建键盘快捷键帮助
function createKeyboardShortcutHelp() {
    // 检查是否已存在
    if (document.querySelector('.keyboard-help')) return;

    const helpButton = document.createElement('button');
    helpButton.className = 'keyboard-help-btn';
    helpButton.innerHTML = '⌨️';
    helpButton.title = '键盘快捷键帮助';

    helpButton.addEventListener('click', showKeyboardShortcutHelp);

    // 添加到页面右下角
    document.body.appendChild(helpButton);
}

// 显示键盘快捷键帮助
function showKeyboardShortcutHelp() {
    // 移除现有的帮助窗口
    const existingHelp = document.querySelector('.keyboard-help-modal');
    if (existingHelp) {
        existingHelp.remove();
        return;
    }

    const helpModal = document.createElement('div');
    helpModal.className = 'keyboard-help-modal';
    helpModal.innerHTML = `
        <div class="keyboard-help-content">
            <div class="help-header">
                <h3>键盘快捷键</h3>
                <button class="help-close-btn">×</button>
            </div>
            <div class="help-shortcuts">
                <div class="shortcut-item">
                    <kbd>空格</kbd>
                    <span>播放/暂停音频</span>
                </div>
                <div class="shortcut-item">
                    <kbd>Esc</kbd>
                    <span>停止所有音频</span>
                </div>
                <div class="shortcut-item">
                    <kbd>←</kbd>
                    <span>后退5秒</span>
                </div>
                <div class="shortcut-item">
                    <kbd>→</kbd>
                    <span>前进5秒</span>
                </div>
                <div class="shortcut-item">
                    <kbd>↑</kbd>
                    <span>增加音量</span>
                </div>
                <div class="shortcut-item">
                    <kbd>↓</kbd>
                    <span>降低音量</span>
                </div>
                <div class="shortcut-item">
                    <kbd>M</kbd>
                    <span>静音/取消静音</span>
                </div>
                <div class="shortcut-item">
                    <kbd>R</kbd>
                    <span>重新播放</span>
                </div>
            </div>
        </div>
    `;

    // 添加关闭事件
    helpModal.querySelector('.help-close-btn').addEventListener('click', () => {
        helpModal.remove();
    });

    // 点击背景关闭
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            helpModal.remove();
        }
    });

    document.body.appendChild(helpModal);
}

// 增强的视觉反馈系统
const VisualFeedback = {
    // 添加点击反馈
    addClickFeedback(element) {
        element.classList.add('clicked');
        setTimeout(() => {
            element.classList.remove('clicked');
        }, 200);
    },

    // 添加选择反馈
    addSelectionFeedback(element) {
        element.classList.add('selecting');
        setTimeout(() => {
            element.classList.remove('selecting');
        }, 400);
    },

    // 添加状态变化反馈
    addStatusChangeFeedback(element) {
        element.classList.add('audio-status-change');
        setTimeout(() => {
            element.classList.remove('audio-status-change');
        }, 500);
    },

    // 添加增强反馈
    addEnhancedFeedback(element) {
        element.classList.add('enhanced-feedback');
        setTimeout(() => {
            element.classList.remove('enhanced-feedback');
        }, 500);
    }
};

// 性能指示器
const PerformanceIndicator = {
    element: null,

    // 创建性能指示器
    create() {
        if (this.element) return;

        this.element = document.createElement('div');
        this.element.className = 'performance-indicator';
        this.element.innerHTML = `
            <div class="perf-title">性能监控</div>
            <div class="perf-metrics">
                <div>初始化: <span id="perf-init">-</span>ms</div>
                <div>平均音频加载: <span id="perf-audio">-</span>ms</div>
                <div>平均内容切换: <span id="perf-content">-</span>ms</div>
            </div>
        `;

        document.body.appendChild(this.element);
    },

    // 显示性能指示器
    show() {
        if (!this.element) this.create();
        this.element.classList.add('show');
        this.update();
    },

    // 隐藏性能指示器
    hide() {
        if (this.element) {
            this.element.classList.remove('show');
        }
    },

    // 更新性能数据
    update() {
        if (!this.element) return;

        const report = PerformanceMonitor.getPerformanceReport();

        const initSpan = this.element.querySelector('#perf-init');
        const audioSpan = this.element.querySelector('#perf-audio');
        const contentSpan = this.element.querySelector('#perf-content');

        if (initSpan) initSpan.textContent = report.appInitTime.toFixed(0);
        if (audioSpan) audioSpan.textContent = report.avgAudioLoadTime;
        if (contentSpan) contentSpan.textContent = report.avgContentSwitchTime;
    },

    // 切换显示状态
    toggle() {
        if (this.element && this.element.classList.contains('show')) {
            this.hide();
        } else {
            this.show();
        }
    }
};

// 添加性能监控快捷键
document.addEventListener('keydown', (event) => {
    // Ctrl+Shift+P: 切换性能指示器
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyP') {
        event.preventDefault();
        PerformanceIndicator.toggle();
    }
});

// 初始化用户体验增强功能
function initUserExperienceEnhancements() {
    // 为所有按钮添加视觉反馈
    document.addEventListener('click', (event) => {
        if (event.target.matches('button, .btn, .part-btn, .audio-btn')) {
            VisualFeedback.addClickFeedback(event.target);
        }
    });

    // 为音频控件添加增强反馈
    document.addEventListener('audioStateChange', (event) => {
        const { audioId } = event.detail;
        const controlsContainer = document.querySelector(`[data-audio-id="${audioId}"]`);
        if (controlsContainer) {
            VisualFeedback.addEnhancedFeedback(controlsContainer);
        }
    });

    // 添加触摸设备优化
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');

        // 为触摸设备优化按钮大小
        const style = document.createElement('style');
        style.textContent = `
            .touch-device .audio-btn {
                min-height: 44px;
                min-width: 44px;
                padding: 0.75rem 1rem;
            }
            
            .touch-device .part-btn {
                min-height: 44px;
                padding: 0.75rem 1rem;
            }
            
            .touch-device .progress-bar {
                height: 8px;
                cursor: pointer;
            }
            
            .touch-device .volume-slider {
                height: 8px;
            }
        `;
        document.head.appendChild(style);
    }

    // 添加焦点管理
    document.addEventListener('keydown', (event) => {
        if (event.code === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });

    console.log('用户体验增强功能已初始化');
}

// 动态生成音频文件路径
function generateAudioFilePath(courseId, part, paragraphNum = null) {
    const basePath = 'Sound';

    if (part === 'A') {
        return `${basePath}/${courseId}/a.opus`;
    } else if (part === 'B' && paragraphNum) {
        return `${basePath}/${courseId}/b_${paragraphNum}.opus`;
    }

    console.warn(`无法生成音频文件路径: courseId=${courseId}, part=${part}, paragraphNum=${paragraphNum}`);
    return null;
}

// 验证音频文件路径
function validateAudioFilePath(audioFile) {
    if (!audioFile || typeof audioFile !== 'string') {
        return false;
    }

    // 检查文件扩展名
    const validExtensions = ['.opus', '.mp3', '.wav', '.ogg'];
    const hasValidExtension = validExtensions.some(ext => audioFile.toLowerCase().endsWith(ext));

    if (!hasValidExtension) {
        console.warn(`音频文件扩展名无效: ${audioFile}`);
        return false;
    }

    // 验证路径格式 - 支持新的数据结构路径
    const validPathPatterns = [
        /^Sound\/Class\d+\/[ab]_\d+\.(opus|mp3|wav|ogg)$/i,  // 新格式: Sound/Class01/a_1.opus
        /^\.\/Sound\/Class\d+\/[ab]_\d+\.(opus|mp3|wav|ogg)$/i,  // 带./前缀
        /^https?:\/\/.+\.(opus|mp3|wav|ogg)$/i,  // HTTP URL
        /^\/.*\.(opus|mp3|wav|ogg)$/i  // 绝对路径
    ];

    const isValidPath = validPathPatterns.some(pattern => pattern.test(audioFile));

    if (!isValidPath) {
        console.warn(`音频文件路径格式无效: ${audioFile}`);
        return false;
    }

    return true;
}

// 清理音频控件
function cleanupAudioControls(audioId) {
    // 销毁对应的播放器实例
    AudioPlayerManager.destroyPlayer(audioId);

    // 清理UI状态
    const controlsContainer = document.querySelector(`[data-audio-id="${audioId}"]`);
    if (controlsContainer) {
        controlsContainer.className = 'audio-controls';
        const statusDiv = controlsContainer.querySelector('.audio-status');
        if (statusDiv) {
            statusDiv.textContent = '已清理';
            statusDiv.className = 'audio-status';
        }
    }
}

// 清除内容显示（返回欢迎状态）
function clearContentDisplay() {
    const contentContainer = document.getElementById('content-container');
    const breadcrumb = document.getElementById('content-breadcrumb');

    if (breadcrumb) {
        breadcrumb.innerHTML = '<span>请选择一个课程和部分开始学习</span>';
    }

    if (contentContainer) {
        contentContainer.innerHTML = `
            <div class="welcome-state">
                <div class="welcome-icon">🎯</div>
                <h3>开始学习粤语</h3>
                <p>从左侧课程列表中选择一个课程和部分，即可开始学习粤语发音。</p>
                <div class="feature-list">
                    <div class="feature-item">
                        <span class="feature-icon">📝</span>
                        <span>原文和粤拼对照</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">🔊</span>
                        <span>标准发音音频</span>
                    </div>
                    <div class="feature-item">
                        <span class="feature-icon">📱</span>
                        <span>响应式设计</span>
                    </div>
                </div>
            </div>
        `;
    }

    // 清除应用状态
    AppState.currentCourse = null;
    AppState.currentPart = null;
}

// ===== Header导航功能 =====

// 初始化Header导航功能
function initHeaderNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', handleNavClick);
    });

    // 添加滚动监听，高亮当前区域
    window.addEventListener('scroll', updateActiveNavLink);
}

// 处理导航链接点击
function handleNavClick(event) {
    event.preventDefault();

    const targetId = event.target.getAttribute('href').substring(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
        // 平滑滚动到目标元素
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });

        // 更新活跃状态
        updateActiveNavLink();

        // 添加焦点管理（无障碍访问）
        setTimeout(() => {
            targetElement.focus();
        }, 500);
    }
}

// 更新活跃的导航链接
function updateActiveNavLink() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');

    let currentSection = '';

    sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100 && rect.bottom >= 100) {
            currentSection = section.id;
        }
    });

    navLinks.forEach(link => {
        const href = link.getAttribute('href').substring(1);
        if (href === currentSection) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// AudioPlayer类已在上方完整实现