#!/bin/bash

CHROME_BIN="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
APP_NAME=taskbarApp
APP_DIR=`pwd`/app
PEM_FILE=`pwd`/$APP_NAME.pem

echo "Packing $APP_NAME"
"$CHROME_BIN" --enable-apps --pack-extension=$APP_DIR --pack-extension-key=$PEM_FILE
