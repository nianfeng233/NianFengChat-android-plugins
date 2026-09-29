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


// ─────────────────────────────────────────────────────────────────────────
// ui.chatlist —— 会话列表
//
// 数据全部来自宿主（render 的 ctx.data），插件是纯函数：
//   ctx.data.me            → 当前用户（头像/名字/在线状态）唯一来源
//   ctx.data.conversations → 会话（角色名/头像/未读/最后消息时间戳）唯一来源
// 插件里不存在第二份身份数据，也不做「未读总数」的二次统计 —— 那个数字
// 由宿主算好放进 tabs[].badge。这样改一处数据，所有页面同帧一致。
//
// 交互（由宿主渲染器统一实现，插件只声明意图）：
//   点击 / 长按 / 左滑出按钮 / 右滑收回 / 点别处收回 / 上下滚动
// ─────────────────────────────────────────────────────────────────────────
'use strict';

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

var WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function hm(d) { return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }

/**
 * 最后一条消息时间的显示规则（严格按需求）：
 *   今天            → 24 小时制「时:分」
 *   昨天            → 「昨天 时:分」
 *   2 ~ 6 天前      → 「星期X」（不显示具体时间）
 *                     7 天前恰好是上周同一天，为避免与本周混淆，故意排除
 *                     （例：今天是周一，范围往前只取到上周二）
 *   今年内更早       → 「M月D日」
 *   跨年            → 「YYYY年M月D日」
 *
 * ts 为 0（旧数据没有时间戳）时退回宿主给的 time 文本。
 */
function formatConversationTime(ts, fallback) {
  if (!ts || ts <= 0) { return fallback || ''; }
  var now = new Date();
  var then = new Date(ts);
  var diffDays = Math.round((startOfDay(now) - startOfDay(then)) / 86400000);

  if (diffDays <= 0) { return hm(then); }                      // 今天
  if (diffDays === 1) { return '昨天 ' + hm(then); }           // 昨天
  if (diffDays <= 6) { return WEEKDAYS[then.getDay()]; }       // 一周内：星期几
  if (then.getFullYear() === now.getFullYear()) {
    return (then.getMonth() + 1) + '月' + then.getDate() + '日';
  }
  return then.getFullYear() + '年' + (then.getMonth() + 1) + '月' + then.getDate() + '日';
}

// 头像：src 为空时由宿主按同一个 seed 生成占位色；插件不持有调色板。
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

// ── 顶栏 / 搜索框：与通讯录页共用 NFUI（构建期从 _shared/ui.common.js 内联）
// 视觉规格从此只维护一份；这里只固定会话页的 handler 与搜索占位文案。
function header(me) {
  return NFUI.topBar(me, { profileTap: 'onProfile', plusTap: 'onPlus' });
}

function searchBar() {
  return NFUI.searchBar('搜索', 'onSearch');
}

// ── 右侧滑出的操作按钮 ────────────────────────────────────────────────
function actionButton(label, icon, color, handler, id) {
  return nf.ui.col(
    {
      w: 78, fillh: 1, bg: color, al: 'center', js: 'center', gap: 5,
      tap: handler, id: id
    },
    nf.ui.icon(icon, { w: 19, c: '@whisper' }),
    nf.ui.txt(label, { fs: 11.5, c: '@whisper', fw: 500, max: 1 })
  );
}

