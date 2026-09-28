# ui.moments —— 朋友圈（底栏入口名：发现）

## 负责
动态卡片、点赞与评论计数。底栏 tab 的名称/图标由 `core.shell` 声明为
「发现 + 指南针」，本插件只负责内容页。

## 导出
| handler | 作用 |
|---|---|
| `render(ctx)` | 动态卡片流 |
| `onLike / onComment` | 点赞/评论（占位） |

## 依赖
`ctx.data.moments`。
