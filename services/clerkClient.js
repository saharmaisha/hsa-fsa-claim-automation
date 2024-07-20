const { Clerk } = require('@clerk/clerk-sdk-node');

const clerk = new Clerk({
  apiKey: process.env.CLERK_API_KEY,
});

module.exports = clerk;
