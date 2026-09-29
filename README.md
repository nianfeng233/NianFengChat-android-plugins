# 念风Chat 插件仓库（NianFengChat-android-plugins）

念风Chat（NianFengChat-android）的**插件仓库**。基座本体不在这里。
协议：Apache-2.0。

基座每次启动会拉取本仓库根目录的 `index.json`，比对版本后**增量**下载缺失/更新的
插件；优先走国内镜像，失败再回退 GitHub 官方源。

---

## 目录约定

```
index.json            元数据全内联（基座只拉这一个文件）
dist/<id>.js          插件本体（单文件，一次 GET 装完）
src/<id>/plugin.json  清单源（`shared` 字段声明构建期要内联的共享片段）
src/<id>/main.js      插件源码
src/_shared/*.js      多插件共用的构建期片段（不会单独发成插件）
tools/build_index.py  构建：src -> dist -> index.json
```

`plugin.json` 里写 `"shared": ["_shared/ui.common.js"]` 后，构建脚本会把共享片段
拼到该插件单文件顶部；基座完全不知情，部署路径与协议都不变。

**改了 `src/` 之后必须跑一次构建脚本**，否则 `dist/` 与 `index.json` 全是旧的：

```bash
python tools/build_index.py
git add -A && git commit -m "feat(ui.chatlist): ..." && git push
```

---

## 最小插件

```js
// src/hello.world/main.js
module.exports = {
  render: function (ctx) {
    return nf.ui.col({ fillw: 1, padh: 20, padt: 40, gap: 10 },
      nf.ui.title('你好，插件'),
      nf.ui.txt('这是由 JS 画出来的 Compose 界面。', { fs: 13, c: '@inkSoft' })
    );
  }
};
```

配套清单：

```json
{
  "id": "hello.world",
  "name": "示例",
  "version": "0.1.0",
  "versionCode": 1,
  "kind": "ui",
  "entry": "main.js",
  "apiVersion": 1,
  "activation": ["view:hello"],
  "contributes": { "views": [{ "id": "hello", "title": "示例" }] }
}
```

---

## 插件运行时约定

### 可用对象

| 名字 | 说明 |
|---|---|
| `nf.ui.*` | 构造 UI 节点（见下表） |
| `nf.fx.*` | 构造副作用意图，放进返回值的 `fx` 数组里由宿主执行 |
| `nf.state` | 插件私有可变状态（活在这个 JS 上下文里） |
| `nf.theme` | 设计令牌表（`{sakura:'#FCC3CE', ...}`） |
| `nf.c('@tok')` | 取色，未知令牌可给兜底 |
| `nf.log(...)` | 打日志（进宿主环形缓冲，Debug 下进 logcat） |
| `host` | 宿主注入的元信息 |

### `nf.ui` 组件

`col / row / box / scroll / list / swipe / drag / txt / title / label / btn / chip /
icon / img / avatar / input / badge / msgdot / spacer / divider / empty / mk`

`msgdot(n, {…})` 是全 App 统一的「消息红点」：外观和 `badge` 一样（个位正圆、两位数起胶囊），
但可以拖拽 —— 拖远后粘胶断裂、烟雾炸开并回调 `drop`（通常在里头清未读），没拖够则弹回；
轻点不消费事件，底下的会话仍可正常点开。所有未读/通知类红点都用它，视觉与交互只维护这一份。

| 专属属性 | 含义 |
|---|---|
| `drop` | 拉断松手后触发的 handler（插件里做清未读等） |
| `bd` | 断裂距离（dp），默认 126 |
| `idx` | 红点在列表中的序号：底栏红点爆掉后，同组红点按它从上到下逐个爆 |
| `cascade` | `1` = 级联发起者（自己爆完再引爆同组其他红点，最后统一清数据） |

`swipe` 是可横向滑出的卡片：**第 1 个子节点是内容，其余是右侧滑出的操作按钮**，
它们属于同一条卡片（内容平移让位，按钮不是浮层）：

```js
nf.ui.swipe(
  { fillw: 1, key: c.id, tap: 'onOpen', long: 'onLong', r: 16, clip: true },
  contentNode,
  actionButtonNode1, actionButtonNode2, actionButtonNode3
)
```

同一时刻只允许一张卡片展开；点击别处会自动收回（宿主统一处理，插件无需关心）。

