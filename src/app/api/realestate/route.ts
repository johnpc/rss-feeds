import { NextRequest, NextResponse } from 'next/server';

interface RealEstateListing {
  id: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  squareFootage?: number;
  lotSize?: string;
  yearBuilt?: number;
  propertyType: string;
  listingDate: string;
  description: string;
  imageUrl?: string;
  mlsNumber?: string;
  agent?: {
    name: string;
    phone?: string;
    email?: string;
  };
  features?: string[];
  neighborhood?: string;
  schoolDistrict?: string;
  daysOnMarket: number;
  pricePerSqFt?: number;
  status: 'active' | 'pending' | 'sold' | 'new';
}

interface RealEstateSearchParams {
  location: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  propertyType?: string;
  maxDaysOnMarket?: number;
}

// RentSpree API Response Interface
interface RentSpreeProperty {
  id: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft?: number;
  lot_size?: string;
  year_built?: number;
  property_type: string;
  listing_date: string;
  description: string;
  photos?: Array<{ url: string }>;
  mls_number?: string;
  agent?: {
    name: string;
    phone?: string;
    email?: string;
  };
  amenities?: string[];
  neighborhood?: string;
  days_on_market: number;
  status: string;
}

// Zillow API Response Interface (via RapidAPI)
interface ZillowProperty {
  zpid: string;
  address: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  livingArea?: number;
  lotAreaValue?: number;
  yearBuilt?: number;
  homeType: string;
  datePostedString: string;
  description?: string;
  photos?: Array<{ url: string }>;
  mlsid?: string;
  listingAgent?: {
    name: string;
    phone?: string;
  };
  daysOnZillow: number;
  homeStatus: string;
}

