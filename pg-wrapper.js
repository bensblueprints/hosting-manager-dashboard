// Wrapper for pg module that falls back to pg-mem when DATABASE_URL is not set
const { newDb } = require('pg-mem');

let memoizedPg = null;

function getInMemoryPg() {
  if (!memoizedPg) {
    const db = newDb();
    memoizedPg = db.adapters.createPg();
  }
  return memoizedPg;
}

module.exports = {
  get Client() {
    if (process.env.DATABASE_URL) {
      return require('pg').Client;
    }
    return getInMemoryPg().Client;
  },
  get Pool() {
    if (process.env.DATABASE_URL) {
      return require('pg').Pool;
    }
    return getInMemoryPg().Pool;
  }
};
