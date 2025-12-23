export const thresholds = {
  'http_req_duration{type:homepage}': ['p(95)<4000'],       // 95% requests < 1s
  'http_req_duration{type:login}': ['p(95)<4000'],
  'http_req_duration{type:game_launch}': ['p(95)<4000'],
  'http_req_duration{type:analytics}': ['p(95)<4000'],
  'http_req_failed': ['rate<0.01'],                         // <1% errors
};
