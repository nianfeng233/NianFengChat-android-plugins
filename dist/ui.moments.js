// ui.moments —— 朋友圈
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

function momentCard(m) {
  return nf.ui.col(
    {
      fillw: 1, gap: 9, padt: 14, padb: 14, padh: 4,
      bg: '@whisper', key: m.id
    },
    nf.ui.row({ fillw: 1, gap: 11, al: 'center' },
      avatar(m.author, m.seed, 40),
      nf.ui.col({ gr: 1, gap: 2 },
        nf.ui.txt(m.author, { fs: 14.5, fw: 600, c: '@ink', max: 1 }),
        nf.ui.txt(m.time, { fs: 10.5, c: '@inkFaint' })
      ),
      nf.ui.icon('more', { w: 18, c: '@inkFaint' })
    ),
    nf.ui.txt(m.text, { fs: 14, c: '@ink', lh: 21 }),
    // 配图占位（第一阶段不引入图片资源，用品牌粉块表示「有图」）
    nf.ui.row({ gap: 5, padt: 2 },
      nf.ui.box({ w: 86, h: 86, bg: '@sakuraSoft', r: 10 }),
      nf.ui.box({ w: 86, h: 86, bg: '@sakura', r: 10 })
    ),
    nf.ui.row({ fillw: 1, gap: 18, padt: 4, al: 'center' },
      nf.ui.row({ gap: 5, al: 'center', tap: 'onLike', id: m.id },
        nf.ui.icon('favorite', { w: 15, c: '@sakuraDeep' }),
        nf.ui.txt(String(m.likes), { fs: 12, c: '@inkSoft' })
      ),
      nf.ui.row({ gap: 5, al: 'center', tap: 'onComment', id: m.id },
        nf.ui.icon('emoji', { w: 15, c: '@inkSoft' }),
        nf.ui.txt(String(m.comments), { fs: 12, c: '@inkSoft' })
      ),
      nf.ui.box({ gr: 1 }),
      nf.ui.icon('more', { w: 16, c: '@inkFaint' })
    ),
    nf.ui.divider({ c: '@hairline' })
  );
}

module.exports = {

  render: function (ctx) {
    var list = (ctx.data && ctx.data.moments) || [];
    var cards = [];
    for (var i = 0; i < list.length; i++) { cards.push(momentCard(list[i])); }

    return nf.ui.col(
      { fillw: 1, fillh: 1, bg: '@whisper' },
      nf.ui.row({ fillw: 1, padh: 18, padt: 10, padb: 8, al: 'center' },
        nf.ui.title('朋友圈', { gr: 1 }),
        nf.ui.icon('camera', { w: 22, c: '@ink' })
      ),
      nf.ui.list({ fillw: 1, gr: 1, padb: 104, padh: 14 }, cards)
    );
  },

  onLike: function (e) {
    return { fx: [nf.fx.toast('已点赞 #' + (e && e.id))] };
  },

  onComment: function (e) {
    return { fx: [nf.fx.toast('评论功能由后续插件接管 #' + (e && e.id))] };
  }
};