// Fetch listings from Zillow via RapidAPI
async function fetchZillowListings(params: RealEstateSearchParams): Promise<RealEstateListing[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    throw new Error('RAPIDAPI_KEY environment variable is required');
  }

  try {
    // Convert location to coordinates for Zillow API
    const location = params.location.includes('Ann Arbor') ? 'Ann Arbor, MI' : params.location;

    const searchParams = new URLSearchParams({
      location: location,
      status_type: 'ForSale',
      home_type: params.propertyType || 'Houses',
      ...(params.minPrice && { price_min: params.minPrice.toString() }),
      ...(params.maxPrice && { price_max: params.maxPrice.toString() }),
      ...(params.minBedrooms && { beds_min: params.minBedrooms.toString() }),
      ...(params.maxBedrooms && { beds_max: params.maxBedrooms.toString() }),
    });

    console.log('Making Zillow API request with params:', searchParams.toString());

    const response = await fetch(`https://zillow-com1.p.rapidapi.com/propertyExtendedSearch?${searchParams}`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'zillow-com1.p.rapidapi.com'
      }
    });

    console.log('Zillow API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zillow API error response:', errorText);
      throw new Error(`Zillow API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Zillow API response data keys:', Object.keys(data));
    console.log('Zillow API response sample:', JSON.stringify(data, null, 2).substring(0, 1000));
    
    const properties: ZillowProperty[] = data.props || data.results || data.listings || [];
    console.log('Found properties count:', properties.length);

    return properties.map((property, index) => {
      const listingDate = new Date(property.datePostedString || Date.now());
      const daysOnMarket = property.daysOnZillow || 0;

      // Determine status
      let status: 'active' | 'pending' | 'sold' | 'new' = 'active';
      if (property.homeStatus?.toLowerCase().includes('pending')) status = 'pending';
      else if (property.homeStatus?.toLowerCase().includes('sold')) status = 'sold';
      else if (daysOnMarket <= 3) status = 'new';

      return {
        id: property.zpid || `property-${index}`,
        address: property.address || 'Address not available',
        price: property.price || 0,
        bedrooms: property.bedrooms || 0,
        bathrooms: property.bathrooms || 0,
        squareFootage: property.livingArea,
        lotSize: property.lotAreaValue ? `${property.lotAreaValue} sq ft` : undefined,
        yearBuilt: property.yearBuilt,
        propertyType: property.homeType || 'Single Family Home',
        listingDate: listingDate.toISOString().split('T')[0],
        description: property.description || `${property.bedrooms || 0} bedroom, ${property.bathrooms || 0} bathroom ${(property.homeType || 'property').toLowerCase()} in ${property.address || 'location not specified'}`,
        imageUrl: property.photos?.[0]?.url,
        mlsNumber: property.mlsid,
        agent: property.listingAgent ? {
          name: property.listingAgent.name,
          phone: property.listingAgent.phone
        } : undefined,
        neighborhood: extractNeighborhood(property.address || ''),
        schoolDistrict: `${extractCity(property.address || '')} Public Schools`,
        daysOnMarket,
        pricePerSqFt: property.livingArea ? Math.round((property.price || 0) / property.livingArea) : undefined,
        status
      };
    }).filter(listing => {
      // Apply additional filters
      if (params.maxDaysOnMarket && listing.daysOnMarket > params.maxDaysOnMarket) return false;
      return true;
    }).sort((a, b) => new Date(b.listingDate).getTime() - new Date(a.listingDate).getTime());

  } catch (error) {
    console.error('Error fetching Zillow listings:', error);
    throw error;
  }
}

// Fetch listings from RentSpree API (alternative MLS source)
async function fetchRentSpreeListings(params: RealEstateSearchParams): Promise<RealEstateListing[]> {
  const apiKey = process.env.RENTSPREE_API_KEY;
  if (!apiKey) {
    return [];
    // throw new Error('RENTSPREE_API_KEY environment variable is required');
  }

  try {
    const searchBody = {
      location: params.location,
      listing_type: 'sale',
      ...(params.minPrice && { price_min: params.minPrice }),
      ...(params.maxPrice && { price_max: params.maxPrice }),
      ...(params.minBedrooms && { bedrooms_min: params.minBedrooms }),
      ...(params.maxBedrooms && { bedrooms_max: params.maxBedrooms }),
      ...(params.propertyType && { property_type: params.propertyType }),
    };

    const response = await fetch('https://api.rentspree.com/v1/listings/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchBody)
    });

    if (!response.ok) {
      throw new Error(`RentSpree API error: ${response.status}`);
    }

    const data = await response.json();
    const properties: RentSpreeProperty[] = data.listings || [];

    return properties.map(property => {
      const listingDate = new Date(property.listing_date);
      const daysOnMarket = property.days_on_market;

      // Determine status
      let status: 'active' | 'pending' | 'sold' | 'new' = 'active';
      if (property.status?.toLowerCase().includes('pending')) status = 'pending';
      else if (property.status?.toLowerCase().includes('sold')) status = 'sold';
      else if (daysOnMarket <= 3) status = 'new';

      return {
        id: property.id,
        address: `${property.address.street}, ${property.address.city}, ${property.address.state} ${property.address.zip}`,
        price: property.price,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        squareFootage: property.sqft,
        lotSize: property.lot_size,
        yearBuilt: property.year_built,
        propertyType: property.property_type,
        listingDate: listingDate.toISOString().split('T')[0],
        description: property.description,
        imageUrl: property.photos?.[0]?.url,
        mlsNumber: property.mls_number,
        agent: property.agent,
        features: property.amenities,
        neighborhood: property.neighborhood,
        daysOnMarket,
        pricePerSqFt: property.sqft ? Math.round(property.price / property.sqft) : undefined,
        status
      };
    }).filter(listing => {
      // Apply additional filters
      if (params.maxDaysOnMarket && listing.daysOnMarket > params.maxDaysOnMarket) return false;
      return true;
    }).sort((a, b) => new Date(b.listingDate).getTime() - new Date(a.listingDate).getTime());

  } catch (error) {
    console.error('Error fetching RentSpree listings:', error);
    throw error;
  }
}

// Main function to fetch listings from available sources
async function fetchRealEstateListings(params: RealEstateSearchParams): Promise<RealEstateListing[]> {
  const errors: string[] = [];

  // Try Zillow first (via RapidAPI)
  try {
    return await fetchZillowListings(params);
  } catch (error) {
    console.error('Zillow API failed:', error);
    errors.push(`Zillow: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // Fallback to RentSpree
  try {
    return await fetchRentSpreeListings(params);
  } catch (error) {
    console.error('RentSpree API failed:', error);
    errors.push(`RentSpree: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  // If all APIs fail, throw an error with details
  throw new Error(`All MLS APIs failed: ${errors.join(', ')}`);
}

// Helper functions for data extraction
function extractNeighborhood(address: string): string {
  if (!address) return 'Ann Arbor Area';
  // Simple extraction - in a real app you might use a geocoding service
  if (address.includes('Downtown')) return 'Downtown Ann Arbor';
  if (address.includes('Kerrytown')) return 'Kerrytown';
  if (address.includes('Burns Park')) return 'Burns Park';
  return 'Ann Arbor Area';
}

function extractCity(address: string): string {
  if (!address) return 'Ann Arbor';
  const parts = address.split(',');
  if (parts.length >= 2) {
    return parts[1].trim();
  }
  return 'Ann Arbor';
}

function getStatusEmoji(status: string): string {
  if (!status) return '🏠'; // Default fallback
  switch (status.toLowerCase()) {
    case 'new': return '🆕';
    case 'pending': return '⏳';
    case 'sold': return '✅';
    default: return '🏠';
  }
}

function getPropertyTypeEmoji(propertyType: string): string {
  if (!propertyType) return '🏠'; // Default fallback
  const type = propertyType.toLowerCase();
  if (type.includes('condo')) return '🏢';
  if (type.includes('townhouse')) return '🏘️';
  if (type.includes('multi')) return '🏬';
  return '🏠'; // Single family
}

function generateRSSFeed(listings: RealEstateListing[], params: RealEstateSearchParams): string {
  const now = new Date().toUTCString();

  // Group listings by different criteria for multiple feed items
  const newListings = listings.filter(listing => listing.status === 'new');
  const priceRanges = [
    { min: 0, max: 300000, label: 'Under $300K' },
    { min: 300000, max: 500000, label: '$300K - $500K' },
    { min: 500000, max: 750000, label: '$500K - $750K' },
    { min: 750000, max: Infinity, label: 'Over $750K' }
  ];

  const rssItems: string[] = [];

  // Add new listings as individual items
  newListings.slice(0, 10).forEach(listing => {
    const statusEmoji = getStatusEmoji(listing.status);
    const typeEmoji = getPropertyTypeEmoji(listing.propertyType);

    const title = `${statusEmoji} ${typeEmoji} NEW: ${listing.address} - $${listing.price.toLocaleString()} | ${listing.bedrooms}BR/${listing.bathrooms}BA`;

    let description = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <h2 style="margin: 0; color: #2c5aa0;">${statusEmoji} ${typeEmoji} ${listing.address}</h2>
        </div>

        ${listing.imageUrl ? `<img src="${listing.imageUrl}" alt="Property photo" style="width: 100%; max-width: 400px; height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 15px;"/>` : ''}

        <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <h3>💰 Price & Details</h3>
          <p><strong>💵 Price:</strong> $${listing.price.toLocaleString()}</p>
          <p><strong>🛏️ Bedrooms:</strong> ${listing.bedrooms} | <strong>🛁 Bathrooms:</strong> ${listing.bathrooms}</p>
          <p><strong>📐 Square Footage:</strong> ${listing.squareFootage?.toLocaleString()} sq ft</p>
          <p><strong>💲 Price per Sq Ft:</strong> $${listing.pricePerSqFt}</p>
          <p><strong>🏠 Property Type:</strong> ${listing.propertyType}</p>
          <p><strong>📅 Year Built:</strong> ${listing.yearBuilt}</p>
          <p><strong>📍 Neighborhood:</strong> ${listing.neighborhood}</p>
        </div>

        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <h3>📋 Description</h3>
          <p>${listing.description}</p>
        </div>`;

    if (listing.features && listing.features.length > 0) {
      description += `
        <div style="background: #f0fff0; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <h3>✨ Features</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${listing.features.map(feature => `<li>${feature}</li>`).join('')}
          </ul>
        </div>`;
    }

    if (listing.agent) {
      description += `
        <div style="background: #fff8f0; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <h3>👤 Listing Agent</h3>
          <p><strong>Name:</strong> ${listing.agent.name}</p>
          ${listing.agent.phone ? `<p><strong>Phone:</strong> ${listing.agent.phone}</p>` : ''}
          ${listing.agent.email ? `<p><strong>Email:</strong> ${listing.agent.email}</p>` : ''}
        </div>`;
    }

    description += `
        <div style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px; font-size: 0.9em; color: #666;">
          <p><strong>📅 Listed:</strong> ${new Date(listing.listingDate).toLocaleDateString()}</p>
          <p><strong>📊 Days on Market:</strong> ${listing.daysOnMarket}</p>
          ${listing.mlsNumber ? `<p><strong>🏷️ MLS #:</strong> ${listing.mlsNumber}</p>` : ''}
          <p><strong>🏫 School District:</strong> ${listing.schoolDistrict}</p>
          <p><strong>📍 Location:</strong> ${params.location}</p>
        </div>
      </div>`;

    rssItems.push(`
    <item>
      <title>${title}</title>
      <description><![CDATA[${description}]]></description>
      <link>http://localhost:3000/api/realestate?location=${params.location}</link>
      <pubDate>${new Date(listing.listingDate).toUTCString()}</pubDate>
      <guid isPermaLink="false">realestate-${listing.id}</guid>
      <category>Real Estate</category>
      <category>New Listing</category>
      <category>${listing.propertyType}</category>
      <category>${listing.neighborhood}</category>
      <author>realestate-rss@localhost</author>
      ${listing.imageUrl ? `<enclosure url="${listing.imageUrl}" type="image/jpeg" length="0"/>` : ''}
    </item>`);
  });

  // Add summary items for different price ranges
  priceRanges.forEach(range => {
    const rangeListings = listings.filter(listing =>
      listing.price >= range.min && listing.price < range.max
    );

    if (rangeListings.length === 0) return;

    const avgPrice = Math.round(rangeListings.reduce((sum, listing) => sum + listing.price, 0) / rangeListings.length);
    const title = `📊 ${range.label} Summary: ${rangeListings.length} listings, avg $${avgPrice.toLocaleString()}`;

    let description = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>📊 ${range.label} Price Range Summary</h2>

        <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 10px 0;">
          <h3>📈 Market Summary</h3>
          <p><strong>🏠 Total Listings:</strong> ${rangeListings.length}</p>
          <p><strong>💰 Average Price:</strong> $${avgPrice.toLocaleString()}</p>
          <p><strong>📊 Price Range:</strong> $${Math.min(...rangeListings.map(l => l.price)).toLocaleString()} - $${Math.max(...rangeListings.map(l => l.price)).toLocaleString()}</p>
          <p><strong>🆕 New Listings:</strong> ${rangeListings.filter(l => l.status === 'new').length}</p>
        </div>

        <h3>🏠 Recent Listings in This Range</h3>`;

    rangeListings.slice(0, 5).forEach(listing => {
      const statusEmoji = getStatusEmoji(listing.status);
      const typeEmoji = getPropertyTypeEmoji(listing.propertyType);

      description += `
        <div style="border: 1px solid #ddd; padding: 10px; border-radius: 5px; background: white; margin: 5px 0;">
          <h4>${statusEmoji} ${typeEmoji} ${listing.address}</h4>
          <p><strong>💵</strong> $${listing.price.toLocaleString()} | <strong>🛏️</strong> ${listing.bedrooms}BR/${listing.bathrooms}BA | <strong>📐</strong> ${listing.squareFootage?.toLocaleString()} sq ft</p>
          <p><strong>📅</strong> Listed ${new Date(listing.listingDate).toLocaleDateString()} (${listing.daysOnMarket} days ago)</p>
          <p><strong>📍</strong> ${listing.neighborhood}</p>
        </div>`;
    });

    description += `
        <div style="margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px; font-size: 0.9em; color: #666;">
          <p><strong>📍 Location:</strong> ${params.location}</p>
          <p><strong>🕒 Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
      </div>`;

    rssItems.push(`
    <item>
      <title>${title}</title>
      <description><![CDATA[${description}]]></description>
      <link>http://localhost:3000/api/realestate?location=${params.location}</link>
      <pubDate>${now}</pubDate>
      <guid isPermaLink="false">realestate-summary-${range.label.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}</guid>
      <category>Real Estate</category>
      <category>Market Summary</category>
      <category>${range.label}</category>
      <author>realestate-rss@localhost</author>
    </item>`);
  });

  const feedTitle = `🏠 Real Estate Listings - ${params.location}`;
  const feedDescription = `New real estate listings and market summaries for ${params.location} (Ann Arbor, MI area)`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:realestate="http://localhost:3000/realestate">
  <channel>
    <title>${feedTitle}</title>
    <description>${feedDescription}</description>
    <link>http://localhost:3000/api/realestate?location=${params.location}</link>
    <atom:link href="http://localhost:3000/api/realestate?location=${params.location}" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <category>Real Estate</category>
    <category>Property Listings</category>
    <copyright>Real Estate data from local MLS</copyright>
    <managingEditor>realestate-rss@localhost</managingEditor>
    <webMaster>realestate-rss@localhost</webMaster>
    <lastBuildDate>${now}</lastBuildDate>
    <pubDate>${now}</pubDate>
    <ttl>60</ttl>
    <generator>Next.js Real Estate RSS Feed v1.0</generator>
    <image>
      <url>https://picsum.photos/64/64?random=house</url>
      <title>Real Estate RSS Feed</title>
      <link>http://localhost:3000/api/realestate?location=${params.location}</link>
      <width>64</width>
      <height>64</height>
    </image>
    ${rssItems.join('')}
  </channel>
</rss>`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params: RealEstateSearchParams = {
      location: searchParams.get('location') || 'Ann Arbor, MI',
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      minBedrooms: searchParams.get('minBedrooms') ? parseInt(searchParams.get('minBedrooms')!) : undefined,
      maxBedrooms: searchParams.get('maxBedrooms') ? parseInt(searchParams.get('maxBedrooms')!) : undefined,
      propertyType: searchParams.get('propertyType') || undefined,
      maxDaysOnMarket: searchParams.get('maxDaysOnMarket') ? parseInt(searchParams.get('maxDaysOnMarket')!) : undefined,
    };

    // Fetch real estate listings from MLS APIs
    const listings = await fetchRealEstateListings(params);

    // Generate RSS feed
    const rssFeed = generateRSSFeed(listings, params);

    return new NextResponse(rssFeed, {
      status: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800', // Cache for 30 minutes (more frequent updates for real data)
      },
    });
  } catch (error) {
    console.error('Error generating real estate RSS feed:', error);

    // Return a more informative error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
      {
        error: 'Failed to generate real estate RSS feed',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