`drag` 是可**纵向拖拽排序**的容器：子节点默认是拖拽项，也可只让某个手柄节点
（`dhandle` 指向容器内的条目 key）发起拖拽。同 `dfleet` 的多个 `drag` 容器
之间可以互相投放，例如通讯录里把联系人从「联系人」拖到别的分组：

```js
nf.ui.drag(
  { fillw: 1, key: 'groups', id: 'groups', dfleet: 'groups',
    dstart: 'onGroupDragStart', dend: 'onGroupDrop', dcancel: 'onGroupDragCancel' },
  sectionNode1, sectionNode2          // 每个 section 的 key 登记为条目 key
)

// 子节点标记 ditem: 1 表示它是可拖拽项；分组标题用 dhandle 映射到外层
// section key，这样整块 section 的坐标用于计算落点，标题只负责启动手势。
{ tap: 'onToggle', long: 'onGroupMenu', dhandle: 'g:' + g.id }
```

拖拽期间宿主会：被拖项整块变灰、跟手浮层复用原节点渲染、实时画插入指示线；
手指靠近当前滚动容器上下边缘时自动滚动，方便把条目拖到屏幕外的分组；
松手后把 `{ id, key, from, to, index, fleet }` 交给 `dend`，
没有有效目标则交给 `dcancel`。

### 通用属性（短键）

| 键 | 含义 |
|---|---|
| `s` | 文本 / 占位 |
| `fs` `fw` `c` `lh` `ls` | 字号 / 粗细 / 颜色 / 行高 / 字距 |
| `bg` `r` `bw` `bc` `elev` `clip` | 背景 / 圆角 / 描边宽 / 描边色 / 阴影 / 裁剪 |
| `pad` `padh` `padv` `padt` `padb` `padl` `padr` | 内边距 |
| `w` `h` `minh` `maxw` `fillw` `fillh` `gr` | 尺寸与权重 |
| `gap` `js` `al` | 子间距 / 主轴对齐 / 交叉轴对齐 |
| `tap` `long` `down` `id` `bind` | 点击 / 长按 / **按下即触发** / 节点 id / 绑定输入框 |
| `ox` `oy` | 节点偏移（dp，可负）：把角标贴到图标右上角之类的微调 |
| `dock` | `'bottom'`：标记成「跟随页面上下滚动收起/显现的底部悬浮层」（拖动完全跟手，松手补完；页面内容不足以滚动时不动） |
| `key` | 列表复用键（**列表项一定要给**，否则流式追加会整段重建） |
| `ic` | 图标名（未知名字画占位方块，不会崩） |
| `seed` | 头像占位色种子（`avatar` 的 `src` 为空时生效；调色板全局只在宿主里） |
| `max` | 最大行数 |
| `axis` | `scroll`/`list` 的方向，`'h'` 为横向 |
| `ditem` | `1` = 该子节点是所在 `drag` 容器的可拖拽项 |
| `dhandle` | 在该节点上启动拖拽，但映射到「外层容器里的另一个条目 key」（分组标题拖整块 section） |
| `dkey` | 拖拽项/手柄的显式 key；默认用节点 `key` |
| `dfleet` | drag 容器的投放编组；同 fleet 的容器之间可跨容器投放 |
| `dstart` / `dend` / `dcancel` | 真正拖起 / 松手投放 / 无有效目标时触发一次；投放载荷含 `id/key/from/to/index/fleet` |
| `ddrop` | 该节点整块作为某个 fleet 的兜底投放区（收起分组也能接收联系人） |
| `dropid` | 兜底投放区的逻辑 id（默认节点 `id`） |

可用图标名见基座 `ui/render/NfIcons.kt` 的 `names`。

### 事件与副作用

节点上的 `tap: 'onXxx'` 会调用本插件导出的 `onXxx(e)`，
`e` 是点击载荷（含 `id`；若节点设了 `bind`，还含输入框当前文本）。

带 `long: 'onXxx'` 的节点：按下先出「按下特效」，提前抬手是点击，
按住到阈值是长按（抬手不再触发点击），按下期间拖动则取消并交给滚动/滑动。
长按载荷除 `id` 外还带有该节点**相对页面**的几何信息（dp）：
`x/y/w/h`（矩形）与 `vw/vh`（页面尺寸），插件可据此把浮窗贴到节点上方。

返回 `{ fx: [...] }` 让宿主执行副作用：

