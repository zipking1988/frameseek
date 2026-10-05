# 配置

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
