// ─────────────────────────────────────────────────────────────────────────
// core.shell —— 应用外壳
//
// 它只做两件事：
//   1. 在页面之外画一条浮动底栏（视觉规格对齐 NianFengChat 的 chatscreen）；
//   2. 在树里留一个 ['slot',{id:'page'}]，宿主会把当前页面插件产出的子树塞进来。
//
// 为什么要有 slot：底栏和页面是两个不同的插件。有了 slot，
// 换一条底栏风格不需要碰任何页面插件，反之亦然。
// ─────────────────────────────────────────────────────────────────────────
'use strict';

var NAV_H = 70;          // 底栏高度（dp）——完全对齐 NianFengChat 的 NavBarHeight
var NAV_RADIUS = 35;     // 圆角
var NAV_SIDE = 48;       // 左右外边距
var NAV_BOTTOM = 30;     // 距屏幕底部（悬浮抬高一点，避开系统手势条）

// 哪个 tab 显示哪个数字，是**外壳插件自己的决定**（tab 本来也是这里声明的）。
// 基座只提供数据事实 ctx.counts（如 unread = 未读总数），不预设 tab 语义。
function badgeOf(t, counts) {
  var n = t.badge | 0;
  if (n > 0) { return n; }                        // 清单/宿主显式给了角标就用它
  if (t.id === 'chat') { return (counts && counts.unread) | 0; }
  return 0;
}

function navButton(t, counts) {
  var color = t.active ? '@success' : '@ink';
  var icon = t.active ? (t.iconActive || t.icon) : t.icon;
  var badge = badgeOf(t, counts);
  return nf.ui.col(
    {
      al: 'center',
      w: 62,
      padt: 9,
      tap: 'onNav',
      id: t.id
    },
    // 图标 + 右上角小红角标：角标锚在图标右上角后向外偏移一点，
    // 只压住图标的一个角（角标本体很小，绝不盖住图标）。
    nf.ui.box(
      { w: 25, h: 27 },
      nf.ui.icon(icon, { w: 25, c: color }),
      badge > 0
        ? nf.ui.msgdot(badge, {
            id: t.id, key: 'nav-dot-' + t.id,
            bg: '@danger', c: '@whisper', al: 'topend', ox: 12, oy: -6,
            // 它是级联发起者：掐爆后逐条引爆会话行里的红点，最后统一清未读
            cascade: 1,
            drop: 'onClearAll'
          })
        : null
    ),
    nf.ui.spacer(4),
    nf.ui.txt(t.label, { fs: 10, c: color, fw: t.active ? 600 : 400 })
  );
}

function navBar(tabs, counts) {
  if (!tabs || tabs.length === 0) { return nf.ui.spacer(0); }
  var items = [];
  for (var i = 0; i < tabs.length; i++) { items.push(navButton(tabs[i], counts)); }
  // 外层这层 Box 的 al:'bottom' 就是「把栏压到屏幕底部」的那一步，
  // 对应 NianFengChat 里的 .align(Alignment.BottomCenter)。
  // dock:'bottom' 声明它是「跟随上下滚动收起/显现的悬浮层」，
  // 具体收起比例由宿主根据当前页面的真实滚动量驱动。
  return nf.ui.box(
    { fillw: 1, al: 'bottom', padb: NAV_BOTTOM, padl: NAV_SIDE, padr: NAV_SIDE, dock: 'bottom' },
    nf.ui.row(
      {
        fillw: 1,
        h: NAV_H,
        bg: '@whisper',      // NavBarBackgroundColor
        r: NAV_RADIUS,       // RoundedCornerShape(35dp)
        elev: 8,             // NavBarShadowElevation，必须能真的画出来
        padl: 24,
        padr: 24,
        js: 'evenly',
        al: 'center'
      },
      items
    )
  );
}

module.exports = {

  render: function (ctx) {
    var page = ctx.hasPage
      ? ['slot', { id: 'page' }]
      : nf.ui.empty('还没有任何页面插件');

    var tabs = ctx.tabs || [];
    var routeView = ctx.route && ctx.route.view;

    // 只在「一级 tab 页」显示悬浮底栏：
    // 聊天页 / 主题页这类二级页不显示，否则会压住输入框/内容。
    var isTabPage = false;
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].view === routeView) { isTabPage = true; break; }
    }

    return nf.ui.box(
      { fillw: 1, fillh: 1, bg: '@whisper' },
      nf.ui.box({ fillw: 1, fillh: 1 }, page),
      isTabPage ? navBar(tabs, ctx.counts) : null
    );
  },

  // 底栏点击：不自己切页面，而是把「意图」交回宿主。
  // 宿主统一管理路由，插件不持有导航状态 —— 这样多插件协作时不会打架。
  onNav: function (e) {
    if (!e || !e.id) { return { fx: [] }; }
    return { fx: [nf.fx.nav(e.id)] };
  },

  // 把底栏「会话」右上角的红点拖远：炸开后清空所有未读
  onClearAll: function () {
    return {
      fx: [
        nf.fx.toast('已全部标为已读'),
        nf.fx.run('conversation.readAll')
      ]
    };
  }
};