// ── 单条会话：内容 + 同卡片右侧延伸的三个按钮 ─────────────────────────
// 无缝式：整行通栏、无圆角、无间隙、无分隔线（和参考图一致）。
function conversationCard(c, timeText, index) {
  // 头像容器：未读红点贴到头像右上角（不再塞在时间下面）
  var avatarBox = nf.ui.box(
    { w: 48, h: 48, key: 'av-' + c.id },
    avatar(c.avatar, c.name, c.seed, 48),
    c.unread > 0
      ? nf.ui.msgdot(c.unread, {
          id: c.id, key: 'dot-' + c.id, bg: '@danger', c: '@whisper',
          al: 'topend', ox: 5, oy: -4,
          // idx：红点在列表中的序号，用于「底栏红点掐爆后从上到下逐个爆」
          idx: index,
          drop: 'onClearUnread'
        })
      : null
  );

  var content = nf.ui.row(
    {
      fillw: 1, gap: 12, padh: 16, padv: 14, al: 'center',
      // 置顶会话用淡灰底（不再用粉色）
      bg: c.pinned ? '@paperSunken' : '@whisper'
    },
    avatarBox,
    nf.ui.col(
      { gr: 1, gap: 4 },
      nf.ui.txt(c.name, { fs: 15, fw: 600, c: '@ink', max: 1 }),
      nf.ui.txt(c.last, { fs: 12.5, c: '@inkSoft', max: 1 })
    ),
    // 最右列只剩时间
    nf.ui.col(
      { al: 'end', gap: 5 },
      nf.ui.txt(timeText, { fs: 10.5, c: '@inkFaint', max: 1 })
    )
  );

  var actions = [
    actionButton(c.pinned ? '取消置顶' : '置顶', 'pin', '@blue', 'onPin', c.id),
    actionButton('标为未读', 'mark_unread', '@amber', 'onUnread', c.id),
    actionButton('删除', 'delete', '@danger', 'onDelete', c.id)
  ];

  // 手势与按钮都在宿主的 swipe 节点里实现：
  //   tap  → 打开会话       long → 弹操作单
  //   左滑 → 露出三个按钮   右滑 → 收回
  return nf.ui.swipe(
    {
      fillw: 1, key: c.id, id: c.id, tap: 'onOpen', long: 'onLong'
    },
    content,
    actions
  );
}

// ── 长按浮窗（贴在选中的会话上方，箭头指向它）──────────────────────────
function menuPopup(menu) {
  var defs = [];
  defs.push({ label: menu.pinned ? '取消置顶' : '置顶', handler: 'onMenuPin' });
  if (menu.unread > 0) { defs.push({ label: '标为已读', handler: 'onMenuRead' }); }
  defs.push({ label: '删除', handler: 'onMenuDelete' });
  // 会话长按与通讯录分组长按共用 NFUI 的同一套浮窗视觉/定位。
  return NFUI.popupMenu(menu, defs, { itemW: 78 });
}

// ── 数据查询（数据在 render 时缓存，handler 只读不写）──────────────────
function findConversation(id) {
  var list = nf.state.convs || [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) { return list[i]; }
  }
  return null;
}

function toFxs(list) {
  var out = [];
  for (var i = 0; i < list.length; i++) { if (list[i]) { out.push(list[i]); } }
  return out;
}

