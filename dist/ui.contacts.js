// ─────────────────────────────────────────────────────────────────────────
// ui.common —— 页面插件之间真正共用的 UI 片段
//
// 这个文件不是插件：它没有自己的清单，由 tools/build_index.py 按
// plugin.json 里的 "shared" 声明**内联**到需要的插件源码顶部。
//
// 为什么采用「构建期内联」而不是运行期 require：
//   1. 基座是原子插件加载（一个 .js 一个 JS 上下文），运行期没有模块解析器；
//   2. 跨插件同步 call 会多一次往返，而顶栏是每次 render 都要画的纯 UI；
//   3. 构建期内联后，dist 仍然是一个单文件，部署路径不变。
//
// 这里只放「多页面长得完全一样」的东西。一旦某个页面需要不同行为，
// 优先通过 opts 传参，而不是复制一份改。
// ─────────────────────────────────────────────────────────────────────────
'use strict';

var NFUI = (function () {

  // 头像：src 为空时由宿主按 seed 生成占位色；插件不持有调色板。
  function avatar(src, name, seed, size) {
    return nf.ui.avatar(src || null, {
      w: size, h: size, seed: seed | 0,
      s: name || '?', c: '@whisper', fs: Math.round(size * 0.4)
    });
  }

  function statusText(me) {
    var base = me.online ? '在线' : '离线';
    return me.status ? (base + ' · ' + me.status) : base;
  }

  /**
   * 顶部栏：用户头像 + 用户名 + 在线状态 + 加大号「+」。
   *
   * 会话页与通讯录页必须共用这一份。opts 只用来换 handler，不换视觉：
   *   opts.profileTap  默认 onProfile
   *   opts.plusTap     默认 onPlus
   */
  function topBar(me, opts) {
    opts = opts || {};
    return nf.ui.row(
      {
        fillw: 1, gap: 12, padh: 18, padt: 12, padb: 10, al: 'center'
      },
      nf.ui.box(
        { tap: opts.profileTap || 'onProfile', id: 'me' },
        avatar(me.avatar, me.name, me.seed, 46)
      ),
      nf.ui.col(
        { gr: 1, gap: 4 },
        nf.ui.txt(me.name || '我', { fs: 18, fw: 700, c: '@ink', max: 1 }),
        nf.ui.row(
          { gap: 6, al: 'center' },
          nf.ui.box({ w: 7, h: 7, r: 4, bg: me.online ? '@success' : '@inkFaint' }),
          nf.ui.txt(statusText(me), { fs: 11.5, c: '@inkFaint', max: 1 })
        )
      ),
      nf.ui.icon('add_thin', {
        w: 46, c: '@ink', tap: opts.plusTap || 'onPlus', pad: 2
      })
    );
  }

  /**
   * 搜索框：会话页和通讯录页共用同一视觉。
   * 当前两个页面都只做到「点一下给占位提示」，真正的搜索输入后续再接。
   */
  function searchBar(placeholder, tap) {
    return nf.ui.row(
      { fillw: 1, padh: 18, padt: 2, padb: 12, al: 'center' },
      nf.ui.row(
        {
          fillw: 1, gap: 8, bg: '@paperSunken', r: 14,
          padh: 14, padv: 13, al: 'center', tap: tap || 'onSearch', id: 'search'
        },
        nf.ui.icon('search', { w: 17, c: '@inkFaint' }),
        nf.ui.txt(placeholder, { fs: 13.5, c: '@inkFaint' })
      )
    );
  }

  /**
   * 贴近某个节点的、带箭头的小浮窗菜单。
   *
   * 会话长按和分组长按共用同一套视觉/定位规则；插件只提供 defs：
   *   [{ label: '删除', handler: 'onMenuDelete' }, ...]
   * menu 里带上宿主长按载荷的 x/y/w/h/vw/vh（都是 dp）。
   */
  function popupMenu(menu, defs, opts) {
    if (!menu || !defs || !defs.length) { return null; }
    opts = opts || {};
    var itemW = opts.itemW || 78;
    var menuW = itemW * defs.length;
    var menuH = 36;
    var arrowH = 10;
    var gap = 4;
    var vw = menu.vw || 390;

    var mx = (menu.x || 0) + ((menu.w || 0) - menuW) / 2;
    mx = Math.max(8, Math.min(mx, vw - menuW - 8));
    var my = Math.max(8, (menu.y || 0) - menuH - arrowH - gap);

    var items = [];
    for (var i = 0; i < defs.length; i++) {
      if (i > 0) { items.push(nf.ui.box({ w: 0.5, h: 18, bg: '#55FFFFFF' })); }
      items.push(nf.ui.box(
        { w: itemW, h: menuH, al: 'center', tap: defs[i].handler, id: 'menu-' + i },
        nf.ui.txt(defs[i].label, { fs: 13, c: '@whisper', max: 1 })
      ));
    }

    return nf.ui.box(
      { fillw: 1, fillh: 1 },
      // 透明遮罩：在「其他位置按下」立即关闭
      nf.ui.box({ fillw: 1, fillh: 1, down: opts.closeHandler || 'onMenuClose' }),
      nf.ui.col(
        { al: 'topstart', ox: mx, oy: my },
        nf.ui.row({ bg: '#4C4C4C', r: 8, clip: true, elev: 8, al: 'center' }, items),
        nf.ui.row({ w: menuW, js: 'center' },
          nf.ui.icon('arrow_drop_down', { w: 22, c: '#4C4C4C', oy: -6 })
        )
      )
    );
  }

  return {
    avatar: avatar,
    statusText: statusText,
    topBar: topBar,
    searchBar: searchBar,
    popupMenu: popupMenu
  };
})();


