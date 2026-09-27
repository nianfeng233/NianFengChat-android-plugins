// ─────────────────────────────────────────────────────────────────────────
// core.shell —— 应用外壳
//
// 它只做两件事：
//   1. 在页面之外画一条浮动底栏（视觉规格对齐 FengYu2 的 chatscreen）；
//   2. 在树里留一个 ['slot',{id:'page'}]，宿主会把当前页面插件产出的子树塞进来。
//
// 为什么要有 slot：底栏和页面是两个不同的插件。有了 slot，
// 换一条底栏风格不需要碰任何页面插件，反之亦然。
// ─────────────────────────────────────────────────────────────────────────
'use strict';

var NAV_H = 70;          // 底栏高度（dp）——完全对齐 FengYu2 的 NavBarHeight
var NAV_RADIUS = 35;     // 圆角
var NAV_SIDE = 48;       // 左右外边距
var NAV_BOTTOM = 20;     // 距屏幕底部

function navButton(t) {
  var color = t.active ? '@sakuraDeep' : '@ink';
  var icon = t.active ? (t.iconActive || t.icon) : t.icon;
  return nf.ui.col(
    {
      al: 'center',
      w: 62,
      padt: 9,
      tap: 'onNav',
      id: t.id
    },
    nf.ui.icon(icon, { w: 25, c: color }),
    nf.ui.spacer(4),
    nf.ui.txt(t.label, { fs: 10, c: color, fw: t.active ? 600 : 400 })
  );
}

function navBar(tabs) {
  if (!tabs || tabs.length === 0) { return nf.ui.spacer(0); }
  var items = [];
  for (var i = 0; i < tabs.length; i++) { items.push(navButton(tabs[i])); }
  // 外层这层 Box 的 al:'bottom' 就是「把栏压到屏幕底部」的那一步，
  // 对应 FengYu2 里的 .align(Alignment.BottomCenter)。
  // 注意：它是**位置**，不是高度 —— 两者别搞混。
  return nf.ui.box(
    { fillw: 1, al: 'bottom', padb: NAV_BOTTOM, padl: NAV_SIDE, padr: NAV_SIDE },
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

    return nf.ui.box(
      { fillw: 1, fillh: 1, bg: '@whisper' },
      nf.ui.box({ fillw: 1, fillh: 1 }, page),
      navBar(ctx.tabs)
    );
  },

  // 底栏点击：不自己切页面，而是把「意图」交回宿主。
  // 宿主统一管理路由，插件不持有导航状态 —— 这样多插件协作时不会打架。
  onNav: function (e) {
    if (!e || !e.id) { return { fx: [] }; }
    return { fx: [nf.fx.nav(e.id)] };
  }
};
