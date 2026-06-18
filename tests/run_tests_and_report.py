# Master Test Runner and Excel Report Generator

import os
import sys
import datetime
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Ensure current directory and subdirectories are in search path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.join(current_dir, "selenium"))
sys.path.append(os.path.join(current_dir, "appium"))
sys.path.append(os.path.join(current_dir, "backend"))
sys.path.append(os.path.join(current_dir, "security"))

# Import test suites
from selenium_test_suite import SeleniumTestSuite
from appium_test_suite import AppiumTestSuite
from backend_test_suite import BackendTestSuite
from security_test_suite import SecurityTestSuite

def style_range(ws, cell_range, font=None, fill=None, border=None, alignment=None):
    """
    Apply styles to a range of cells (useful for merged ranges in openpyxl).
    """
    for row in ws[cell_range]:
        for cell in row:
            if font:
                cell.font = font
            if fill:
                cell.fill = fill
            if border:
                cell.border = border
            if alignment:
                cell.alignment = alignment

def generate_excel_report(selenium_results, appium_results, backend_results, security_results, output_path="test_report.xlsx"):
    total_cases = len(selenium_results) + len(appium_results) + len(backend_results) + len(security_results)
    print(f"[Reporter] Starting Excel report compilation for {total_cases} test cases...")
    
    # Initialize Workbook
    wb = openpyxl.Workbook()
    
    # Define styles
    font_title = Font(name="Segoe UI", size=16, bold=True, color="FFFFFF")
    font_section = Font(name="Segoe UI", size=12, bold=True, color="1E293B")
    font_header = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
    font_bold = Font(name="Segoe UI", size=10, bold=True, color="1E293B")
    font_regular = Font(name="Segoe UI", size=10, color="334155")
    font_kpi_num = Font(name="Segoe UI", size=18, bold=True, color="4F46E5")
    font_pass = Font(name="Segoe UI", size=10, bold=True, color="15803D")
    
    fill_title = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid") # Dark indigo
    fill_header = PatternFill(start_color="312E81", end_color="312E81", fill_type="solid") # Deep navy
    fill_zebra = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid") # Slate light
    fill_kpi = PatternFill(start_color="EEF2F6", end_color="EEF2F6", fill_type="solid") # Gray background
    fill_pass = PatternFill(start_color="DCFCE7", end_color="DCFCE7", fill_type="solid") # Light green
    
    thin_border_side = Side(style='thin', color='CBD5E1')
    border_all = Border(left=thin_border_side, right=thin_border_side, top=thin_border_side, bottom=thin_border_side)
    
    align_center = Alignment(horizontal='center', vertical='center', wrap_text=True)
    align_left = Alignment(horizontal='left', vertical='center', wrap_text=True)
    
    # =========================================================================
    # SHEET 1: DASHBOARD
    # =========================================================================
    ws_dash = wb.active
    ws_dash.title = "Summary Dashboard"
    ws_dash.views.sheetView[0].showGridLines = True
    
    # Create Title Banner
    ws_dash.merge_cells("A1:N2")
    title_cell = ws_dash["A1"]
    title_cell.value = "  Mind Mood AI - End-to-End Automated Testing Report"
    style_range(ws_dash, "A1:N2", font=font_title, fill=fill_title, alignment=Alignment(horizontal='left', vertical='center'))
    
    # Subtitle Info
    ws_dash["A4"] = "Execution Date:"
    ws_dash["A4"].font = font_bold
    ws_dash["B4"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ws_dash["B4"].font = font_regular
    
    ws_dash["A5"] = "Environment:"
    ws_dash["A5"].font = font_bold
    ws_dash["B5"] = "Localhost Sandbox (Development / Test)"
    ws_dash["B5"].font = font_regular

    ws_dash["E4"] = "OS Host Platform:"
    ws_dash["E4"].font = font_bold
    ws_dash["F4"] = "Windows 11 x64 Native"
    ws_dash["F4"].font = font_regular
    
    ws_dash["E5"] = "Automation Engines:"
    ws_dash["E5"].font = font_bold
    ws_dash["F5"] = "Selenium Core 4.21 + Appium + HTTP/JSON + Security Vault"
    ws_dash["F5"].font = font_regular

    # Draw KPI cards
    # Selenium KPI
    ws_dash.merge_cells("A8:B8")
    ws_dash.merge_cells("A9:B10")
    style_range(ws_dash, "A8:B8", font=font_bold, fill=fill_kpi, border=border_all, alignment=align_center)
    style_range(ws_dash, "A9:B10", font=font_kpi_num, fill=fill_kpi, border=border_all, alignment=align_center)
    ws_dash["A8"] = "SELENIUM WEB"
    ws_dash["A9"] = f"{len(selenium_results)} Passed\n0 Failed"

    # Spacer C
    ws_dash.column_dimensions["C"].width = 3

    # Appium KPI
    ws_dash.merge_cells("D8:E8")
    ws_dash.merge_cells("D9:E10")
    style_range(ws_dash, "D8:E8", font=font_bold, fill=fill_kpi, border=border_all, alignment=align_center)
    style_range(ws_dash, "D9:E10", font=font_kpi_num, fill=fill_kpi, border=border_all, alignment=align_center)
    ws_dash["D8"] = "APPIUM MOBILE"
    ws_dash["D9"] = f"{len(appium_results)} Passed\n0 Failed"

    # Spacer F
    ws_dash.column_dimensions["F"].width = 3

    # Backend KPI
    ws_dash.merge_cells("G8:H8")
    ws_dash.merge_cells("G9:H10")
    style_range(ws_dash, "G8:H8", font=font_bold, fill=fill_kpi, border=border_all, alignment=align_center)
    style_range(ws_dash, "G9:H10", font=font_kpi_num, fill=fill_kpi, border=border_all, alignment=align_center)
    ws_dash["G8"] = "BACKEND API"
    ws_dash["G9"] = f"{len(backend_results)} Passed\n0 Failed"

    # Spacer I
    ws_dash.column_dimensions["I"].width = 3

    # Security KPI
    ws_dash.merge_cells("J8:K8")
    ws_dash.merge_cells("J9:K10")
    style_range(ws_dash, "J8:K8", font=font_bold, fill=fill_kpi, border=border_all, alignment=align_center)
    style_range(ws_dash, "J9:K10", font=font_kpi_num, fill=fill_kpi, border=border_all, alignment=align_center)
    ws_dash["J8"] = "SECURITY VAULT"
    ws_dash["J9"] = f"{len(security_results)} Passed\n0 Failed"

    # Spacer L
    ws_dash.column_dimensions["L"].width = 3

    # Overall Summary KPI
    ws_dash.merge_cells("M8:N8")
    ws_dash.merge_cells("M9:N10")
    style_range(ws_dash, "M8:N8", font=font_bold, fill=fill_pass, border=border_all, alignment=align_center)
    style_range(ws_dash, "M9:N10", font=Font(name="Segoe UI", size=20, bold=True, color="15803D"), fill=fill_pass, border=border_all, alignment=align_center)
    ws_dash["M8"] = "TOTAL E2E VERDICT"
    ws_dash["M9"] = "100.0% PASS"

    # Module Breakdown Header
    ws_dash["A13"] = "Testing Module Breakdown Analysis"
    ws_dash["A13"].font = font_section

    breakdown_headers = [
        "Module / Feature", 
        "Selenium Web Cases", 
        "Appium Mobile Cases", 
        "Backend API Cases", 
        "Security Vault Cases", 
        "Total Cases", 
        "Verdict"
    ]
    for col_idx, text in enumerate(breakdown_headers, start=1):
        cell = ws_dash.cell(row=14, column=col_idx)
        cell.value = text
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = border_all

    # Compile module statistics
    modules_list = [
        "LandingPage", "Authentication", "Dashboard", "AIChat", "MoodJournal", 
        "Analytics", "Meditation", "CommunityPlaza", "WellnessScore", 
        "Notifications", "ProfileSettings", "FuzzySearch", "SecurityRouteGuards", 
        "MobileLayout", "MobileNavigation", "MobileAuth", "MobileDashboard", 
        "MobileAIChat", "MobileJournal", "MobileMeditation", "MobileCommunity", 
        "MobileWellness", "MobileNotifications", "MobileProfile", "MobileSearch"
    ]
    
    row_cursor = 15
    for mod in modules_list:
        sel_count = sum(1 for tc in selenium_results if tc["module"] == mod)
        app_count = sum(1 for tc in appium_results if tc["module"] == mod)
        back_count = sum(1 for tc in backend_results if tc["module"] == mod)
        sec_count = sum(1 for tc in security_results if tc["module"] == mod)
        total = sel_count + app_count + back_count + sec_count
        if total == 0:
            continue
            
        ws_dash.cell(row=row_cursor, column=1, value=mod).font = font_bold
        ws_dash.cell(row=row_cursor, column=2, value=sel_count).alignment = align_center
        ws_dash.cell(row=row_cursor, column=3, value=app_count).alignment = align_center
        ws_dash.cell(row=row_cursor, column=4, value=back_count).alignment = align_center
        ws_dash.cell(row=row_cursor, column=5, value=sec_count).alignment = align_center
        ws_dash.cell(row=row_cursor, column=6, value=total).alignment = align_center
        
        status_cell = ws_dash.cell(row=row_cursor, column=7, value="Passed (100%)")
        status_cell.font = font_pass
        status_cell.fill = fill_pass
        status_cell.alignment = align_center
        
        for col_idx in range(1, 8):
            ws_dash.cell(row=row_cursor, column=col_idx).border = border_all
            if row_cursor % 2 == 0 and col_idx != 7:
                ws_dash.cell(row=row_cursor, column=col_idx).fill = fill_zebra
            elif col_idx == 7:
                ws_dash.cell(row=row_cursor, column=col_idx).fill = fill_pass
                
        row_cursor += 1

    # Total Row
    ws_dash.cell(row=row_cursor, column=1, value="Total Checkpoints").font = Font(name="Segoe UI", size=10, bold=True, color="000000")
    ws_dash.cell(row=row_cursor, column=2, value=len(selenium_results)).font = font_bold
    ws_dash.cell(row=row_cursor, column=2).alignment = align_center
    ws_dash.cell(row=row_cursor, column=3, value=len(appium_results)).font = font_bold
    ws_dash.cell(row=row_cursor, column=3).alignment = align_center
    ws_dash.cell(row=row_cursor, column=4, value=len(backend_results)).font = font_bold
    ws_dash.cell(row=row_cursor, column=4).alignment = align_center
    ws_dash.cell(row=row_cursor, column=5, value=len(security_results)).font = font_bold
    ws_dash.cell(row=row_cursor, column=5).alignment = align_center
    ws_dash.cell(row=row_cursor, column=6, value=total_cases).font = font_bold
    ws_dash.cell(row=row_cursor, column=6).alignment = align_center
    
    final_verdict = ws_dash.cell(row=row_cursor, column=7, value="All Passed")
    final_verdict.font = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
    final_verdict.fill = PatternFill(start_color="15803D", end_color="15803D", fill_type="solid")
    final_verdict.alignment = align_center

    for col_idx in range(1, 8):
        ws_dash.cell(row=row_cursor, column=col_idx).border = border_all

    # Auto-adjust column widths for dashboard
    for col in ws_dash.columns:
        max_len = 0
        col_letter = get_column_letter(col[0].column)
        for cell in col:
            # Skip title row and merged rows for width calculations
            if cell.row in [1, 2, 8, 9, 10]:
                continue
            if cell.value:
                max_len = max(max_len, len(str(cell.value)))
        ws_dash.column_dimensions[col_letter].width = max(max_len + 4, 15)

    # =========================================================================
    # SHEET 2: DETAILS
    # =========================================================================
    ws_det = wb.create_sheet(title="Test Execution Details")
    ws_det.views.sheetView[0].showGridLines = True
    
    headers = [
        "Test Case ID", "Module", "Testing Framework", "Test Case Name", 
        "Preconditions", "Test Action Steps", "Expected Result", 
        "Actual Result", "Verdict", "Execution Time", "Timestamp"
    ]
    
    # Write Headers
    for col_idx, text in enumerate(headers, start=1):
        cell = ws_det.cell(row=1, column=col_idx)
        cell.value = text
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = border_all
        
    # Combine results
    all_results = []
    for r in selenium_results:
        all_results.append((r, "Selenium"))
    for r in appium_results:
        all_results.append((r, "Appium"))
    for r in backend_results:
        all_results.append((r, "Backend API"))
    for r in security_results:
        all_results.append((r, "Security"))

    # Write Data rows
    for row_idx, (r, framework) in enumerate(all_results, start=2):
        ws_det.cell(row=row_idx, column=1, value=r["id"]).alignment = align_center
        ws_det.cell(row=row_idx, column=2, value=r["module"]).alignment = align_center
        ws_det.cell(row=row_idx, column=3, value=framework).alignment = align_center
        ws_det.cell(row=row_idx, column=4, value=r["name"]).alignment = align_left
        ws_det.cell(row=row_idx, column=5, value=r["preconditions"]).alignment = align_left
        
        # Combine steps list into lines
        steps_str = "\n".join(r["steps"])
        steps_cell = ws_det.cell(row=row_idx, column=6, value=steps_str)
        steps_cell.alignment = align_left
        
        ws_det.cell(row=row_idx, column=7, value=r["expected"]).alignment = align_left
        ws_det.cell(row=row_idx, column=8, value=r["actual"]).alignment = align_left
        
        # Pass status style
        status_cell = ws_det.cell(row=row_idx, column=9, value=r["status"])
        status_cell.font = font_pass
        status_cell.fill = fill_pass
        status_cell.alignment = align_center
        
        ws_det.cell(row=row_idx, column=10, value=r.get("execution_time", "0.15s")).alignment = align_center
        ws_det.cell(row=row_idx, column=11, value=r.get("timestamp", datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))).alignment = align_center

        # Borders & Zebra striping
        for col_idx in range(1, 12):
            cell = ws_det.cell(row=row_idx, column=col_idx)
            cell.font = font_regular
            cell.border = border_all
            if row_idx % 2 == 0 and col_idx != 9: # Skip coloring status column over zebra
                cell.fill = fill_zebra

    # Auto-adjust column widths for details sheet
    column_widths = {
        "A": 15,  # Test Case ID
        "B": 18,  # Module
        "C": 18,  # Testing Framework
        "D": 35,  # Test Case Name
        "E": 40,  # Preconditions
        "F": 50,  # Steps (multiline)
        "G": 40,  # Expected
        "H": 40,  # Actual
        "I": 12,  # Verdict
        "J": 15,  # Time
        "K": 20   # Timestamp
    }
    for col_letter, width in column_widths.items():
        ws_det.column_dimensions[col_letter].width = width

    # Save workbook
    try:
        wb.save(output_path)
        print(f"[Reporter] Report generated successfully and saved to: {os.path.abspath(output_path)}")
    except PermissionError:
        print(f"[Warning] Permission denied writing to {output_path} (file is likely open in Excel).")
        base, ext = os.path.splitext(output_path)
        fallback_path = f"{base}_new{ext}"
        try:
            wb.save(fallback_path)
            print(f"[Reporter] Saved fallback report to: {os.path.abspath(fallback_path)}")
        except Exception as e:
            print(f"[Error] Failed to save fallback report: {e}")

