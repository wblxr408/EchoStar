#!/bin/bash

# ============================================
# EchoStar 后端开发环境快速启动脚本
# ============================================

echo ""
echo "============================================"
echo "  EchoStar Backend - 开发环境启动"
echo "============================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js (>= 18.0.0)"
    echo "下载地址: https://nodejs.org/"
    exit 1
fi

echo "[信息] 检测到 Node.js 版本:"
node -v
echo ""

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "[错误] 未检测到 npm"
    exit 1
fi

echo "[信息] 检测到 npm 版本:"
npm -v
echo ""

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "[警告] 未找到 .env 文件"
    echo ""
    echo "请按照以下步骤配置环境:"
    echo "1. 复制 .env.example 为 .env"
    echo "2. 编辑 .env 文件，配置数据库、Redis 等信息"
    echo "3. 详细配置请参考 SETUP_GUIDE.md"
    echo ""
    echo "正在从 .env.example 创建 .env 文件..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "[成功] 已创建 .env 文件，请编辑配置后再运行此脚本"
        exit 1
    else
        echo "[错误] 未找到 .env.example 文件"
        exit 1
    fi
fi

echo "[信息] 环境检查完成"
echo ""

# 检查依赖是否已安装
if [ ! -d node_modules ]; then
    echo "[信息] 未检测到 node_modules，正在安装依赖..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo "[错误] 依赖安装失败"
        exit 1
    fi
    echo ""
    echo "[成功] 依赖安装完成"
    echo ""
fi

echo "[信息] 启动开发服务器..."
echo ""
echo "提示: 按 Ctrl+C 可以停止服务器"
echo ""

# 启动开发服务器
npm run dev