// ─────────────────────────────────────────────────────────────────────────
// ui.contacts —— 通讯录（第二版）
//
// 关键交互：
//   • 顶部栏 / 搜索框与会话页共用 NFUI（构建期内联 _shared/ui.common.js）；
//   • 「私聊 / 群聊 / 渠道」三个分类各自持有一套分组，互不影响；
//   • 分类栏与下面的分组列表连成一块（下划线式 tab，见参考图 1）；
//   • 分组可展开/收起；长按弹「删除 / 新建分组」；分组可拖拽排序；
//   • 分组内联系人可拖拽到其他分组；拖拽联系人时自动收起全部分组，
//     只留下分组标题做投放目标，方便选择且不会被长列表挡住；
//   • 拖拽结束/取消后恢复拖拽前的展开状态。
//
// 数据分工：
//   • 联系人本体 + kind + initial 来自宿主 ctx.data.contacts；
//   • 每个分类的分组、成员、展开态是本插件 state（第一版不持久化）。
// ─────────────────────────────────────────────────────────────────────────
'use strict';

var TAB_DEFS = [
  { id: 'private', label: '私聊', groupId: 'g_private', groupName: '联系人' },
  { id: 'group',   label: '群聊', groupId: 'g_group',   groupName: '我的群聊' },
  { id: 'channel', label: '渠道', groupId: 'g_channel', groupName: '我的渠道' }
];

var ui = {
  tab: 'private',
  tabs: {
    private: { groups: null, members: null },
    group:   { groups: null, members: null },
    channel: { groups: null, members: null }
  },
  menu: null,
  editor: null,

  // 拖联系人时临时收起全部分组；结束时恢复到拖拽前的展开状态。
  dragCollapseAll: false,
  dragRestore: null,
  dragSourceId: null,
  dragSourceGroupId: null
};

// ── 基础数据访问 ───────────────────────────────────────────────────────────

function tabDef(tabId) {
  for (var i = 0; i < TAB_DEFS.length; i++) {
    if (TAB_DEFS[i].id === tabId) { return TAB_DEFS[i]; }
  }
  return TAB_DEFS[0];
}

function stateOf(tabId) {
  return ui.tabs[tabId] || ui.tabs[ui.tab];
}

function state() {
  return stateOf(ui.tab);
}

function findGroupIn(st, id) {
  if (!st || !st.groups || !id) { return null; }
  for (var i = 0; i < st.groups.length; i++) {
    if (st.groups[i].id === id) { return st.groups[i]; }
  }
  return null;
}

function findGroup(id) {
  return findGroupIn(state(), id);
}

function indexOfGroupIn(st, id) {
  if (!st || !st.groups || !id) { return -1; }
  for (var i = 0; i < st.groups.length; i++) {
    if (st.groups[i].id === id) { return i; }
  }
  return -1;
}

function newGroupId(tabId) {
  return 'g_' + tabId + '_' + nf.now() + '_' + Math.floor(Math.random() * 1000);
}

