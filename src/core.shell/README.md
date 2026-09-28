# core.shell —— 应用外壳

## 负责
- 悬浮底部导航栏（70dp 高、圆角 35、左右 48 外边距、底部 30dp、阴影 8）
- 页面插槽 `['slot',{id:'page'}]`：宿主把当前页面插件的树塞进来
- 「会话」图标右上角的小圆/胶囊消息红点（`nf.ui.msgdot`），数字来自 `ctx.counts.unread`
- 底栏声明 `dock:'bottom'`：随可滚动页面上下拖动跟手收起/显现（数据层不参与）
- 二级页（聊天/主题等非 tab 页）自动隐藏底栏，避免压住输入框

## 导出
| handler | 作用 |
|---|---|
| `render(ctx)` | 外壳树 + 页面 slot |
| `onNav(e)` | 底栏点击 → `nf.fx.nav(tabId)` |
| `onClearAll()` | 掐爆底栏红点 → `conversation.readAll` 清空所有未读 |

## 依赖
无。只读 `ctx.tabs / ctx.counts / ctx.route`，不直接引用任何业务数据。
