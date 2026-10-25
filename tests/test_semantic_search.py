"""Cross-language concept alignment is not new recognition or arbitrary NLU."""

from frameseek.semantic_search import caption_matches, interpret


def test_complete_conditions_not_single_character_overlap():
    question = "找出穿白色球衣的人，列出所有出现时间"
    terms, problems = interpret(question)
    assert not problems and set(terms) == {"white", "jersey", "person"}
    assert caption_matches("一名身穿白色球衣的球员在门口。", terms)
    assert not caption_matches("一名穿蓝色球衣的球员。", terms)
    assert not caption_matches("白色箱子旁边有球员。", terms)
    english, problems = interpret("find people wearing white jersey, list all times")
    assert not problems and set(english) == set(terms)


def test_unknown_clauses_and_negation_are_not_silently_discarded():
    terms, problems = interpret("white jersey jumping")
    assert "jumping" in terms and not problems
    assert not caption_matches("穿白色球衣的球员", terms)
    assert interpret("white or blue")[1]
    assert interpret("没有红色帽子的人")[1]


def test_legacy_bilingual_candidates_stay_unverified_and_require_all_conditions(tmp_path):
    import json

    from test_visual_search import source

    from frameseek.index_service import chat_answer, search_source

    video = "vid_fixture"
    directory = tmp_path / video / "frames"
    directory.mkdir(parents=True)
    for i in range(3):
        (directory / f"f{i}.jpg").write_bytes(b"fixture-only")
    manifest = source(["白色球衣的球员。", "蓝色球衣的球员。", "球员在红色箱子旁。"])
    row = {
        "id": video,
        "generation": 2,
        "metadata": json.dumps({"duration": 40.0}),
        "manifest": json.dumps(manifest),
    }
    for question in ("找出穿白色球衣的人，列出所有出现时间", "white jersey person"):
        result = search_source(tmp_path, row, question)
        assert result["total_candidates"] == 1
        assert result["frames"][0]["frame_id"] == "vid_fixture_f0"
        assert result["verified_matches"] is False
        assert not chat_answer(result)["events"]
        assert "缺少完整物体观察索引" in chat_answer(result)["answer"]


def test_aggregate_questions_do_not_become_false_zero_occurrence_answers(tmp_path):
    from frameseek.index_service import search_source

    source = {"id": "vid_unobserved", "generation": 1, "metadata": '{"duration":12}'}
    result = search_source(tmp_path, source, "谁投的3分最多？")
    assert result["kind"] == "clarification_required"
    assert result["model_requests_sent"] == 0
    assert "总次数或排名" in result["message"]
