#!/bin/sh
# Read-only probes of the dreamDEX REST API (staging/testnet + mainnet) for perps coverage and error contract.
B=${BASE_URL:-https://stg.api.dreamdex.io/v0}
p() { echo "=== $1"; curl -s -D - -o "${TMPDIR:-/tmp}/dreamdex-body" "$1" ${2:+-H "$2"} | grep -iE "^(HTTP|error-name|content-type)"; head -c ${3:-600} "${TMPDIR:-/tmp}/dreamdex-body"; echo; }
date -u
p "$B/markets" "" 3000
p "$B/currencies" "" 1500
p "$B/markets/BTC-PERP"
p "$B/markets/BTC:USDso"
p "$B/orderbooks?symbols=BTC-PERP"
p "$B/tickers?symbols=BTC-PERP"
p "$B/tickers"
p "$B/markets/NOPE:USDso/volume"
p "$B/markets/SOMI:USDso/volume?since=-5"
p "$B/markets/SOMI:USDso/volume?since=abc"
p "$B/markets/SOMI:USDso/candles?interval=7m"
p "$B/markets/SOMI:USDso/trades?limit=-1"
p "$B/markets/SOMI:USDso/trades?limit=99999999999999999999"
p "$B/perps"
p "$B/perp/markets"
