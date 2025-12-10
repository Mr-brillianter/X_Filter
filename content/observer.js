// DOM 监听器 - 监听 X 页面的帖子加载

class XFilterObserver {
  constructor() {
    this.observer = null;
    this.processedTweets = new Set();
    this.callbacks = [];
    
    // X/Twitter 的帖子选择器
    this.tweetSelectors = [
      'article[data-testid="tweet"]',
      'div[data-testid="tweet"]',
      'article[role="article"]'
    ];
  }

  /**
   * 开始监听
   */
  start() {
    XFilterHelpers.log('Starting DOM observer...');
    
    // 处理已存在的帖子
    this.processExistingTweets();
    
    // 监听新帖子
    this.observer = new MutationObserver(
      XFilterHelpers.debounce((mutations) => {
        this.handleMutations(mutations);
      }, 100)
    );

    // 监听整个文档
    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    XFilterHelpers.log('DOM observer started');
  }

  /**
   * 停止监听
   */
  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
      XFilterHelpers.log('DOM observer stopped');
    }
  }

  /**
   * 处理已存在的帖子
   */
  processExistingTweets() {
    const tweets = this.findTweets();
    XFilterHelpers.log(`Found ${tweets.length} existing tweets`);
    tweets.forEach(tweet => this.processTweet(tweet));
  }

  /**
   * 处理 DOM 变化
   */
  handleMutations(mutations) {
    const newTweets = [];
    
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // 检查节点本身是否是帖子
          if (this.isTweet(node)) {
            newTweets.push(node);
          }
          // 检查子节点中的帖子
          const tweets = this.findTweetsInElement(node);
          newTweets.push(...tweets);
        }
      });
    });

    if (newTweets.length > 0) {
      XFilterHelpers.log(`Found ${newTweets.length} new tweets`);
      newTweets.forEach(tweet => this.processTweet(tweet));
    }
  }

  /**
   * 查找所有帖子
   */
  findTweets() {
    const tweets = [];
    this.tweetSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      tweets.push(...Array.from(elements));
    });
    return tweets;
  }

  /**
   * 在元素中查找帖子
   */
  findTweetsInElement(element) {
    const tweets = [];
    this.tweetSelectors.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      tweets.push(...Array.from(elements));
    });
    return tweets;
  }

  /**
   * 检查元素是否是帖子
   */
  isTweet(element) {
    return this.tweetSelectors.some(selector => {
      if (selector.includes('[')) {
        const [tag, attr] = selector.split('[');
        const [attrName, attrValue] = attr.replace(']', '').split('=');
        return element.tagName.toLowerCase() === tag &&
               element.getAttribute(attrName) === attrValue.replace(/"/g, '');
      }
      return element.matches(selector);
    });
  }

  /**
   * 处理单个帖子
   */
  processTweet(tweet) {
    // 生成唯一ID
    const tweetId = tweet.getAttribute('data-xfilter-id') || XFilterHelpers.generateId();
    
    // 避免重复处理
    if (this.processedTweets.has(tweetId)) {
      return;
    }
    
    tweet.setAttribute('data-xfilter-id', tweetId);
    this.processedTweets.add(tweetId);
    
    // 通知所有回调
    this.callbacks.forEach(callback => {
      try {
        callback(tweet);
      } catch (error) {
        XFilterHelpers.error('Error in tweet callback:', error);
      }
    });
  }

  /**
   * 注册回调函数
   */
  onTweetFound(callback) {
    this.callbacks.push(callback);
  }

  /**
   * 清除所有已处理的帖子标记
   */
  reset() {
    this.processedTweets.clear();
    document.querySelectorAll('[data-xfilter-id]').forEach(tweet => {
      tweet.removeAttribute('data-xfilter-id');
    });
  }
}

