# FrameSeek

上传视频，用自然语言定位可验证的事件、原话与时间证据。

当前状态：**桌面调查工作台、持久化调查和多视频素材管理已实现**。调查库可保存并恢复问题、空间画布、发现和笔记；素材库支持实际上传、预检、私有播放和独立调查。NVIDIA/Nebius 摄取与多轮问答已完成接口及模拟集成验证。默认 fixture 不调用模型；真实模型服务、批准的数字预算和部署校准仍缺，真实质量/性能未验收，不代表完整 MVP。详见 [工作流与真实运行配置](docs/WORKSPACE_RUNTIME.md)。

## 本地启动

前置条件：Python 3.13、uv、make。本机macOS已验证；Linux与完整冷启动时间尚未验证。ffmpeg/ffprobe为上传视频预检和真实视频分析所需，本地合同校验不依赖GPU或模型密钥。

```sh
make setup
make preflight
make demo
```

打开 <http://127.0.0.1:8765>，点击“包裹何时在中央？”，再输入“那后来呢？”或“谁搬的？”。点击各轮的00:06/00:13证据帧，查看实际播放器跳转。页面持续标注固定演示；`/health`提供预检，`/docs`提供API与schema。`make run`与`make demo`启动同一本地服务，默认仅绑定localhost，不作为生产部署。

```sh
make test          # 本地合同、窗口和SQLite竞态测试；不付费
make check         # lint与format
make eval-fixture  # 四种固定JSON合同样例；不做模型评测
npm test          # 全部前端状态、画布和异步持久化回归；Node.js ≥20
```

浏览器演示是3张生成静帧按5/6/7秒编码成的18秒合成序列，不是真实搬运录像；证据帧从该MP4提取并随包提供，启动演示无需ffmpeg或模型密钥；重生成素材可运行`uv run --frozen python scripts/build_demo_media.py`（需要ffmpeg）。CLI合同样例中的媒体URI仍为占位，与浏览器演示素材分开。当前无`eval-real`命令，未配置的真实模式主动拒绝启动：

```sh
FRAMESEEK_MODE=real uv run --frozen python -m frameseek.preflight
```

退出码2并列出权限、预算、GPU计费/释放、媒体隔离等缺项，不自动降级为fixture。`.env.example`是变量参考，程序不会自动读取`.env`；配置可由环境或`FRAMESEEK_CONFIG`指定的TOML载入。密钥不能写入TOML。

## 预算与真实运行

按实际完整窗口数预检；一小时连续素材至少32窗，镜头切分可更多。具体额度未确认前粗标注primary cap为30、额外coarse重试0；单次查询zoom最多3次，文本repair最多1次。修改环境或配置不能批准升额。

账本已用于所有模型阶段的双级预算准入，提供显式本机操作工具。测试批准记录与金额均为合成数据；运行服务不会安装批准记录，也没有客户端预算批准接口。真实运行需要明确批准的有限数值，以及实际模型权限、价格和供应商侧资源截止校准；当前未提供。

## 文档

- [技术契约](ARCHITECTURE.md)：唯一技术权威，含C/G/X/E01–E18要求。
- [产品概览](profile.md)：范围、目标和能力边界。
- [配置](docs/configuration.md)、[API与schema](docs/api.md)、[错误](docs/errors.md)。
- [D1实施记录](docs/D1_STATUS.md)：实际完成与未验证项。
- [代码评审与修复](docs/CODE_REVIEW_20261004.md)：初始私有仓库导入前的审查、回归验证及覆盖限制。
- [演示与浏览器验证](docs/PREVIEW_STATUS.md)、[界面规则](DESIGN.md)、[改版历史](docs/DESIGN_REVIEW.md)、[当前视觉对照与验证](design-qa.md)。
- [批准记录](docs/autoplan/APPROVAL.md)、[后续26项任务](docs/autoplan/IMPLEMENTATION_TASKS.md)、[29路径簇测试计划](docs/autoplan/test-plan-20261004.md)。

CPU基础依赖锁在`uv.lock`。GPU推理依赖、权重与镜像将独立管理，尚未安装。项目许可、模型许可与素材权利在发布前逐项核查，当前未选择项目许可证。


## 调查工作台前端

浏览器直接加载本地构建产物，不依赖 CDN。React 19.3 管理调查名称、轮次脉络、检查器、发现集合与证据对照；现有空间引擎负责卡片移动／连线／缩放，桥接状态通过 `workbench-model.js` 统一订阅。API 和 fixture 边界保持原合同。

修改 `frontend/workbench.jsx` 或前端源码后：

```sh
npm ci --ignore-scripts
npm run build
npm test
```

构建产物与内容哈希写入 `src/frameseek/static/`；运行本地服务无需安装 Node 依赖。组件依据 [React 外部状态订阅](https://react.dev/reference/react/useSyncExternalStore) 与 [createRoot](https://react.dev/reference/react-dom/client/createRoot) 官方接口，React／ReactDOM 许可保留在 `workbench.js.LEGAL.txt`。

证据集合最多8项，支持拖入画布或点击保存。名称、分组、笔记和空间状态保存到本机 SQLite，默认24小时；Markdown 导出保留素材来源与未确认项。真实素材拥有独立调查，索引未就绪时关闭问答，禁止套用预设证据。

画布导航支持可点击的小地图、聚焦选中对象、关系高亮和拖动对齐。拖动手柄时按 Shift 可跳过吸附；画布获得焦点后，F 聚焦当前对象、Home 回到全局，双击空白也可适应视图。小桌面默认收起小地图，缩窄窗口会保持当前对象可见。画布几何与导航测试包含在 `npm test` 中，视觉验证见 `docs/canvas-polish-20261004`。

画布随缩放切换详细、摘要与图谱显示；摘要保留原问题、简短答案、实际证据数量和结果状态，点击“查看详情”可聚焦完整内容。调查路径支持命名和折叠，名称不改写原问题，折叠只隐藏实际后续问题与发现；从历史选择隐藏对象会自动展开其祖先。拖动折叠卡片会一起移动隐藏后续对象；折叠期间整理画布后，展开会重新排布以避免重叠。名称和折叠状态已加入调查持久化。验证见 `docs/canvas-density-20261004` 与 `design-qa.md`。

完整工作区菜单可从左侧“菜单”展开，连接调查画布、素材、发现、问题详情、新调查、演示库、本地视频和 API 文档。右侧先展示结论与证据，依据可展开；发现支持类型筛选、按视频时间排序、回看及来源问题定位。宽桌面检查器344px，小桌面320px，收起后归还画布空间。验证见 `docs/menu-inspector-20261004`。