| 副作用 | 作用 |
|---|---|
| `nf.fx.nav(target, args)` | 切页面（`target` 是 navTab 的 id 或 view 的 id） |
| `nf.fx.toast(msg)` | 弹提示 |
| `nf.fx.kvSet/kvDel` | 插件私有持久化 |
| `nf.fx.emit(name, payload)` | 发事件给声明了 `event:<name>` 的插件 |
| `nf.fx.call(plugin, handler, args)` | 调另一个插件的导出函数 |
| `nf.fx.run(name, args)` | 请求宿主能力（如 `sendMessage`） |
| `nf.fx.http(req)` | 出网（**当前仅记录，待接真实网络**） |

宿主 `run` 能力（会话操作是唯一写入口，写完所有页面同帧一致）：

| 名称 | 参数 | 作用 |
|---|---|---|
| `sendMessage` | `{conversationId, text}` | 发送消息（宿主乐观更新 + 后台管线） |
| `conversation.pin` | `{id, pinned}` | 置顶 / 取消置顶（自动重排） |
| `conversation.read` | `{id}` | 标为已读（未读清零，角标同步） |
| `conversation.unread` | `{id, unread}` | 标为未读（默认 1） |
| `conversation.delete` | `{id}` | 删除会话及其消息 |
| `refresh` | — | 让宿主重渲染一次（插件内部状态变了时用） |

### 渲染入参

`render(ctx)` 里：

```js
ctx.route      // { view:'chat', params:{ conversationId:'c1' } }
ctx.data       // 包含当前视图数据 + 全局身份切片 ctx.data.me
ctx.counts     // 全局数据事实（宿主数据层聚合），如 { unread: 未读总数 }
ctx.tabs       // 全部导航项 + 各自 active 状态（只有外壳插件用得上）
ctx.hasPage    // 是否会有页面树被塞进 slot
```

> `ctx.data` 是**按视图裁剪**的：会话页只拿到会话数组，聊天页只拿到当前会话的消息。
> 这是刻意的 —— 每次渲染都要跨进程，别把全量数据一股脑塞过去。
>
> 其中 `ctx.data.me`（用户头像 / 昵称 / 在线状态）与 `ctx.data.conversations`
> 里的角色头像 / 角色名 / 未读数都是**全局唯一的一份数据**（宿主 `NfData`）。
> 任何页面都不要自己再定义头像、昵称或未读统计 —— 直接复用这些字段，
> 这样改一处数据所有页面同时变。

---

## 现有插件

| id | 作用 | 说明 | 专属 README |
|---|---|---|---|
| `core.shell` | 应用外壳 | 浮动底栏 + 页面插槽 + 「会话」未读角标 | [README](src/core.shell/README.md) |
| `ui.chatlist` | 会话列表 | 用户顶栏（与通讯录共用 `_shared/ui.common.js`）/ 时间规则 / 未读 / 点击 / 长按操作单 / 左滑按钮 | [README](src/ui.chatlist/README.md) |
| `ui.contacts` | 通讯录 | 顶栏与搜索框与会话页共用；私聊/群聊/渠道三套独立分组；折叠、长按菜单、分组与联系人拖拽排序；拖联系人自动收起全部分组、顶部插入线、边缘自动滚动 | [README](src/ui.contacts/README.md) |
| `ui.moments` | 朋友圈 | 动态卡片 / 点赞评论计数 | [README](src/ui.moments/README.md) |
| `ui.me` | 我 | 资料卡（复用全局身份 `ctx.data.me`）+ 设置入口 | [README](src/ui.me/README.md) |
| `ui.chat` | 聊天页 | 消息流 + 输入框（发送热路径的样板） | [README](src/ui.chat/README.md) |
| `ui.theme` | 主题与配色 | 逐个展示设计令牌，一眼验证配色链路 | [README](src/ui.theme/README.md) |
| `feat.demo` | 演示数据 | 注入会话 / 联系人 / 朋友圈 / 全局用户资料（只存时间戳） | [README](src/feat.demo/README.md) |
| `feat.echo` | 回声回复 | 无 UI，挂在 `message.send` 管线的 `reply` 阶段 | [README](src/feat.echo/README.md) |

---

## 性能红线（改插件前请看一眼）

1. **列表项必须给 `key`**；
2. 不要在 `render` 里做重活 —— 它是每次重绘都会执行的纯函数；
3. 高频数据（输入框文本、消息列表）的真相在宿主侧，**不要**试图在插件里
   维护一份再同步回来（那会把每次按键都变成一次跨进程往返）；
4. 能用一条 `fx` 表达的事，不要拆成多次跨插件 `call`。

---

## 许可

Apache-2.0。提交即表示同意以该协议分发。

