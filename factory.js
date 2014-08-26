'use strict;'

/**
 *  页面管理器 model
 **/
var factory = {
    // 实例缓存
    cache: [],
    // 实例历史
    histories: [],
    // 存在正在显示中的页面
    showingPages: [], 
    // 最大缓存数
    _max_caches: 15,
    // 最大历史数
    _max_histories: 25,

    init: function (options) {
        if (options.max_cache) this._max_caches = options.max_cache;
        if (options.max_history) this._max_histories = options.max_history;

        // 接口钩子
        if (options.interfaces) this.interfaces = options.interfaces;
        else this.interfaces = {};
    },

    exist: function(pageId) {
        return !!factory.findInHistory(pageId);
    },

    create: function(config) {

        var page = new config.Component(config.data);

        var cacheItem = {

            options: config.options || {},
            pageId: config.pageId,
            page: page,
            Component: config.Component,
            expire: (new Date).getTime()
        };

        this.add(cacheItem);

        return cacheItem;
    },
    add: function(cacheItem) {

        if (cacheItem.options.cache) {
            // 去掉重复的
            this.uniqCaches(cacheItem);
            // 缓存数据剔除操作, 查找快要被淘汰的页面
            if (this.cache.length >= this._max_caches) {
                var removeItem = this.findNeedTimeoutCache();
                if (!this.findHistory(removeItem)) {
                    this.destoryPage(removeItem.page);
                }
            }
            this.cache.push(cacheItem);
        }
        // 添加进历史中
        this.addToHistory(cacheItem);

    },
    addToHistory: function(cacheItem) {
        // 去掉重复的
        this.uniqHistories(cacheItem);
        // 历史记录剔除操作
        if (this.histories.length >= this._max_histories) {
            var removeItem = this.histories.shift();
            if (!this.findCache(removeItem)) {
                this.destoryPage(removeItem.page);
            }
        }
        this.histories.push(cacheItem);
    },
    /**
     *  保证历史记录中页面实例唯一，id为pageId
     **/
    uniqHistories: function(cacheItem) {
        var histories = [];

        for (var i = 0; i < this.histories.length; i++) {
            var item = this.histories[i];
            if (item && item.pageId === cacheItem.pageId && cacheItem !== item) {
                if (!this.findCache(item)) {
                    this.destoryPage(item.page);
                }
                continue;
            }
            histories.push(item);
        }
        this.histories = histories;
    },
    /**
     *  保证缓存中页面实例唯一，id为pageId
     **/
    uniqCaches: function(cacheItem) {

        var cache = [];

        for (var i = 0; i < this.cache.length; i++) {
            var item = this.cache[i];
            if (item && item.pageId == cacheItem.pageId && cacheItem !== item) {
                if (!this.findHistory(item)) {
                    this.destoryPage(item.page);
                }
                continue;
            }
            cache.push(item);
        }
        this.cache = cache;

    },
    /**
     *  查找expire最小的，即最快过期的cache项
     **/
    findNeedTimeoutCache: function() {
        var destItem = this.cache[0],
            expireTime = this.remainTime(destItem);

        for (var i = 1; i < this.cache.length; i++) {

            var item = this.cache[i];

            if (!destItem.options.expire && !item.options.expire) {
                continue;
            } else if (destItem.options.expire && !item.options.expire) {
                continue;
            } else if (!destItem.options.expire && item.options.expire) {
                destItem = item;
                expireTime = this.remainTime(destItem);
            } else {
                if (this.remainTime(item) < expireTime) {
                    destItem = item;
                    expireTime = this.remainTime(destItem);
                }
            }
        }

        return destItem;
    },
    findInHistory: function(pageId) {
        var matchedCache = null;

        for (var i = 0; i < this.histories.length; i++) {
            var item = this.histories[i];
            if (item && item.pageId == pageId) {
                matchedCache = item;
                break;
            }
        }

        return matchedCache;
    },
    findInCache: function(pageId) {
        var matchedCache = null;

        for (var i = 0; i < this.cache.length; i++) {
            var item = this.cache[i];
            if (item && item.pageId == pageId) {
                matchedCache = item;
                break;
            }
        }

        return matchedCache;
    },
    findCache: function(destItem) {
        var matchedCache = false;

        for (var i = 0; i < this.cache.length; i++) {
            var item = this.cache[i];
            if (item && item === destItem) {
                matchedCache = true;
                break;
            }
        }

        return matchedCache;
    },
    findHistory: function(destItem) {
        var matchedCache = false;

        for (var i = 0; i < this.histories.length; i++) {
            var item = this.histories[i];
            if (item && item == destItem) {
                matchedCache = true;
                break;
            }
        }

        return matchedCache;
    },
    removeFromCache: function(cacheItem) {
        var cache = [],
            isRemoved = false;

        for (var i = 0; i < this.cache.length; i++) {
            var item = this.cache[i];
            if (item && item === cacheItem) {
                isRemoved = true;
                if (!this.findHistory(cacheItem)) {
                    this.destoryPage(cacheItem.page);
                    // 表示从历史和缓存中清空了
                }
                continue;
            }
            cache.push(item);
        }
        this.cache = cache;

        return isRemoved;
    },
    removeFromHistory: function(cacheItem) {
        var histories = [],
            isRemoved = false;
        for (var i = 0; i < this.histories.length; i++) {
            var item = this.histories[i];
            if (item && item === cacheItem) {
                isRemoved = true;
                if (!this.findCache(cacheItem)) {
                    this.destoryPage(cacheItem.page);
                    // 表示从历史和缓存中清空了
                }
                continue;
            }
            histories.push(item);
        }
        this.histories = histories;

        return isRemoved;
    },
    updateExpire: function (cacheItem) {
        cacheItem.expire = (new Date).getTime();
    },
    addPage: function(page, config, status) {
        this.interfaces.add && this.interfaces.add.apply(this, arguments);

        this.showPage(page, config, status, true);
    },
    showPage: function(page, config, status, isInit) {
        this.interfaces.show && this.interfaces.show.apply(this, arguments);

        page._actived = true;

        // 把在显示中的历史页面隐藏掉
        if (!config.slience) {
            this.cleanPages(page);
            this.showingPages.push({
                page: page,
                config: config
            });
        }

    },
    cleanPages: function(currPage) {
        for (var i = 0; i < this.showingPages.length; i++) {
            var item = this.showingPages[i];
            if (item.page !== currPage) {
                this.hidePage(item.page, item.config);
            }
        }
        this.showingPages = [];
    },
    hidePage: function(page, config) {
        if (page._actived) {
            page._actived = false;
            this.interfaces.hide && this.interfaces.hide.apply(this, arguments);
        }
    },
    destoryPage: function (page) {
        this.interfaces.destroy && this.interfaces.destroy.apply(this, arguments);
    },
    isTimeout: function(cacheItem) {
        // expire 为0时永不过时
        if (cacheItem.options.expire === 0) return false;

        var isTimeout = (new Date).getTime() >= cacheItem.expire + cacheItem.options.expire * 1000;
        return isTimeout;
    },
    remainTime: function(cacheItem) {
        return (cacheItem.expire + cacheItem.options.expire * 1000) - (new Date).getTime();
    }
};


module.exports = factory;