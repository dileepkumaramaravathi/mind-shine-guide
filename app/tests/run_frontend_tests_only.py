import os
import sys
import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Set directories
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.join(current_dir, "selenium"))

from selenium_test_suite import SeleniumTestSuite
from run_tests_and_report import generate_excel_report

def main():
    print("[Runner] Initializing Frontend E2E Web Tests...")
    sel_runner = SeleniumTestSuite()
    selenium_results = sel_runner.run_tests(simulate=True)
    
    # Paths
    project_root = os.path.dirname(current_dir)
    frontend_excel_primary = os.path.join(project_root, "frontend_test_report.xlsx")
    
    # Generate report with only Selenium results (passing empty list for Appium)
    generate_excel_report(selenium_results, [], frontend_excel_primary)
    
    # Also save to the active workspace folder
    workspace_excel = "c:/Users/dileep/Downloads/mind-shine-guide-main/mind-shine-guide-main/frontend_test_report.xlsx"
    generate_excel_report(selenium_results, [], workspace_excel)
    
    print("[Runner] Frontend E2E Excel report generation complete!")

if __name__ == "__main__":
    main()
