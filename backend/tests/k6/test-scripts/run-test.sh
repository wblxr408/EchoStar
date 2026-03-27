#!/bin/bash
# EchoStar k6 压力测试运行脚本
# 使用方法: ./run-test.sh --mode rate-limit|performance [options]

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$BACKEND_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_MODE="performance"

# 默认参数
USER_COUNT=${USER_COUNT:-100}
STORY_COUNT=${STORY_COUNT:-500}
LOAD_VUS=${LOAD_VUS:-50}
DURATION=${DURATION:-"2m"}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   EchoStar 后端压力测试${NC}"
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
        --help)
            echo "使用方法: $0 --mode rate-limit|performance [options]"
            echo ""
            echo "测试模式:"
            echo "  --mode performance  性能测试（关闭限流，测试后端大流量性能）[默认]"
            echo "  --mode rate-limit   限流测试（保留限流，验证限流功能正确性）"
            echo ""
            echo "选项:"
            echo "  --users N     创建 N 个用户（默认: 100）"
            echo "  --stories N   创建 N 个故事（默认: 500）"
            echo "  --vus N       并发虚拟用户数（默认: 50）"
            echo "  --duration T  测试持续时间（默认: 2m）"
            echo "  --reset       测试前重置数据库环境"
            echo "  --help        显示帮助信息"
            echo ""
            echo "示例:"
            echo "  $0 --mode performance --reset"
            echo "  $0 --mode rate-limit --vus 100"
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
echo -e "  用户数量:    ${GREEN}$USER_COUNT${NC}"
echo -e "  故事数量:    ${GREEN}$STORY_COUNT${NC}"
echo -e "  并发用户:    ${GREEN}$LOAD_VUS${NC}"
echo -e "  测试时长:    ${GREEN}$DURATION${NC}"
echo -e "  报告目录:    ${GREEN}$REPORT_DIR${NC}"
echo -e "  测试脚本:    ${GREEN}$TEST_SCRIPT${NC}"
echo -e "  重置环境:    ${GREEN}$DO_RESET${NC}"

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
export USER_COUNT=$USER_COUNT
export STORY_COUNT=$STORY_COUNT
export LOAD_VUS=$LOAD_VUS
export LOAD_DURATION=$DURATION
export TEST_MODE=$TEST_MODE
export REPORT_DIR=$REPORT_DIR

# 报告文件名
JSON_REPORT="${REPORT_DIR}/stress-test-${TIMESTAMP}.json"
SUMMARY_REPORT="${REPORT_DIR}/stress-test-${TIMESTAMP}-summary.txt"
SUMMARY_EXPORT="${REPORT_DIR}/stress-test-${TIMESTAMP}-summary.json"

echo -e "\n${BLUE}开始 ${TEST_MODE} 测试...${NC}"
echo -e "${YELLOW}报告将保存到: $SUMMARY_EXPORT${NC}"

if [[ "$DO_RESET" == "0" ]]; then
    echo ""
    if [[ "$TEST_MODE" == "performance" ]]; then
        echo -e "${YELLOW}注意: 请确保后端服务器已使用 node src/server.no-limit.js 启动（关闭限流）${NC}"
    else
        echo -e "${YELLOW}注意: 请确保后端服务器已使用 npm run dev 启动（保留限流）${NC}"
    fi
fi

echo ""

# 运行测试
echo -e "${YELLOW}运行 ${TEST_SCRIPT}...${NC}"
k6 run --summary-export="$SUMMARY_EXPORT" "$SCRIPT_DIR/$TEST_SCRIPT" | tee "$SUMMARY_REPORT"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   测试完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "  模式:     ${GREEN}$TEST_MODE${NC}"
echo -e "  JSON报告: ${GREEN}$SUMMARY_EXPORT${NC}"
echo -e "  摘要报告: ${GREEN}$SUMMARY_REPORT${NC}"
echo -e "${GREEN}========================================${NC}"

# 提示生成 HTML 报告
echo -e "\n${YELLOW}提示: 可以使用 k6-reporter 生成 HTML 报告:${NC}"
echo -e "  npx k6-reporter $JSON_REPORT"
