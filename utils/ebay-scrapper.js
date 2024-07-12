import { puppeteer } from 'puppeteer';

export default scrapeEbay = async (query) => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox"]
  });
  const page = await browser.newPage();
  const searchQuery = encodeURIComponent(query);
  const url = `https://www.ebay.co.uk/sch/i.html?_nkw=${searchQuery}`;

  await page.goto(url, { waitUntil: 'networkidle2' });

  const listings = await page.evaluate(() => {
    const results = [];
    const items = document.querySelectorAll('.s-item');

    items.forEach(item => {
      const titleElement = item.querySelector('.s-item__title');
      const priceElement = item.querySelector('.s-item__price');
      const linkElement = item.querySelector('.s-item__link');

      const title = titleElement ? titleElement.innerText : null;
      const price = priceElement ? priceElement.innerText : null;
      const link = linkElement ? linkElement.href : null;

      if (title && price && link && title !== 'Shop on eBay') {
        results.push({
          title,
          price,
          link,
        });
      }
    });

    return results;
  });

  await browser.close();

  const parsedListings = listings.map(listing => {
    const numericalPrice = parseFloat(listing.price.replace(/[^0-9.-]+/g, ''));
    return { ...listing, numericalPrice };
  }).sort((a, b) => a.numericalPrice - b.numericalPrice);

  return parsedListings;
};

