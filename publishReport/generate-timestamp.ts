import { getRoundedTimestamp, writeTimestampToFile } from './timestamp-helper';

const timestamp = getRoundedTimestamp();
writeTimestampToFile(timestamp);

console.log(`Timestamp created: ${timestamp}`);
