# Using default shell; no shebang

# Check if brew is installed
brew=$(which -s brew)
echo "$brew"
if [ -z "$brew" ]; then
      echo "Please install Brew First"
      exit 1
fi

# brew update && brew install vegeta


echo 'GET http://localhost:80/photo/97b72fb0-a84a-11e6-bf37-6d2c86545d91' | \
    vegeta attack --rate=300 -duration 5m | vegeta encode | \
    jaggr @count=rps \
          hist\[100,200,300,400,500\]:code \
          p25,p50,p95:latency \
          sum:bytes_in \
          sum:bytes_out | \
    jplot rps+code.hist.100+code.hist.200+code.hist.300+code.hist.400+code.hist.500 \
          latency.p95+latency.p50+latency.p25 \
          bytes_in.sum+bytes_out.sum

