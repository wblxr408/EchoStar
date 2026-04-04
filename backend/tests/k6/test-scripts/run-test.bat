@echo off
chcp 65001 >nul 2>&1
REM EchoStar k6 Stress Test Script (Windows) v3.0
REM Usage: run-test.bat --mode rate-limit|performance [options]
REM Note: Run this script from the backend directory
REM
REM v3.0 changes:
REM   - --full (JSON Lines) and --monitor are now enabled by DEFAULT for performance mode
REM   - Auto-runs parse-report.js after test to generate comprehensive Markdown report
REM   - Report includes per-stage P95 analysis, inflection point detection, endpoint trends

setlocal enabledelayedexpansion

REM Get the backend directory (parent of tests)
set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%..\..\..
cd /d "%BACKEND_DIR%"

REM Default config
for /f "tokens=1-6 delims=/" %%a in ('echo %date%') do (
    set TIMESTAMP=%%c%%b%%a
)
for /f "tokens=1-3 delims=:." %%a in ('echo %time%') do (
    set TIMESTAMP=%TIMESTAMP%_%%a%%b%%c
)
set TIMESTAMP=%TIMESTAMP: =%

set TEST_MODE=performance
set DO_RESET=0
set PROFILE=peak

REM Default parameters
if not defined USER_COUNT set USER_COUNT=
if not defined STORY_COUNT set STORY_COUNT=
if not defined LOAD_VUS set LOAD_VUS=
if not defined DURATION set DURATION=

REM --- Full and Monitor are ON by default for performance mode ---
REM Use --no-full or --no-monitor to disable explicitly
set DO_FULL=1
set DO_MONITOR=1

echo ========================================
echo    EchoStar Backend Stress Test v3.0
echo ========================================
echo.
echo Working directory: %CD%
echo.

REM Check if k6 is installed
where k6 >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERROR: k6 is not installed
    echo Please visit https://k6.io/docs/installation/ to install k6
    exit /b 1
)

for /f "tokens=*" %%i in ('k6 version') do set K6_VERSION=%%i
echo k6 version: %K6_VERSION%
echo.

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :validate_mode
if "%~1"=="--mode" (
    set TEST_MODE=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--full" (
    set DO_FULL=1
    shift
    goto :parse_args
)
if "%~1"=="--no-full" (
    set DO_FULL=0
    shift
    goto :parse_args
)
if "%~1"=="--users" (
    set USER_COUNT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--stories" (
    set STORY_COUNT=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--vus" (
    set LOAD_VUS=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--duration" (
    set DURATION=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--reset" (
    set DO_RESET=1
    shift
    goto :parse_args
)
if "%~1"=="--monitor" (
    set DO_MONITOR=1
    shift
    goto :parse_args
)
if "%~1"=="--no-monitor" (
    set DO_MONITOR=0
    shift
    goto :parse_args
)
if "%~1"=="--profile" (
    set PROFILE=%~2
    shift
    shift
    goto :parse_args
)
if "%~1"=="--env" (
    set "ENV_RAW=%~2"
    REM cmd.exe may split KEY=VALUE into two separate args; detect and rejoin
    echo !ENV_RAW! | findstr "=" >nul
    if errorlevel 1 (
        if not "%~3"=="" (
            set "ENV_NEXT=%~3"
            set "ENV_FIRST_CHAR=!ENV_NEXT:~0,1!"
            if not "!ENV_FIRST_CHAR!"=="-" (
                set "ENV_RAW=!ENV_RAW!=!ENV_NEXT!"
                set "NEED_EXTRA_SHIFT=1"
            )
        )
    )
    set "ENV_KEY="
    set "ENV_VAL="
    for /f "tokens=1,2 delims==" %%a in ("!ENV_RAW!") do (
        set "ENV_KEY=%%a"
        set "ENV_VAL=%%b"
    )
    if "!ENV_KEY!"=="PROFILE" set "PROFILE=!ENV_VAL!"
    if "!ENV_KEY!"=="USER_COUNT" set "USER_COUNT=!ENV_VAL!"
    if "!ENV_KEY!"=="STORY_COUNT" set "STORY_COUNT=!ENV_VAL!"
    if "!ENV_KEY!"=="LOAD_VUS" set "LOAD_VUS=!ENV_VAL!"
    if "!ENV_KEY!"=="LOAD_DURATION" set "DURATION=!ENV_VAL!"
    if "!ENV_KEY!"=="BASE_URL" set "BASE_URL=!ENV_VAL!"
    if "!ENV_KEY!"=="DIST" set "DIST=!ENV_VAL!"
    if "!ENV_KEY!"=="HOT_RATIO" set "HOT_RATIO=!ENV_VAL!"
    shift
    shift
    if defined NEED_EXTRA_SHIFT (
        shift
        set "NEED_EXTRA_SHIFT="
    )
    goto :parse_args
)
if "%~1"=="--help" goto :show_help
goto :skip_help

