const fs = require('fs');

// Load the exported JSON
const data = JSON.parse(fs.readFileSync('/Users/yogeshkorke/Downloads/tinderApp.users.json'));

// Transform to an array of string IDs
const userIds = data.map(user => user._id.$oid);

// Save the transformed data
fs.writeFileSync('/Users/yogeshkorke/Downloads/userIdsArray.json', JSON.stringify(userIds, null, 2));

console.log('User IDs transformed and saved successfully');
