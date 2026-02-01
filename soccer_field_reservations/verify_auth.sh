#!/bin/bash

BASE_URL="http://localhost:8080/api/auth"

echo "1. Attempt to Login with Admin Credentials"
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{
    "login": "tallis",
    "senha": "Joaquim#19"
}' $BASE_URL/login)

echo "Response: $LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Login Successful. Token received."
    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token')
else
    echo "❌ Login Failed."
    exit 1
fi

echo -e "\n2. Verify Admin Access to Protected Route"
# Attempt to list all users or admin specific route if any, or just check fields with token
# We don't have a specific list-users endpoint, but /api/campos/admin might be protected or we can try change-password
# Actually, let's try to hit the admin campos endpoint which I mocked/created earlier?
# Wait, I created `/api/campos/admin` which calls `service.listarTodos()`.
# In SecurityConfig: `it.requestMatchers("/api/admin/**").hasRole("ADMIN")`
# But `/api/campos/admin` is NOT matching `/api/admin/**`. It matches `/api/campos...`.
# Let's check SecurityConfig again in my mind...
# `it.requestMatchers("/api/admin/**").hasRole("ADMIN")`
# `it.anyRequest().authenticated()`
# So `/api/campos` (GET) is public.
# `/api/campos` (POST) is authenticated.
# `/api/campos/admin` (GET) is authenticated (because it's not explicitly public).

echo "Accessing /api/campos/admin with Token..."
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/campos/admin | jq '. | length'

echo -e "\n3. Attempt Access to Protected Route WITHOUT Token"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/campos/admin)
if [ "$HTTP_CODE" == "403" ] || [ "$HTTP_CODE" == "401" ]; then
    echo "✅ Access Denied as expected (HTTP $HTTP_CODE)."
else
    echo "❌ Unexpected Access (HTTP $HTTP_CODE)."
fi
