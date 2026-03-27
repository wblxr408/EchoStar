@echo off
chcp 65001 >nul 2>&1
REM EchoStar 压测监控启动脚本 (Windows)
REM 用法: run-monitor.bat [duration_seconds] [interval_seconds]
REM 示例: run-monitor.bat 300        # 监控 5 分钟
REM       run-monitor.bat 300 10     # 每 10 秒采样一次

setlocal

set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%..\..\..
cd /d "%BACKEND_DIR%"

set DURATION=%~1
set INTERVAL=%~2

if "%DURATION%"=="" set DURATION=0
if "%INTERVAL%"=="" set INTERVAL=5

echo.
echo 启动监控（间隔 %INTERVAL%s，时长 %DURATION%s）...
echo 提示: 测试完成后按 Ctrl+C 停止监控并保存报告
echo.

node tests\k6\test-scripts\monitor.cjs %DURATION% %INTERVAL%

endlocal
