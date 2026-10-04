# 配置（D1已实现部分）

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
| mode | fixture | fixture / real；real仍被D1预检阻止 |
| scene_threshold | 0.3 | 0–1；模型/媒体执行尚未接入 |
| coarse_frames | 12 | 每窗口8–16帧 |
| candidate_k / rerank_k | 10 / 5 | 1–100，rerank≤candidate；未来检索参数 |
| ttl_hours | 24 | 1–168小时；实际数据清理尚未实现 |
| max_window_seconds / overlap_seconds | 120 / 5 | 固定秒 |
| max_fps / max_frames | 1 / 128 | 固定采样保护；真实采样尚未接入 |
| primary_cap / coarse_retry_cap | 30 / 0 | 未确认预算的临时保护，普通配置不可升额 |
| zoom_cap / text_repair_cap | 3 / 1 | 固定查询尝试/文本repair上限 |

所有数值必须有限且范围合法；整数限额不接受布尔值。价格、硬件、模型ID、真实上传/磁盘/进程限额及校准预算尚未配置，`real_ready=false`。这些缺项不能由`mode=real`、普通env/file或客户端cap绕过。

账本的预算单位必须是明确币种的整数微单位（如`USD_MICRO`）；金额示例只用于合成测试，不是价格或批准额度。owner和部署总量同事务预留；unknown不释放。服务端批准版本管理和真实费用上界验证仍待实现。
