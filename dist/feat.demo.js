// ─────────────────────────────────────────────────────────────────────────
// feat.demo —— 演示数据注入
//
// 这个插件存在的唯一目的，是证明一句话：
//     **基座里没有任何内容，你看到的所有数据都是插件给的。**
//
// 「全部删掉」。方式是把内容当成一次普通的副作用
// （nf.fx.run('seed', ...)）交给宿主，和其他任何插件走的是同一条路。
// ─────────────────────────────────────────────────────────────────────────
'use strict';

// ── 时间：只存时间戳，显示规则全部由会话列表插件从 ts 推导 ──────────────
//
// 这样「今天/昨天/星期几/几月几号/跨年」不是写死的字符串：
// 明天再打开，昨天的那条会自动变成「星期X」。
var MIN = 60000;

function todayAt(h, m) {
  var d = new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function daysAgoAt(days, h, m) {
  var d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

var CONVERSATIONS = [
  { id: 'c1', name: '林清和', last: '我把那版配色重新调了一下，你看看', ts: Date.now() - 2 * MIN, unread: 2, pinned: true,  avatar: null, seed: 3 },
  { id: 'c2', name: '风语小组', last: '顾南枝：明天上午十点，别迟到', ts: todayAt(10, 24), unread: 5, pinned: true,  avatar: null, seed: 5 },
  { id: 'c3', name: '白露',   last: '好呀，那就这么说定了',              ts: todayAt(9, 41), unread: 0, pinned: false, avatar: null, seed: 2 },
  { id: 'c4', name: '沈砚',   last: '[图片]',                          ts: daysAgoAt(1, 20, 15), unread: 0, pinned: false, avatar: null, seed: 8 },
  { id: 'c5', name: '架构讨论组', last: '岑野：插件热更新的原子性我再补充一点', ts: daysAgoAt(1, 18, 2), unread: 1, pinned: false, avatar: null, seed: 1 },
  { id: 'c6', name: '苏晚',   last: '语音通话 12:31',                  ts: daysAgoAt(3, 12, 31), unread: 0, pinned: false, avatar: null, seed: 6 },
  { id: 'c7', name: '祁越',   last: '收到，我这边已经部署好了',          ts: daysAgoAt(6, 9, 5), unread: 0, pinned: false, avatar: null, seed: 4 },
  { id: 'c8', name: '设计周会', last: '许知微：字体统一换成思源黑体',     ts: daysAgoAt(9, 16, 40), unread: 0, pinned: false, avatar: null, seed: 9 },
  { id: 'c9', name: '温叙',   last: '下次再聊',                        ts: new Date(2004, 11, 20, 9, 30).getTime(), unread: 0, pinned: false, avatar: null, seed: 10 },
  { id: 'c10', name: '江照',  last: '文件已经发你邮箱了',                ts: daysAgoAt(2, 21, 8), unread: 128, pinned: false, avatar: null, seed: 11 }
];

// ── 再生成一批「演示会话」：专门用来验证窗口化 ────────────────────────────
// 宿主默认只下发 30 条，往下滚会自动再要一页；累积到上限后窗口整体后移，
// 最早的一批被丢掉。时间放在 20~90 天前，排在精选示例后面，不会打乱
// 前面那些「今天/昨天/星期几/日期」的时间格式示例。
(function () {
  for (var i = 0; i < 80; i++) {
    var days = 20 + (i % 70);
    CONVERSATIONS.push({
      id: 'g' + (i + 1),
      name: '演示会话 ' + (i + 1),
      last: '第 ' + (i + 1) + ' 条演示会话的最后消息预览',
      ts: daysAgoAt(days, 9 + (i % 12), (i * 7) % 60),
      unread: (i % 17 === 0) ? ((i % 9) + 1) : 0,
      pinned: false,
      avatar: null,
      seed: (i % 11) + 1
    });
  }
})();

var CONTACTS = [
  { id: 'c1', name: '林清和', group: '置顶', starred: true,  signature: '在做一个很慢的东西', seed: 3 },
  { id: 'c2', name: '顾南枝', group: 'A',    starred: true,  signature: '早睡',               seed: 5 },
  { id: 'c3', name: '白露',   group: 'A',    starred: false, signature: '今天也要开心',        seed: 2 },
  { id: 'c4', name: '沈砚',   group: 'B',    starred: false, signature: '写代码中，勿扰',      seed: 8 },
  { id: 'c5', name: '岑野',   group: 'B',    starred: false, signature: '插件化信徒',          seed: 1 },
  { id: 'c6', name: '苏晚',   group: 'C',    starred: false, signature: '晚安',               seed: 6 },
  { id: 'c7', name: '祁越',   group: 'C',    starred: false, signature: '在部署',             seed: 4 },
  { id: 'c8', name: '许知微', group: 'C',    starred: false, signature: '字体控',             seed: 9 },
  { id: 'c9', name: '温叙',   group: 'D',    starred: false, signature: '潜水员',             seed: 10 },
  { id: 'c10', name: '江照',  group: 'D',    starred: false, signature: '出差中',             seed: 11 }
];

var MOMENTS = [
  { id: 'm1', author: '林清和', text: '把整个 app 做成插件容器之后，框架代码少了三分之二。剩下的都是「约束」。', time: '18 分钟前', likes: 12, comments: 4, seed: 3 },
  { id: 'm2', author: '岑野',   text: '热更新的关键不是「能换」，是「换的时候不能有一个文件处于半写状态」。',     time: '1 小时前',  likes: 34, comments: 9, seed: 1 },
  { id: 'm3', author: '白露',   text: '今天天气很好。',                                                       time: '3 小时前',  likes: 8,  comments: 2, seed: 2 },
  { id: 'm4', author: '沈砚',   text: '性能优化到最后，都是在减少跨边界的次数。',                               time: '昨天',      likes: 56, comments: 15, seed: 8 }
];

var MESSAGES = [
  { conversationId: 'c1', items: [
      { id: 1, role: 'assistant', text: '我把那版配色重新调了一下，你看看', time: '14:02' },
      { id: 2, role: 'user',      text: '粉色调淡了一些？',                 time: '14:03' },
      { id: 3, role: 'assistant', text: '对，降了大概 8% 的饱和度，白底上更稳。', time: '14:03' },
      { id: 4, role: 'user',      text: '可以，就这版。',                   time: '14:05' }
  ]},
  { conversationId: 'c3', items: [
      { id: 10, role: 'assistant', text: '好呀，那就这么说定了', time: '09:41' }
  ]}
];

module.exports = {

  onStartup: function () {
    nf.log('注入演示数据：' + CONVERSATIONS.length + ' 个会话 / ' + CONTACTS.length + ' 位联系人');
    return {
      fx: [nf.fx.run('seed', {
        conversations: CONVERSATIONS,
        contacts: CONTACTS,
        moments: MOMENTS,
        messages: MESSAGES,
        // 「我是谁」的唯一一份数据：会话列表顶栏 / 我页面 / 将来的任何地方
        // 都读它。换头像只改这里。
        profile: {
          name: '念风',
          signature: '万物皆插件',
          avatar: null,
          seed: 7,
          online: true,
          status: 'Wi-Fi · 65%'
        }
      })]
    };
  }
};
