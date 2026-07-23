import sys, io
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

"""
Master Test Runner - Mind Mood AI
Runs all 5 test suites (1500 total test cases) and produces 5 separate Excel reports.
Suites:
  1. Selenium UI Automation     — 300 cases → selenium_test_report.xlsx
  2. Appium Mobile Automation   — 300 cases → appium_test_report.xlsx
  3. Field Validation           — 300 cases → field_validation_test_report.xlsx
  4. Vulnerability & Security   — 300 cases → vulnerability_test_report.xlsx
  5. Load & Performance         — 300 cases → load_test_report.xlsx
"""
import os, sys, time, datetime

sys.path.insert(0, os.path.dirname(__file__))
REPORT_DIR = os.path.join(os.path.dirname(__file__), "reports")
os.makedirs(REPORT_DIR, exist_ok=True)

TIMESTAMP = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
DIVIDER = "=" * 70

SUITES = [
    ("selenium_test_suite",      "Selenium UI Automation",    "selenium_test_report.xlsx"),
    ("appium_test_suite",        "Appium Mobile Automation",  "appium_test_report.xlsx"),
    ("field_validation_test_suite", "Field Validation",       "field_validation_test_report.xlsx"),
    ("vulnerability_test_suite", "Vulnerability & Security",  "vulnerability_test_report.xlsx"),
    ("load_test_suite",          "Load & Performance",        "load_test_report.xlsx"),
]

if __name__ == "__main__":
    print(DIVIDER)
    print("  MIND MOOD AI — MASTER AUTOMATED TEST RUNNER")
    print("  5 Suites × 300 Cases = 1500 Total Test Cases")
    print(f"  Started: {TIMESTAMP}")
    print(DIVIDER)

    grand_total = 0
    grand_passed = 0
    summary = []

    for module_name, suite_label, report_name in SUITES:
        print(f"\n{'─' * 70}")
        print(f"  ▶ Running Suite: {suite_label}")
        print(f"{'─' * 70}")
        t0 = time.time()
        try:
            mod = __import__(module_name)
            # Each suite has a function build_*_tests()
            build_fn_name = [attr for attr in dir(mod) if attr.startswith("build_")][0]
            build_fn = getattr(mod, build_fn_name)
            results = build_fn()
            passed = sum(1 for r in results if r.get("status") == "Pass")
            total = len(results)
            elapsed = time.time() - t0

            # Generate report
            from report_utils import generate_excel_report
            report_path = os.path.join(REPORT_DIR, report_name)
            generate_excel_report(results, suite_label, f"300 automated test cases — {suite_label}", report_path)

            rate = f"{(passed/total*100):.1f}%" if total else "0%"
            status_icon = "✅" if passed == total else "⚠️"
            print(f"\n  {status_icon} {suite_label}: {passed}/{total} passed ({rate}) in {elapsed:.1f}s")
            summary.append((suite_label, total, passed, total - passed, rate, report_name))
            grand_total += total
            grand_passed += passed

        except Exception as e:
            print(f"  ❌ ERROR running {suite_label}: {e}")
            import traceback; traceback.print_exc()
            summary.append((suite_label, 0, 0, 0, "ERROR", report_name))

    # Final summary table
    print(f"\n{DIVIDER}")
    print("  FINAL SUMMARY")
    print(DIVIDER)
    print(f"  {'Suite':<35} {'Total':>7} {'Passed':>7} {'Failed':>7} {'Rate':>8}  {'Report'}")
    print(f"  {'─'*35} {'─'*7} {'─'*7} {'─'*7} {'─'*8}  {'─'*35}")
    for suite, total, passed, failed, rate, report in summary:
        icon = "✅" if failed == 0 else "❌"
        print(f"  {icon} {suite:<33} {total:>7} {passed:>7} {failed:>7} {rate:>8}  {report}")
    print(f"  {'─'*35} {'─'*7} {'─'*7} {'─'*7} {'─'*8}")
    final_rate = f"{(grand_passed/grand_total*100):.1f}%" if grand_total else "0%"
    print(f"  {'GRAND TOTAL':<35} {grand_total:>7} {grand_passed:>7} {grand_total-grand_passed:>7} {final_rate:>8}")
    print(DIVIDER)
    print(f"\n  Reports saved to: {os.path.abspath(REPORT_DIR)}")
    print(f"  Completed: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(DIVIDER)

    # Exit with non-zero if any failures
    if grand_passed < grand_total:
        sys.exit(1)
    sys.exit(0)
