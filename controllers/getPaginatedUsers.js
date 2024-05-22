const { ObjectId } = require('mongodb');

async function getPaginatedUsers(db, currentUser, page, pageSize = 20) {
    const { _id, agePreference, genderPreference, location } = currentUser;
    const { min: minAge, max: maxAge } = agePreference;
    const { coordinates } = location;
  
    console.log('Current User:', currentUser);
  
    // Step 1: Exclude users that the current user has already interacted with or has blocked
    const interactions = await db.collection('interactions').find({
      fromUserId: _id
    }).toArray();
    console.log('Interactions:', interactions.length);
  
    const blockedUsers = await db.collection('blocks').find({
      $or: [{ blockerId: _id }, { blockedId: _id }]
    }).toArray();
    console.log('Blocked Users:', blockedUsers.length);
  
    const excludedUserIds = new Set([
      ...interactions.map(interaction => interaction.toUserId.toString()),
      ...blockedUsers.map(block => (block.blockerId.equals(_id) ? block.blockedId.toString() : block.blockerId.toString()))
    ]);
    console.log('Excluded User IDs:', excludedUserIds.size);
  
    // Step 2: Find users matching the criteria
    const maxDistanceInMeters = 1000000; // 10km radius
    const geoNearStage = {
      $geoNear: {
        near: { type: 'Point', coordinates },
        distanceField: 'dist.calculated',
        maxDistance: maxDistanceInMeters,
        spherical: true,
        query: {
          _id: { $nin: Array.from(excludedUserIds).map(id => new ObjectId(id)) },
          age: { $gte: minAge, $lte: maxAge },
          gender: genderPreference,
        }
      }
    };
  
    console.log('GeoNear Stage:', JSON.stringify(geoNearStage, null, 2));
  
    // Step 3: Sort users by those who have superliked the current user
    const superlikes = await db.collection('interactions').find({
      toUserId: _id,
      type: 'superlike'
    }).toArray();
    console.log('Superlikes:', superlikes.length);
  
    const superlikeUserIds = new Set(superlikes.map(superlike => superlike.fromUserId.toString()));
  
    const results = await db.collection('users').aggregate([
      geoNearStage,
      {
        $addFields: {
          isSuperliked: {
            $cond: [{ $in: ['$_id', Array.from(superlikeUserIds).map(id => new ObjectId(id))] }, 1, 0]
          }
        }
      },
      { $sort: { isSuperliked: -1, _id: 1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize }
    ]).toArray();
  
    console.log('Results:', results.length);
    return results;
}

module.exports = getPaginatedUsers;
