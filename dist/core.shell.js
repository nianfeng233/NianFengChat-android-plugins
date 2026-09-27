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

var NAV_H = 70;          // 底栏高度（dp）——对齐 FengYu2 的 NavBarHeight
var NAV_RADIUS = 35;     // 圆角
var NAV_SIDE = 46;       // 左右外边距
var NAV_BOTTOM = 18;     // 距屏幕底部

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
  return nf.ui.box(
    { fillw: 1, al: 'bottom', padb: NAV_BOTTOM, padl: NAV_SIDE, padr: NAV_SIDE },
    nf.ui.row(
      {
        fillw: 1,
        h: NAV_H,
        bg: '@whisper',
        r: NAV_RADIUS,
        elev: 10,
        padl: 16,
        padr: 16,
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
