// 存储管理

const XFilterStorage = {
  /**
   * 默认设置
   */
  defaults: {
    enabled: true,
    viewMode: 'waterfall', // 'waterfall' or 'original'
    columns: 3,
    gap: 16,
    showTextOnHover: true,
    autoHideText: true,
    lazyLoad: true
  },

  /**
   * 获取设置
   */
  async get(key) {
    try {
      const result = await chrome.storage.sync.get(key || this.defaults);
      if (key) {
        return result[key] !== undefined ? result[key] : this.defaults[key];
      }
      return { ...this.defaults, ...result };
    } catch (error) {
      XFilterHelpers.error('Failed to get storage:', error);
      return key ? this.defaults[key] : this.defaults;
    }
  },

  /**
   * 设置配置
   */
  async set(key, value) {
    try {
      const data = typeof key === 'object' ? key : { [key]: value };
      await chrome.storage.sync.set(data);
      return true;
    } catch (error) {
      XFilterHelpers.error('Failed to set storage:', error);
      return false;
    }
  },

  /**
   * 监听设置变化
   */
  onChange(callback) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        const changedSettings = {};
        for (let key in changes) {
          changedSettings[key] = changes[key].newValue;
        }
        callback(changedSettings);
      }
    });
  }
};

