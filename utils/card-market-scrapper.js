import { puppeteer } from 'puppeteer';
// TODO implement searching for different rarities such as Alt Art (V2) Mangas (V3) - see if possible to also search for special rares
// May need to adjust based on rarity (there is a rarity) can be used for special rare? as there is no (V)

export default scrapeCardMarket = async (query) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"]
  });
  const page = await browser.newPage();

  const ua =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36";
  await page.setUserAgent(ua);

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const searchQuery = encodeURIComponent(query);
  const url = `https://www.cardmarket.com/en/OnePiece/Products/Search?searchString=${searchQuery}`;

  await page.goto(url, { waitUntil: 'domcontentloaded' });

  console.log('Page has loaded!');

  try {
    console.log(`Waiting for selector: .row.g-0 .col-12.col-md-8.px-2.flex-column a`);
    await page.waitForSelector('.row.g-0 .col-12.col-md-8.px-2.flex-column a', { timeout: 60000 });
    console.log('Selector found.');
  } catch (error) {
    console.error('Selector not found:', error);
    await browser.close();
    return;
  }

  const cardLink = await page.evaluate(() => {
    const cardUrl = document.querySelector('.row.g-0 .col-12.col-md-8.px-2.flex-column a');
    return cardUrl ? cardUrl.href : null;
  });

  console.log(cardLink);

  if (!cardLink) {
    console.error('Card not found');
    await browser.close();
    process.exit(1);
  }

  await page.goto(cardLink, { waitUntil: 'networkidle2' });


  const listings = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('.table-body .row.g-0.article-row');

    items.forEach(item => {
      const container = item.querySelector('.price-container.d-none.d-md-flex.justify-content-end > .d-flex.flex-column');
      const priceElement = container ? container.querySelector('span') : null;
      const sellerElement = item.querySelector('.col-seller span.me-1 a');
      const linkElement = document.querySelector('link');

      const price = priceElement ? priceElement.innerText.trim() : null;
      const seller = sellerElement ? sellerElement.innerText.trim() : null;
      const link = linkElement ? linkElement.href : null;

      if (price && seller) {
        results.push({
          price,
          seller,
          link,
        })
      };
    });
    return results;

  });
  await browser.close();

  return listings;
};