function kindOf(c) {
  var k = c && c.kind ? String(c.kind) : 'private';
  return (k === 'group' || k === 'channel') ? k : 'private';
}

function matchTab(c, tabId) {
  var k = kindOf(c);
  if (tabId === 'channel') { return k === 'channel'; }
  if (tabId === 'group') { return k === 'group'; }
  return k !== 'group' && k !== 'channel';
}

function initialOf(c) {
  if (c && c.initial) { return String(c.initial).toUpperCase(); }
  var n = (c && c.name) || '';
  return n.charAt(0).toUpperCase();
}

/** 同一分组内统一按名称首字母排序；同首字母再按名称稳定排序。 */
function compareContact(a, b) {
  var ai = initialOf(a);
  var bi = initialOf(b);
  if (ai !== bi) { return ai < bi ? -1 : 1; }
  var an = (a && a.name) || '';
  var bn = (b && b.name) || '';
  if (an !== bn) { return an < bn ? -1 : 1; }
  return 0;
}

/**
 * 初始化/校正三个分类各自的分组数据。
 *
 * 每个分类是独立的一套分组 + 成员映射；联系人按 kind 只归属对应分类。
 */
function ensureState(all) {
  for (var t = 0; t < TAB_DEFS.length; t++) {
    var def = TAB_DEFS[t];
    var st = ui.tabs[def.id];

    if (!st.groups) {
      st.groups = [{ id: def.groupId, name: def.groupName, collapsed: false }];
    }
    if (!st.groups.length) {
      st.groups.push({ id: def.groupId, name: def.groupName, collapsed: false });
    }
    if (!st.members) { st.members = {}; }

    var alive = {};
    for (var i = 0; i < all.length; i++) {
      var c = all[i];
      if (!matchTab(c, def.id)) { continue; }
      alive[c.id] = true;
      if (!findGroupIn(st, st.members[c.id])) {
        st.members[c.id] = st.groups[0].id;
      }
    }
    for (var k in st.members) {
      if (!alive[k]) { delete st.members[k]; }
    }
  }
}

function contactsInGroup(all, gid) {
  var st = state();
  var out = [];
  for (var i = 0; i < all.length; i++) {
    var c = all[i];
    if (!matchTab(c, ui.tab)) { continue; }
    if (st.members[c.id] !== gid) { continue; }
    out.push(c);
  }
  out.sort(compareContact);
  return out;
}

// ── 拖拽临时收起 / 恢复 ────────────────────────────────────────────────────

function saveCollapseState() {
  if (ui.dragRestore) { return; }
  var st = state();
  var saved = [];
  for (var i = 0; i < st.groups.length; i++) {
    saved.push({ id: st.groups[i].id, collapsed: !!st.groups[i].collapsed });
  }
  ui.dragRestore = { tab: ui.tab, groups: saved };
}

/** @return 是否真的改变了展开状态（没改就不需要 refresh）。 */
function restoreCollapseState() {
  var changed = false;
  var r = ui.dragRestore;
  ui.dragRestore = null;
  ui.dragSourceId = null;
  ui.dragSourceGroupId = null;

  if (ui.dragCollapseAll) {
    ui.dragCollapseAll = false;
    changed = true;
  }
  if (!r) { return changed; }

  var st = stateOf(r.tab);
  if (!st || !st.groups) { return changed; }
  for (var i = 0; i < r.groups.length; i++) {
    var g = findGroupIn(st, r.groups[i].id);
    if (!g) { continue; }
    var want = !!r.groups[i].collapsed;
    if (!!g.collapsed !== want) { g.collapsed = want; changed = true; }
  }
  return changed;
}

// ── UI 片段 ────────────────────────────────────────────────────────────────

/**
 * 顶部分类栏：文字 + 下划线指示器，底部一条通栏分割线。
 * 与下面的分组列表同底色、紧贴在一起，整体就是参考图 1 的布局。
 */
