"""Public synthetic demo catalog, independent of private user videos and models."""

from frameseek.schema import Answer, hms


def catalog() -> dict:
    def event(start: int, end: int, action: str, caption: str, frames: list[int]) -> dict:
        return {
            "video_id": "demo_parcel",
            "start": float(start),
            "end": float(end),
            "start_hms": hms(start),
            "end_hms": hms(end),
            "action": action,
            "summary": caption,
            "support_level": "high",
            "evidence": [
                {
                    "t": float(t),
                    "t_hms": hms(t),
                    "frame_id": f"demo_parcel_f{t}",
                    "uri": f"/media/demo_parcel/frames/{t}.jpg",
                    "caption": caption,
                    "asr": None,
                }
                for t in frames
            ],
        }

    center = event(5, 11, "包裹出现在工作台中央", "纸箱位于工作台中央，顶部有浅色封箱带。", [6, 10])
    right = event(
        11, 18, "包裹出现在工作台右侧", "纸箱从中央位置切换至右侧；画面中没有可辨认的搬运者。", [13]
    )
    definitions = [
        (
            "center",
            "包裹什么时候出现在中央？",
            "ok",
            "包裹在 00:05–00:11 出现在工作台中央。",
            [center],
            [],
        ),
        ("right", "什么时候移到右侧？", "ok", "从 00:11 开始，包裹出现在工作台右侧。", [right], []),
        (
            "person",
            "能确认是谁搬动的吗？",
            "partial",
            "能确认包裹在 00:11 切换到右侧，但不能确认是谁搬动的。",
            [right],
            ["演示画面没有人物，无法确定搬运者或搬运方式。"],
        ),
        ("forklift", "有叉车出现吗？", "no_result", "这段 18 秒演示画面中没有叉车。", [], []),
        ("failure", "查看失败样例", "error", "这次查找未完成。你已查看的结果仍会保留。", [], []),
    ]
    queries = []
    for identifier, question, status, answer, events, unresolved in definitions:
        data = {
            "schema_version": "0.1",
            "status": status,
            "timebase": "video_absolute_seconds",
            "answer": answer,
            "events": events,
            "unresolved": unresolved,
            "followups": ["什么时候移到右侧？"] if identifier == "center" else [],
            "trace": {
                "visible": {
                    "channels": ["visual_vector"],
                    "segments_reviewed": 3 if status != "error" else 0,
                    "evidence_segments": len(events),
                },
                "debug": None,
            },
            "errors": [],
        }
        if status == "error":
            data["errors"] = [
                {
                    "code": "demo_failure",
                    "stage": "demo",
                    "message": "这是固定失败样例，用来展示错误与无命中的区别。",
                    "cause": "synthetic_demo_failure",
                    "retryable": False,
                    "suggested_action": "选择其他示例问题继续体验。",
                    "docs_url": "/docs/errors",
                    "request_id": "demo_failure",
                }
            ]
        queries.append(
            {
                "id": identifier,
                "question": question,
                "response": Answer.model_validate(data).model_dump(),
            }
        )
    return {
        "mode": "fixture",
        "synthetic": True,
        "video": {
            "id": "demo_parcel",
            "title": "包裹移动 · 合成演示",
            "duration": 18,
            "uri": "/demo/video",
        },
        "queries": queries,
    }
