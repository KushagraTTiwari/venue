const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'venue-service',
  brokers: ['localhost:9092']
});

module.exports = {kafka};