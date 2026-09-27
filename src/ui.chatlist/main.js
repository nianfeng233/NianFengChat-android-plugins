// ─────────────────────────────────────────────────────────────────────────
// ui.chatlist —— 会话列表
//
// 数据来自宿主（render 的 ctx.data.conversations），插件是纯函数：
// 同样的入参永远画出同样的树。因此它天然可以被缓存、被预渲染、被热替换。
// ─────────────────────────────────────────────────────────────────────────
'use strict';

// 头像底色：全部落在 logo 的粉/黑体系内，不引入第五种颜色
var AVATAR_COLORS = ['#F7BCC8', '#F2A9B9', '#E9A2B0', '#D8A6B2', '#C9A6B3', '#EFB9A8'];

function avatarColor(seed) {
  return AVATAR_COLORS[Math.abs(seed | 0) % AVATAR_COLORS.length];
}

function avatar(name, seed, size) {
  return nf.ui.avatar(null, {
    w: size,
    h: size,
    bg: avatarColor(seed),
    s: name || '?',
    c: '@whisper',
    fs: Math.round(size * 0.42)
  });
}

function conversationRow(c) {
  return nf.ui.row(
    {
      fillw: 1,
      gap: 12,
      padh: 14,
      padv: 11,
      r: 16,
      bg: c.pinned ? '@sakuraSoft' : '@whisper',
      tap: 'onOpen',
      id: c.id,
      al: 'center',
      key: c.id
    },
    avatar(c.name, c.seed, 46),
    nf.ui.col(
      { gr: 1, gap: 3 },
      nf.ui.row(
        { fillw: 1, al: 'center' },
        nf.ui.txt(c.name, { fs: 15, fw: 600, c: '@ink', gr: 1, max: 1 }),
        nf.ui.txt(c.time, { fs: 10.5, c: '@inkFaint' })
      ),
      nf.ui.row(
        { fillw: 1, al: 'center', gap: 8 },
        nf.ui.txt(c.last, { fs: 12.5, c: '@inkSoft', gr: 1, max: 1 })
      )
    ),
    c.unread > 0 ? nf.ui.badge(c.unread, { bg: '@sakuraDeep', c: '@whisper' }) : null
  );
}

function header(totalUnread) {
  return nf.ui.row(
    { fillw: 1, padh: 18, padt: 10, padb: 6, al: 'center' },
    nf.ui.title('会话', { gr: 1 }),
    totalUnread > 0
      ? nf.ui.chip(totalUnread + ' 条未读', null, {
          bg: '@sakuraSoft', c: '@ink', fs: 11, padh: 10, padv: 4, r: 999
        })
      : null,
    nf.ui.icon('add', { w: 22, c: '@ink', padl: 10 })
  );
}

function searchBar() {
  return nf.ui.row(
    {
      fillw: 1, gap: 8, padh: 18, padt: 4, padb: 10, al: 'center'
    },
    nf.ui.row(
      {
        gr: 1, gap: 6, bg: '@paperSunken', r: 12, padh: 12, padv: 8, al: 'center'
      },
      nf.ui.icon('search', { w: 16, c: '@inkFaint' }),
      nf.ui.txt('搜索会话、联系人', { fs: 13, c: '@inkFaint' })
    )
  );
}

module.exports = {

  render: function (ctx) {
    var list = (ctx.data && ctx.data.conversations) || [];
    var rows = [];
    for (var i = 0; i < list.length; i++) { rows.push(conversationRow(list[i])); }

    return nf.ui.col(
      { fillw: 1, fillh: 1, bg: '@whisper' },
      header((ctx.data && ctx.data.totalUnread) || 0),
      searchBar(),
      rows.length
        ? nf.ui.list(
            // padb 是给浮动底栏让位：内容不能钻到底栏下面
            { fillw: 1, gr: 1, padb: 104, gap: 2, padh: 4 },
            rows
          )
        : nf.ui.empty('还没有会话')
    );
  },

  // 一个 handler 处理整排会话：靠点击载荷里的 id 区分，不用为每行注册一个函数
  onOpen: function (e) {
    if (!e || !e.id) { return { fx: [] }; }
    return {
      fx: [nf.fx.nav('chat', { conversationId: e.id })]
    };
  }
};
