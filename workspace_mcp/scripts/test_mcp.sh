#!/usr/bin/env bash

################################################################
# Script de test du Workspace MCP
# Teste les endpoints principaux du serveur
################################################################

set -e

BASE_URL="http://localhost:3100"

echo "🧪 Test du Workspace MCP Server..."
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_passed=0
test_failed=0

# Fonction de test
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/mcp_test_response.json "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" -o /tmp/mcp_test_response.json "$BASE_URL$endpoint")
    fi

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((test_passed++))
        cat /tmp/mcp_test_response.json | jq '.' 2>/dev/null || cat /tmp/mcp_test_response.json
        echo ""
    else
        echo -e "${RED}✗ FAIL (HTTP $response)${NC}"
        ((test_failed++))
        cat /tmp/mcp_test_response.json
        echo ""
    fi
}

# Vérifier que le serveur tourne
echo "Vérification que le serveur MCP tourne..."
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Le serveur MCP ne répond pas sur $BASE_URL${NC}"
    echo "Démarrez-le avec: npm start"
    exit 1
fi

echo -e "${GREEN}✓ Serveur MCP opérationnel${NC}"
echo ""

# Tests
test_endpoint "Health Check" "GET" "/health"
test_endpoint "List Tools" "GET" "/tools"
test_endpoint "Stats" "GET" "/stats"
test_endpoint "Server System Info" "POST" "/tools/call" '{"name":"server_get_system_info","arguments":{}}'
test_endpoint "Server Health Check" "POST" "/tools/call" '{"name":"server_health_check","arguments":{}}'

# Résumé
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Tests terminés:"
echo -e "  ${GREEN}Passed: $test_passed${NC}"
echo -e "  ${RED}Failed: $test_failed${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Cleanup
rm -f /tmp/mcp_test_response.json

if [ $test_failed -gt 0 ]; then
    exit 1
fi

echo -e "\n${GREEN}✅ Tous les tests sont passés !${NC}"
