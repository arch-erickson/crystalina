(function (root, factory) {
  const catalog = factory();
  if (typeof module === 'object' && module.exports) module.exports = catalog;
  root.CrystalinaProductCatalog = catalog;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const products = [
    {
      id: 'c1000000-0000-4000-8000-000000000001', slug: 'h5-600-uv-alkaline', sku: 'CRY-H5-600-UV',
      modelCode: 'H5-600-UV', productKind: 'system', name: 'Crystalina H5-600 High-Flow UV Alkaline RO',
      category: 'Reverse Osmosis', price: 1499, comparePrice: null, stock: 1, badge: 'New Arrival',
      short: 'Black-frame 600 GPD reverse osmosis system with alkaline finishing and LED-UVC treatment.',
      description: 'A customized high-flow system for larger households and higher daily demand. This Crystalina configuration pairs three serviceable prefilter housings with a 600 GPD RO membrane, alkaline finishing media, real-time monitoring, and a long-life LED-UVC treatment module.',
      specs: ['Manufacturer-rated 600 GPD purified-water capacity', '1-micron sediment and activated-carbon prefiltration', '600 GPD reverse osmosis membrane', 'Weak-alkaline finishing cartridge', 'LED-UVC treatment module', 'Two pressure gauges and digital monitoring panel'],
      installationMinutes: 120, image: '/images/products/h5-600-uv-editorial.webp', requiredFilterTypes: ['ppf-02', 'acm-10', 'ro-600-gpd', 'mfc-ph', 'led-uvc'], rating: '0.0', reviews: 0
    },
    {
      id: 'c1000000-0000-4000-8000-000000000002', slug: 'f5-600-uv-alkaline', sku: 'CRY-F5-600-UV',
      modelCode: 'F5-600-UV', productKind: 'system', name: 'Crystalina F5-600 UV Alkaline RO',
      category: 'Reverse Osmosis', price: 1299, comparePrice: null, stock: 1, badge: 'New Arrival',
      short: 'Open-frame 600 GPD RO system with alkaline finishing, polishing carbon, and LED-UVC treatment.',
      description: 'A fully equipped F5-600 configuration with three front-access prefilters, a high-output membrane, taste-polishing carbon, alkaline finishing media, and a mercury-free LED-UVC module. The open layout keeps routine cartridge changes accessible.',
      specs: ['Manufacturer-rated 600 GPD purified-water capacity', 'Three front-access prefilter housings', '600 GPD reverse osmosis membrane', 'T33 taste-polishing carbon cartridge', 'Weak-alkaline finishing cartridge', 'LED-UVC treatment module'],
      installationMinutes: 120, image: '/images/products/f5-600-uv-editorial.webp', requiredFilterTypes: ['ppf-02', 'acm-10', 'ro-600-gpd', 't33', 'mfc-ph', 'led-uvc'], rating: '0.0', reviews: 0
    },
    {
      id: 'c1000000-0000-4000-8000-000000000003', slug: 'x2a-600-smart-tankless', sku: 'CRY-X2A-600',
      modelCode: 'X2A-600', productKind: 'system', name: 'Crystalina X2A Smart Tankless RO',
      category: 'Reverse Osmosis', price: 1399, comparePrice: null, stock: 1, badge: 'Smart System',
      short: 'Enclosed tankless 600 GPD system with real-time TDS monitoring and three-cartridge service.',
      description: 'The compact X2A places its FSA prefilter, 600 GPD RO membrane, and ACM finishing cartridge inside a clean enclosed cabinet. A front display provides real-time TDS monitoring, while the three physical replacement cartridges simplify scheduled service.',
      specs: ['Manufacturer-rated 600 GPD configuration', '0.0001-micron manufacturer-rated RO filtration', 'Real-time TDS monitoring display', 'FSA 3-in-1 prefilter cartridge', 'ACM 2-in-1 finishing cartridge', 'Compact 478 x 161 x 410 mm cabinet'],
      installationMinutes: 90, image: '/images/products/x2a-600-editorial.webp', requiredFilterTypes: ['x2a-fsa', 'ro-600-gpd', 'x2a-acm', 'led-uvc'], rating: '0.0', reviews: 0
    },
    {
      id: 'c1000000-0000-4000-8000-000000000004', slug: 'w5-400-alkaline', sku: 'CRY-W5-400-ALK',
      modelCode: 'W5-400-ALK', productKind: 'system', name: 'Crystalina W5-400 Non-Electric Alkaline RO',
      category: 'Reverse Osmosis', price: 1049, comparePrice: null, stock: 1, badge: 'No Electricity',
      short: 'Non-electric 400 GPD RO rack with polishing carbon and weak-alkaline finishing media.',
      description: 'This customized W5-400 configuration operates without a booster pump or powered controls. It combines three transparent front housings with a 400 GPD membrane, a T33 polishing cartridge, and weak-alkaline finishing media.',
      specs: ['Manufacturer-rated 400 GPD nominal capacity', 'Non-electric operation', 'Three transparent front filter housings', '400 GPD reverse osmosis membrane', 'T33 taste-polishing carbon cartridge', 'Weak-alkaline finishing cartridge'],
      installationMinutes: 90, image: '/images/products/w5-400-alkaline-editorial.webp', requiredFilterTypes: ['ppf-02', 'acm-10', 'ro-400-gpd', 't33', 'mfc-ph'], rating: '0.0', reviews: 0
    },
    {
      id: 'c2000000-0000-4000-8000-000000000001', slug: 'ppf-02-sediment-cartridge', sku: 'PPF-02',
      modelCode: 'PPF-02', productKind: 'replacement_filter', name: 'PPF-02 1-Micron Sediment Cartridge',
      category: 'Replacement Filters', price: 19, comparePrice: null, stock: 0, badge: null,
      short: '1-micron polypropylene sediment cartridge for visible particles, rust, and suspended solids.',
      description: 'A grooved 252 x 63 mm polypropylene prefilter used as the first service stage in Crystalina open-frame systems. The photographed Crystalina cartridges specify replacement within six months, depending on water conditions and usage.',
      specs: ['Model PPF-02', '1-micron filtration', 'Grooved polypropylene construction', 'Fits purchased H5-600, F5-600, and W5-400 configurations', 'Typical replacement interval: up to 6 months'],
      installationMinutes: 15, image: '/images/products/filter-ppf-02-editorial.webp', filterTypeTags: ['ppf-02'], rating: '0.0', reviews: 0
    },
    {
      id: 'c2000000-0000-4000-8000-000000000002', slug: 'acm-10-sintered-carbon-cartridge', sku: 'CRY-ACM-10',
      modelCode: 'ACM-10', productKind: 'replacement_filter', name: 'ACM Sintered Carbon Cartridge',
      category: 'Replacement Filters', price: 39, comparePrice: null, stock: 0, badge: null,
      short: '1-micron coconut-shell sintered activated-carbon cartridge for open-frame systems.',
      description: 'A high-iodine-value sintered activated-carbon cartridge used in the second and third front housings of the purchased H5-600 and F5-600 configurations.',
      specs: ['Crystalina ACM-10 fit reference', '1-micron manufacturer-rated filtration', 'Sintered activated carbon', 'Two cartridges required per complete H5/F5/W5 service set', 'Typical replacement interval: up to 12 months'],
      installationMinutes: 15, image: '/images/products/filter-acm-10-editorial.webp', filterTypeTags: ['acm-10'], rating: '0.0', reviews: 0
    },
    {
      id: 'c2000000-0000-4000-8000-000000000003', slug: 'x2a-fsa-3-in-1-prefilter', sku: 'CRY-X2A-FSA',
      modelCode: 'FSA-X2A', productKind: 'replacement_filter', name: 'X2A FSA 3-in-1 Prefilter',
      category: 'Replacement Filters', price: 49, comparePrice: null, stock: 0, badge: null,
      short: 'Plug-in sediment, carbon, and anti-scale prefilter for the Crystalina X2A.',
      description: 'The X2A first cartridge combines pleated polypropylene, sintered activated carbon, and anti-scale media in one plug-in service part.',
      specs: ['Crystalina X2A fit reference', '3-in-1 composite cartridge', '1-micron manufacturer-rated filtration', 'Connector variant verified before fulfillment', 'Typical replacement interval: up to 12 months'],
      installationMinutes: 10, image: '/images/products/filter-x2a-fsa-editorial.webp', filterTypeTags: ['x2a-fsa'], rating: '0.0', reviews: 0
    },
    {
      id: 'c2000000-0000-4000-8000-000000000004', slug: 'crystalina-600-gpd-ro-membrane', sku: 'CRY-RO-600',
      modelCode: 'RO-600', productKind: 'replacement_filter', name: '600 GPD Reverse Osmosis Membrane',
      category: 'Replacement Filters', price: 119, comparePrice: null, stock: 0, badge: null,
      short: 'High-flux 600 GPD membrane for Crystalina H5, F5, and X2A configurations.',
      description: 'The core membrane replacement for the purchased 600 GPD systems. The exact supplier connector variant is verified against the installed cartridge before fulfillment.',
      specs: ['Crystalina RO-600 fit family', '600 GPD manufacturer-rated flux', '0.0001-micron manufacturer-rated filtration', 'Connector fit confirmed against the installed H5-600, F5-600, or X2A-600 cartridge', 'Typical replacement interval: 24 to 60 months'],
      installationMinutes: 20, image: '/images/products/filter-ro-600-editorial.webp', filterTypeTags: ['ro-600-gpd'], rating: '0.0', reviews: 0
    },
    {
      id: 'c2000000-0000-4000-8000-000000000005', slug: 't33-polishing-carbon-cartridge', sku: 'T33',
      modelCode: 'T33', productKind: 'replacement_filter', name: 'T33 Polishing Carbon Cartridge',
      category: 'Replacement Filters', price: 39, comparePrice: null, stock: 0, badge: null,
      short: 'Post-RO sintered activated-carbon cartridge for final taste and odor polishing.',
      description: 'A compact post-treatment cartridge used after the RO membrane in the purchased F5-600 and W5-400 configurations.',
      specs: ['Model T33', '1-micron manufacturer-rated filtration', 'Sintered activated carbon', 'Fits purchased F5-600 and W5-400 configurations', 'Typical replacement interval: up to 12 months'],
      installationMinutes: 10, image: '/images/products/filter-t33-editorial.webp', filterTypeTags: ['t33'], rating: '0.0', reviews: 0
    },
    {
      id: 'c2000000-0000-4000-8000-000000000006', slug: 'mfc-ph-alkaline-cartridge', sku: 'MFC',
      modelCode: 'MFC', productKind: 'replacement_filter', name: 'MFC + pH Alkaline Finishing Cartridge',
      category: 'Replacement Filters', price: 49, comparePrice: null, stock: 0, badge: null,
      short: 'Sintered-carbon finishing cartridge with weak-alkaline mineral media.',
      description: 'A post-RO finishing cartridge combining activated-carbon polishing with weak-alkaline media for the purchased H5-600, F5-600, and W5-400 alkaline configurations.',
      specs: ['Model MFC', '1-micron manufacturer-rated filtration', 'Sintered carbon plus weak-alkaline media', 'Manufacturer-stated pH range: 7.5 to 9', 'Typical replacement interval: up to 12 months'],
      installationMinutes: 10, image: '/images/products/filter-mfc-ph-editorial.webp', filterTypeTags: ['mfc-ph'], rating: '0.0', reviews: 0
    },
    {
      id: 'c2000000-0000-4000-8000-000000000007', slug: 'x2a-acm-finishing-cartridge', sku: 'CRY-X2A-ACM',
      modelCode: 'ACM-X2A', productKind: 'replacement_filter', name: 'X2A ACM Finishing Cartridge',
      category: 'Replacement Filters', price: 49, comparePrice: null, stock: 0, badge: null,
      short: 'Plug-in coconut-shell sintered-carbon finishing cartridge for the Crystalina X2A.',
      description: 'The X2A final cartridge uses a framed, plug-in sintered-carbon design for final-stage treatment after the RO membrane.',
      specs: ['Crystalina X2A fit reference', '1-micron manufacturer-rated filtration', 'Sintered activated carbon', 'Connector variant verified before fulfillment', 'Typical replacement interval: up to 12 months'],
      installationMinutes: 10, image: '/images/products/filter-x2a-acm-editorial.webp', filterTypeTags: ['x2a-acm'], rating: '0.0', reviews: 0
    },
    {
      id: 'c2000000-0000-4000-8000-000000000008', slug: 'led-uvc-sterilization-module', sku: 'LED-UVC',
      modelCode: 'LED-UVC', productKind: 'replacement_filter', name: 'LED-UVC Sterilization Module',
      category: 'Replacement Filters', price: 129, comparePrice: null, stock: 0, badge: 'Service Part',
      short: 'Mercury-free flow-activated LED-UVC service module for compatible Crystalina systems.',
      description: 'A long-life treatment module for compatible H5, F5 UV, and X2A configurations. It is listed individually as a service part and is not included in annual cartridge bundles.',
      specs: ['Model LED-UVC', 'Mercury-free LED module', 'Manufacturer-rated 10,000-hour LED lifespan', 'Flow-activated start', 'Professional service recommended'],
      installationMinutes: 30, image: '/images/products/filter-led-uvc-editorial.webp', filterTypeTags: ['led-uvc'], rating: '0.0', reviews: 0
    },
    {
      id: 'c2000000-0000-4000-8000-000000000009', slug: 'crystalina-400-gpd-ro-membrane', sku: 'CRY-RO-400',
      modelCode: 'RO-400', productKind: 'replacement_filter', name: '400 GPD Reverse Osmosis Membrane',
      category: 'Replacement Filters', price: 99, comparePrice: null, stock: 0, badge: null,
      short: 'High-flux 400 GPD membrane fitted to the purchased Crystalina W5-400 configuration.',
      description: 'The core membrane replacement for the non-electric W5-400. The supplier connector suffix is verified against the installed cartridge before fulfillment.',
      specs: ['Crystalina RO-400 fit reference', '400 GPD manufacturer-rated flux', '0.0001-micron manufacturer-rated filtration', 'Fits purchased W5-400 system', 'Typical replacement interval: 24 to 36 months'],
      installationMinutes: 20, image: '/images/products/filter-ro-400-editorial.webp', filterTypeTags: ['ro-400-gpd'], rating: '0.0', reviews: 0
    },
    {
      id: 'c3000000-0000-4000-8000-000000000001', slug: 'h5-600-complete-filter-set', sku: 'CRY-H5-600-SET',
      modelCode: 'H5-600-SET', productKind: 'filter_bundle', name: 'H5-600 Complete Replacement Filter Set',
      category: 'Replacement Filters', price: 239, comparePrice: 265, stock: 0, badge: 'Complete Set',
      short: 'Five physical replacement cartridges matched to the purchased H5-600 UV alkaline system.',
      description: 'One-box routine service set for the Crystalina H5-600 UV alkaline configuration. The membrane connector variant is verified against the installed cartridge before fulfillment. The long-life LED-UVC module is sold separately only when service replacement is needed.',
      specs: ['1 PPF-02 sediment cartridge', '2 ACM sintered-carbon cartridges', '1 600 GPD RO membrane', '1 MFC + pH alkaline cartridge'],
      installationMinutes: 45, image: '/images/products/bundle-h5-600-editorial.webp', rating: '0.0', reviews: 0,
      compatibleSystemIds: ['c1000000-0000-4000-8000-000000000001']
    },
    {
      id: 'c3000000-0000-4000-8000-000000000002', slug: 'f5-600-uv-complete-filter-set', sku: 'CRY-F5-600-UV-SET',
      modelCode: 'F5-600-UV-SET', productKind: 'filter_bundle', name: 'F5-600 UV Complete Replacement Filter Set',
      category: 'Replacement Filters', price: 269, comparePrice: 304, stock: 0, badge: 'Complete Set',
      short: 'Six physical replacement cartridges matched to the purchased F5-600 UV alkaline system.',
      description: 'Complete routine cartridge set for the Crystalina F5-600 UV alkaline configuration. The membrane connector variant is verified against the installed cartridge before fulfillment. The long-life LED-UVC module remains available separately as a service part.',
      specs: ['1 PPF-02 sediment cartridge', '2 ACM sintered-carbon cartridges', '1 600 GPD RO membrane', '1 T33 polishing cartridge', '1 MFC + pH alkaline cartridge'],
      installationMinutes: 50, image: '/images/products/bundle-f5-600-uv-editorial.webp', rating: '0.0', reviews: 0,
      compatibleSystemIds: ['c1000000-0000-4000-8000-000000000002']
    },
    {
      id: 'c3000000-0000-4000-8000-000000000003', slug: 'x2a-600-complete-filter-set', sku: 'CRY-X2A-600-SET',
      modelCode: 'X2A-600-SET', productKind: 'filter_bundle', name: 'X2A Complete 3-Cartridge Replacement Set',
      category: 'Replacement Filters', price: 195, comparePrice: 217, stock: 0, badge: 'Complete Set',
      short: 'The three physical replacement cartridges used by the Crystalina X2A.',
      description: 'A model-specific set containing the X2A FSA prefilter, 600 GPD RO membrane, and ACM finishing cartridge. The membrane connector variant is verified against the installed cartridge before fulfillment. Its long-life LED-UVC module is not a routine cartridge and is sold separately for service replacement.',
      specs: ['1 X2A FSA 3-in-1 prefilter', '1 600 GPD RO membrane', '1 X2A ACM finishing cartridge'],
      installationMinutes: 35, image: '/images/products/bundle-x2a-600-editorial.webp', rating: '0.0', reviews: 0,
      compatibleSystemIds: ['c1000000-0000-4000-8000-000000000003']
    },
    {
      id: 'c3000000-0000-4000-8000-000000000004', slug: 'w5-400-alkaline-complete-filter-set', sku: 'CRY-W5-400-ALK-SET',
      modelCode: 'W5-400-ALK-SET', productKind: 'filter_bundle', name: 'W5-400 Alkaline Complete Replacement Filter Set',
      category: 'Replacement Filters', price: 249, comparePrice: 284, stock: 0, badge: 'Complete Set',
      short: 'Six physical replacement cartridges matched to the purchased W5-400 alkaline system.',
      description: 'Complete routine cartridge set for the Crystalina W5-400 non-electric alkaline configuration, with sediment, dual carbon, RO, polishing, and alkaline finishing stages. The membrane connector variant is verified against the installed cartridge before fulfillment.',
      specs: ['1 PPF-02 sediment cartridge', '2 ACM sintered-carbon cartridges', '1 400 GPD RO membrane', '1 T33 polishing cartridge', '1 MFC + pH alkaline cartridge'],
      installationMinutes: 50, image: '/images/products/bundle-w5-400-alkaline-editorial.webp', rating: '0.0', reviews: 0,
      compatibleSystemIds: ['c1000000-0000-4000-8000-000000000004']
    }
  ];

  const compatibilities = [
    ['c1000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', '1', 1, 90],
    ['c1000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000002', '2-3', 2, 365],
    ['c1000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000004', '4', 1, 730],
    ['c1000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000006', '5', 1, 365],
    ['c1000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000008', 'UV', 1, 4562],
    ['c1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', '1', 1, 90],
    ['c1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', '2-3', 2, 365],
    ['c1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000004', '4', 1, 730],
    ['c1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000005', '5', 1, 365],
    ['c1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000006', '6', 1, 365],
    ['c1000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000008', 'UV', 1, 4562],
    ['c1000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000003', '1-3', 1, 365],
    ['c1000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000004', '4', 1, 730],
    ['c1000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000007', '5-6', 1, 365],
    ['c1000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000008', '7', 1, 4562],
    ['c1000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000001', '1', 1, 90],
    ['c1000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000002', '2-3', 2, 365],
    ['c1000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000009', '4', 1, 730],
    ['c1000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000005', '5', 1, 365],
    ['c1000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000006', '6', 1, 365]
  ].map(([systemId, replacementId, stageCode, quantity, replacementIntervalDays]) => ({ systemId, replacementId, stageCode, quantity, replacementIntervalDays }));

  const bundleItems = [
    ['c3000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000001', 1],
    ['c3000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000002', 2],
    ['c3000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000004', 1],
    ['c3000000-0000-4000-8000-000000000001', 'c2000000-0000-4000-8000-000000000006', 1],
    ['c3000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000001', 1],
    ['c3000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000002', 2],
    ['c3000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000004', 1],
    ['c3000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000005', 1],
    ['c3000000-0000-4000-8000-000000000002', 'c2000000-0000-4000-8000-000000000006', 1],
    ['c3000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000003', 1],
    ['c3000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000004', 1],
    ['c3000000-0000-4000-8000-000000000003', 'c2000000-0000-4000-8000-000000000007', 1],
    ['c3000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000001', 1],
    ['c3000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000002', 2],
    ['c3000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000009', 1],
    ['c3000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000005', 1],
    ['c3000000-0000-4000-8000-000000000004', 'c2000000-0000-4000-8000-000000000006', 1]
  ].map(([bundleId, componentId, quantity]) => ({ bundleId, componentId, quantity }));

  return {
    products: products.map(product => ({ ...product, priceIsPlaceholder: true })),
    compatibilities,
    bundleItems
  };
});