module.exports = {

  render: function (ctx) {
    var data = ctx.data || {};
    var me = data.me || { name: '我', seed: 0, online: false, status: '' };
    // 宿主只下发「可视窗口附近」的一小段（默认 30 条），顺序已在数据层排好；
    // window 里带着 offset/total/hasMore，用来决定什么时候取下一页。
    var list = data.conversations || [];
    var win = data.window || { offset: 0, limit: list.length, total: list.length, hasMore: false };

    // 缓存给 handler 读；插件不修改数据，修改一律发意图给宿主
    nf.state.convs = list;
    nf.state.me = me;
    nf.state.window = win;

    var rows = [];
    for (var i = 0; i < list.length; i++) {
      rows.push(conversationCard(
        list[i],
        formatConversationTime(list[i].ts, list[i].time),
        i
      ));
    }
    // 后面还有数据时，末尾放一个提示条（滚到就自动触发加载）
    if (win.hasMore) {
      rows.push(nf.ui.row(
        { fillw: 1, h: 48, js: 'center', al: 'center' },
        nf.ui.txt('正在加载更早的会话…', { fs: 12, c: '@inkFaint' })
      ));
    }

    var body = nf.ui.col(
      { fillw: 1, fillh: 1, bg: '@whisper' },
      header(me),
      searchBar(),
      rows.length
        ? nf.ui.list(
            // 无缝式：整块白底一直铺到屏幕底，行与行之间没有间隙和圆角；
            // padb 是「最后一条能滚到多高」的留白，列表本身仍从悬浮底栏下面穿过。
            // woff：窗口起点变化时渲染器自动补偿滚动位置；onEnd：滚到接近末尾要下一页。
            {
              fillw: 1, gr: 1, bg: '@whisper', padt: 2, padb: 120, gap: 0,
              woff: win.offset,
              onEnd: win.hasMore ? 'onLoadMore' : null
            },
            rows
          )
        : nf.ui.empty('还没有会话')
    );

    // 长按浮窗画在整页最上层（最后绘制的孩子在最上面）
    return nf.ui.box(
      { fillw: 1, fillh: 1, bg: '@whisper' },
      body,
      nf.state.menu ? menuPopup(nf.state.menu) : null
    );
  },

  // 滚到接近末尾：向宿主再要一页（窗口化，数据层负责滑窗与丢弃最早的一批）
  onLoadMore: function () {
    return { fx: [nf.fx.run('conversation.window')] };
  },

  // 打开会话：顺手把这一条的未读清掉（真相仍在宿主数据层）
  onOpen: function (e) {
    if (!e || !e.id) { return { fx: [] }; }
    return {
      fx: toFxs([
        nf.fx.nav('chat', { conversationId: e.id }),
        nf.fx.run('conversation.read', { id: e.id })
      ])
    };
  },

  // 长按：打开贴着这条会话上方的小浮窗
  // 载荷里有这一行的页面坐标（x/y/w/h/vw/vh，dp），浮窗据此定位
  onLong: function (e) {
    var c = e && e.id ? findConversation(e.id) : null;
    if (!c) { return { fx: [] }; }
    nf.state.menu = {
      id: c.id, name: c.name,
      pinned: !!c.pinned, unread: c.unread | 0,
      x: e.x || 0, y: e.y || 0, w: e.w || 0, h: e.h || 0,
      vw: e.vw || 390, vh: e.vh || 800
    };
    return { fx: [nf.fx.run('refresh')] };
  },

  // ── 左滑按钮 ────────────────────────────────────────────────────────
  onPin: function (e) {
    var c = e && e.id ? findConversation(e.id) : null;
    if (!c) { return { fx: [] }; }
    return {
      fx: toFxs([
        nf.fx.toast(c.pinned ? '已取消置顶' : '已置顶'),
        nf.fx.run('conversation.pin', { id: c.id, pinned: !c.pinned })
      ])
    };
  },

  onUnread: function (e) {
    var c = e && e.id ? findConversation(e.id) : null;
    if (!c) { return { fx: [] }; }
    return {
      fx: toFxs([
        nf.fx.toast('已标为未读'),
        nf.fx.run('conversation.unread', { id: c.id, unread: c.unread > 0 ? c.unread : 1 })
      ])
    };
  },

  onDelete: function (e) {
    var c = e && e.id ? findConversation(e.id) : null;
    if (!c) { return { fx: [] }; }
    return {
      fx: toFxs([
        nf.fx.toast('已删除「' + c.name + '」'),
        nf.fx.run('conversation.delete', { id: c.id })
      ])
    };
  },

  // ── 长按操作单 ──────────────────────────────────────────────────────
  onMenuPin: function () {
    var m = nf.state.menu;
    var c = m ? findConversation(m.id) : null;
    nf.state.menu = null;
    if (!c) { return { fx: [] }; }
    return {
      fx: toFxs([
        nf.fx.toast(c.pinned ? '已取消置顶' : '已置顶'),
        nf.fx.run('conversation.pin', { id: c.id, pinned: !c.pinned })
      ])
    };
  },

  onMenuRead: function () {
    var m = nf.state.menu;
    nf.state.menu = null;
    if (!m) { return { fx: [] }; }
    return {
      fx: toFxs([
        nf.fx.toast('已标为已读'),
        nf.fx.run('conversation.read', { id: m.id })
      ])
    };
  },

  onMenuDelete: function () {
    var m = nf.state.menu;
    nf.state.menu = null;
    if (!m) { return { fx: [] }; }
    return {
      fx: toFxs([
        nf.fx.toast('已删除「' + m.name + '」'),
        nf.fx.run('conversation.delete', { id: m.id })
      ])
    };
  },

  onMenuClose: function () {
    nf.state.menu = null;
    return { fx: [nf.fx.run('refresh')] };
  },

  // 把会话头像右上角的红点拖远：炸开后这条会话标为已读
  onClearUnread: function (e) {
    if (!e || !e.id) { return { fx: [] }; }
    return {
      fx: toFxs([
        nf.fx.toast('已标为已读'),
        nf.fx.run('conversation.read', { id: e.id })
      ])
    };
  },

  // ── 占位交互（让人能立刻试出「点击特效 / 提示」）────────────────────
  onPlus: function () {
    return { fx: [nf.fx.toast('发起新会话（占位）')] };
  },

  onSearch: function () {
    return { fx: [nf.fx.toast('搜索（占位）')] };
  },

  onProfile: function () {
    return { fx: [nf.fx.nav('me')] };
  }
};
