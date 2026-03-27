@echo off
chcp 65001 >nul 2>&1
REM EchoStar k6 Stress Test Script (Windows)
REM Usage: run-test.bat --mode rate-limit|performance [options]
REM Note: Run this script from the backend directory

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
set TEST_TYPE=simple
set DO_RESET=0
set DO_MONITOR=0

REM Default parameters
if not defined USER_COUNT set USER_COUNT=100
if not defined STORY_COUNT set STORY_COUNT=500
if not defined LOAD_VUS set LOAD_VUS=50
if not defined DURATION set DURATION=2m

echo ========================================
echo    EchoStar Backend Stress Test
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
    set TEST_TYPE=full
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
if "%~1"=="--help" goto :show_help
goto :skip_help

:show_help
echo Usage: %0 [options]
echo.
echo Modes:
echo   --mode performance  Performance test - disable rate limiting, test raw performance (default)
echo   --mode rate-limit   Rate limit test - keep rate limiting, verify it works correctly
echo.
echo Options:
echo   --full        Run full stress test with large data creation
echo   --users N     Create N users (default: 100)
echo   --stories N   Create N stories (default: 500)
echo   --vus N       Concurrent virtual users (default: 50)
echo   --duration T  Test duration (default: 2m)
echo   --reset       Reset database before test (runs reset-env.js)
echo   --monitor     Enable Redis/PG monitoring during test
echo   --help        Show this help message
echo.
echo Examples:
echo   %0 --mode performance --reset
echo   %0 --mode rate-limit --vus 100
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

    if %ERRORLEVEL% neq 0 (
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
echo   Reset database:  %DO_RESET%
echo   User count:      %USER_COUNT%
echo   Story count:     %STORY_COUNT%
echo   Concurrent VUs:  %LOAD_VUS%
echo   Duration:        %DURATION%
echo   Report dir:      %REPORT_DIR%
echo   Test script:     %TEST_SCRIPT%
echo ========================================
echo.

REM Set environment variables for k6
set USER_COUNT=%USER_COUNT%
set STORY_COUNT=%STORY_COUNT%
set LOAD_VUS=%LOAD_VUS%
set LOAD_DURATION=%DURATION%
set TEST_MODE=%TEST_MODE%
set REPORT_DIR=%REPORT_DIR%

REM Report file names
set SUMMARY_EXPORT=%REPORT_DIR%\stress-test-%TIMESTAMP%-summary.json

echo Starting %TEST_MODE% test...
echo Report will be saved to: %SUMMARY_EXPORT%

REM Start monitor if requested
if "%DO_MONITOR%"=="1" (
    set "MONITOR_PID_FILE=%TEMP%\echostar-monitor-%TIMESTAMP%.pid"
    if exist "!MONITOR_PID_FILE!" del "!MONITOR_PID_FILE!"
    echo.
    echo [MONITOR] Starting Redis/PG monitoring (5s interval^)...
    start "" /b node tests\k6\test-scripts\monitor.cjs 0 5 "!MONITOR_PID_FILE!"
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
k6 run --summary-export="%SUMMARY_EXPORT%" "%SCRIPT_DIR%%TEST_SCRIPT%"

REM Stop monitor if it was started
if "%DO_MONITOR%"=="1" (
    echo.
    echo [MONITOR] Stopping monitor...
    if defined MONITOR_PID_FILE (
        if exist "!MONITOR_PID_FILE!" (
            set /p MONITOR_PID=<"!MONITOR_PID_FILE!"
            taskkill /f /pid !MONITOR_PID! >nul 2>nul
            del "!MONITOR_PID_FILE!" >nul 2>nul
        )
    )
    echo [MONITOR] Stopped.
)

echo.
echo ========================================
echo    Test completed!
echo ========================================
echo   Mode:   %TEST_MODE%
echo   Report: %SUMMARY_EXPORT%
echo ========================================

endlocal
