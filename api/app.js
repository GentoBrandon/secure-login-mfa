const express = require('express')
const app = express()
const port = 8001
const pgp = require('pg-promise')(/* options */)
const db = pgp('postgresql://umg:mfa-umg@db:5432/postgres?schema=public')

app.get('/', (req, res) => {
  db.any('SELECT * FROM products')
  .then((products) => {
    res.json({
      success: true,
      data: products
    });
  })
  .catch((error) => {
    res.status(500).json({
      success: false,
      error: error.message
    });
  });
});

app.get('/products', async (req, res) => {
  const products = await db.any('SELECT * FROM products');
  try {
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
});

