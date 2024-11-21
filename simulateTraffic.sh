#!/bin/bash

echo "Which environment do you want to target? (prod/local)"
read env

# Set the host based on the user's input
if [ "$env" == "local" ]; then
    host="http://localhost:3000"
elif [ "$env" == "prod" ]; then
    host="https://pizza-service.virtual-pizza.click"
else
    echo "Invalid option. Please choose 'prod' or 'local'."
    exit 1
fi

# Loop to hit the menu every 3 seconds
while true; do
  curl -s "$host/api/order/menu"
  sleep 3
done &

# Loop to send an invalid login every 25 seconds
while true; do
  curl -s -X PUT "$host/api/auth" -d '{"email":"unknown@jwt.com", "password":"bad"}' -H 'Content-Type: application/json'
  sleep 25
done &

# Loop to login and logout two minutes later
while true; do
  response=$(curl -s -X PUT "$host/api/auth" -d '{"email":"f@jwt.com", "password":"franchisee"}' -H 'Content-Type: application/json')
  token=$(echo "$response" | jq -r '.token')
  sleep 110
  curl -s -X DELETE "$host/api/auth" -H "Authorization: Bearer $token"
  sleep 10
done &

# Loop to login, buy a pizza, wait 20 seconds, logout, and wait 30 seconds
while true; do
  response=$(curl -s -X PUT "$host/api/auth" -d '{"email":"d@jwt.com", "password":"diner"}' -H 'Content-Type: application/json')
  token=$(echo "$response" | jq -r '.token')
  curl -s -X POST "$host/api/order" -H 'Content-Type: application/json' -d '{"franchiseId": 1, "storeId": 1, "items": [{"menuId": 1, "description": "Veggie", "price": 0.05}]}' -H "Authorization: Bearer $token"
  sleep 20
  curl -s -X DELETE "$host/api/auth" -H "Authorization: Bearer $token"
  sleep 30
done &
