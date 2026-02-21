#!/usr/bin/env bash
set -eo pipefail

# Allocate parties and create ledger API users via the v2 HTTP JSON API.
# Based on canton-open-source-3.4.10/examples/09-json-api/utils.sh

API_HOST="${API_HOST:-localhost}"
API_PORT="${API_PORT:-7575}"
API_BASE="http://$API_HOST:$API_PORT"

curl_check() {
  local url=$1
  local contentType=${2:-application/json}
  shift 2

  local args=("$@")

  response=$(curl -s -S -w "\n%{http_code}" "$url" \
      -H "Content-Type: $contentType" \
      "${args[@]}"
      )

  local httpCode=$(echo "$response" | tail -n1 | tr -d '\r')
  local responseBody=$(echo "$response" | sed '$d')

  if [ "$httpCode" -ne "200" ]; then
    echo "  ERROR: HTTP $httpCode - $responseBody" >&2
    return 1
  fi

  echo "$responseBody"
}

get_participant_namespace() {
  curl_check "$API_BASE/v2/parties/participant-id" "application/json" |
    jq -r .participantId | sed 's/^[^:]*:://'
}

get_user_party() {
  local user=$1
  curl_check "$API_BASE/v2/users/$user" "application/json" 2>/dev/null | jq -r .user.primaryParty
}

allocate_party() {
  local partyIdHint=$1

  # Check if party already exists
  local party
  party=$(curl_check "$API_BASE/v2/parties/party?parties=$partyIdHint::$NAMESPACE" "application/json" 2>/dev/null |
    jq -r '.partyDetails[0].party') || party=""

  if [ -n "$party" ] && [ "$party" != "null" ]; then
    echo "  Party $partyIdHint already exists" >&2
    echo "$party"
    return
  fi

  # Create new party
  curl_check "$API_BASE/v2/parties" "application/json" \
    --data-raw '{
      "partyIdHint": "'$partyIdHint'",
      "identityProviderId": ""
    }' | jq -r .partyDetails.party
}

allocate_party_and_create_user() {
  local userId=$1

  # Check if user already exists
  local party
  party=$(get_user_party "$userId" 2>/dev/null) || party=""
  if [ -n "$party" ] && [ "$party" != "null" ]; then
    echo "  User $userId already exists -> $party"
    return
  fi

  # Allocate party
  echo "  Allocating party: $userId"
  party=$(allocate_party "$userId")

  if [ -z "$party" ] || [ "$party" = "null" ]; then
    echo "  ERROR: Failed to allocate party for $userId" >&2
    return 1
  fi

  # Create user
  echo "  Creating user: $userId -> $party"
  curl_check "$API_BASE/v2/users" "application/json" \
    --data-raw '{
      "user": {
        "id": "'$userId'",
        "primaryParty": "'$party'",
        "isDeactivated": false,
        "identityProviderId": ""
      },
      "rights": [
        {
          "kind": {
            "CanActAs": {
              "value": {
                "party": "'$party'"
              }
            },
            "CanReadAs": {
              "value": {
                "party": "'$party'"
              }
            }
          }
        }
      ]
    }' | jq -r .user.primaryParty > /dev/null
}

# Wait for the API to be ready
echo "=== Waiting for Canton JSON API ==="
until curl_check "$API_BASE/v2/parties/participant-id" "application/json" > /dev/null 2>&1; do
  echo "  Waiting for JSON API..."
  sleep 3
done

NAMESPACE=$(get_participant_namespace)
echo "  Participant namespace: $NAMESPACE"

# Wait for the synchronizer to be connected (party allocation fails without it)
echo "  Waiting for synchronizer connection..."
until curl -s "$API_BASE/v2/parties" \
  -H "Content-Type: application/json" \
  --data-raw '{"partyIdHint": "healthcheck", "identityProviderId": ""}' 2>/dev/null | \
  jq -e '.partyDetails.party' > /dev/null 2>&1; do
  sleep 3
done
echo "  Synchronizer connected."

# Default parties
DEFAULT_PARTIES="Operator Alice Bob DrSmith DrJones PharmaCorp LabCorp Auditor"

# Use command-line args if provided, otherwise use defaults
# Usage: ./setup-parties.sh [party1 party2 ...]
if [ $# -gt 0 ]; then
  PARTIES="$*"
else
  PARTIES="$DEFAULT_PARTIES"
fi

echo "=== Allocating parties and creating users ==="
for name in $PARTIES; do
  allocate_party_and_create_user "$name"
done

echo "=== Party and user setup complete ==="
