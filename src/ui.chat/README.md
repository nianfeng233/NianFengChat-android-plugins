# ui.chat —— 聊天页

## 负责
- 顶栏（会话头像/名字/在线态，头像复用会话对象里唯一那份 avatar/seed）
- 消息气泡流：**窗口化**，宿主默认只下发最近 50 条；向上滚到顶自动
  `run('message.window')` 取更早一页，渲染器负责保持阅读位置不跳
- `anchor:'end'`：首次进入与追加新消息时自动贴底
- 输入框与发送：文本缓存在宿主 `NfInputBuffer`（按键不跨边界），
  发送按钮用 `bind` 把文本直接塞进点击载荷，一次边界完成发送

## 导出
| handler | 作用 |
|---|---|
| `render(ctx)` | 顶栏 + 消息窗口 + 输入框 |
| `onSend(e)` | `run('sendMessage',{conversationId,text})` |
| `onLoadOlder()` | `run('message.window',{conversationId})` |
| `onBack()` | 返回会话列表 |

## 依赖
`ctx.data.conversation / messages / window`；不加载历史以外的任何数据。
