#!/bin/bash

# Ask the user for the environment
echo "Which environment do you want to target? (prod/local)"
read env

# Set the host based on the user's input
if [ "$env" == "local" ]; then
    host="http://localhost:3000"
elif [ "$env" == "prod" ]; then
    host="https://pizza-pi.click"
else
    echo "Invalid option. Please choose 'prod' or 'local'."
    exit 1
fi

# Log in as admin
echo "Logging in as admin..."
response=$(curl -s -X PUT $host/api/auth -d '{"email":"a@jwt.com", "password":"admin"}' -H 'Content-Type: application/json')

# Extract the token from the response
token=$(echo $response | jq -r '.token')

if [ "$token" == "null" ]; then
    echo "Failed to log in. Response: $response"
    exit 1
fi

echo "Admin login successful. Token: $token"

# Add users
echo "Adding users..."
curl -X POST $host/api/auth -d '{"name":"pizza diner", "email":"d@jwt.com", "password":"diner"}' -H 'Content-Type: application/json'
curl -X POST $host/api/auth -d '{"name":"pizza franchisee", "email":"f@jwt.com", "password":"franchisee"}' -H 'Content-Type: application/json'

# Add menu items
echo "Adding menu items..."
curl -X PUT $host/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Veggie", "description": "A garden of delight", "image":"pizza1.png", "price": 0.0038 }'  -H "Authorization: Bearer $token"
curl -X PUT $host/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Pepperoni", "description": "Spicy treat", "image":"pizza2.png", "price": 0.0042 }'  -H "Authorization: Bearer $token"
curl -X PUT $host/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Margarita", "description": "Essential classic", "image":"pizza3.png", "price": 0.0042 }'  -H "Authorization: Bearer $token"
curl -X PUT $host/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Crusty", "description": "A dry mouthed favorite", "image":"pizza4.png", "price": 0.0028 }'  -H "Authorization: Bearer $token"
curl -X PUT $host/api/order/menu -H 'Content-Type: application/json' -d '{ "title":"Charred Leopard", "description": "For those with a darker side", "image":"pizza5.png", "price": 0.0099 }'  -H "Authorization: Bearer $token"

# Add franchise
echo "Adding franchise..."
curl -X POST $host/api/franchise -H 'Content-Type: application/json' -d '{"name": "pizzaPocket", "admins": [{"email": "f@jwt.com"}]}'  -H "Authorization: Bearer $token"

# Add store
echo "Adding store..."
curl -X POST $host/api/franchise/1/store -H 'Content-Type: application/json' -d '{"franchiseId": 1, "name":"SLC"}'  -H "Authorization: Bearer $token"

echo "Script execution completed."
