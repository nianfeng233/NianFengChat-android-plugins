# ui.contacts —— 通讯录（第二版）

## 负责
- **顶部栏与搜索框**：通过构建期共享 `NFUI`（`_shared/ui.common.js`）与会话页使用同一份视觉，
  搜索框中只显示「搜索」；
- 「私聊 / 群聊 / 渠道」三个分类各自持有一套独立分组，初始分别为
  「联系人 / 我的群聊 / 我的渠道」；
- 分类栏为文字 + 蓝色下划线指示器，与下方分组列表同底色且直接相连（参考图 1）；
- 分组可展开/收起、右侧显示当前分类下的人数；
- 长按分组弹「删除 / 新建分组」；新建分组是屏幕正中央的大号输入浮层；
- 分组可长按后继续拖动排序；联系人可跨分组拖拽；
- 同一分组内始终按 `initial`（名称首字母）排序。

## 拖拽协议
- 外层 `nf.ui.drag` 负责分组排序，`dfleet:'groups'`；
- 每个分组的联系人区是独立 `nf.ui.drag`，共用 `dfleet:'contacts'`，因此可跨组投放；
- 分组标题用 `dhandle` 映射到整块 section，长按静态弹菜单、长按后移动进入排序；
- 拖联系人时：
  - `dstart → onContactDragStart`，插件的 `dragCollapseAll` 把所有分组压成标题，
    只留下可投放的标题区域；源分组列表保留节点但 0 高，保证拖拽手势协程不被中断；
  - 指到哪个分组就画目标分组顶部的插入线；
  - 手指靠上/下边缘时宿主自动滚动当前 `scroll`/`list`，把屏幕外分组滚进来；
  - 松手 `onContactDrop` / 取消 `onContactDragCancel` 后恢复拖拽前的展开状态。

## 导出
| handler | 作用 |
|---|---|
| `render(ctx)` | 顶栏 + 分类 + 分组 + 联系人 |
| `onTab(e)` | 切换私聊/群聊/渠道 |
| `onToggle(e)` | 展开/收起分组 |
| `onGroupMenu / onMenuDelete / onMenuNew` | 分组长按菜单 |
| `onEditorCreate / onEditorClose` | 新建分组输入浮层 |
| `onGroupDrop / onGroupDragStart / onGroupDragCancel` | 分组拖拽 |
| `onContactDrop / onContactDragStart / onContactDragCancel` | 联系人拖拽 |
| `onOpen / onPlus / onSearch / onProfile` | 占位交互与导航 |

## 数据
- 联系人本体与 `kind` / `initial` 来自 `ctx.data.contacts`（内容插件注入）；
- 每个分类的「分组、成员、展开态」都是插件 state；
  第一版不持久化，退出重进各分类恢复为初始单个分组。
