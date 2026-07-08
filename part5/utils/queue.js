import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL);

console.log('Connection Of Queue to Redis Done',connection);

const embeddingsQueue = new Queue('embeddingsQueue',{
  connection
});

export default embeddingsQueue;

