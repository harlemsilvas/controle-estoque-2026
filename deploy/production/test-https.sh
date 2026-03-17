#!/bin/bash
# Quick test script

echo "===== HTTPS Configuration Test ====="
echo ""

# Test 1: Frontend
echo "1️⃣ Frontend (https://estoque.local):"
curl -s -o /dev/null -w "   Status: %{http_code}\n" https://estoque.local

# Test 2: API Docs  
echo ""
echo "2️⃣ API Docs (https://estoque.local/api-docs):"
curl -s -o /dev/null -w "   Status: %{http_code}\n" https://estoque.local/api-docs

# Test 3: Backend direct
echo ""
echo "3️⃣ Backend direct (http://localhost:3000/api-docs):"
curl -s -o /dev/null -w "   Status: %{http_code}\n" http://localhost:3000/api-docs

echo ""
echo "✅ Test complete - Check browser F12 Network tab for Mixed Content errors"
