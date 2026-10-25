"""No-dispatch concept alignment for existing captions and structured observations.

A bounded bilingual vocabulary is normalization, not a new visual model. Unknown
conditions are retained for clarification, not ignored. Source-specific facts,
entity bindings and occurrence times always come from the supplied index.
"""

import re

from frameseek.occurrences import Condition, normalized

# General visual concepts; no video IDs, teams, answers or source timestamps.
VOCABULARY = {
    "white": ["白色", "白", "white"],
    "red": ["红色", "红", "red"],
    "blue": ["蓝色", "蓝", "blue"],
    "yellow": ["黄色", "黄", "yellow"],
    "black": ["黑色", "黑", "black"],
    "green": ["绿色", "绿", "green"],
    "jersey": ["球衣", "jersey", "jerseys"],
    "shirt": ["衬衫", "上衣", "shirt", "shirts"],
    "hat": ["帽子", "帽", "hat", "cap"],
    "person": ["人物", "球员", "人员", "人", "person", "people", "player", "players"],
    "parcel": ["纸箱", "箱子", "包裹", "parcel", "box", "boxes", "package"],
    "car": ["汽车", "车辆", "car", "cars", "vehicle"],
    "bicycle": ["自行车", "单车", "bicycle", "bike"],
}
GRAMMAR = [
    "列出所有出现时间",
    "列出出现时间",
    "列出所有出现的时间",
    "所有出现的时间",
    "所有出现时间",
    "整段视频里面",
    "整段视频里",
    "整段视频",
    "视频里面",
    "视频里",
    "出现的时间",
    "出现时间",
    "帮我找出",
    "帮我找到",
    "帮我找",
    "找出",
    "找到",
    "查找",
    "请",
    "穿着",
    "身穿",
    "穿",
    "戴着",
    "戴",
    "的",
    "和",
    "以及",
    "与",
    "全部",
    "所有",
    "列出",
    "出现",
    "时间",
    "find all",
    "find",
    "show me",
    "show",
    "list all",
    "list",
    "all appearances",
    "appearances",
    "all times",
    "timestamps",
    "times",
    "in the video",
    "throughout the video",
    "video",
    "please",
    "wearing",
    "wears",
    "with",
    "and",
    "a",
    "the",
]


def remove_phrase(text, phrase):
    if re.fullmatch(r"[a-z ]+", phrase):
        return re.sub(r"(?<![a-z0-9])" + re.escape(phrase) + r"(?![a-z0-9])", " ", text)
    return text.replace(phrase, " ")


def canonical(value):
    value = normalized(value)
    for key, aliases in VOCABULARY.items():
        if value in aliases:
            return key
    return value


def interpret(question):
    text = normalized(question)
    if re.search(r"\b(?:not|without|or|except)\b|没有|不穿|不是|或者|除了|未戴|不戴", text):
        return [], ["否定或任选条件需要明确的结构化筛选，当前不自动猜测。"]
    terms = []
    phrases = sorted(
        ((alias, key) for key, aliases in VOCABULARY.items() for alias in aliases),
        key=lambda pair: -len(pair[0]),
    )
    # Remove question grammar first so e.g. 时间 is not misread as a source fact.
    for phrase in sorted(GRAMMAR, key=len, reverse=True):
        text = remove_phrase(text, phrase)
    for alias, key in phrases:
        changed = remove_phrase(text, alias)
        if changed != text:
            terms.append(key)
            text = changed
    remainder = re.sub(r"[\s，。！？、,:;?.!\-]+", " ", text).strip()
    if remainder:
        # Arbitrary literal index vocabulary remains usable; it is not translated
        # or discarded. Structured indexes below must ground every term.
        terms.extend(remainder.split())
    return list(dict.fromkeys(terms)), []


def caption_terms(caption):
    text = normalized(caption)
    found = set()
    for key, aliases in VOCABULARY.items():
        if any(remove_phrase(text, alias) != text for alias in aliases):
            found.add(key)
    return found


def caption_matches(caption, terms):
    concepts = caption_terms(caption)
    literal = normalized(caption)
    return all(term in concepts or term not in VOCABULARY and term in literal for term in terms)


def resolve_conditions(index, question, explicit=None):
    if explicit:
        return [Condition.model_validate(c) for c in explicit], []
    remainder = normalized(question)
    conditions = []
    # Aliases shipped with the source's trusted observation index can express
    # arbitrary multilingual concepts and relationships, beyond built-in words.
    for alias in sorted(index.query_aliases, key=len, reverse=True):
        changed = remove_phrase(remainder, normalized(alias))
        if changed != remainder:
            conditions.extend(index.query_aliases[alias])
            remainder = changed
    terms, problems = interpret(remainder)
    if problems or not terms and not conditions:
        return [], problems or ["请描述要查找的物体、可见属性或动作。"]
    # Field/value names are extracted from this source's existing observations.
    options = {}
    for observation in index.observations:
        for subject in observation.subjects:
            for field, values in subject.facts.items():
                for value in values:
                    options.setdefault(canonical(value), set()).add((field, value))
    for term in terms:
        available = options.get(term, set())
        if len(available) != 1:
            problems.append(f"索引中无法唯一解释条件「{term}」，请使用下方可用属性明确筛选。")
        else:
            field, value = next(iter(available))
            conditions.append(Condition(field=field, value=value))
    unique = {(c.field, c.value, c.operator): c for c in conditions}
    if len(unique) > 12:
        return [], ["条件超过12项，请缩小问题范围。"]
    return list(unique.values()), problems


def available_conditions(index):
    return [
        {"field": field, "value": value, "operator": "is"}
        for field, value in sorted(
            {
                (field, value)
                for o in index.observations
                for s in o.subjects
                for field, values in s.facts.items()
                for value in values
            }
        )
    ][:200]
