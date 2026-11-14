#!/bin/sh
# usage: api-gql.sh '<graphql query>'  -> POSTs to the Hideki testnet indexer
G=${INDEXER:-https://hideki-dev.smk.somnia.host/v1/graphql}
curl -s "$G" -H 'content-type: application/json' --data "$(python3 -c 'import json,sys;print(json.dumps({"query":sys.argv[1]}))' "$1")"
