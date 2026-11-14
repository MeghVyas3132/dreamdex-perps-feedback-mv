#!/bin/sh
# Read-only probes of the dreamDEX REST API (staging/testnet + mainnet) for perps coverage and error contract.
B=${BASE_URL:-https://stg.api.dreamdex.io/v0}
p() { echo "=== $1"; curl -s -D - -o /tmp/claude-501/-Users-meghvyas-Desktop-Larp/8942c846-e668-47ff-8614-fbd2b936c989/scratchpad/body "$1" ${2:+-H "$2"} | grep -iE "^(HTTP|error-name|content-type)"; head -c ${3:-600} /tmp/claude-501/-Users-meghvyas-Desktop-Larp/8942c846-e668-47ff-8614-fbd2b936c989/scratchpad/body; echo; }
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
