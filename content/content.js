// 主内容脚本 - 协调各个模块

class XFilterApp {
  constructor() {
    this.observer = new XFilterObserver();
    this.mediaExtractor = new XFilterMediaExtractor();
    this.styleInjector = new XFilterStyleInjector();
    
    // 布局引擎需要在获取设置后初始化
    this.layoutEngine = null;
    
    this.settings = null;
    this.isEnabled = false;
    
    // 统计数据
    this.stats = {
      total: 0,
      media: 0
    };
  }

  /**
   * 初始化应用
   */
  async init() {
    XFilterHelpers.log('Initializing X Filter...');
    
    // 1. 获取用户设置
    this.settings = await XFilterStorage.get();
    this.isEnabled = this.settings.enabled;
    
    // 2. 初始化布局引擎
    this.layoutEngine = new XFilterLayoutEngine(this.settings);
    this.layoutEngine.init(); // 创建容器但不一定显示
    
    // 3. 初始化样式注入器
    this.styleInjector.init();
    
    // 4. 设置消息监听 (来自 Popup)
    this.setupMessageListener();
    
    // 5. 监听设置变化
    XFilterStorage.onChange((changes) => {
      this.handleSettingsChange(changes);
    });

    // 6. 如果启用，开始运行
    if (this.isEnabled) {
      this.start();
    }
    
    XFilterHelpers.log('Initialization complete');
  }

  /**
   * 启动功能
   */
  start() {
    if (!this.isEnabled) return;
    
    document.body.classList.add('xfilter-active');
    
    // 切换到瀑布流视图
    this.layoutEngine.switchToWaterfall();
    this.styleInjector.toggleImmersiveMode(true);
    
    // 配置 Observer 回调
    this.observer.onTweetFound((tweet) => this.handleNewTweet(tweet));
    
    // 启动 Observer
    this.observer.start();
    
    XFilterHelpers.log('App started');
  }

  /**
   * 停止功能
   */
  stop() {
    document.body.classList.remove('xfilter-active');
    
    // 停止监听
    this.observer.stop();
    this.observer.reset(); // 清除处理标记，以便重新启用时能重新扫描
    
    // 恢复原始视图
    this.layoutEngine.switchToOriginal();
    this.styleInjector.toggleImmersiveMode(false);
    
    XFilterHelpers.log('App stopped');
  }

  /**
   * 处理新发现的帖子
   */
  handleNewTweet(tweet) {
    this.stats.total++;
    
    // 1. 提取媒体内容
    const media = this.mediaExtractor.extractMedia(tweet);
    
    // 2. 只有包含媒体的帖子才添加到瀑布流
    if (media.hasMedia) {
      this.stats.media++;
      this.layoutEngine.addItem(tweet, media);
    }
  }

  /**
   * 处理来自 Popup 或 Background 的消息
   */
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.type) {
        case 'TOGGLE_FILTER':
          this.toggle(request.payload.enabled);
          break;
        case 'GET_STATS':
          sendResponse({ stats: this.stats });
          break;
      }
    });
  }

  /**
   * 切换开启状态
   */
  toggle(enabled) {
    this.isEnabled = enabled;
    if (this.isEnabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  /**
   * 处理设置变更
   */
  handleSettingsChange(changes) {
    // 更新本地设置副本
    this.settings = { ...this.settings, ...changes };
    
    // 更新布局引擎设置
    if (this.layoutEngine) {
      this.layoutEngine.settings = this.settings;
      this.layoutEngine.updateLayout();
    }
    
    // 处理开关切换
    if (changes.enabled !== undefined) {
      this.toggle(changes.enabled);
    }
  }
}

// 实例化并运行
const app = new XFilterApp();

// 等待页面加载完成 (稍微延迟以确保 X 的脚本已运行)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => app.init(), 1000));
} else {
  setTimeout(() => app.init(), 1000);
}