:show_help
echo Usage: %0 [options]
echo.
echo Modes:
echo   --mode performance  Performance test - disable rate limiting (default)
echo   --mode rate-limit   Rate limit test - keep rate limiting
echo.
echo Options:
echo   --full          Enable JSON lines output (default: ON for performance mode)
echo   --no-full       Disable JSON lines output
echo   --monitor       Enable Redis/PG monitoring (default: ON for performance mode)
echo   --no-monitor    Disable monitoring
echo   --users N       Create N users (overrides profile)
echo   --stories N     Create N stories (overrides profile)
echo   --vus N         Concurrent virtual users (overrides profile)
echo   --duration T    Test duration (overrides profile)
echo   --profile P     Use test profile: smoke/daily/peak/overload/endurance/ramp (default: peak)
echo   --env K=V       Set environment variable (e.g., --env PROFILE=peak --env DIST=pareto)
echo   --reset         Reset database before test (runs reset-env.js)
echo   --help          Show this help message
echo.
echo Auto-generated reports (performance mode):
echo   - summary JSON:  k6 --summary-export
echo   - full JSON lines: k6 --out json (per-request data for stage analysis)
echo   - monitor JSON:  Redis/PG/Docker metrics
echo   - Markdown report: per-stage P95, inflection points, endpoint trends
echo   - stage JSON: structured per-stage data for programmatic use
echo.
echo Examples:
echo   %0 --mode performance --reset --env PROFILE=ramp
echo   %0 --mode performance --profile peak
echo   %0 --mode rate-limit --vus 100 --no-full --no-monitor
exit /b 0

:skip_help
echo Unknown argument: %~1
exit /b 1

:validate_mode
if not "%TEST_MODE%"=="performance" if not "%TEST_MODE%"=="rate-limit" (
    echo ERROR: Invalid mode "%TEST_MODE%"
    echo Valid modes: performance, rate-limit
    exit /b 1
)

REM Rate-limit mode defaults: no full, no monitor
if "%TEST_MODE%"=="rate-limit" (
    set DO_FULL=0
    set DO_MONITOR=0
)

REM Set report directory based on mode
if "%TEST_MODE%"=="rate-limit" (
    set REPORT_DIR=tests\k6\test-reports\rate-limit-test
    set TEST_SCRIPT=rate-limit-test.js
) else (
    set REPORT_DIR=tests\k6\test-reports\performance-test
    set TEST_SCRIPT=stress-test-simple.js
)

REM Create report directory
if not exist "%REPORT_DIR%" mkdir "%REPORT_DIR%"

:run_test