function tabRow() {
  var items = [];
  for (var i = 0; i < TAB_DEFS.length; i++) {
    var t = TAB_DEFS[i];
    var on = ui.tab === t.id;
    items.push(nf.ui.col(
      {
        gr: 1, al: 'center', gap: 7, padt: 12,
        tap: 'onTab', id: t.id, key: 'tab:' + t.id
      },
      nf.ui.txt(t.label, { fs: 15, fw: on ? 700 : 500, c: on ? '@ink' : '@inkSoft' }),
      nf.ui.box({ w: 32, h: 3, r: 2, bg: on ? '@blue' : '#00000000' })
    ));
  }
  return nf.ui.col(
    { fillw: 1, bg: '@whisper' },
    nf.ui.row({ fillw: 1, padh: 10, al: 'center' }, items),
    nf.ui.divider({ c: '@hairline' })
  );
}

function contactRow(c) {
  return nf.ui.row(
    {
      fillw: 1, gap: 12, padh: 18, padv: 10, al: 'center',
      tap: 'onOpen', id: c.id, key: c.id, ditem: 1
    },
    NFUI.avatar(null, c.name, c.seed, 42),
    nf.ui.col(
      { gr: 1, gap: 2 },
      nf.ui.row(
        { fillw: 1, al: 'center' },
        nf.ui.txt(c.name || '', { fs: 14.5, fw: 500, gr: 1, max: 1, c: '@ink' }),
        c.starred ? nf.ui.icon('star_filled', { w: 14, c: '@sakuraDeep' }) : null
      ),
      nf.ui.txt(c.signature || '', { fs: 12, c: '@inkFaint', max: 1 })
    )
  );
}

function contactListNode(g, list, zeroHeight) {
  var rows = [];
  for (var i = 0; i < list.length; i++) { rows.push(contactRow(list[i])); }
  if (!rows.length) {
    rows.push(nf.ui.box(
      { fillw: 1, h: 34, al: 'center' },
      nf.ui.txt('这个分组还没有成员', { fs: 12, c: '@inkFaint' })
    ));
  }
  var props = {
    fillw: 1, key: 'cl:' + g.id, id: g.id, dfleet: 'contacts',
    dstart: 'onContactDragStart',
    dend: 'onContactDrop',
    dcancel: 'onContactDragCancel'
  };
  if (zeroHeight) {
    // 拖拽源分组的列表压在 0 高：视觉上分组全收起，但节点仍保留在
    // 原组合位置，拖拽指针协程不会被移除。
    props.h = 0;
    props.clip = true;
    props.r = 1;
  }
  return nf.ui.drag(props, rows);
}

function groupSection(g, list) {
  // 拖联系人期间：所有分组都按「收起」渲染，屏幕只留下可投放的标题。
  var collapsed = ui.dragCollapseAll || !!g.collapsed;

  var header = nf.ui.row(
    {
      fillw: 1, gap: 8, padh: 18, padt: 14, padb: 14, al: 'center',
      tap: 'onToggle', long: 'onGroupMenu',
      id: g.id, key: 'gh:' + g.id, dhandle: 'g:' + g.id
    },
    nf.ui.icon(collapsed ? 'chevron_right' : 'arrow_drop_down', { w: 18, c: '@inkFaint' }),
    nf.ui.txt(g.name, { fs: 15, fw: 600, c: '@ink', gr: 1, max: 1 }),
    nf.ui.txt(String(list.length), { fs: 12, c: '@inkFaint' })
  );

  var children = [header];

  if (!collapsed) {
    children.push(contactListNode(g, list, false));
  } else if (ui.dragCollapseAll && g.id === ui.dragSourceGroupId) {
    // 源分组的列表节点仍在原位置，但压成 0 高并裁剪。
    children.push(contactListNode(g, list, true));
  }

  return nf.ui.col(
    {
      fillw: 1, key: 'g:' + g.id,
      // 整块分组是联系人拖拽的兜底投放区：收起时手指落在标题上也能投放。
      ddrop: 'contacts', dropid: g.id
    },
    children
  );
}

/** 长按分组后的小菜单：删除 / 新建分组。 */
function groupMenuLayer() {
  return NFUI.popupMenu(ui.menu, [
    { label: '删除', handler: 'onMenuDelete' },
    { label: '新建分组', handler: 'onMenuNew' }
  ], { itemW: 86 });
}

