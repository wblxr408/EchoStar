@echo off
chcp 65001 >nul 2>&1
REM EchoStar k6 Stress Test Script (Windows)
REM Usage: run-test.bat [options]
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

set REPORT_DIR=tests\k6\test-reports
set TEST_TYPE=simple
set DO_RESET=0

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

REM Create report directory
if not exist "%REPORT_DIR%" mkdir "%REPORT_DIR%"

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :run_test
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
if "%~1"=="--help" (
    echo Usage: %0 [options]
    echo.
    echo Options:
    echo   --full        Run full stress test (with large data creation)
    echo   --users N     Create N users (default: 100)
    echo   --stories N   Create N stories (default: 500)
    echo   --vus N       Concurrent virtual users (default: 50)
    echo   --duration T  Test duration (default: 2m)
    echo   --reset       Reset database before test (runs reset-env.js)
    echo   --help        Show this help message
    exit /b 0
)
echo Unknown argument: %~1
exit /b 1

:run_test

REM Run database reset if requested
if "%DO_RESET%"=="1" (
    echo.
    echo ========================================
    echo    Resetting database...
    echo ========================================
    echo.
    node tests\unit\test-scripts\reset-env.js
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Database reset failed
        exit /b 1
    )
    echo.
    echo Database reset completed.
    echo.
)

REM Display test config
echo Test configuration:
echo   Test type: %TEST_TYPE%
echo   Reset database: %DO_RESET%
echo   User count: %USER_COUNT%
echo   Story count: %STORY_COUNT%
echo   Concurrent users: %LOAD_VUS%
echo   Duration: %DURATION%
echo   Report directory: %REPORT_DIR%
echo.

REM Set environment variables for k6
set USER_COUNT=%USER_COUNT%
set STORY_COUNT=%STORY_COUNT%
set LOAD_VUS=%LOAD_VUS%
set LOAD_DURATION=%DURATION%

REM Report file names
set SUMMARY_EXPORT=%REPORT_DIR%\stress-test-%TIMESTAMP%-summary.json

echo Starting test...
echo Report will be saved to: %SUMMARY_EXPORT%
echo.
if "%DO_RESET%"=="0" (
    echo IMPORTANT: Make sure backend server is running on http://localhost:3000
    echo.
)

REM Run test
if "%TEST_TYPE%"=="full" (
    echo Running full stress test...
    k6 run --summary-export="%SUMMARY_EXPORT%" "%SCRIPT_DIR%stress-test.js"
) else (
    echo Running simple stress test...
    k6 run --summary-export="%SUMMARY_EXPORT%" "%SCRIPT_DIR%stress-test-simple.js"
)

echo.
echo ========================================
echo    Test completed!
echo ========================================
echo Report file: %SUMMARY_EXPORT%

endlocal
