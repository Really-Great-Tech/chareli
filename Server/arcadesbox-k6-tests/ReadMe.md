running codes
//k6 run -e ENV=production main.js

//Smoke Load (Validation)
k6 run main.js \
-e ENV=production \
-e GAME_ID=c3be2491-33a7-4157-9e9d-1b61fc264119 \
-e GAME_NAME=sand-worm \
-e USER_EMAIL=aabbeyjr456@gmail.com \
-e USER_PASSWORD=48suma@ASU \
-e GUEST_VUS=50 \
-e LOGGED_VUS=10 \
-e DURATION=2m

//3k guest users + 200 logged-in users
k6 run main.js \
-e ENV=production \
-e GAME_ID=c3be2491-33a7-4157-9e9d-1b61fc264119 \
-e GAME_NAME=sand-worm \
-e USER_EMAIL=aabbeyjr456@gmail.com \
-e USER_PASSWORD=48suma@ASU \
-e GUEST_VUS=3000 \
-e LOGGED_VUS=200 \
-e DURATION=5m

//5k guest users + 500 logged-in users
k6 run main.js \
-e ENV=production \
-e GAME_ID=c3be2491-33a7-4157-9e9d-1b61fc264119 \
-e GAME_NAME=sand-worm \
-e USER_EMAIL=aabbeyjr456@gmail.com \
-e USER_PASSWORD=48suma@ASU \
-e GUEST_VUS=5000 \
-e LOGGED_VUS=500 \
-e DURATION=5m

//3k logged-in users + 200 guest users
k6 run main.js \
-e ENV=production \
-e GAME_ID=c3be2491-33a7-4157-9e9d-1b61fc264119 \
-e GAME_NAME=sand-worm \
-e USER_EMAIL=aabbeyjr456@gmail.com \
-e USER_PASSWORD=48suma@ASU \
-e GUEST_VUS=200 \
-e LOGGED_VUS=3000 \
-e DURATION=5m

//5k logged-in users + 500 guest users
k6 run main.js \
-e ENV=production \
-e GAME_ID=c3be2491-33a7-4157-9e9d-1b61fc264119 \
-e GAME_NAME=sand-worm \
-e USER_EMAIL=aabbeyjr456@gmail.com \
-e USER_PASSWORD=48suma@ASU \
-e GUEST_VUS=500 \
-e LOGGED_VUS=5000 \
-e DURATION=5m

||========================================================||
// 3k loggedin user
k6 run loggedin-main.js \
-e ENV=production \
-e GAME_ID=c3be2491-33a7-4157-9e9d-1b61fc264119 \
-e GAME_NAME=sand-worm \
-e USER_EMAIL=aabbeyjr456@gmail.com \
-e USER_PASSWORD=48suma@ASU \
-e LOGGED_VUS=3000 \
-e DURATION=5m

// 5k loggedin user
k6 run loggedin-main.js \
-e ENV=production \
-e GAME_ID=b47b7048-edfd-4dc1-828f-951c69f50dc3 \
-e GAME_NAME=sand-worm \
-e USER_EMAIL=aabbeyjr456@gmail.com \
-e USER_PASSWORD=48suma@ASU \
-e LOGGED_VUS=5000 \
-e DURATION=5m

// 3k guest user
k6 run guest-main.js \
-e ENV=production \
-e GAME_ID=b47b7048-edfd-4dc1-828f-951c69f50dc3 \
-e GAME_NAME=sand-worm \
-e USER_EMAIL=aabbeyjr456@gmail.com \
-e USER_PASSWORD=48suma@ASU \
-e GUEST_VUS=3000 \
-e DURATION=5m

// 5k guest user
k6 run guest-main.js \
-e ENV=production \
-e GAME_ID=c3be2491-33a7-4157-9e9d-1b61fc264119 \
-e GAME_NAME=sand-worm \
-e USER_EMAIL=aabbeyjr456@gmail.com \
-e USER_PASSWORD=48suma@ASU \
-e GUEST_VUS=5000 \
-e DURATION=5m

|| =============================||
k6 run homePage-main.js \
-e ENV=production \
-e USER_VU=1000 \
-e DURATION=5m

k6 run gameLaunchmain.js \
-e ENV=production \
-e GAME_ID=c3be2491-33a7-4157-9e9d-1b61fc264119 \
-e GAME_NAME=sand-worm \
-e USER_VU=1000 \
-e DURATION=5m

k6 run login-main.js \
-e ENV=production \
-e USER_EMAIL=aabbeyjr456@gmail.com \
-e USER_PASSWORD=48suma@ASU \
-e USER_VU=1000 \
-e DURATION=5m

k6 run analytics-main.js \
-e ENV=production \
-e GAME_ID=c3be2491-33a7-4157-9e9d-1b61fc264119 \
-e GAME_NAME=sand-worm \
-e USER_VU=10 \
-e DURATION=5m
