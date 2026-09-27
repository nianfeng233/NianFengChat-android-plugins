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

var CONVERSATIONS = [
  { id: 'c1', name: '林清和', last: '我把那版配色重新调了一下，你看看', time: '刚刚', unread: 2, pinned: true,  seed: 3 },
  { id: 'c2', name: '风语小组', last: '顾南枝：明天上午十点，别迟到', time: '10:24', unread: 5, pinned: true, seed: 5 },
  { id: 'c3', name: '白露',   last: '好呀，那就这么说定了',                 time: '09:41', unread: 0, pinned: false, seed: 2 },
  { id: 'c4', name: '沈砚',   last: '[图片]',                              time: '昨天',  unread: 0, pinned: false, seed: 8 },
  { id: 'c5', name: '架构讨论组', last: '岑野：插件热更新的原子性我再补充一点', time: '昨天', unread: 1, pinned: false, seed: 1 },
  { id: 'c6', name: '苏晚',   last: '语音通话 12:31',                     time: '星期二', unread: 0, pinned: false, seed: 6 },
  { id: 'c7', name: '祁越',   last: '收到，我这边已经部署好了',             time: '星期一', unread: 0, pinned: false, seed: 4 },
  { id: 'c8', name: '设计周会', last: '许知微：字体统一换成思源黑体',        time: '上周',  unread: 0, pinned: false, seed: 9 }
];

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
        profile: { name: '我', signature: '万物皆插件', seed: 7 }
      })]
    };
  }
};
