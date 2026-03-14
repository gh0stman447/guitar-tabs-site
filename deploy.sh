#!/bin/bash
set -e

git pull
npm install
npm run build
pm2 restart guitar-tabs
