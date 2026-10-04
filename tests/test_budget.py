import sqlite3
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest

from frameseek.attempts import ApprovedBudget, AttemptLedger, BudgetDenied


def install(ledger, scope, *, money=100, calls=40, primary=32):
    ledger.install_approved_record(
        ApprovedBudget(
            scope, "test-v1", "synthetic-test-not-human-spend", primary, calls, money, "USD_MICRO"
        )
    )


@pytest.fixture
def ledger(tmp_path):
    result = AttemptLedger(tmp_path / "ledger.db")
    install(result, "*")
    install(result, "owner1")
    return result


def reserve(ledger, id="a1", owner="owner1", money=100, **changes):
    kwargs = dict(
        attempt_id=id,
        owner=owner,
        version="test-v1",
        payload_hash="test-payload",
        kind="coarse",
        money_units=money,
        currency_unit="USD_MICRO",
    )
    return ledger.reserve(**{**kwargs, **changes})


def test_unknown_stays_reserved_across_restart_and_cannot_dispatch(ledger):
    reserve(ledger)
    ledger.transition("a1", "dispatched")
    ledger.transition("a1", "unknown")
    restarted = AttemptLedger(ledger.path)
    assert reserve(restarted) == "unknown"
    with pytest.raises(BudgetDenied):
        restarted.transition("a1", "dispatched")
    with pytest.raises(BudgetDenied):
        reserve(restarted, id="a2", money=1)
    assert restarted.read_attempt("a1", "other") is None


def test_concurrent_last_credit_reserves_only_one_attempt(ledger):
    barrier = Barrier(2)

    def contender(id):
        barrier.wait()
        try:
            return reserve(ledger, id=id)
        except BudgetDenied:
            return "denied"

    with ThreadPoolExecutor(max_workers=2) as executor:
        states = list(executor.map(contender, ("a1", "a2")))
    assert sorted(states) == ["denied", "reserved"]
    assert sum(ledger.read_attempt(id, "owner1") is not None for id in ("a1", "a2")) == 1


def test_failed_owner_reserve_rolls_back_global_and_cookie_cannot_bypass(ledger):
    with pytest.raises(BudgetDenied):
        reserve(ledger, id="bad", owner="not-approved")
    assert reserve(ledger) == "reserved"
    install(ledger, "owner2")
    with pytest.raises(BudgetDenied):
        reserve(ledger, id="a2", owner="owner2", money=1)


def test_lower_or_revoked_approval_prevents_reserved_dispatch(ledger):
    reserve(ledger, money=80)
    ledger.restrict("*", "test-v1", money_units=79)
    with pytest.raises(BudgetDenied):
        ledger.transition("a1", "dispatched")
    with pytest.raises(BudgetDenied):
        ledger.restrict("*", "test-v1", money_units=100)
    ledger.restrict("owner1", "test-v1")
    with pytest.raises(BudgetDenied):
        reserve(ledger, id="a2", money=1)


def test_same_id_reuses_state_but_different_payload_or_currency_fails(ledger):
    reserve(ledger)
    assert reserve(ledger) == "reserved"
    with pytest.raises(BudgetDenied):
        reserve(ledger, payload_hash="changed")
    with pytest.raises(BudgetDenied):
        reserve(ledger, id="a2", money=1, currency_unit="EUR_MICRO")


def test_unconfirmed_30_and_confirmed_actual_n_transition(ledger):
    ledger.admit_windows("owner1", None, 30)
    for count in (31, 32, 33):
        with pytest.raises(BudgetDenied):
            ledger.admit_windows("owner1", None, count)
    ledger.admit_windows("owner1", "test-v1", 32)
    with pytest.raises(BudgetDenied):
        ledger.admit_windows("owner1", "test-v1", 33)


@pytest.mark.parametrize("money", [0, -1, True, 1.5, float("nan"), float("inf"), 2**53])
def test_invalid_or_unknown_money_never_reserves(ledger, money):
    with pytest.raises(BudgetDenied):
        reserve(ledger, money=money)
    assert ledger.read_attempt("a1", "owner1") is None


def test_all_stage_requests_share_total_call_budget(tmp_path):
    ledger = AttemptLedger(tmp_path / "ledger.db")
    for scope in ("*", "owner1"):
        install(ledger, scope, calls=7, primary=1)
    for n, kind in enumerate(("coarse", "zoom", "asr", "embed", "rerank", "text", "allocation")):
        reserve(ledger, id=f"a{n}", money=1, kind=kind)
    with pytest.raises(BudgetDenied):
        reserve(ledger, id="over", money=1, kind="text")


def test_reserved_crash_can_be_marked_unknown_without_releasing_money(ledger):
    reserve(ledger)
    ledger.transition("a1", "unknown")
    assert reserve(ledger) == "unknown"
    with pytest.raises(BudgetDenied):
        reserve(ledger, id="retry", money=1)


def test_incompatible_database_does_not_silently_rebuild(tmp_path):
    path = tmp_path / "ledger.db"
    with sqlite3.connect(path) as conn:
        conn.execute("PRAGMA user_version=99")
    with pytest.raises(BudgetDenied, match="migration required"):
        AttemptLedger(path)
    with sqlite3.connect(path) as conn:
        assert conn.execute("PRAGMA user_version").fetchone()[0] == 99


def test_existing_unversioned_database_requires_explicit_migration(tmp_path):
    path = tmp_path / "foreign.db"
    with sqlite3.connect(path) as conn:
        conn.execute("CREATE TABLE foreign_data(id TEXT)")
    with pytest.raises(BudgetDenied, match="explicit migration"):
        AttemptLedger(path)
