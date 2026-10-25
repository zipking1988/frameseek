# 配置

2026-10-24: 用户授权新增 `provider=tokenfactory` 与 `allow_tokenfactory_media`，仅向固定 Token Factory API 发送本机抽帧 JPEG。使用 Nemotron 3.5 Super VL 公共 API 和 Qwen3 Embedding 8B 文本检索；不租 GPU、不自动启用付费请求。配置、预算待确认项与篮球测试见 [Token Factory 本地准备](TOKEN_FACTORY_LOCAL.md)。原自托管及 Gemini 路线保持独立。

优先级：环境变量 > `[frameseek]` TOML > 默认值。`FRAMESEEK_CONFIG`为本地配置文件路径；不从HTTP请求获取它。密钥不能写入配置；未知字段/变量、非法值拒绝，错误不会回显输入值或秘密。程序不会自动加载`.env`。

```toml
[frameseek]
mode = "fixture"
scene_threshold = 0.3
coarse_frames = 12
candidate_k = 10
rerank_k = 5
ttl_hours = 24
```

例如`FRAMESEEK_COARSE_FRAMES=8 make preflight`覆盖文件与默认。`FRAMESEEK_CONFIG=/path/to/config.toml make preflight`显式载入文件。

| 字段 / 对应FRAMESEEK大写变量 | 默认 | 当前范围/单位 |
|---|---|---|
| mode | fixture | fixture / real；真实启动需要有效 runtime，模型调用还需预算批准 |
| scene_threshold | 0.3 | 0–1；上传媒体镜头切分阈值 |
| coarse_frames | 12 | 每窗口8–16帧 |
| candidate_k / rerank_k | 10 / 5 | 1–100，rerank≤candidate；真实检索候选数 |
| ttl_hours | 24 | 1–168小时；到期禁读，服务启动及后台周期清理 |
| max_window_seconds / overlap_seconds | 120 / 5 | 固定秒 |
| max_fps / max_frames | 1 / 128 | 固定实际采样保护 |
| primary_cap / coarse_retry_cap | 30 / 0 | 未确认预算的临时保护，普通配置不可升额 |
| zoom_cap / text_repair_cap | 3 / 1 | 固定查询尝试/文本repair上限 |

所有数值必须有限且范围合法；整数限额不接受布尔值。真实上传/存储/解码限额已实现；实际模型ID、权限、价格、硬件和资源停费校准尚未完成，部署预检报告保持 `real_ready=false`。CLI在real模式下仍固定退出2，不能作为已配置部署的动态准入结果；实际运行还由runtime、预算和会话操作校验。这些要求不能由 `mode=real`、普通env/file或客户端cap绕过。

账本的预算单位必须是明确币种的整数微单位（如`USD_MICRO`）；金额示例只用于合成测试，不是价格或批准额度。owner和部署总量同事务预留；unknown不释放。可信本机批准版本工具已实现；真实数值批准和费用上界验证仍待完成。

运行配置：`FS_DATA_DIR` 指向私有存储（默认 `.frameseek-data/`），`FS_RUNTIME_FILE` 指向可信模型runtime文件，`FS_PUBLIC_ORIGIN` 是经评审的部署HTTPS origin。密钥通过runtime端点的 `key_env` 引用环境变量，不写入配置或Git。runtime模板不是批准记录。详见 [当前运行工作流与预算安装要求](WORKSPACE_RUNTIME.md)。

`make agent-check`（`python -m frameseek.readiness`）是独立的动态本机前提检查；可加 `--owner EXISTING_OWNER_ID` 仅读已有两级审批。不创建私有存储、不读取/展示密钥值、不安装审批、不调用模型。API和UI的检查用当前会话主体。所有前提通过时CLI退出0，否则2；`live_verified` 始终false，原 `preflight` 的部署验收限制不受影响。

## AI Builder Cup runtime 与入口

runtime 新增 `provider`（`nvidia_nebius` 默认 / `gemini`）及 `allow_google_media`（默认false）。Gemini只允许 `https://generativelanguage.googleapis.com/v1beta`，四个必需角色需有模型/revision、环境密钥和经校准的保守费用上界；asr必须为空。配置使用 [runtime.gemini.example.json](runtime.gemini.example.json)，仍需独立两级数字预算，不会自动调用模型或创建Google项目。详见 [Gemini准备流程](AI_BUILDER_CUP.md)。

容器入口使用 `FS_COMPONENT=workspace`（默认）或 `gateway`，`PORT` 默认为8080、有限整数1–65535，始终一个Uvicorn进程。gateway需 `FS_PUBLIC_ORIGIN`、不同的HTTPS `FS_BACKEND_ORIGIN` 和32–256可打印ASCII字符的私有 `FS_GATEWAY_TOKEN`。workspace配置同一token后所有直接访问需该token，原session/CSRF/拥有权仍必需。Cloud Run 的 `K_SERVICE` 环境禁止直接启动workspace；使用持久单后端与无状态gateway。模板不是部署或开支授权，见 [deployment.md](deployment.md)。

## 本机预算结算与恢复

Trusted Token Factory deployments can set `FS_DIRECT_OBSERVATIONS=1` to use the
same validated one-vision-call short-window path as the private local bridge.
This disables JSON repair and the separate text rewrite; it changes neither
ledger storage nor approvals/caps/history. Other providers reject this flag.
The default route remains unchanged when the flag is absent. No browser request
can enable it, and all dispatch still requires both existing budget scopes.

`FS_VISUAL_SEARCH=1` additionally enables frame-level local candidate retrieval
and one vision-only broad-question verification (at most8 saved frames), with
repairs/text rewriting disabled. This also enables the direct-observation path.
It is Token Factory only, including with the private shared-ledger adapter.
The free owned `search-index` operation is available without this flag and never
dispatches a provider request. See [engine scope](VIDEO_CTRL_F_ENGINE.md).

`budget_admin settle` 仅由可信本机操作者按已核对的用量证据下调 completed 请求的金额占用；不退调用次数，不释放 unknown，不改变原 attempt 身份，也不自动启用审批。`budget_admin resume` 需新的明确继续授权引用，恢复同一审批版本，保留原金额和调用上限及消耗。账本 v2 保留 v1 数据并增加结算/恢复审计表；没有 HTTP 或普通配置绕过入口。详情见 [Token Factory 核账记录](TOKEN_FACTORY_LOCAL.md#reconciliation-and-user-continuation-2026-10-24)。

## Explicit retention for an existing source

The default24-hour TTL and1–168-hour ordinary configuration range remain unchanged.
A trusted operator may extend one existing active owner's selected source and its
active investigations to an explicit cutoff no more than120 days ahead. New
investigations using that source inherit its authorized cutoff. Other uploads,
owners, deleted/expired data and model budgets are not changed by this operation.
A durable `retention_extensions` record stores the authorization and previous dates.

Stop the single workspace service first, then use its Python runtime:

```sh
python -m frameseek.workspace_admin --data-dir /path/to/private-workspace \
  --owner OWNER_ID --video VIDEO_ID --until '2027-01-13T00:00:00+09:00' \
  --confirm-authorized-reference EXPLICIT_USER_AUTHORIZATION
```

The CLI refuses a held `serve.lock`, preventing constructor recovery from altering
live worker/query states. No HTTP endpoint, environment variable or ordinary
configuration field grants this extension. The existing session cookie is refreshed
from the authenticated server record's remaining lifetime on `/api/session`;
this neither creates a new owner nor rolls server expiry forward. CSRF, Origin,
Secure/HttpOnly/SameSite and source ownership/expiry checks are retained.
