import dayjs from 'dayjs';
import fs from 'fs';
const TIMESTAMP_FILE = './timestamp.txt';

export function getRoundedTimestamp(): string {
  const now = dayjs();
  const minutes = Math.round(now.minute() / 5) * 5;
  const roundedTimestamp = now.minute(minutes).format('YYYY-MM-DD-HH-mm');
  return roundedTimestamp;
}

// Function to write timestamp to a file
export function writeTimestampToFile(timestamp: string): void {
  fs.writeFileSync(TIMESTAMP_FILE, timestamp);
}

// Function to read timestamp from a file
export function readTimestampFromFile(): string {
  return fs.readFileSync(TIMESTAMP_FILE, 'utf-8');
}
