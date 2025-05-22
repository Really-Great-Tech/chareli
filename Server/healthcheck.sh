#!/bin/sh
exec wget -q --spider http://localhost:3000/health || exit 1