/** 新建分组：大号输入浮层，屏幕正中央。 */
function groupEditorLayer() {
  var e = ui.editor;
  var inputId = e.inputId;

  return nf.ui.box(
    { fillw: 1, fillh: 1 },
    // 遮罩：点空白关闭；卡片是它的兄弟节点，点在卡片上不会误关。
    nf.ui.box({ fillw: 1, fillh: 1, bg: '#66000000', down: 'onEditorClose' }),
    nf.ui.col(
      {
        w: '82%', bg: '@whisper', r: 18, elev: 12,
        padh: 20, padv: 20, gap: 16, key: 'group-editor'
      },
      nf.ui.txt('新建分组', { fs: 17, fw: 700, c: '@ink' }),
      nf.ui.input({
        id: inputId, val: e.name || '新分组', ph: '输入分组名称',
        max: 1, fs: 14.5, bg: '@paperSunken', r: 12,
        padh: 14, padv: 11, fillw: 1
      }),
      nf.ui.row(
        { fillw: 1, js: 'end', gap: 10, al: 'center' },
        nf.ui.btn('取消', 'onEditorClose', {
          fs: 14, c: '@inkSoft', bg: '@paperSunken', padh: 18, padv: 10, r: 12
        }),
        nf.ui.btn('创建', 'onEditorCreate', {
          fs: 14, fw: 600, c: '@ink', bg: '@sakura', padh: 18, padv: 10, r: 12,
          bind: inputId
        })
      )
    )
  );
}

// ── 导出 ───────────────────────────────────────────────────────────────────

