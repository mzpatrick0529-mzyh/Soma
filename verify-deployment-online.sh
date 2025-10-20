#!/bin/bash

# 部署验证脚本
# 用于检查部署后的应用是否正常运行

FRONTEND_URL=${1:-"http://localhost"}
BACKEND_URL=${2:-"http://localhost:8787"}

echo "🔍 Soma 部署验证"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "前端 URL: $FRONTEND_URL"
echo "后端 URL: $BACKEND_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_url() {
    local url=$1
    local name=$2
    local expected_code=${3:-200}
    
    echo -n "检查 $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 10)
    
    if [ "$response" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ 成功${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗ 失败${NC} (HTTP $response, 期望 $expected_code)"
        return 1
    fi
}

check_api() {
    local url=$1
    local name=$2
    
    echo -n "检查 $name... "
    
    response=$(curl -s "$url" --max-time 10)
    
    if echo "$response" | grep -q "ok\|success\|true"; then
        echo -e "${GREEN}✓ API 响应正常${NC}"
        return 0
    else
        echo -e "${RED}✗ API 响应异常${NC}"
        echo "响应: $response"
        return 1
    fi
}

# 计数器
passed=0
failed=0

# 1. 检查前端
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "前端检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if check_url "$FRONTEND_URL" "首页"; then
    ((passed++))
else
    ((failed++))
fi

if check_url "$FRONTEND_URL/robots.txt" "robots.txt"; then
    ((passed++))
else
    ((failed++))
fi

if check_url "$FRONTEND_URL/sitemap.xml" "sitemap.xml"; then
    ((passed++))
else
    ((failed++))
fi

# 2. 检查后端
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "后端检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if check_url "$BACKEND_URL/health" "健康检查"; then
    ((passed++))
else
    ((failed++))
fi

if check_api "$BACKEND_URL/api/self-agent/provider-info" "Provider 信息"; then
    ((passed++))
else
    ((failed++))
fi

# 3. 检查 API 连接
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "API 连接检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 从前端访问后端 API（通过代理）
if check_url "$FRONTEND_URL/api/health" "前端→后端代理" 200; then
    ((passed++))
else
    echo -e "${YELLOW}⚠️  如果是 Vercel 部署，请检查 vercel.json 中的 rewrites 配置${NC}"
    ((failed++))
fi

# 4. 性能检查
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "性能检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "测试首页加载时间... "
load_time=$(curl -o /dev/null -s -w '%{time_total}\n' "$FRONTEND_URL")
echo -e "${GREEN}${load_time}s${NC}"

if (( $(echo "$load_time < 2.0" | bc -l) )); then
    echo -e "${GREEN}✓ 加载速度优秀${NC}"
    ((passed++))
elif (( $(echo "$load_time < 5.0" | bc -l) )); then
    echo -e "${YELLOW}⚠️  加载速度一般${NC}"
    ((passed++))
else
    echo -e "${RED}✗ 加载速度较慢${NC}"
    ((failed++))
fi

# 5. 总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "验证总结"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "通过: ${GREEN}$passed${NC}"
echo -e "失败: ${RED}$failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}🎉 所有检查通过！应用已成功部署${NC}"
    exit 0
else
    echo -e "${RED}❌ 有 $failed 项检查失败，请查看上方日志${NC}"
    exit 1
fi
