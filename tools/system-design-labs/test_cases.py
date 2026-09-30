import concurrent.futures
import pathlib
import tempfile
import threading
import unittest
from cases import Ledger, SearchIndex, MAX_AMOUNT


class SearchTests(unittest.TestCase):
    def test_out_of_order_duplicate_and_delete_cannot_resurrect(self):
        index = SearchIndex()
        for version, text, deleted in [(2, "Go сети", False), (1, "старое", False),
                                       (2, "Go сети", False), (4, "", True),
                                       (3, "Go приватно", False)]:
            index.apply(42, version, text, deleted)
        self.assertEqual(index.documents[42], (4, "", True))
        self.assertEqual(index.search("go", {42}), [])

    def test_current_authorization_filters_a_stale_public_document(self):
        index = SearchIndex()
        index.apply(42, 1, "Go сети")
        index.apply(43, 1, "Go базы")
        self.assertEqual(index.search("GO", {42, 43}), [42, 43])
        # Access revoked in the authoritative source; the index has not updated.
        self.assertEqual(index.search("go", {43}), [43])
        self.assertEqual(index.search("go сети", {43}), [])

    def test_replace_removes_old_terms_and_conflicting_version_fails(self):
        index = SearchIndex()
        index.apply(42, 1, "Go сети")
        index.apply(42, 2, "Go базы")
        self.assertEqual(index.search("сети", {42}), [])
        self.assertEqual(index.search("базы", {42}), [42])
        with self.assertRaises(ValueError):
            index.apply(42, 2, "другой текст")


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.ledger = Ledger(str(pathlib.Path(self.temp.name) / "ledger.sqlite"))
        self.ledger.initialize()
        self.ledger.seed({"A": 1000, "B": 0})

    def assert_invariants(self, initial=None):
        initial = initial or {"A": 1000, "B": 0}
        balances, operations, entries = self.ledger.snapshot()
        self.assertEqual(sum(balances.values()), sum(initial.values()))
        self.assertTrue(all(value >= 0 for value in balances.values()))
        self.assertEqual(len(entries), 2 * len(operations))
        for key, source, destination, amount in operations:
            self.assertCountEqual([(a, d) for k, a, d in entries if k == key],
                                  [(source, -amount), (destination, amount)])
        for account, value in balances.items():
            self.assertEqual(value, initial[account] + sum(d for _, a, d in entries if a == account))

    def test_competing_transfers_cannot_spend_the_same_balance(self):
        barrier = threading.Barrier(2)
        def submit(args):
            barrier.wait(timeout=5)
            return self.ledger.transfer(*args)
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(submit, [("X", "A", "B", 700), ("Y", "A", "B", 600)]))
        self.assertCountEqual(results, ["applied", "insufficient"])
        self.assert_invariants()

    def test_concurrent_retries_apply_one_effect_and_survive_reopening(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
            results = list(pool.map(lambda _: self.ledger.transfer("X", "A", "B", 700), range(24)))
        self.assertEqual(results.count("applied"), 1)
        self.assertEqual(results.count("replayed"), 23)
        reopened = Ledger(self.ledger.filename)
        self.assertEqual(reopened.transfer("X", "A", "B", 700), "replayed")
        self.assertEqual(reopened.snapshot()[0], {"A": 300, "B": 700})
        with self.assertRaises(ValueError):
            reopened.transfer("X", "A", "B", 600)
        self.assert_invariants()

    def test_failure_before_commit_leaves_no_partial_effect(self):
        with self.assertRaises(RuntimeError):
            self.ledger.transfer("X", "A", "B", 700, fail_before_commit=True)
        self.assertEqual(self.ledger.snapshot(), ({"A": 1000, "B": 0}, [], []))
        self.assertEqual(self.ledger.transfer("X", "A", "B", 700), "applied")
        self.assert_invariants()

    def test_unknown_account_and_invalid_amount_do_not_create_entries(self):
        for args in [("X", "A", "C", 1), ("X", "A", "B", 0),
                     ("X", "A", "B", 0.5), ("X", "A", "B", True)]:
            with self.assertRaises(ValueError):
                self.ledger.transfer(*args)
        self.assertEqual(self.ledger.snapshot(), ({"A": 1000, "B": 0}, [], []))

    def test_refused_request_is_stable_and_its_key_cannot_change_payload(self):
        self.assertEqual(self.ledger.transfer("X", "A", "B", 1100), "insufficient")
        reopened = Ledger(self.ledger.filename)
        self.assertEqual(reopened.transfer("X", "A", "B", 1100), "insufficient")
        with self.assertRaises(ValueError):
            reopened.transfer("X", "A", "B", 100)
        self.assertEqual(reopened.snapshot(), ({"A": 1000, "B": 0}, [], []))

    def test_integer_overflow_is_rejected_before_any_journal_effect(self):
        self.ledger.seed({"C": 10, "D": MAX_AMOUNT})
        with self.assertRaises(ValueError):
            self.ledger.transfer("overflow", "C", "D", 1)
        balances, operations, entries = self.ledger.snapshot()
        self.assertEqual(balances["D"], MAX_AMOUNT)
        self.assertEqual(balances["C"], 10)
        self.assertEqual(operations, [])
        self.assertEqual(entries, [])
        with self.ledger.connect() as db:
            types = [row[0] for row in db.execute("SELECT typeof(balance) FROM accounts")]
        self.assertTrue(all(kind == "integer" for kind in types))
        with self.assertRaises(ValueError):
            self.ledger.seed({"E": MAX_AMOUNT + 1})


if __name__ == "__main__":
    unittest.main()
