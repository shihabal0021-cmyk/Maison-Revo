const { getStore } = require('@netlify/blobs');

const DEFAULT_PRODUCTS = [
  { id: 1, name: "Classic Steel Ring", cat: "Rings", price: 590, image: "", code: "MR" },
  { id: 2, name: "Black Signet Ring", cat: "Rings", price: 690, image: "", code: "MR" },
  { id: 3, name: "Minimal Chain Bracelet", cat: "Bracelets", price: 790, image: "", code: "BR" },
  { id: 4, name: "Classic Cuff Bracelet", cat: "Bracelets", price: 850, image: "", code: "CU" },
  { id: 5, name: "Silver Hoop Earrings", cat: "Earrings", price: 550, image: "", code: "ER" },
  { id: 6, name: "Pearl Drop Earrings", cat: "Earrings", price: 650, image: "", code: "PR" },
  { id: 7, name: "Bold Link Bracelet", cat: "Bracelets", price: 920, image: "", code: "BL" },
  { id: 8, name: "Everyday Band Ring", cat: "Rings", price: 490, image: "", code: "BD" }
];

const store = getStore({ name: 'maison-revo-products', consistency: 'strong' });

async function getProducts() {
  const saved = await store.get('catalog', { type: 'json' });
  if (Array.isArray(saved)) return saved;
  await store.setJSON('catalog', DEFAULT_PRODUCTS);
  return DEFAULT_PRODUCTS;
}

function authorized(event) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return false;

  // Netlify's CommonJS `exports.handler` receives an event object,
  // not a Fetch API Request. Read the Authorization header accordingly.
  const headers = event && event.headers ? event.headers : {};
  const header = headers.authorization || headers.Authorization || '';
  return header === `Bearer ${configured}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

exports.handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const isAdminCheck = String(event.queryStringParameters?.admin || '') === '1';
      if (isAdminCheck && !authorized(event)) return json({ error: 'Unauthorized' }, 401);
      return json(await getProducts());
    }

    if (!authorized(event)) return json({ error: 'Unauthorized' }, 401);

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const products = await getProducts();
      const product = {
        id: Number.isFinite(Number(body.id)) ? Number(body.id) : Date.now(),
        name: String(body.name || '').trim(),
        cat: String(body.cat || 'Rings').trim(),
        price: Number(body.price) || 0,
        image: String(body.image || ''),
        code: String(body.code || 'MR').trim().slice(0, 8)
      };
      if (!product.name || product.price < 0) return json({ error: 'Name and valid price are required.' }, 400);
      const index = products.findIndex(p => p.id === product.id);
      if (index >= 0) products[index] = product; else products.push(product);
      await store.setJSON('catalog', products);
      return json(product, index >= 0 ? 200 : 201);
    }

    if (event.httpMethod === 'DELETE') {
      const id = Number(event.queryStringParameters?.id);
      if (!id) return json({ error: 'Product id is required.' }, 400);
      const products = await getProducts();
      const next = products.filter(p => p.id !== id);
      await store.setJSON('catalog', next);
      return json({ ok: true });
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch (error) {
    console.error(error);
    return json({ error: 'Server error' }, 500);
  }
};
