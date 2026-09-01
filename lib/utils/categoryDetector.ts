import { Expense } from '@/lib/types';

interface CategoryRule {
  category: Expense['category'];
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'restaurant',
    keywords: [
      'frühstück', 'breakfast', 'mittagessen', 'lunch', 'abendessen', 'dinner',
      'pizza', 'pasta', 'burger', 'sushi', 'döner', 'kebap', 'kebab', 'tacos', 'burrito',
      'restaurant', 'bar', 'kneipe', 'bier', 'beer', 'wein', 'wine', 'cocktail', 'cocktails',
      'drinks', 'café', 'cafe', 'kaffee', 'coffee', 'bäckerei', 'bakery', 'brunch', 'eis',
      'ice cream', 'gelato', 'italienisch', 'spanier', 'tapas', 'grieche', 'asiate',
      'chinesisch', 'steak', 'bbq', 'grillen', 'imbiss', 'snack', 'lieferando', 'wolt',
      'ubereats', 'mcdonalds', 'burger king', 'kfc', 'subway', 'pizzeria', 'trattoria',
      'osteria', 'ristorante', 'pub', 'club', 'essen', 'food', 'speisen', 'gaststätte', 'wirtshaus'
    ],
  },
  {
    category: 'groceries',
    keywords: [
      'einkauf', 'einkaufen', 'supermarkt', 'supermarket', 'lebensmittel', 'groceries',
      'rewe', 'edeka', 'aldi', 'lidl', 'kaufland', 'penny', 'netto', 'spar', 'coop', 'migros',
      'drogerie', 'dm', 'rossmann', 'müller', 'wocheneinkauf', 'markt', 'obst', 'gemüse',
      'getränkemarkt', 'bio', 'alnatura', 'denns', 'bäcker', 'metzger', 'fleischer', 'woche'
    ],
  },
  {
    category: 'transport',
    keywords: [
      'taxi', 'uber', 'bolt', 'free now', 'lyft', 'grab', 'bahn', 'db', 'deutsche bahn',
      'zug', 'train', 'ice', 'ec', 'ic', 'regionalbahn', 'flug', 'flight', 'airline',
      'lufthansa', 'ryanair', 'easyjet', 'ticket', 'fahrkarte', 'tanken', 'benzin', 'gas',
      'diesel', 'sprit', 'kraftstoff', 'tankstelle', 'aral', 'shell', 'esso', 'total',
      'bus', 'tram', 'straßenbahn', 'u-bahn', 'metro', 'subway', 's-bahn', 'flughafen',
      'airport', 'parken', 'parking', 'parkhaus', 'parkticket', 'maut', 'toll', 'vignette',
      'roller', 'scooter', 'tier', 'lime', 'bolt scooter', 'voi', 'carsharing', 'sixt',
      'miles', 'share now', 'mietwagen', 'rental car', 'fähre', 'ferry', 'fahrt'
    ],
  },
  {
    category: 'hotel',
    keywords: [
      'hotel', 'airbnb', 'ferienwohnung', 'ferienhaus', 'unterkunft', 'accommodation',
      'hostel', 'booking', 'booking.com', 'übernachtung', 'chalet', 'hütte', 'camping',
      'zeltplatz', 'motel', 'resort', 'pension', 'zimmer', 'room', 'urlaub', 'residenz'
    ],
  },
  {
    category: 'entertainment',
    keywords: [
      'kino', 'cinema', 'movie', 'film', 'museum', 'ausstellung', 'theater', 'theatre',
      'musical', 'festival', 'konzert', 'concert', 'club', 'party', 'disco', 'eintritt',
      'skipass', 'ski pass', 'skigebiet', 'therme', 'spa', 'wellness', 'sauna', 'bowling',
      'billiard', 'escape room', 'freizeitpark', 'amusement park', 'europapark', 'phantasialand',
      'zoo', 'aquarium', 'kart', 'kartbahn', 'paintball', 'lasertag', 'minigolf', 'golf',
      'boot', 'bootsverleih', 'kayak', 'kanu', 'sup', 'ski', 'event', 'ausflug'
    ],
  },
  {
    category: 'household',
    keywords: [
      'strom', 'electricity', 'gas', 'wasser', 'water', 'internet', 'wlan', 'wifi',
      'rundfunk', 'gez', 'miete', 'rent', 'nebenkosten', 'haushalt', 'household',
      'putzmittel', 'ikea', 'möbel', 'furniture', 'baumarkt', 'hardware store', 'obi',
      'hornbach', 'bauhaus', 'toom', 'amazon', 'reparatur', 'repair', 'handwerker'
    ],
  },
  {
    category: 'cafe',
    keywords: [
      'café', 'cafe', 'espresso', 'cappuccino', 'latte', 'starbucks', 'bäckerei', 'kuchen',
      'torte', 'törtchen', 'croissant', 'matcha', 'tee', 'tea', 'bubble tea', 'eis', 'ice'
    ],
  },
];

export function detectCategoryFromTitle(title: string): Expense['category'] | null {
  if (!title || !title.trim()) return null;
  const normalized = title.toLowerCase().trim();

  for (const rule of CATEGORY_RULES) {
    for (const kw of rule.keywords) {
      if (normalized.includes(kw.toLowerCase())) {
        return rule.category;
      }
    }
  }

  return null;
}