REM Run database reset if requested
if "%DO_RESET%"=="1" (
    echo.
    echo ========================================
    echo    Resetting test environment...
    echo ========================================
    echo.

    if "%TEST_MODE%"=="performance" (
        echo [INFO] Starting server WITHOUT rate limiting...
        node tests\unit\test-scripts\reset-env.js --no-limit
    ) else (
        echo [INFO] Starting server WITH rate limiting...
        node tests\unit\test-scripts\reset-env.js
    )

    if !ERRORLEVEL! neq 0 (
        echo ERROR: Environment reset failed
        exit /b 1
    )
    echo.
    echo Environment reset completed.
    echo.
)

REM Display test config
echo ========================================
echo   Test Configuration
echo ========================================
echo   Mode:            %TEST_MODE%
echo   Profile:         %PROFILE%
echo   Reset database:  %DO_RESET%
echo   User count:      %USER_COUNT%
echo   Story count:     %STORY_COUNT%
echo   Concurrent VUs:  %LOAD_VUS%
echo   Duration:        %DURATION%
echo   Report dir:      %REPORT_DIR%
echo   Test script:     %TEST_SCRIPT%
echo   Full output:     %DO_FULL%
echo   Monitoring:      %DO_MONITOR%
echo ========================================
echo.

REM Set environment variables for k6
set PROFILE=%PROFILE%
set TEST_MODE=%TEST_MODE%
set REPORT_DIR=%REPORT_DIR%
if not "%USER_COUNT%"=="" set USER_COUNT=%USER_COUNT%
if not "%STORY_COUNT%"=="" set STORY_COUNT=%STORY_COUNT%
if not "%LOAD_VUS%"=="" set LOAD_VUS=%LOAD_VUS%
if not "%DURATION%"=="" set LOAD_DURATION=%DURATION%
if not "%DIST%"=="" set DIST=%DIST%
if not "%HOT_RATIO%"=="" set HOT_RATIO=%HOT_RATIO%

REM Report file names (content-type first, then timestamp)
set SUMMARY_EXPORT=%REPORT_DIR%\%PROFILE%-summary-%TIMESTAMP%.json
set JSON_LINES_EXPORT=%REPORT_DIR%\%PROFILE%-%TIMESTAMP%.json

echo Starting %TEST_MODE% test...
echo Summary report: %SUMMARY_EXPORT%
if "%DO_FULL%"=="1" echo Full data:      %JSON_LINES_EXPORT%

REM Start monitor if requested
if "%DO_MONITOR%"=="1" (
    set "MONITOR_PID_FILE=%TEMP%\echostar-monitor-%TIMESTAMP%.pid"
    if exist "!MONITOR_PID_FILE!" del "!MONITOR_PID_FILE!"
    echo.
    echo [MONITOR] Starting Redis/PG/Docker monitoring (5s interval^)...
    start "" /b node tests\k6\test-scripts\monitor.cjs 0 5 "!MONITOR_PID_FILE!" "%REPORT_DIR%"
    timeout /t 2 /nobreak > nul
    echo [MONITOR] Running. Will auto-stop after k6 test completes.
    echo.
)
echo.
if "%DO_RESET%"=="0" (
    if "%TEST_MODE%"=="performance" (
        echo IMPORTANT: Make sure backend server is running WITHOUT rate limiting
        echo   (Use: node src/server.no-limit.js)
    ) else (
        echo IMPORTANT: Make sure backend server is running WITH rate limiting
        echo   (Use: npm run dev)
    )
    echo.
)

REM Run test
echo Running %TEST_SCRIPT%...
set K6_EXIT_CODE=0
if "%DO_FULL%"=="1" (
    echo [INFO] Full mode: recording per-request data for stage analysis...
    k6 run --out json="%JSON_LINES_EXPORT%" --summary-export="%SUMMARY_EXPORT%" "%SCRIPT_DIR%%TEST_SCRIPT%"
    if !ERRORLEVEL! neq 0 set K6_EXIT_CODE=!ERRORLEVEL!
) else (
    k6 run --summary-export="%SUMMARY_EXPORT%" "%SCRIPT_DIR%%TEST_SCRIPT%"
    if !ERRORLEVEL! neq 0 set K6_EXIT_CODE=!ERRORLEVEL!
)