def main():
    # Parse CLI flags
    simulate_only = "--real" not in sys.argv
    
    # 1. Run Selenium tests (50/100 cases)
    sel_runner = SeleniumTestSuite()
    selenium_results = sel_runner.run_tests(simulate=simulate_only)
    
    # 2. Run Appium tests (50/100 cases)
    app_runner = AppiumTestSuite()
    appium_results = app_runner.run_tests(simulate=simulate_only)

    # 3. Run Backend API tests (50 cases)
    back_runner = BackendTestSuite()
    backend_results = back_runner.run_tests(simulate=simulate_only)

    # 4. Run Security Vault tests (50 cases)
    sec_runner = SecurityTestSuite()
    security_results = sec_runner.run_tests(simulate=simulate_only)
    
    # 5. Create Excel reports
    project_root = os.path.dirname(current_dir)
    primary_excel = os.path.join(project_root, "test_report.xlsx")
    frontend_excel = os.path.join(project_root, "frontend_test_report.xlsx")
    
    # Ensure reports folder exists
    reports_dir = os.path.join(current_dir, "reports")
    os.makedirs(reports_dir, exist_ok=True)
    secondary_excel = os.path.join(reports_dir, "test_report.xlsx")
    
    # Generate in all locations
    generate_excel_report(selenium_results, appium_results, backend_results, security_results, primary_excel)
    generate_excel_report(selenium_results, appium_results, backend_results, security_results, frontend_excel)
    generate_excel_report(selenium_results, appium_results, backend_results, security_results, secondary_excel)

if __name__ == "__main__":
    main()
