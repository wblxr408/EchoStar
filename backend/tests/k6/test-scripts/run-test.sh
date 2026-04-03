#!/bin/bash
# EchoStar k6 压力测试运行脚本 v3.0
# 使用方法: ./run-test.sh --mode rate-limit|performance [options]
#
# v3.0 changes:
#   - --full (JSON Lines) and --monitor are now ON by default for performance mode
#   - Auto-runs parse-report.js after test to generate comprehensive Markdown report
#   - Report includes per-stage P95 analysis, inflection point detection, endpoint trends

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 默认配置
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$BACKEND_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_MODE="performance"

# 默认参数
USER_COUNT=${USER_COUNT:-}
STORY_COUNT=${STORY_COUNT:-}
LOAD_VUS=${LOAD_VUS:-}
DURATION=${DURATION:-}
PROFILE=${PROFILE:-peak}

# --- Full and Monitor are ON by default for performance mode ---
DO_FULL=1
DO_MONITOR=1
MONITOR_PID=""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   EchoStar Backend Stress Test v3.0${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查 k6 是否安装
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}错误: k6 未安装${NC}"
    echo -e "${YELLOW}请访问 https://k6.io/docs/installation/ 安装 k6${NC}"
    exit 1
fi

echo -e "${GREEN}k6 版本: $(k6 version)${NC}"

# 解析命令行参数
DO_RESET=0
while [[ $# -gt 0 ]]; do
    case $1 in
        --mode)
            TEST_MODE="$2"
            shift 2
            ;;
        --reset)
            DO_RESET=1
            shift
            ;;
        --full)
            DO_FULL=1
            shift
            ;;
        --no-full)
            DO_FULL=0
            shift
            ;;
        --users)
            USER_COUNT=$2
            shift 2
            ;;
        --stories)
            STORY_COUNT=$2
            shift 2
            ;;
        --vus)
            LOAD_VUS=$2
            shift 2
            ;;
        --duration)
            DURATION=$2
            shift 2
            ;;
        --profile)
            PROFILE="$2"
            shift 2
            ;;
        --monitor)
            DO_MONITOR=1
            shift
            ;;
        --no-monitor)
            DO_MONITOR=0
            shift
            ;;
        --env)
            ENV_ARG="$2"
            KEY="${ENV_ARG%%=*}"
            VALUE="${ENV_ARG#*=}"
            case "$KEY" in
                PROFILE) PROFILE="$VALUE" ;;
                USER_COUNT) USER_COUNT="$VALUE" ;;
                STORY_COUNT) STORY_COUNT="$VALUE" ;;
                LOAD_VUS) LOAD_VUS="$VALUE" ;;
                LOAD_DURATION) DURATION="$VALUE" ;;
                BASE_URL) BASE_URL="$VALUE" ;;
                DIST) DIST="$VALUE" ;;
                HOT_RATIO) HOT_RATIO="$VALUE" ;;
            esac
            shift 2
            ;;
        --help)
            echo "使用方法: $0 --mode rate-limit|performance [options]"
            echo ""
            echo "测试模式:"
            echo "  --mode performance  性能测试（关闭限流，测试后端大流量性能）[默认]"
            echo "  --mode rate-limit   限流测试（保留限流，验证限流功能正确性）"
            echo ""
            echo "选项:"
            echo "  --full          启用 JSON lines 输出（默认: performance 模式开启）"
            echo "  --no-full       关闭 JSON lines 输出"
            echo "  --monitor       启用 Redis/PG 监控（默认: performance 模式开启）"
            echo "  --no-monitor    关闭监控"
            echo "  --users N       创建 N 个用户（覆盖 Profile 默认值）"
            echo "  --stories N     创建 N 个故事（覆盖 Profile 默认值）"
            echo "  --vus N         并发虚拟用户数（覆盖 Profile 默认值）"
            echo "  --duration T    测试持续时间（覆盖 Profile 默认值）"
            echo "  --profile P     测试场景: smoke/daily/peak/overload/endurance/ramp (默认: peak)"
            echo "  --env K=V       设置环境变量（如 --env PROFILE=peak --env DIST=pareto）"
            echo "  --reset         测试前重置数据库环境"
            echo "  --help          显示帮助信息"
            echo ""
            echo "自动生成的报告 (performance 模式):"
            echo "  - summary JSON:     k6 --summary-export 聚合指标"
            echo "  - full JSON lines:  逐请求数据（用于阶段分析）"
            echo "  - monitor JSON:     Redis/PG/Docker 指标"
            echo "  - Markdown 报告:    按阶段 P95、拐点检测、接口趋势"
            echo "  - stage JSON:       结构化的阶段数据"
            echo ""
            echo "示例:"
            echo "  $0 --mode performance --reset --env PROFILE=ramp"
            echo "  $0 --mode performance --profile peak"
            echo "  $0 --mode rate-limit --vus 100 --no-full --no-monitor"
            exit 0
            ;;
        *)
            echo -e "${RED}未知参数: $1${NC}"
            exit 1
            ;;
    esac
