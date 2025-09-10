import dayjs from 'dayjs';
import fs from 'fs';
import path from 'path';

const TIMESTAMP_FILE = path.resolve(__dirname, '../timestamp.txt');

export function getRoundedTimestamp(): string {
  const now = dayjs();
  const minutes = Math.round(now.minute() / 5) * 5;
  return now.minute(minutes).second(0).millisecond(0).format('YYYY-MM-DD_HH-mm');
}

export function writeTimestampToFile(timestamp: string): void {
  try {
    fs.writeFileSync(TIMESTAMP_FILE, timestamp, 'utf-8');
    console.log(`Timestamp written to file: ${timestamp}`);
  } catch (error) {
    console.error('Error writing timestamp to file:', error);
    throw error;
  }
}

export function readTimestampFromFile(): string {
  try {
    if (!fs.existsSync(TIMESTAMP_FILE)) {
      throw new Error(`Timestamp file ${TIMESTAMP_FILE} does not exist`);
    }
    return fs.readFileSync(TIMESTAMP_FILE, 'utf-8').trim();
  } catch (error) {
    console.error('Error reading timestamp from file:', error);
    throw error;
  }
}
