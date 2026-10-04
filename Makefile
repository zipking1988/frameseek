.PHONY: setup test check preflight run demo eval-fixture schema

setup:
	uv sync --python 3.13

test:
	uv run --frozen pytest

check:
	uv run --frozen ruff check .
	uv run --frozen ruff format --check .
	uv run --frozen python scripts/export_contracts.py --check

schema:
	uv run --frozen python scripts/export_contracts.py

preflight:
	uv run --frozen python -m frameseek.preflight

run:
	uv run --frozen uvicorn frameseek.api:create_app --factory --host 127.0.0.1 --port 8765

demo: run

eval-fixture:
	uv run --frozen python -m frameseek.fixtures
