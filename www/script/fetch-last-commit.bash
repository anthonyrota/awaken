curl https://api.github.com/repos/anthonyrota/awaken/commits/master \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['sha'])"