REM Stop monitor if it was started (create stop signal file for graceful exit)
if "%DO_MONITOR%"=="1" (
    echo.
    echo [MONITOR] Stopping monitor...
    if defined MONITOR_PID_FILE (
        REM Read PID from the PID file (not the file path itself)
        set "MONITOR_PID="
        if exist "!MONITOR_PID_FILE!" (
            set /p MONITOR_PID=<"!MONITOR_PID_FILE!"
        )
        REM Create stop signal file to trigger graceful exit in monitor.cjs
        set STOP_SIGNAL_FILE=!MONITOR_PID_FILE:.pid=.stop!
        type nul > "!STOP_SIGNAL_FILE!" 2>nul
        REM Wait for monitor to finish saving report (max 15 seconds)
        for /L %%i in (1,1,15) do (
            timeout /t 1 /nobreak > nul
            REM Check if monitor process is still running (by PID, not file path)
            if defined MONITOR_PID (
                tasklist /fi "PID eq !MONITOR_PID!" 2>nul | find "node" >nul || goto :monitor_stopped
            ) else (
                goto :monitor_stopped
            )
        )
        :monitor_stopped
        REM Give monitor extra time to finish writing report before cleaning up files
        timeout /t 2 /nobreak > nul
        if exist "!MONITOR_PID_FILE!" del "!MONITOR_PID_FILE!" >nul 2>nul
        if exist "!STOP_SIGNAL_FILE!" del "!STOP_SIGNAL_FILE!" >nul 2>nul
    )
    echo [MONITOR] Stopped.
)

REM ========================================
REM  Post-test: Auto-generate reports
REM ========================================
echo.
echo ========================================
echo    Generating Reports...
echo ========================================

REM Parse report and generate Markdown
if exist "%SUMMARY_EXPORT%" (
    if "%DO_FULL%"=="1" (
        if exist "%JSON_LINES_EXPORT%" (
            echo [REPORT] Running deep stage analysis...
            node tests\k6\test-scripts\parse-report.js "%SUMMARY_EXPORT%" "%JSON_LINES_EXPORT%" "%REPORT_DIR%"
            REM Generate charts (parse-report.js produces {profile}-analysis-{timestamp}.json)
            set STAGES_JSON=!REPORT_DIR!\!PROFILE!-analysis-!TIMESTAMP!.json
            if exist "!STAGES_JSON!" (
                echo [CHARTS] Generating visual charts...
                node tests\k6\test-scripts\plot-stages.js "!STAGES_JSON!" "!REPORT_DIR!"
            ) else (
                echo [WARNING] Analysis JSON not found: !STAGES_JSON!
                echo [WARNING] plot-stages.js skipped. Run manually if needed.
            )
        ) else (
            echo [REPORT] Generating summary report...
            node tests\k6\test-scripts\parse-report.js "%SUMMARY_EXPORT%" "%REPORT_DIR%"
        )
    ) else (
        echo [REPORT] Generating summary report...
        node tests\k6\test-scripts\parse-report.js "%SUMMARY_EXPORT%" "%REPORT_DIR%"
    )
) else (
    echo [WARNING] Summary export not found, skipping report generation.
)

echo.
echo ========================================
echo    Test completed!
echo ========================================
echo   Mode:           %TEST_MODE%
echo   Profile:        %PROFILE%
echo   Summary:        %SUMMARY_EXPORT%
if "%DO_FULL%"=="1" echo   Full data:      %JSON_LINES_EXPORT%
if "%DO_FULL%"=="1" echo   Charts:         (see *-charts.html and *-analysis.json in %REPORT_DIR%)
if "%DO_MONITOR%"=="1" echo   Monitor:        (see monitor-*.json in %REPORT_DIR%)
echo ========================================

exit /b %K6_EXIT_CODE%

endlocal
