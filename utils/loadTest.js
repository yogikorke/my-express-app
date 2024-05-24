import http from 'k6/http';
import { sleep } from 'k6';
import { SharedArray } from 'k6/data';

// Load the user IDs from the JSON file
const userIds = new SharedArray('user ids', function() {
  return JSON.parse(open('./userIdsArray.json'));
});

export let options = {
  stages: [
    { duration: '1m', target: 1000 },  // Ramp-up to 1000 users over 1 minutes
    { duration: '1m', target: 5000 },  // Ramp-up to 5000 users over the next 1 minutes
    { duration: '1m', target: 10000 }, // Ramp-up to 10000 users over the next 1 minutes
    { duration: '1m', target: 10000 }, // Hold at 10000 users for 1 minutes
    { duration: '1m', target: 0 }, // Ramp-down to 0 users over 5 minutes
  ],
};

export default function () {
  // Select a random user ID from the array
  const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
  
  // Make the HTTP GET request with the random user ID
  http.get(`http://localhost:1234/users?userId=${randomUserId}&minAge=25&maxAge=35&gender=female&lon=12.4924&lat=41.8902&page=1&pageSize=20`);
  
  // Each user makes a request every 2 seconds
  sleep(2);
}
