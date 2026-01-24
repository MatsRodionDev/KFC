const fs = require('fs');
const pages = ['MenuPage', 'CartPage', 'CheckoutPage', 'ProductPage', 'OrderPage', 'HistoryPage', 'CustomProductBuilder'];
pages.forEach(p => {
  const index = `src/pages/${p}/index.ts`;
  const comp = `src/pages/${p}/${p}.tsx`;
  const css = `src/pages/${p}/${p}.css`;
  if (!fs.existsSync(index)) console.log(`ERROR: ${index} missing`);
  if (!fs.existsSync(comp)) console.log(`ERROR: ${comp} missing`);
  if (!fs.existsSync(css)) console.log(`ERROR: ${css} missing`);
});
console.log('All files check complete');
