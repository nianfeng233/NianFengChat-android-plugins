// ui.contacts —— 通讯录
'use strict';

// 头像底色：仅在 logo 的粉/黑体系内取值
var AVATAR_COLORS = ['#F7BCC8', '#F2A9B9', '#E9A2B0', '#D8A6B2', '#C9A6B3', '#EFB9A8'];
function avatarColor(seed) { return AVATAR_COLORS[Math.abs(seed | 0) % AVATAR_COLORS.length]; }
function avatar(name, seed, size) {
  return nf.ui.avatar(null, {
    w: size, h: size, bg: avatarColor(seed),
    s: name || '?', c: '@whisper', fs: Math.round(size * 0.42)
  });
}

var TABS = [
  { id: 'all',    label: '全部' },
  { id: 'group',  label: '群聊' },
  { id: 'private',label: '私聊' },
  { id: 'star',   label: '星标' }
];

// 分栏状态存在插件自己的 state 里。
// 注意：这份 state 活在 JS 侧，切 tab 只重渲染当前插件，不需要宿主介入。
var ui = { tab: 'all' };

function tabRow() {
  var items = [];
  for (var i = 0; i < TABS.length; i++) {
    var t = TABS[i];
    var on = t.id === ui.tab;
    items.push(nf.ui.chip(t.label, 'onTab', {
      id: t.id,
      bg: on ? '@sakura' : '@paperSunken',
      c: on ? '@ink' : '@inkSoft',
      fs: 12.5,
      padh: 14,
      padv: 7,
      r: 999,
      fw: on ? 600 : 400
    }));
  }
  return nf.ui.row({ fillw: 1, gap: 8, padh: 18, padt: 6, padb: 12, al: 'center' }, items);
}

function pick(list) {
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var c = list[i];
    if (ui.tab === 'star' && !c.starred) { continue; }
    if (ui.tab === 'group' && c.group !== '群聊') { continue; }
    if (ui.tab === 'private' && c.group === '群聊') { continue; }
    out.push(c);
  }
  return out;
}

function contactRow(c) {
  return nf.ui.row(
    {
      fillw: 1, gap: 12, padh: 14, padv: 10, r: 14,
      tap: 'onOpen', id: c.id, al: 'center', key: c.id
    },
    avatar(c.name, c.seed, 42),
    nf.ui.col(
      { gr: 1, gap: 2 },
      nf.ui.row({ fillw: 1, al: 'center' },
        nf.ui.txt(c.name, { fs: 14.5, fw: 500, gr: 1, max: 1, c: '@ink' }),
        c.starred ? nf.ui.icon('star_filled', { w: 14, c: '@sakuraDeep' }) : null
      ),
      nf.ui.txt(c.signature, { fs: 12, c: '@inkFaint', max: 1 })
    )
  );
}

function groupHeader(letter) {
  return nf.ui.txt(letter, {
    fs: 11.5, fw: 600, c: '@inkSoft', padh: 18, padt: 10, padb: 4
  });
}

module.exports = {

  render: function (ctx) {
    var all = (ctx.data && ctx.data.contacts) || [];
    var list = pick(all);

    // 按 group 分组（这里 group 直接就是首字母/置顶）
    var blocks = [];
    var last = null;
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.group !== last) { blocks.push(groupHeader(c.group)); last = c.group; }
      blocks.push(contactRow(c));
    }

    return nf.ui.col(
      { fillw: 1, fillh: 1, bg: '@whisper' },
      nf.ui.row({ fillw: 1, padh: 18, padt: 10, padb: 4, al: 'center' },
        nf.ui.title('通讯录', { gr: 1 }),
        nf.ui.icon('add', { w: 22, c: '@ink' })
      ),
      tabRow(),
      list.length
        ? nf.ui.list({ fillw: 1, gr: 1, padb: 84, padh: 4 }, blocks)
        : nf.ui.empty('这个分栏里还没有人')
    );
  },

  onTab: function (e) {
    if (!e || !e.id) { return { fx: [] }; }
    ui.tab = e.id;
    // 插件自己改了内部状态 → 让宿主重渲染（数据没变，但视图需要刷新）
    return { fx: [nf.fx.run('refresh')] };
  },

  onOpen: function (e) {
    return { fx: [nf.fx.toast('打开联系人：' + (e && e.id))] };
  }
};
