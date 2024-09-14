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

response=$(curl -s -X PUT $host/api/auth -d '{"email":"a@jwt.com", "password":"admin"}' -H 'Content-Type: application/json')
token=$(echo $response | jq -r '.token')
echo ${response}
echo ${token}