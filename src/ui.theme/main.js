// ui.theme —— 主题与配色
//
// 这个插件的意义有两层：
//   1. 它是「从二级页面进入」的示例（ui.me → ui.theme）；
//   2. 它把基座注入的令牌逐个画出来，一眼就能验证配色链路没断。
//      换肤时只需要改基座的 NfColors，本插件不用动一行代码。
'use strict';

var TOKENS = [
  { k: 'whisper',    use: '页面底 / logo 底（严格 #FFFFFF，零色差的关键）' },
  { k: 'paper',      use: '卡片面' },
  { k: 'paperSunken',use: '输入框 / 凹陷面' },
  { k: 'sakura',     use: '主粉（logo 出现频率最高的彩色）' },
  { k: 'sakuraSoft', use: '淡粉底 / 进度条轨道' },
  { k: 'sakuraDeep', use: '强调 / 选中态' },
  { k: 'salmon',     use: '暖粉（logo 次高频）' },
  { k: 'ink',        use: '主文字（logo 的黑色）' },
  { k: 'inkSoft',    use: '次级文字' },
  { k: 'inkFaint',   use: '弱化文字 / 占位' },
  { k: 'hairline',   use: '分隔线' },
  { k: 'danger',     use: '危险动作' }
];

function swatch(t) {
  return nf.ui.row(
    { fillw: 1, gap: 12, padt: 7, padb: 7, al: 'center', key: t.k },
    nf.ui.box({
      w: 40, h: 40, r: 12, bg: '@' + t.k,
      bw: t.k === 'whisper' || t.k === 'paper' ? 1 : null,
      bc: '@hairline'
    }),
    nf.ui.col({ gr: 1, gap: 2 },
      nf.ui.txt('@' + t.k, { fs: 13.5, fw: 600, c: '@ink', ls: 0.2 }),
      nf.ui.txt(t.use, { fs: 11, c: '@inkFaint', lh: 15, max: 2 })
    )
  );
}

module.exports = {

  render: function () {
    var rows = [];
    for (var i = 0; i < TOKENS.length; i++) { rows.push(swatch(TOKENS[i])); }

    return nf.ui.col(
      { fillw: 1, fillh: 1, bg: '@whisper' },
      nf.ui.row(
        { fillw: 1, gap: 10, padh: 12, padt: 10, padb: 10, al: 'center' },
        nf.ui.icon('back', { w: 22, c: '@ink', tap: 'onBack' }),
        nf.ui.title('主题与配色', { gr: 1 })
      ),
      nf.ui.list({ fillw: 1, gr: 1, padh: 18, padb: 104 }, rows)
    );
  },

  onBack: function () {
    return { fx: [nf.fx.nav('me')] };
  }
};
