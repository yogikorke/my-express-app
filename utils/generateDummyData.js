const { MongoClient } = require('mongodb');
const faker = require('faker');
const { ObjectId } = require('mongodb');

async function generateDummyData() {
  const client = new MongoClient('mongodb://localhost:27017', { useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db('tinderApp');

    // Drop existing collections if they exist
    console.log('Dropping existing collections...');
    await db.collection('users').drop().catch(() => {});
    await db.collection('interactions').drop().catch(() => {});
    await db.collection('blocks').drop().catch(() => {});

    console.log('Generating users...');
    // Generate Users
    const users = [];
    for (let i = 0; i < 30000; i++) {
      users.push({
        name: faker.name.findName(),
        age: faker.datatype.number({ min: 18, max: 60 }),
        gender: faker.random.arrayElement(['male', 'female', 'other']),
        location: {
          type: 'Point',
          coordinates: [parseFloat(faker.address.longitude()), parseFloat(faker.address.latitude())]
        }
      });
    }
    await db.collection('users').insertMany(users);
    console.log('Users generated and inserted.');

    console.log('Generating interactions...');
    // Generate Interactions
    const interactions = [];
    for (let i = 0; i < 3000000; i++) {
      interactions.push({
        fromUserId: users[faker.datatype.number({ min: 0, max: users.length - 1 })]._id,
        toUserId: users[faker.datatype.number({ min: 0, max: users.length - 1 })]._id,
        type: faker.random.arrayElement(['like', 'superlike', 'dislike']),
        timestamp: faker.date.past()
      });
    }
    await db.collection('interactions').insertMany(interactions);
    console.log('Interactions generated and inserted.');

    console.log('Generating blocks...');
    // Generate Blocks
    const blocks = [];
    for (let i = 0; i < 10000; i++) {
      blocks.push({
        blockerId: users[faker.datatype.number({ min: 0, max: users.length - 1 })]._id,
        blockedId: users[faker.datatype.number({ min: 0, max: users.length - 1 })]._id,
        timestamp: faker.date.past()
      });
    }
    await db.collection('blocks').insertMany(blocks);
    console.log('Blocks generated and inserted.');

    console.log('Dummy data generated successfully');
  } catch (error) {
    console.error('Error generating dummy data:', error);
  } finally {
    await client.close();
  }
}

generateDummyData().catch(console.error);
