import { json, LoaderFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"
import scrapeEbay from "../../utils/ebay-scrapper"
import scrapeCardMarket from "../../utils/card-market-scrapper"

interface CardMarketListing {
  seller: string;
  price: string;
  link: string;
}

interface eBayListing {
  seller: string;
  price: string;
  link: string;
}

interface LoaderData {
  cardMarketListings: CardMarketListing[];
  eBayListings: eBayListing[];
  error?: string;
}

export const loader: LoaderFunction = async ({ request }: { request: Request }) => {
  const url = new URL(request.url)
  const cardId = url.searchParams.get("cardId")

  if (!cardId) {
    return json({ error: "Card ID is required" }, { status: 400 })
  }

  try {
    const [cardMarketListings, eBayListings] = await Promise.all([
      scrapeCardMarket(cardId),
      scrapeEbay(cardId),
    ])

    return json({ cardMarketListings, eBayListings })
  } catch (error) {
    console.error(error)
    return json({ error: "Failed to scrape data" }, { status: 500 })
  }
}

export default function Cards() {
  const { cardMarketListings, eBayListings, error } = useLoaderData<LoaderData>()

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div>
      <h2 className="text-3xl mt-8">CardMarket Listings</h2>
      {cardMarketListings.length === 0 ? (
        <p>No CardMarket listings found</p>
      ) : (
        <ul>
          {cardMarketListings.map((listing: CardMarketListing, index: number) => (
            <li key={index}>
              <p>Seller: {listing.seller}</p>
              <p>Price: {listing.price}</p>
              <a href={listing.link} target="_blank" rel="noopener noreferrer">
                View Listing
              </a>
            </li>
          ))}</ul>
      )}

      <h2 className="text-3xl mt-8">eBay Listings</h2>
      {eBayListings.length === 0 ? (
        <p>No eBay listings found</p>
      ) : (
        <ul>
          {eBayListings.map((listing: eBayListing, index: number) => (
            <li key={index}>
              <p>Seller: {listing.seller}</p>
              <p>Price: {listing.price}</p>
              <a href={listing.link} target="_blank" rel="noopener noreferrer">
                View Listing</a>
            </li>
          ))}</ul>
      )}
    </div>
  );
}
