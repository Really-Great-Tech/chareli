#!/bin/sh
set -xe
# simple should expand later
exec wget -q --spider http://localhost:3000/health || exit 1
