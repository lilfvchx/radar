import * as gpsjam from './source/gpsjam';
import { runIngestionPipeline as runArCrimePipeline } from './source/ar_crime/pipeline';

/**
 * Scheduler for periodic data ingestion tasks
 *
 * This module manages scheduled jobs for:
 * - Daily GPS jamming data updates
 * - Other recurring data ingestion tasks
 */

interface ScheduledJob {
  name: string;
  intervalMs: number;
  lastRun: number;
  task: () => Promise<void>;
}

const jobs: ScheduledJob[] = [];
let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * GPS Jamming Daily Update Job
 * Fetches the latest GPS jamming data and ensures recent datasets are available
 */
async function gpsJammingDailyUpdate() {
  console.log('[Scheduler] Running GPS jamming daily update...');

  try {
    // Refresh manifest to detect new datasets
    await gpsjam.fetchManifest();

    // Get the latest date
    const latestDate = await gpsjam.getLatestDate();
    console.log(`[Scheduler] Latest GPS jamming dataset: ${latestDate}`);

    // Fetch the latest dataset to ensure it's cached
    await gpsjam.fetchDataset(latestDate);

    // Optionally backfill the last 7 days to ensure recent data is available
    const manifest = await gpsjam.fetchManifest();
    const recentDates = manifest.slice(-7).map((e) => e.date);

    for (const date of recentDates) {
      try {
        await gpsjam.fetchDataset(date);
      } catch (error) {
        console.warn(`[Scheduler] Failed to fetch dataset for ${date}:`, error);
      }
    }

    console.log('[Scheduler] GPS jamming daily update complete');
  } catch (error) {
    console.error('[Scheduler] GPS jamming daily update failed:', error);
  }
}

/**
 * Register a scheduled job
 */
export function registerJob(name: string, intervalMs: number, task: () => Promise<void>) {
  jobs.push({
    name,
    intervalMs,
    lastRun: 0,
    task,
  });
  console.log(`[Scheduler] Registered job: ${name} (every ${intervalMs / 1000}s)`);
}

/**
 * Start the scheduler
 * Checks every minute if any jobs need to run
 */
export function startScheduler() {
  if (schedulerInterval) {
    console.warn('[Scheduler] Already running');
    return;
  }

  console.log('[Scheduler] Starting...');

  // Run check every minute
  schedulerInterval = setInterval(checkJobs, 60000);

  // Run initial check immediately
  checkJobs();
}

/**
 * Stop the scheduler
 */
export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] Stopped');
  }
}

/**
 * Check and run jobs that are due
 */
async function checkJobs() {
  const now = Date.now();

  for (const job of jobs) {
    const timeSinceLastRun = now - job.lastRun;

    if (timeSinceLastRun >= job.intervalMs) {
      console.log(`[Scheduler] Running job: ${job.name}`);
      job.lastRun = now;

      try {
        await job.task();
      } catch (error) {
        console.error(`[Scheduler] Job failed: ${job.name}`, error);
      }
    }
  }
}

/**
 * Initialize default scheduled jobs
 */
export function initializeDefaultJobs() {
  // GPS Jamming: Check for new data every 6 hours
  registerJob(
    'GPS Jamming Daily Update',
    6 * 60 * 60 * 1000, // 6 hours
    gpsJammingDailyUpdate,
  );

  // AR Crime OSINT: Run every 30 minutes
  if (process.env.AR_CRIME_SCHEDULER_ENABLED !== 'false') {
    registerJob(
      'AR Crime OSINT Ingest',
      30 * 60 * 1000, // 30 minutes
      runArCrimePipeline,
    );
  }

  // Add other scheduled jobs here as needed
}

/**
 * Force run all jobs immediately (useful for testing or manual trigger)
 */
export async function runAllJobsNow() {
  console.log('[Scheduler] Running all jobs immediately...');
  for (const job of jobs) {
    console.log(`[Scheduler] Running: ${job.name}`);
    try {
      await job.task();
      job.lastRun = Date.now();
    } catch (error) {
      console.error(`[Scheduler] Job failed: ${job.name}`, error);
    }
  }
  console.log('[Scheduler] All jobs completed');
}
