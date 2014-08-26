'use strict;'
/**
 *  View 路由管理器
 **/
var factory = require('./factory.js'),
    pageStatus = {
        CURRENT: 0,
        CACHE: 1,
        CREATE: 2,
        HISTORY: 3
    };

var pageManager = {

    init: function(options) {
        factory.init(el, options || {});
    },
    render: function(context) {

        // 页面是否前进还是后退的标识
        var forward = context.forward,
            cur = factory.findInHistory(context.routes.old), // 当前页
            last = null,
            current;

        if (context.routes.old === context.routes.new && cur) {
            // 当前页面的切换, 相同url
            factory.showPage(cur.page, context, pageStatus.CURRENT/*current page*/);
            // 记录新页面
            current = cur;

        } else if (forward) {

            last = factory.findInCache(context.routes.new); // 跳转新页

            // 页面标识为使用缓存，且缓存为超时
            if (last && last.options.cache && !factory.isTimeout(last)) {
                info.cache('View cache from', context.routes.old, 'to', context.routes.new);

                // if hit cache, update expire time
                factory.updateExpire(last);
                // 记录新页面
                current = last;

                factory.showPage(last.page, context, pageStatus.CACHE/*cache page*/);

                cur && factory.hidePage(cur.page);
                // 从缓存中取出来，添加进历史中
                factory.addToHistory(last);

                // 无法从缓存中拿到页面实例了，新建页面实例
            } else {
                info.create('View created from', context.routes.old, 'to', context.routes.new);
                // 记录新页面
                current = factory.create(context);

                factory.addPage(current.page, context, pageStatus.CREATE/*create page*/);
                cur && factory.hidePage(cur.page);

                // 如果当前页面缓存已经超时，清除之
                if (last && last.options.cache && factory.isTimeout(last)) {
                    factory.removeFromCache(last);
                }
            }

        } else {
            // 初次打开页面
            if (!cur) {
                info.init('View init ', context.routes.new);
                cur = factory.create(context);
                // 记录新页面
                current = cur;
                factory.addPage(cur.page, context, pageStatus.CREATE/*create page*/);

                // 后退 or 前进
            } else {

                last = factory.findInHistory(context.routes.new);
                // 后退页面存在缓存历史
                if (last) {
                    info.history('View history from', context.routes.old, 'to', context.routes.new);
                    // 记录新页面
                    current = last;
                    factory.showPage(last.page, context, pageStatus.HISTORY/*history page*/);
                    factory.hidePage(cur.page);

                    // 没有后退历史了，创建新的页面实例放进历史记录中
                } else {
                    info.back('New history from', context.routes.old, 'to', context.routes.new);

                    last = factory.create(context);
                    // 记录新页面
                    current = last;

                    factory.addPage(last.page, context, pageStatus.CREATE/*created history page*/);
                    factory.hidePage(cur.page);
                }
            }
        }

        return current.page;
    },
    exist: function () {
        return factory.exist;
    },
    isDebug: function () {
        return !!localStorage.getItem('__page_debug__');
    }
};

var info = {
    log: function (style, args) {
        if (!pageManager.isDebug ()) return;
         
        args = Array.prototype.slice.call(args);
        var typeText = args.shift(),
        args = ['%c[view-manager]%c' + typeText, 'color: blue;font-size:16px;', style].concat(args)
        console.log.apply(console, args);
    },
    init: function () {
        this.log('color:cornflowerblue;font-size:14px;', arguments);
    },
    cache: function () {
        this.log('color:orange;font-size:14px;', arguments);
    },
    create: function () {
        this.log('color:greenyellow;font-size:14px;', arguments);
    },
    history: function () {
        this.log('color:gray;font-size:14px;', arguments);
    },
    back: function () {
        this.log('color:#333;font-size:14px;', arguments);
    }
}

// DEBUG
window.__page__ = factory;

module.exports = pageManager;
