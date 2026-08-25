const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const catalog = require('../js/product-catalog');

const storeSource = fs.readFileSync(path.join(__dirname, '..', 'js', 'store.js'), 'utf8');

function storage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: key => values.delete(key)
  };
}

function loadStore(localStorage) {
  const context = {
    window: { CrystalinaProductCatalog: catalog },
    localStorage,
    document: { dispatchEvent() {} },
    CustomEvent: class CustomEvent {},
    console
  };
  vm.createContext(context);
  vm.runInContext(`${storeSource}\n;globalThis.__Store = Store;`, context);
  return context.__Store;
}

test('the v4 catalog upgrade repairs an empty v3 catalog without clearing the cart', () => {
  const cart = [{ id: catalog.products[0].id, qty: 1 }];
  const localStorage = storage({
    crystalina_data_version: 'manufacturer-catalog-v3',
    crystalina_products: '[]',
    crystalina_cart: JSON.stringify(cart)
  });

  const store = loadStore(localStorage);
  assert.equal(store.getProducts().length, catalog.products.length);
  assert.equal(JSON.stringify(store.getCart()), JSON.stringify(cart));
  assert.equal(localStorage.getItem('crystalina_data_version'), 'manufacturer-catalog-v4');
  assert.equal(localStorage.getItem('crystalina_catalog_seed_count'), String(catalog.products.length));
});

test('an intentional admin delete-all remains empty after a reload', () => {
  const localStorage = storage();
  const firstLoad = loadStore(localStorage);
  firstLoad.deleteAllProducts();
  assert.equal(firstLoad.getProducts().length, 0);

  const secondLoad = loadStore(localStorage);
  assert.equal(secondLoad.getProducts().length, 0);
});