module.exports = {

  render: function (ctx) {
    var data = ctx.data || {};
    var me = data.me || { name: '我', seed: 0, online: false, status: '' };
    var all = data.contacts || [];
    ensureState(all);

    var st = state();
    var sections = [];
    for (var i = 0; i < st.groups.length; i++) {
      var g = st.groups[i];
      sections.push(groupSection(g, contactsInGroup(all, g.id)));
    }

    var inner = [
      tabRow(),
      nf.ui.drag(
        {
          fillw: 1, key: 'groups', id: 'groups', dfleet: 'groups',
          dstart: 'onGroupDragStart',
          dend: 'onGroupDrop',
          dcancel: 'onGroupDragCancel'
        },
        sections
      )
    ];

    var body = nf.ui.col(
      { fillw: 1, fillh: 1, bg: '@whisper' },
      NFUI.topBar(me),
      NFUI.searchBar('搜索', 'onSearch'),
      nf.ui.scroll({ fillw: 1, gr: 1, padb: 120 }, inner)
    );

    return nf.ui.box(
      { fillw: 1, fillh: 1, bg: '@whisper' },
      body,
      ui.menu ? groupMenuLayer() : null,
      ui.editor ? groupEditorLayer() : null
    );
  },

  // ── 顶部分类 ──────────────────────────────────────────────────────────
  onTab: function (e) {
    if (!e || !e.id || ui.tab === e.id) { return { fx: [] }; }
    ui.tab = e.id;
    ui.menu = null;
    ui.editor = null;
    return { fx: [nf.fx.run('refresh')] };
  },

  // ── 分组：展开/收起、长按菜单、拖拽排序 ───────────────────────────────
  onToggle: function (e) {
    if (ui.dragCollapseAll) { return { fx: [] }; }
    var g = e && e.id ? findGroup(e.id) : null;
    if (!g) { return { fx: [] }; }
    g.collapsed = !g.collapsed;
    ui.menu = null;
    return { fx: [nf.fx.run('refresh')] };
  },

  onGroupMenu: function (e) {
    if (ui.dragCollapseAll || !e || !e.id) { return { fx: [] }; }
    var g = findGroup(e.id);
    if (!g) { return { fx: [] }; }
    ui.menu = {
      id: g.id, name: g.name,
      x: e.x || 0, y: e.y || 0, w: e.w || 0, h: e.h || 0,
      vw: e.vw || 390, vh: e.vh || 800
    };
    return { fx: [nf.fx.run('refresh')] };
  },

  onMenuClose: function () {
    ui.menu = null;
    return { fx: [nf.fx.run('refresh')] };
  },

  onMenuDelete: function () {
    var m = ui.menu;
    ui.menu = null;
    var st = state();
    var idx = m && m.id ? indexOfGroupIn(st, m.id) : -1;
    if (idx < 0) { return { fx: [nf.fx.run('refresh')] }; }
    if (st.groups.length <= 1) {
      return { fx: [nf.fx.toast('至少保留一个分组'), nf.fx.run('refresh')] };
    }
    var g = st.groups[idx];
    var fallback = st.groups[idx === 0 ? 1 : 0].id;
    for (var cid in st.members) {
      if (st.members[cid] === g.id) { st.members[cid] = fallback; }
    }
    st.groups.splice(idx, 1);
    return {
      fx: [
        nf.fx.toast('已删除分组「' + g.name + '」'),
        nf.fx.run('refresh')
      ]
    };
  },

  onMenuNew: function () {
    ui.menu = null;
    ui.editor = {
      inputId: 'grp_name_' + nf.now(),
      name: '新分组'
    };
    return { fx: [nf.fx.run('refresh')] };
  },

  onEditorClose: function () {
    if (!ui.editor) { return { fx: [] }; }
    ui.editor = null;
    return { fx: [nf.fx.run('refresh')] };
  },

  onEditorCreate: function (e) {
    var name = e && e.text ? String(e.text).trim() : '';
    if (!name && ui.editor && ui.editor.name) {
      name = String(ui.editor.name).trim();
    }
    if (!name) { return { fx: [nf.fx.toast('分组名称不能为空')] }; }

    state().groups.push({ id: newGroupId(ui.tab), name: name, collapsed: false });
    ui.editor = null;
    return {
      fx: [
        nf.fx.toast('已新建分组「' + name + '」'),
        nf.fx.run('refresh')
      ]
    };
  },

  onGroupDragStart: function () {
    var changed = !!(ui.menu || ui.editor);
    ui.menu = null;
    ui.editor = null;
    return { fx: changed ? [nf.fx.run('refresh')] : [] };
  },

  onGroupDragCancel: function () {
    var changed = !!(ui.menu || ui.editor);
    ui.menu = null;
    ui.editor = null;
    return { fx: changed ? [nf.fx.run('refresh')] : [] };
  },

  onGroupDrop: function (e) {
    if (!e || !e.id) { return { fx: [] }; }
    var st = state();
    var from = indexOfGroupIn(st, e.id);
    if (from < 0) { return { fx: [] }; }

    var to = e.index | 0;
    // 宿主给的 index 是「插入到第几个之前」；源项还在数组里，往下移要减一。
    if (to > from) { to--; }
    if (to < 0) { to = 0; }
    if (to >= st.groups.length) { to = st.groups.length - 1; }
    if (to === from) { return { fx: [] }; }

    var g = st.groups.splice(from, 1)[0];
    st.groups.splice(to, 0, g);
    return { fx: [nf.fx.run('refresh')] };
  },

  // ── 联系人：拖拽跨分组 ────────────────────────────────────────────────
  onContactDragStart: function (e) {
    ui.menu = null;
    ui.editor = null;
    ui.dragSourceId = e && e.id ? e.id : null;
    ui.dragSourceGroupId = ui.dragSourceId ? state().members[ui.dragSourceId] : null;
    saveCollapseState();
    ui.dragCollapseAll = true;
    return { fx: [nf.fx.run('refresh')] };
  },

  onContactDragCancel: function () {
    return { fx: restoreCollapseState() ? [nf.fx.run('refresh')] : [] };
  },

  onContactDrop: function (e) {
    var restored = restoreCollapseState();

    if (!e || !e.id || !e.to) {
      return { fx: restored ? [nf.fx.run('refresh')] : [] };
    }
    var st = state();
    var g = findGroupIn(st, e.to);
    if (!g) {
      return { fx: restored ? [nf.fx.run('refresh')] : [] };
    }
    if (st.members[e.id] === e.to) {
      return { fx: restored ? [nf.fx.run('refresh')] : [] };
    }

    st.members[e.id] = e.to;
    return {
      fx: [
        nf.fx.toast('已移动到「' + g.name + '」'),
        nf.fx.run('refresh')
      ]
    };
  },

  // ── 顶栏 / 搜索 / 打开联系人（占位）──────────────────────────────────
  onProfile: function () {
    return { fx: [nf.fx.nav('me')] };
  },

  onPlus: function () {
    return { fx: [nf.fx.toast('新建联系人（占位）')] };
  },

  onSearch: function () {
    return { fx: [nf.fx.toast('搜索（占位）')] };
  },

  onOpen: function (e) {
    return { fx: [nf.fx.toast('打开联系人：' + ((e && e.id) || ''))] };
  }
};
