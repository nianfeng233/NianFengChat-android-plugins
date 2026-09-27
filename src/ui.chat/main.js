// ─────────────────────────────────────────────────────────────────────────
// ui.chat —— 聊天页
//
// 发送链路的性能关键点（务必别改坏）：
//   • 输入框文本存在**宿主缓冲**里（nf.ui.input 的 id），按键不跨进程；
//   • 发送按钮用 bind 把输入框绑进来，宿主在点击载荷里直接带上文本，
//     插件因此不需要「先查询输入框」—— 少一次跨进程往返；
//   • 插件只发一条 run('sendMessage') 意图，真正的乐观更新由宿主同步完成，
//     所以用户气泡的出现时间与插件复杂度无关。
// ─────────────────────────────────────────────────────────────────────────
'use strict';

var AVATAR_COLORS = ['#F7BCC8', '#F2A9B9', '#E9A2B0', '#D8A6B2', '#C9A6B3', '#EFB9A8'];
function avatarColor(seed) { return AVATAR_COLORS[Math.abs(seed | 0) % AVATAR_COLORS.length]; }
function avatar(name, seed, size) {
  return nf.ui.avatar(null, {
    w: size, h: size, bg: avatarColor(seed),
    s: name || '?', c: '@whisper', fs: Math.round(size * 0.42)
  });
}

var INPUT_ID = 'nf.chat.input';

function topBar(conv) {
  return nf.ui.row(
    { fillw: 1, gap: 10, padh: 12, pady: 10, padv: 10, al: 'center', bg: '@whisper' },
    nf.ui.icon('back', { w: 22, c: '@ink', tap: 'onBack' }),
    avatar(conv.name, conv.seed, 34),
    nf.ui.col({ gr: 1, gap: 1 },
      nf.ui.txt(conv.name, { fs: 15.5, fw: 600, c: '@ink', max: 1 }),
      nf.ui.txt('在线', { fs: 10.5, c: '@inkFaint' })
    ),
    nf.ui.icon('call', { w: 20, c: '@ink', padl: 6 }),
    nf.ui.icon('video', { w: 21, c: '@ink', padl: 10 }),
    nf.ui.icon('more', { w: 20, c: '@ink', padl: 10 }),
    nf.ui.divider(null)
  );
}

function bubble(m) {
  var mine = m.role === 'user';
  var pending = !mine && (!m.text || m.text.length === 0);

  var body = pending
    ? nf.ui.row({ gap: 4, al: 'center', padt: 4, padb: 4 },
        nf.ui.box({ w: 6, h: 6, r: 3, bg: '@sakuraDeep' }),
        nf.ui.box({ w: 6, h: 6, r: 3, bg: '@sakura' }),
        nf.ui.box({ w: 6, h: 6, r: 3, bg: '@sakuraSoft' })
      )
    : nf.ui.txt(m.text, { fs: 14.5, c: '@ink', lh: 21 });

  return nf.ui.row(
    { fillw: 1, gap: 9, al: 'center', padt: 5, padb: 5, key: String(m.id) },
    mine ? nf.ui.box({ gr: 1 }) : null,
    mine ? null : avatar(mine ? '' : '对', m.id % 6, 34),
    nf.ui.box(
      {
        maxw: 268,
        bg: mine ? '@sakura' : '@whisper',
        r: 18,
        padh: 14,
        padv: 9,
        bw: mine ? null : 1,
        bc: mine ? null : '@hairline'
      },
      body
    ),
    mine ? null : nf.ui.box({ gr: 1 })
  );
}

function composer() {
  return nf.ui.row(
    {
      fillw: 1, gap: 9, padh: 12, padt: 8, padb: 10, al: 'center',
      bg: '@whisper'
    },
    nf.ui.icon('emoji', { w: 23, c: '@inkSoft' }),
    nf.ui.box(
      { gr: 1 },
      nf.ui.input({
        id: INPUT_ID,
        ph: '说点什么…',
        submit: 'onSend',
        max: 4,
        fs: 15,
        bg: '@paperSunken',
        r: 20,
        padh: 14,
        padv: 9
      })
    ),
    nf.ui.icon('add', { w: 22, c: '@inkSoft' }),
    // bind 把发送按钮和输入框绑定：宿主会把输入框当前文本塞进点击载荷
    nf.ui.box(
      {
        w: 40, h: 40, r: 20, bg: '@sakuraDeep', al: 'center',
        tap: 'onSend', bind: INPUT_ID
      },
      nf.ui.icon('send', { w: 19, c: '@whisper' })
    )
  );
}

module.exports = {

  render: function (ctx) {
    var conv = (ctx.data && ctx.data.conversation) || { id: '', name: '会话', seed: 1 };
    var list = (ctx.data && ctx.data.messages) || [];

    var rows = [];
    for (var i = 0; i < list.length; i++) { rows.push(bubble(list[i])); }

    return nf.ui.col(
      { fillw: 1, fillh: 1, bg: '@paperSunken' },
      topBar(conv),
      rows.length
        ? nf.ui.list({ fillw: 1, gr: 1, padh: 12, padt: 6, padb: 6 }, rows)
        : nf.ui.empty('还没有消息，说点什么吧'),
      composer()
    );
  },

  onSend: function (e) {
    var text = e && e.text ? String(e.text).trim() : '';
    if (!text) { return { fx: [] }; }
    return {
      fx: [nf.fx.run('sendMessage', {
        conversationId: (e && e.conversationId) || '',
        text: text
      })]
    };
  },

  onBack: function () {
    return { fx: [nf.fx.nav('chat')] };
  }
};
