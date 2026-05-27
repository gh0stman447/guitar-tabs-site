#!/bin/bash
set -e

git fetch origin
git checkout main
git pull origin main

rm -rf node_modules .next
npm ci
npm run build
pm2 restart olegguitar



# #!/bin/bash
# set -e

# git pull
# rm -rf node_modules .next
# npm ci
# npm run build
# pm2 restart olegguitar
