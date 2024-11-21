# #!/bin/bash

# # Loop from 1 to 100
# for i in {1..100}; do
#   # Randomly set level to either "warn" or "info"
#   if (( RANDOM % 2 )); then
#     level="warn"
#   else
#     level="info"
#   fi

#   # Send the POST request with curl
#   curl -X POST \
#     -H "Content-Type: application/json" \
#     -H "Authorization: Bearer " \
#     -d '{"streams": [{"stream": {"component":"jwt-pizza-service", "level": "'"$level"'", "type":"http-req"},
#          "values": [["'"$(($(date +%s)*1000000000))"'", "{\"name\":\"hacker\", \"email\":\"d@jwt.com\", \"password\":\"****\"}", {"user_id": "44","traceID": "9bc86924d069e9f8ccf09192763f1120"}]]}]}' \
#     https://logs-prod-006.grafana.net/loki/api/v1/push

#   # Print a message at the end of each loop iteration
#   echo "Iteration $i completed with level: $level"

#   # Wait for 2 seconds before the next iteration
#   sleep 2
# done

#!/bin/bash

# Set the API endpoint and credentials
log_url="https://logs-prod-006.grafana.net/loki/api/v1/query"
auth_header="Authorization: Bearer"

# Define the query to filter logs by component
query='{component="jwt-pizza-service"}'

# Make the curl request to query the logs
response=$(curl -s -G -H "Content-Type: application/json" -H "$auth_header" --data-urlencode "query=$query" "$log_url")

# Print the response
echo "Query result:"
echo "$response"
