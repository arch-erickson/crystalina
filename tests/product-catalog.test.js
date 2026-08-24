const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../js/product-catalog');

test('the purchased catalog exposes exactly four one-of-one filtration systems', () => {
  // Catches a missing purchased unit, duplicate configuration, or invented system stock.
  const systems = catalog.products.filter(product => product.productKind === 'system');
  assert.deepEqual(systems.map(product => product.modelCode).sort(), [
    'F5-600-UV',
    'H5-600-UV',
    'W5-400-ALK',
    'X2A-600'
  ]);
  assert.ok(systems.every(product => product.stock === 1));
});

test('each filtration system has one model-specific complete replacement bundle', () => {
  // Catches a storefront configuration that leaves a system without its requested bundle option.
  const systems = catalog.products.filter(product => product.productKind === 'system');
  const bundles = catalog.products.filter(product => product.productKind === 'filter_bundle');
  assert.equal(bundles.length, systems.length);
  assert.deepEqual(
    bundles.map(bundle => bundle.compatibleSystemIds).flat().sort(),
    systems.map(system => system.id).sort()
  );
});

test('the X2A bundle contains its three physical replacement cartridges', () => {
  // Catches an incorrect X-series stage mapping or accidental inclusion of the long-life UV module.
  const bundle = catalog.products.find(product => product.modelCode === 'X2A-600-SET');
  assert.ok(bundle);
  const parts = catalog.bundleItems
    .filter(item => item.bundleId === bundle.id)
    .map(item => ({ sku: catalog.products.find(product => product.id === item.componentId).sku, quantity: item.quantity }));
  assert.deepEqual(parts, [
    { sku: 'CRY-X2A-FSA', quantity: 1 },
    { sku: 'CRY-RO-600', quantity: 1 },
    { sku: 'CRY-X2A-ACM', quantity: 1 }
  ]);
});

test('bundle prices are discounted from the sum of their individual cartridges', () => {
  // Catches a bundle price that is higher than buying the exact same cartridges separately.
  for (const bundle of catalog.products.filter(product => product.productKind === 'filter_bundle')) {
    const individualTotal = catalog.bundleItems
      .filter(item => item.bundleId === bundle.id)
      .reduce((total, item) => total + catalog.products.find(product => product.id === item.componentId).price * item.quantity, 0);
    assert.ok(bundle.price < individualTotal, `${bundle.modelCode} should cost less than ${individualTotal}`);
  }
});

test('the Supabase catalog migration contains every storefront SKU and slug', () => {
  // Catches drift between the static fallback catalog and the server-side source of truth.
  const migrationDirectory = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrationName = fs.readdirSync(migrationDirectory).find(name => name.endsWith('_manufacturer_product_catalog.sql'));
  assert.ok(migrationName, 'manufacturer product catalog migration should exist');
  const migration = fs.readFileSync(path.join(migrationDirectory, migrationName), 'utf8');
  for (const product of catalog.products) {
    assert.ok(migration.includes(`'${product.slug}'`), `missing slug ${product.slug}`);
    assert.ok(migration.includes(`'${product.sku}'`), `missing SKU ${product.sku}`);
  }
});

test('every manufacturer catalog item has a committed WebP asset', () => {
  // Catches broken storefront media paths before deployment.
  for (const product of catalog.products) {
    assert.match(product.image, /^\/images\/products\/[a-z0-9-]+\.webp$/);
    assert.ok(fs.existsSync(path.join(__dirname, '..', product.image.slice(1))), `missing image ${product.image}`);
  }
});

test('temporary catalog prices are explicitly marked as placeholders', () => {
  // Prevents user-requested random amounts from being presented as approved retail pricing.
  assert.ok(catalog.products.every(product => product.priceIsPlaceholder === true));
});

test('uncertain RO connector variants require fit confirmation before fulfillment', () => {
  // Prevents a generic fit-family SKU from promising an unverified manufacturer connector suffix.
  const uncertainMembranes = catalog.products.filter(product => ['CRY-RO-600', 'CRY-RO-400'].includes(product.sku));
  assert.equal(uncertainMembranes.length, 2);
  assert.ok(uncertainMembranes.every(product => /connector.+verified.+before fulfillment/i.test(product.description)));
});

test('Supabase persists one model-specific bundle relationship per purchased system', () => {
  // Prevents the server catalog from depending on browser-only compatibleSystemIds metadata.
  const migrationDirectory = path.join(__dirname, '..', 'supabase', 'migrations');
  const migrations = fs.readdirSync(migrationDirectory)
    .filter(name => name.endsWith('.sql'))
    .map(name => fs.readFileSync(path.join(migrationDirectory, name), 'utf8'))
    .join('\n');
  assert.match(migrations, /create table public\.system_filter_bundles/i);
  for (const bundle of catalog.products.filter(product => product.productKind === 'filter_bundle')) {
    assert.ok(migrations.includes(`'${bundle.slug}'`), `missing system relationship for ${bundle.slug}`);
  }
});