done

# 验证测试模式
if [[ "$TEST_MODE" != "performance" && "$TEST_MODE" != "rate-limit" ]]; then
    echo -e "${RED}错误: 无效的测试模式 '$TEST_MODE'${NC}"
    echo "有效模式: performance, rate-limit"
    exit 1
fi

# Rate-limit mode defaults: no full, no monitor
if [[ "$TEST_MODE" == "rate-limit" ]]; then
    DO_FULL=0
    DO_MONITOR=0
fi

# 根据模式设置报告目录和测试脚本
if [[ "$TEST_MODE" == "rate-limit" ]]; then
    REPORT_DIR="tests/k6/test-reports/rate-limit-test"
    TEST_SCRIPT="rate-limit-test.js"
else
    REPORT_DIR="tests/k6/test-reports/performance-test"
    TEST_SCRIPT="stress-test-simple.js"
fi

# 创建报告目录
mkdir -p "$REPORT_DIR"

# 显示测试配置
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}   测试配置${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "  测试模式:    ${GREEN}$TEST_MODE${NC}"
echo -e "  Profile:     ${GREEN}$PROFILE${NC}"
echo -e "  报告目录:    ${GREEN}$REPORT_DIR${NC}"
echo -e "  测试脚本:    ${GREEN}$TEST_SCRIPT${NC}"
echo -e "  重置环境:    ${GREEN}$DO_RESET${NC}"
echo -e "  Full 输出:   ${GREEN}$DO_FULL${NC}"
echo -e "  监控:        ${GREEN}$DO_MONITOR${NC}"

# 重置环境
if [[ "$DO_RESET" == "1" ]]; then
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}   重置测试环境...${NC}"
    echo -e "${YELLOW}========================================${NC}"

    if [[ "$TEST_MODE" == "performance" ]]; then
        echo -e "${BLUE}[INFO] 启动服务器（关闭限流）...${NC}"
        node tests/unit/test-scripts/reset-env.js --no-limit
    else
        echo -e "${BLUE}[INFO] 启动服务器（保留限流）...${NC}"
        node tests/unit/test-scripts/reset-env.js
    fi

    if [[ $? -ne 0 ]]; then
        echo -e "${RED}错误: 环境重置失败${NC}"
        exit 1
    fi

    echo -e "${GREEN}环境重置完成${NC}"
fi

# 设置环境变量
export PROFILE=$PROFILE
export TEST_MODE=$TEST_MODE
export REPORT_DIR=$REPORT_DIR
[ -n "$USER_COUNT" ] && export USER_COUNT=$USER_COUNT
[ -n "$STORY_COUNT" ] && export STORY_COUNT=$STORY_COUNT
[ -n "$LOAD_VUS" ] && export LOAD_VUS=$LOAD_VUS
[ -n "$DURATION" ] && export LOAD_DURATION=$DURATION

# 报告文件名 (内容类型在前，时间戳在后)
SUMMARY_EXPORT="${REPORT_DIR}/${PROFILE}-summary-${TIMESTAMP}.json"
JSON_LINES_EXPORT="${REPORT_DIR}/${PROFILE}-${TIMESTAMP}.json"

echo -e "\n${BLUE}开始 ${TEST_MODE} 测试...${NC}"
echo -e "${YELLOW}Summary 报告: $SUMMARY_EXPORT${NC}"
if [[ "$DO_FULL" == "1" ]]; then
    echo -e "${YELLOW}Full 数据:     $JSON_LINES_EXPORT${NC}"
fi

