// ui.me —— 我
//
// 资料卡的数据来自 ctx.data.me —— 与会话列表顶栏同一份「我是谁」。
// 这里不定义任何头像/昵称变量，也不持有调色板：src 为空时由宿主按 seed 生成。
'use strict';

function avatar(src, name, seed, size) {
  return nf.ui.avatar(src || null, {
    w: size, h: size, seed: seed | 0,
    s: name || '?', c: '@whisper', fs: Math.round(size * 0.4)
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

function statusText(p) {
  var base = p.online ? '在线' : '离线';
  return p.status ? (base + ' · ' + p.status) : base;
}

function profileCard(p) {
  return nf.ui.row(
    { fillw: 1, gap: 14, padh: 18, padv: 18, al: 'center', bg: '@whisper' },
    avatar(p.avatar, p.name, p.seed, 62),
    nf.ui.col({ gr: 1, gap: 5 },
      nf.ui.txt(p.name, { fs: 19, fw: 700, c: '@ink' }),
      nf.ui.row({ gap: 6, al: 'center' },
        nf.ui.box({ w: 7, h: 7, r: 4, bg: p.online ? '@success' : '@inkFaint' }),
        nf.ui.txt(statusText(p), { fs: 11.5, c: '@inkFaint', max: 1 })
      ),
      nf.ui.txt(p.signature || '', { fs: 12.5, c: '@inkFaint', max: 1 })
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
    // me 是宿主注入的全局身份切片（与 chatlist 顶栏同源）；
    // profile 是旧字段，仅作兼容回退。
    var data = ctx.data || {};
    var p = data.me || data.profile || { name: '我', signature: '', seed: 7, online: false, status: '' };
    var rows = [];
    for (var i = 0; i < ENTRIES.length; i++) { rows.push(entryRow(ENTRIES[i])); }

    return nf.ui.col(
      { fillw: 1, fillh: 1, bg: '@whisper' },
      nf.ui.box({ fillw: 1, bg: '@whisper' }, profileCard(p)),
      nf.ui.divider({ c: '@hairline', padh: 18 }),
      // padb 交给列表当 contentPadding：菜单能滚到悬浮底栏上方，
      // 列表本身从底栏下面穿过，不会在底部留出一块异色遮罩。
      nf.ui.list({ fillw: 1, gr: 1, padt: 6, padb: 120 }, rows)
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
