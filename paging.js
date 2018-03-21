const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

async function pagingSelect(tablename, values = [], search, query, offset = 0, limit = 10) {
  const info = {};
  const client = new Client({
    connectionString,
  });
  await client.connect();

  try {
    const res = await client.query(query, values);
    info.data = {
      limit,
      offset,
      items: res.rows,
    };

    if (!search) {
      if (offset > 0) {
        info.data.prev = {
          href: `/${tablename}?offset=${offset - limit}&limit=${limit}`,
        };
      }

      if (res.rows.length >= limit) {
        info.data.next = {
          href: `/${tablename}?offset=${Number(offset) + limit}&limit=${limit}`,
        };
      }
    } else {
      if (offset > 0) {
        info.data.prev = {
          href: `/${tablename}?search=${search}&offset=${offset - limit}&limit=${limit}`,
        };
      }

      if (res.rows.length <= limit) {
        info.data.next = {
          href: `/${tablename}?search=${search}&offset=${Number(offset) + limit}&limit=${limit}`,
        };
      }
    }
  } catch (e) {
    console.error('Error selecting', e);
    info.error = {
      error: 'Database error occurred',
      status: 400,
    };
  }
  await client.end();
  return info;
}

module.exports = {
  pagingSelect,
};
