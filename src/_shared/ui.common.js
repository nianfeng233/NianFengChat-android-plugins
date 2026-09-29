// ─────────────────────────────────────────────────────────────────────────
// ui.common —— 页面插件之间真正共用的 UI 片段
//
// 这个文件不是插件：它没有自己的清单，由 tools/build_index.py 按
// plugin.json 里的 "shared" 声明**内联**到需要的插件源码顶部。
//
// 为什么采用「构建期内联」而不是运行期 require：
//   1. 基座是原子插件加载（一个 .js 一个 JS 上下文），运行期没有模块解析器；
//   2. 跨插件同步 call 会多一次往返，而顶栏是每次 render 都要画的纯 UI；
//   3. 构建期内联后，dist 仍然是一个单文件，部署路径不变。
//
// 这里只放「多页面长得完全一样」的东西。一旦某个页面需要不同行为，
// 优先通过 opts 传参，而不是复制一份改。
// ─────────────────────────────────────────────────────────────────────────
'use strict';

var NFUI = (function () {

  // 头像：src 为空时由宿主按 seed 生成占位色；插件不持有调色板。
  function avatar(src, name, seed, size) {
    return nf.ui.avatar(src || null, {
      w: size, h: size, seed: seed | 0,
      s: name || '?', c: '@whisper', fs: Math.round(size * 0.4)
    });
  }

  function statusText(me) {
    var base = me.online ? '在线' : '离线';
    return me.status ? (base + ' · ' + me.status) : base;
  }

  /**
   * 顶部栏：用户头像 + 用户名 + 在线状态 + 加大号「+」。
   *
   * 会话页与通讯录页必须共用这一份。opts 只用来换 handler，不换视觉：
   *   opts.profileTap  默认 onProfile
   *   opts.plusTap     默认 onPlus
   */
  function topBar(me, opts) {
    opts = opts || {};
    return nf.ui.row(
      {
        fillw: 1, gap: 12, padh: 18, padt: 12, padb: 10, al: 'center'
      },
      nf.ui.box(
        { tap: opts.profileTap || 'onProfile', id: 'me' },
        avatar(me.avatar, me.name, me.seed, 46)
      ),
      nf.ui.col(
        { gr: 1, gap: 4 },
        nf.ui.txt(me.name || '我', { fs: 18, fw: 700, c: '@ink', max: 1 }),
        nf.ui.row(
          { gap: 6, al: 'center' },
          nf.ui.box({ w: 7, h: 7, r: 4, bg: me.online ? '@success' : '@inkFaint' }),
          nf.ui.txt(statusText(me), { fs: 11.5, c: '@inkFaint', max: 1 })
        )
      ),
      nf.ui.icon('add_thin', {
        w: 46, c: '@ink', tap: opts.plusTap || 'onPlus', pad: 2
      })
    );
  }

  /**
   * 搜索框：会话页和通讯录页共用同一视觉。
   * 当前两个页面都只做到「点一下给占位提示」，真正的搜索输入后续再接。
   */
  function searchBar(placeholder, tap) {
    return nf.ui.row(
      { fillw: 1, padh: 18, padt: 2, padb: 12, al: 'center' },
      nf.ui.row(
        {
          fillw: 1, gap: 8, bg: '@paperSunken', r: 14,
          padh: 14, padv: 13, al: 'center', tap: tap || 'onSearch', id: 'search'
        },
        nf.ui.icon('search', { w: 17, c: '@inkFaint' }),
        nf.ui.txt(placeholder, { fs: 13.5, c: '@inkFaint' })
      )
    );
  }

  /**
   * 贴近某个节点的、带箭头的小浮窗菜单。
   *
   * 会话长按和分组长按共用同一套视觉/定位规则；插件只提供 defs：
   *   [{ label: '删除', handler: 'onMenuDelete' }, ...]
   * menu 里带上宿主长按载荷的 x/y/w/h/vw/vh（都是 dp）。
   */
  function popupMenu(menu, defs, opts) {
    if (!menu || !defs || !defs.length) { return null; }
    opts = opts || {};
    var itemW = opts.itemW || 78;
    var menuW = itemW * defs.length;
    var menuH = 36;
    var arrowH = 10;
    var gap = 4;
    var vw = menu.vw || 390;

    var mx = (menu.x || 0) + ((menu.w || 0) - menuW) / 2;
    mx = Math.max(8, Math.min(mx, vw - menuW - 8));
    var my = Math.max(8, (menu.y || 0) - menuH - arrowH - gap);

    var items = [];
    for (var i = 0; i < defs.length; i++) {
      if (i > 0) { items.push(nf.ui.box({ w: 0.5, h: 18, bg: '#55FFFFFF' })); }
      items.push(nf.ui.box(
        { w: itemW, h: menuH, al: 'center', tap: defs[i].handler, id: 'menu-' + i },
        nf.ui.txt(defs[i].label, { fs: 13, c: '@whisper', max: 1 })
      ));
    }

    return nf.ui.box(
      { fillw: 1, fillh: 1 },
      // 透明遮罩：在「其他位置按下」立即关闭
      nf.ui.box({ fillw: 1, fillh: 1, down: opts.closeHandler || 'onMenuClose' }),
      nf.ui.col(
        { al: 'topstart', ox: mx, oy: my },
        nf.ui.row({ bg: '#4C4C4C', r: 8, clip: true, elev: 8, al: 'center' }, items),
        nf.ui.row({ w: menuW, js: 'center' },
          nf.ui.icon('arrow_drop_down', { w: 22, c: '#4C4C4C', oy: -6 })
        )
      )
    );
  }

  return {
    avatar: avatar,
    statusText: statusText,
    topBar: topBar,
    searchBar: searchBar,
    popupMenu: popupMenu
  };
})();
