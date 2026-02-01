#!/bin/bash

BASE_URL="http://localhost:8080/api"

echo "1. Verify Public Access Denied (Reservations)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/reservas)
if [ "$HTTP_CODE" == "403" ] || [ "$HTTP_CODE" == "401" ]; then
    echo "✅ /api/reservas is PROTECTED (HTTP $HTTP_CODE)."
else
    echo "❌ /api/reservas is PUBLIC (HTTP $HTTP_CODE) - FAIL"
fi

echo -e "\n2. Verify Public Access Denied (Campos)"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET $BASE_URL/campos)
if [ "$HTTP_CODE" == "403" ] || [ "$HTTP_CODE" == "401" ]; then
    echo "✅ /api/campos is PROTECTED (HTTP $HTTP_CODE)."
else
    echo "❌ /api/campos is PUBLIC (HTTP $HTTP_CODE) - FAIL"
fi

echo -e "\n3. Login (Admin)"
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{
    "login": "tallis",
    "senha": "Joaquim#19"
}' $BASE_URL/auth/login)
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')

if [ "$TOKEN" != "null" ]; then
    echo "✅ Login Successful."
else
    echo "❌ Login Failed."
    exit 1
fi

echo -e "\n4. Verify Access WITH Token"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" $BASE_URL/campos)
if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Authenticated Access Successful (HTTP 200)."
else
    echo "❌ Authenticated Access Failed (HTTP $HTTP_CODE)."
fi
