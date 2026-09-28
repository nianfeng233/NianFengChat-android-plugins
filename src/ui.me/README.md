# ui.me —— 「我」

## 负责
资料卡 + 设置入口。资料卡直接读宿主注入的**全局身份** `ctx.data.me`
（与会话列表顶栏同源，换头像只改数据层一处）；页面白底、菜单从悬浮底栏下穿过。

## 导出
| handler | 作用 |
|---|---|
| `render(ctx)` | 资料卡 + 菜单 |
| `onEntry(e)` | `theme` → `nav('theme')`，其余占位 toast |

## 依赖
`ctx.data.me`。
