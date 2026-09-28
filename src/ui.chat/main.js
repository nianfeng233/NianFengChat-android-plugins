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

// 头像来源只有一个：会话对象（ctx.data.conversation）里的 avatar + seed。
// 顶栏、消息气泡、会话列表行拿到的都是同一份数据，改一次全都变。
function avatar(src, name, seed, size) {
  return nf.ui.avatar(src || null, {
    w: size, h: size, seed: seed | 0,
    s: name || '?', c: '@whisper', fs: Math.round(size * 0.4)
  });
}

var INPUT_ID = 'nf.chat.input';

function topBar(conv) {
  return nf.ui.row(
    { fillw: 1, gap: 10, padh: 12, padt: 10, padb: 10, al: 'center', bg: '@whisper' },
    nf.ui.icon('back', { w: 22, c: '@ink', tap: 'onBack' }),
    avatar(conv.avatar, conv.name, conv.seed, 34),
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

function bubble(m, conv) {
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
    // 气泡头像与会话顶栏用同一个 avatar / seed，避免「同一个人两个头像」
    mine ? null : avatar(conv.avatar, conv.name, conv.seed, 34),
    nf.ui.box(
      {
        maxw: "74%",   // 相对宽度：换任何比例的屏幕都不会溢出
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

function composer(conv) {
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
    // bind 把发送按钮和输入框绑定：宿主会把输入框当前文本塞进点击载荷；
    // id 带上会话号，发送管线才知道这条消息属于哪个会话（会话列表靠它更新预览）。
    nf.ui.box(
      {
        w: 40, h: 40, r: 20, bg: '@sakuraDeep', al: 'center',
        tap: 'onSend', bind: INPUT_ID, id: conv.id
      },
      nf.ui.icon('send', { w: 19, c: '@whisper' })
    )
  );
}

module.exports = {

  render: function (ctx) {
    var conv = (ctx.data && ctx.data.conversation) || { id: '', name: '会话', seed: 1, avatar: null };
    // 宿主只下发最近一小段消息（默认 50 条）；window.start 是这段在完整记录里的起点，
    // 向上滚到顶时 onStart 再要更早的一页。
    var list = (ctx.data && ctx.data.messages) || [];
    var win = (ctx.data && ctx.data.window) || { start: 0, total: list.length, hasMore: false };
    nf.state.convId = conv.id;

    var rows = [];
    for (var i = 0; i < list.length; i++) { rows.push(bubble(list[i], conv)); }

    return nf.ui.col(
      { fillw: 1, fillh: 1, bg: '@paperSunken' },
      topBar(conv),
      rows.length
        ? nf.ui.list(
            {
              fillw: 1, gr: 1, padh: 12, padt: 6, padb: 6,
              // 聊天记录：默认贴底显示最新消息；woff=窗口起点，前插更早消息时保持阅读位置
              anchor: 'end',
              woff: win.start,
              onStart: win.hasMore ? 'onLoadOlder' : null
            },
            rows
          )
        : nf.ui.empty('还没有消息，说点什么吧'),
      composer(conv)
    );
  },

  // 滚到顶部：向宿主再要一页更早的消息
  onLoadOlder: function () {
    return {
      fx: [nf.fx.run('message.window', { conversationId: nf.state.convId || '' })]
    };
  },

  onSend: function (e) {
    var text = e && e.text ? String(e.text).trim() : '';
    if (!text) { return { fx: [] }; }
    return {
      fx: [nf.fx.run('sendMessage', {
        conversationId: (e && e.id) || '',
        text: text
      })]
    };
  },

  onBack: function () {
    return { fx: [nf.fx.nav('chat')] };
  }
};
