// ui.me —— 我
'use strict';

var AVATAR_COLORS = ['#F7BCC8', '#F2A9B9', '#E9A2B0', '#D8A6B2', '#C9A6B3', '#EFB9A8'];
function avatarColor(seed) { return AVATAR_COLORS[Math.abs(seed | 0) % AVATAR_COLORS.length]; }
function avatar(name, seed, size) {
  return nf.ui.avatar(null, {
    w: size, h: size, bg: avatarColor(seed),
    s: name || '?', c: '@whisper', fs: Math.round(size * 0.42)
  });
}

var ENTRIES = [
  { id: 'profile',  icon: 'person',        label: '个人资料' },
  { id: 'theme',    icon: 'palette',       label: '主题与配色' },
  { id: 'fav',      icon: 'favorite',      label: '收藏' },
  { id: 'sticker',  icon: 'emoji',         label: '表情包' },
  { id: 'plugins',  icon: 'extension',     label: '插件管理' },
  { id: 'settings', icon: 'settings',      label: '设置' }
];

function profileCard(p) {
  return nf.ui.row(
    { fillw: 1, gap: 14, padh: 18, padv: 18, al: 'center', bg: '@whisper' },
    avatar(p.name, p.seed, 62),
    nf.ui.col({ gr: 1, gap: 5 },
      nf.ui.txt(p.name, { fs: 19, fw: 700, c: '@ink' }),
      nf.ui.txt(p.signature, { fs: 12.5, c: '@inkFaint', max: 1 })
    ),
    nf.ui.icon('chevron_right', { w: 20, c: '@inkFaint' })
  );
}

function entryRow(e) {
  return nf.ui.row(
    {
      fillw: 1, gap: 13, padh: 18, padv: 15, al: 'center',
      tap: 'onEntry', id: e.id, key: e.id
    },
    nf.ui.box(
      { w: 34, h: 34, r: 10, bg: '@sakuraSoft', al: 'center' },
      nf.ui.icon(e.icon, { w: 18, c: '@sakuraDeep' })
    ),
    nf.ui.txt(e.label, { fs: 14.5, c: '@ink', gr: 1 }),
    nf.ui.icon('chevron_right', { w: 17, c: '@inkFaint' })
  );
}

module.exports = {

  render: function (ctx) {
    var p = (ctx.data && ctx.data.profile) || { name: '我', signature: '', seed: 7 };
    var rows = [];
    for (var i = 0; i < ENTRIES.length; i++) { rows.push(entryRow(ENTRIES[i])); }

    return nf.ui.col(
      { fillw: 1, fillh: 1, bg: '@paperSunken' },
      nf.ui.box({ fillw: 1, bg: '@whisper' }, profileCard(p)),
      nf.ui.spacer(10),
      nf.ui.col(
        { fillw: 1, bg: '@whisper', r: 0, gr: 1, padb: 84 },
        nf.ui.list({ fillw: 1, gr: 1 }, rows)
      )
    );
  },

  onEntry: function (e) {
    var id = e && e.id;
    if (id === 'theme') {
      // 跳到另一个插件提供的页面：插件之间不直接耦合，只发一条导航意图
      return { fx: [nf.fx.nav('theme')] };
    }
    return { fx: [nf.fx.toast('「' + id + '」将由对应插件接管')] };
  }
};
