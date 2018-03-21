require('dotenv').config();
const { Client } = require('pg');
const xss = require('xss');

const connectionString = process.env.DATABASE_URL;

const xssArray = array => array.map(i => xss(i));

async function queryDb(q, values = [], tablename = '', search = '') {
  const info = {};
  const client = new Client({ connectionString });
  await client.connect();

  let result;
  let cleanValues;
  let offsetResult;
  let limitResult;

  try {
    if (!tablename) {
      cleanValues = xssArray(values);
      result = await client.query(q, cleanValues);
      return result;
    }

    result = await client.query(q, values);

    if (search) {
      info.data = {
        limit: values[2],
        offset: values[1],
        items: result.rows,
      };
      offsetResult = info.data.offset;
      limitResult = info.data.limit;

      if (offsetResult > 0) {
        info.data.prev = {
          href: `/${tablename}?search=${search}&offset=${offsetResult - limitResult}&limit=${limitResult}`,
        };
      }

      if (result.rows.length >= limitResult) {
        info.data.next = {
          href: `/${tablename}?search=${search}&offset=${offsetResult + limitResult}&limit=${limitResult}`,
        };
      }
      return info;
    }
    info.data = {
      limit: values[1],
      offset: values[0],
      items: result.rows,
    };
    offsetResult = info.data.offset;
    limitResult = info.data.limit;
    if (offsetResult > 0) {
      info.data.prev = {
        href: `/${tablename}?offset=${offsetResult - limitResult}&limit=${limitResult}`,
      };
    }

    if (result.rows.length >= limitResult) {
      info.data.next = {
        href: `/${tablename}?offset=${offsetResult + limitResult}&limit=${limitResult}`,
      };
    }
    return info;
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}

module.exports = {
  queryDb,
};
