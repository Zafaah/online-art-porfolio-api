
import { commissionQueue } from "./src/jobs/queue";
import { connectToRedis } from "./src/config/redisdb";


const queue = await commissionQueue();

const showQueueJobs = async () => {
  console.log("Checking Commission Queue Status...\n");

  try {
    const waitingJobs = await queue.getJobs(["waiting"]);
    const activeJobs = await queue.getJobs(["active"]);
    const completedJobs = await queue.getJobs(["completed"]);
    const failedJobs = await queue.getJobs(["failed"]);

    console.log(` Waiting jobs: ${waitingJobs.length}`);
    console.log(` Active jobs: ${activeJobs.length}`);
    console.log(` Completed jobs: ${completedJobs.length}`);
    console.log(` Failed jobs: ${failedJobs.length}\n`);

    
    if (waitingJobs.length > 0) {
      console.log(" WAITING JOBS:");
      console.log("=".repeat(50));

      for (const job of waitingJobs) {
        console.log(`\n Job ID: ${job.id}`);
        console.log(` Name: ${job.name}`);
        console.log(` Data:`, JSON.stringify(job.data, null, 2));
        console.log(` Timestamp: ${new Date(job.timestamp).toLocaleString()}`);
      }
    }

    
    if (activeJobs.length > 0) {
      console.log("\ ACTIVE JOBS:");
      console.log("=".repeat(50));

      for (const job of activeJobs) {
        console.log(` Job ID: ${job.id}`);
        console.log(`Name: ${job.name}`);
        console.log(` Data:`, JSON.stringify(job.data, null, 2));
      }
    }

    
    if (failedJobs.length > 0) {
      console.log("\n FAILED JOBS:");
      console.log("=".repeat(50));

      for (const job of failedJobs) {
        console.log(`\n Job ID: ${job.id}`);
        console.log(` Name: ${job.name}`);
        console.log(` Data:`, JSON.stringify(job.data, null, 2));
        console.log(` Failed Reason: ${job.failedReason}`);
      }
    }

  } catch (error) {
    console.error(" Error fetching queue jobs:", error);
  } finally {
    await (await queue).close();
    await (await connectToRedis()).quit();
  }
};


if (import.meta.main) {
  showQueueJobs();
}

export { showQueueJobs };
