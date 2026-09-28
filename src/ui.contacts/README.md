# ui.contacts —— 通讯录

## 负责
四个分栏（全部/群聊/私聊/星标）+ 按首字母分组；头像占位色由宿主按 seed 生成。

## 导出
| handler | 作用 |
|---|---|
| `render(ctx)` | 分栏 + 分组列表 |
| `onTab(e)` | 切换分栏（插件内部状态 + `refresh`） |
| `onOpen(e)` | 打开联系人（占位 toast） |

## 依赖
`ctx.data.contacts`。
