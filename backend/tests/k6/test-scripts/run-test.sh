#!/bin/bash
# EchoStar k6 压力测试运行脚本
# 使用方法: ./run-test.sh [options]

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
REPORT_DIR="tests/k6/test-reports"
TEST_TYPE="simple"

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

# 创建报告目录
mkdir -p "$REPORT_DIR"

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        --full)
            TEST_TYPE="full"
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
            echo "使用方法: $0 [options]"
            echo ""
            echo "选项:"
            echo "  --full        运行完整压力测试（包含大量数据创建）"
            echo "  --users N     创建 N 个用户（默认: 100）"
            echo "  --stories N   创建 N 个故事（默认: 500）"
            echo "  --vus N       并发虚拟用户数（默认: 50）"
            echo "  --duration T  测试持续时间（默认: 2m）"
            echo "  --help        显示帮助信息"
            exit 0
            ;;
        *)
            echo -e "${RED}未知参数: $1${NC}"
            exit 1
            ;;
    esac
done

# 显示测试配置
echo -e "\n${YELLOW}测试配置:${NC}"
echo -e "  测试类型: ${GREEN}$TEST_TYPE${NC}"
echo -e "  用户数量: ${GREEN}$USER_COUNT${NC}"
echo -e "  故事数量: ${GREEN}$STORY_COUNT${NC}"
echo -e "  并发用户: ${GREEN}$LOAD_VUS${NC}"
echo -e "  测试时长: ${GREEN}$DURATION${NC}"
echo -e "  报告目录: ${GREEN}$REPORT_DIR${NC}"

# 设置环境变量
export USER_COUNT=$USER_COUNT
export STORY_COUNT=$STORY_COUNT
export LOAD_VUS=$LOAD_VUS
export LOAD_DURATION=$DURATION

# 报告文件名
JSON_REPORT="${REPORT_DIR}/stress-test-${TIMESTAMP}.json"
SUMMARY_REPORT="${REPORT_DIR}/stress-test-${TIMESTAMP}-summary.txt"

echo -e "\n${BLUE}开始测试...${NC}"
echo -e "${YELLOW}报告将保存到: $JSON_REPORT${NC}"
echo ""

# 运行测试
if [ "$TEST_TYPE" == "full" ]; then
    echo -e "${YELLOW}运行完整压力测试...${NC}"
    k6 run \
        --out json="$JSON_REPORT" \
        "$SCRIPT_DIR/stress-test.js" \
        | tee "$SUMMARY_REPORT"
else
    echo -e "${YELLOW}运行简化压力测试...${NC}"
    k6 run \
        --out json="$JSON_REPORT" \
        "$SCRIPT_DIR/stress-test-simple.js" \
        | tee "$SUMMARY_REPORT"
fi

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}   测试完成!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${BLUE}报告文件:${NC}"
echo -e "  JSON 报告: ${GREEN}$JSON_REPORT${NC}"
echo -e "  摘要报告: ${GREEN}$SUMMARY_REPORT${NC}"

# 提示生成 HTML 报告
echo -e "\n${YELLOW}提示: 可以使用 k6-reporter 生成 HTML 报告:${NC}"
echo -e "  npx k6-reporter $JSON_REPORT"
