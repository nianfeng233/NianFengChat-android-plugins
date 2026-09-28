# feat.echo —— 回声回复

## 负责
挂在 `message.send` 管线的 `reply` 阶段：用户发消息后，宿主把文本送进来，
本插件回一条「回声」文本。用来演示「多个插件参与同一条发送管线」。

前置阶段（`pre`）的插件可以先改写文本，本插件拿到的是改写后的结果；
多个 `reply` 插件的按 `order` 依次执行，最后一个非空回复生效。

## 导出
| handler | 作用 |
|---|---|
| `onReply(args)` | 入参 `{phase, text, conversationId}`，返回 `{reply:'…'}` |

## 依赖
宿主发送管线 `NfHost.runSendPipeline`。不需要界面。
