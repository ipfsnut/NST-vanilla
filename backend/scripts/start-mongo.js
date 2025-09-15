const { MongoMemoryServer } = require('mongodb-memory-server');

async function startMongo() {
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017
    }
  });
}

startMongo();
