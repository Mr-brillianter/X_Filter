// 媒体提取器 - 从帖子中提取图片和视频

class XFilterMediaExtractor {
  constructor() {
    this.imageSelectors = [
      'img[src*="pbs.twimg.com/media"]',
      'img[src*="video.twimg.com"]',
      'div[data-testid="tweetPhoto"] img',
      'a[href*="/photo/"] img'
    ];
    
    this.videoSelectors = [
      'video',
      'div[data-testid="videoPlayer"]',
      'div[data-testid="videoComponent"]'
    ];
  }

  /**
   * 从帖子中提取所有媒体
   */
  extractMedia(tweet) {
    const media = {
      images: this.extractImages(tweet),
      videos: this.extractVideos(tweet),
      hasMedia: false
    };
    
    media.hasMedia = media.images.length > 0 || media.videos.length > 0;
    
    return media;
  }

  /**
   * 提取图片
   */
  extractImages(tweet) {
    const images = [];
    const imageElements = new Set();
    
    this.imageSelectors.forEach(selector => {
      const elements = tweet.querySelectorAll(selector);
      elements.forEach(img => imageElements.add(img));
    });
    
    imageElements.forEach(img => {
      const src = img.src;
      
      // 过滤掉头像和小图标
      if (this.isValidImage(src, img)) {
        images.push({
          element: img,
          src: this.getHighQualityImageUrl(src),
          originalSrc: src,
          alt: img.alt || '',
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        });
      }
    });
    
    return images;
  }

  /**
   * 提取视频
   */
  extractVideos(tweet) {
    const videos = [];
    const videoElements = new Set();
    
    this.videoSelectors.forEach(selector => {
      const elements = tweet.querySelectorAll(selector);
      elements.forEach(video => {
        if (video.tagName === 'VIDEO') {
          videoElements.add(video);
        } else {
          // 查找容器内的 video 标签
          const videoTag = video.querySelector('video');
          if (videoTag) {
            videoElements.add(videoTag);
          }
        }
      });
    });
    
    videoElements.forEach(video => {
      const poster = video.poster || '';
      const src = video.src || video.querySelector('source')?.src || '';
      
      videos.push({
        element: video,
        src: src,
        poster: poster,
        width: video.videoWidth || video.width,
        height: video.videoHeight || video.height,
        duration: video.duration || 0
      });
    });
    
    return videos;
  }

  /**
   * 检查是否是有效的图片
   */
  isValidImage(src, img) {
    // 排除头像
    if (src.includes('profile_images')) {
      return false;
    }
    
    // 排除表情符号
    if (src.includes('emoji')) {
      return false;
    }
    
    // 排除太小的图片
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (width < 100 || height < 100) {
      return false;
    }
    
    return true;
  }

  /**
   * 获取高质量图片URL
   */
  getHighQualityImageUrl(src) {
    // Twitter 图片质量参数
    // name=small (240px), medium (600px), large (1024px), orig (原图)
    if (src.includes('pbs.twimg.com/media')) {
      // 移除现有的质量参数
      const baseUrl = src.split('?')[0];
      // 添加大图参数
      return `${baseUrl}?format=jpg&name=large`;
    }
    return src;
  }

  /**
   * 获取帖子的主要媒体类型
   */
  getMediaType(media) {
    if (media.videos.length > 0) {
      return 'video';
    }
    if (media.images.length > 0) {
      return 'image';
    }
    return 'none';
  }

  /**
   * 获取媒体的宽高比
   */
  getAspectRatio(mediaItem) {
    const width = mediaItem.width || 1;
    const height = mediaItem.height || 1;
    return width / height;
  }

  /**
   * 预加载图片
   */
  preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
}

