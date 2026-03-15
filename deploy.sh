#!/bin/bash
set -e

git pull
rm -rf node_modules .next
npm ci
npm run build
pm2 restart guitar-tabs
