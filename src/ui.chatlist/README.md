# ui.chatlist —— 会话列表

## 负责
- 顶栏：用户头像 + 昵称 + 在线状态 + 细加号（`add_thin`）
- 无缝式整行列表：无间隙/无圆角/无分隔线，白底铺到屏幕底并从悬浮底栏下穿过
- 时间显示由时间戳推导：今天 `HH:mm`、昨天 `昨天 HH:mm`、2~6 天前 `星期X`、
  今年更早 `M月D日`、跨年 `YYYY年M月D日`
- **窗口化**：宿主默认只下发 30 条；滚到接近末尾自动
  `run('conversation.window')` 取下一页，累积上限后数据层滑窗丢弃最早一批
- 未读红点：贴在头像右上角，复用全局 `nf.ui.msgdot`（可拖拽、粘胶拉断、
  烟雾炸散、轻点不误触）；它是底栏级联爆散的被引爆端（`idx`）
- 左滑：置顶/标未读/删除三个按钮与卡片同一条；松手按「本次位移 1/5」吸附
- 长按：贴着该行上方弹出深色小浮窗（置顶/标已读/删除），点其他地方立即关闭

## 导出
| handler | 作用 |
|---|---|
| `render(ctx)` | 顶栏 + 搜索 + 会话窗口 |
| `onOpen / onLong` | 进聊天 / 弹出浮窗 |
| `onPin / onUnread / onDelete` | 左滑三个动作 |
| `onMenuPin / onMenuRead / onMenuDelete / onMenuClose` | 长按浮窗 |
| `onLoadMore` | `run('conversation.window')` |
| `onClearUnread(e)` | 掐爆某个会话红点 → `conversation.read` |
| `onPlus / onSearch / onProfile` | 占位交互 |

## 依赖
`ctx.data.me / conversations / window`；顺序由数据层给（窗口切片依赖全局序）。