if [[ "$DO_RESET" == "0" ]]; then
    echo ""
    if [[ "$TEST_MODE" == "performance" ]]; then
        echo -e "${YELLOW}注意: 请确保后端服务器已使用 node src/server.no-limit.js 启动（关闭限流）${NC}"
    else
        echo -e "${YELLOW}注意: 请确保后端服务器已使用 npm run dev 启动（保留限流）${NC}"
    fi
fi

# 启动监控
if [[ "$DO_MONITOR" == "1" ]]; then
    echo -e "\n${BLUE}[MONITOR] 启动 Redis/PG/Docker 监控 (5s 间隔)...${NC}"
    node tests/k6/test-scripts/monitor.cjs 0 5 "" "$REPORT_DIR" &
    MONITOR_PID=$!
    sleep 2
    echo -e "${BLUE}[MONITOR] 运行中 (PID: $MONITOR_PID)，k6 测试结束后自动停止${NC}"
fi

echo ""

# 运行测试
K6_EXIT_CODE=0
echo -e "${YELLOW}运行 ${TEST_SCRIPT}...${NC}"
if [[ "$DO_FULL" == "1" ]]; then
    echo -e "${YELLOW}[INFO] Full mode: 记录逐请求数据用于阶段分析...${NC}"
    k6 run --out json="$JSON_LINES_EXPORT" --summary-export="$SUMMARY_EXPORT" "$SCRIPT_DIR/$TEST_SCRIPT" || K6_EXIT_CODE=$?
else
    k6 run --summary-export="$SUMMARY_EXPORT" "$SCRIPT_DIR/$TEST_SCRIPT" || K6_EXIT_CODE=$?
fi

# 停止监控
if [[ "$DO_MONITOR" == "1" ]] && [[ -n "$MONITOR_PID" ]]; then
    echo -e "\n${BLUE}[MONITOR] 停止监控 (PID: $MONITOR_PID)...${NC}"
    kill $MONITOR_PID 2>/dev/null || true
    wait $MONITOR_PID 2>/dev/null || true
    echo -e "${BLUE}[MONITOR] 已停止${NC}"
fi

# ========================================
#  测试后：自动生成报告
# ========================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}   生成报告...${NC}"
echo -e "${BLUE}========================================${NC}"

if [[ -f "$SUMMARY_EXPORT" ]]; then
    if [[ "$DO_FULL" == "1" ]] && [[ -f "$JSON_LINES_EXPORT" ]]; then
        echo -e "${YELLOW}[REPORT] 执行深度阶段分析...${NC}"
        node tests/k6/test-scripts/parse-report.js "$SUMMARY_EXPORT" "$JSON_LINES_EXPORT" "$REPORT_DIR"
        # 生成图表（parse-report.js 会生成 {profile}-analysis-{timestamp}.json）
        STAGES_JSON="${REPORT_DIR}/${PROFILE}-analysis-${TIMESTAMP}.json"
        if [[ -f "$STAGES_JSON" ]]; then
            echo -e "${YELLOW}[CHARTS] 生成可视化图表...${NC}"
            node tests/k6/test-scripts/plot-stages.js "$STAGES_JSON" "$REPORT_DIR"
        fi
    else
        echo -e "${YELLOW}[REPORT] 生成 summary 报告...${NC}"
        node tests/k6/test-scripts/parse-report.js "$SUMMARY_EXPORT" "$REPORT_DIR"
    fi
else
    echo -e "${YELLOW}[WARNING] 未找到 summary export，跳过报告生成${NC}"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   测试完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  模式:          ${GREEN}$TEST_MODE${NC}"
echo -e "  Profile:       ${GREEN}$PROFILE${NC}"
echo -e "  Summary:       ${GREEN}$SUMMARY_EXPORT${NC}"
if [[ "$DO_FULL" == "1" ]]; then
    echo -e "  Full data:     ${GREEN}$JSON_LINES_EXPORT${NC}"
    echo -e "  Charts:        ${GREEN}(见 $REPORT_DIR/*-charts.html 和 *-analysis.json)${NC}"
fi
if [[ "$DO_MONITOR" == "1" ]]; then
    echo -e "  Monitor:       ${GREEN}(见 $REPORT_DIR/monitor-*.json)${NC}"
fi
echo -e "${GREEN}========================================${NC}"

exit $K6_EXIT_CODE
