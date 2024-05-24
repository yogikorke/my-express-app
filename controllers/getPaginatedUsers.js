const { ObjectId } = require('mongodb');

async function getPaginatedUsers(db, currentUser, page, pageSize = 20) {
    const { _id, agePreference, genderPreference, location } = currentUser;
    const { min: minAge, max: maxAge } = agePreference;
    const { coordinates } = location;

    const maxDistanceInMeters = 500000; // radius

    // Step 1: Fetch excluded user IDs
    const [interactions, blockedUsers] = await Promise.all([
        db.collection('interactions').find({
            fromUserId: _id
        }).project({ toUserId: 1 }).toArray(),
        db.collection('blocks').find({
            $or: [{ blockerId: _id }, { blockedId: _id }]
        }).project({ blockerId: 1, blockedId: 1 }).toArray()
    ]);

    const excludedUserIds = new Set([
        ...interactions.map(interaction => interaction.toUserId.toString()),
        ...blockedUsers.map(block => (block.blockerId.equals(_id) ? block.blockedId.toString() : block.blockerId.toString()))
    ]);

    // Step 2: Fetch superlikes
    const superlikes = await db.collection('interactions').find({
        toUserId: _id,
        type: 'superlike'
    }).project({ fromUserId: 1 }).toArray();

    const superlikeUserIds = new Set(superlikes.map(superlike => superlike.fromUserId.toString()));

    // Step 3: Aggregate users
    const results = await db.collection('users').aggregate([
        {
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
        },
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

    return results;
}

module.exports = getPaginatedUsers;
