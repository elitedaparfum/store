import { db, productsTable } from "@workspace/db";
import { count } from "drizzle-orm";

const SAMPLE_PRODUCTS = [
  {
    name: "Oud Royale",
    family: "Oriental",
    gender: "Unisex",
    price: 320,
    notesTop: "Saffron, Bergamot",
    notesHeart: "Oud, Rose Damascena, Amber",
    notesBase: "Musk, Sandalwood, Vanilla",
    description: "A majestic oud composition born from the rarest Arabian woods. Oud Royale opens with a whisper of precious saffron and sun-drenched bergamot before revealing its heart of legendary oud, Bulgarian rose, and warm amber. The drydown is an eternal embrace of velvety musk and sandalwood.",
    imageUrl: "/images/oud-royale.png",
    featured: "true",
  },
  {
    name: "Rose de Minuit",
    family: "Floral",
    gender: "Women",
    price: 240,
    notesTop: "Pink Pepper, Lychee",
    notesHeart: "Bulgarian Rose, Peony, Jasmine Sambac",
    notesBase: "White Musk, Ambrette, Cedarwood",
    description: "A nocturnal rose that blooms only under starlight. Rose de Minuit captures the ineffable beauty of a dew-kissed garden at midnight, where Bulgarian roses unfurl their petals alongside delicate jasmine and voluptuous peony.",
    imageUrl: "/images/rose-de-nuit.png",
    featured: "true",
  },
  {
    name: "Bois Mystique",
    family: "Woody",
    gender: "Men",
    price: 280,
    notesTop: "Cardamom, Ginger, Black Pepper",
    notesHeart: "Vetiver, Guaiac Wood, Iris",
    notesBase: "Labdanum, Ambergris, Leather",
    description: "A labyrinthine forest of ancient woods and aromatic spices. Bois Mystique is for the man who commands every room he enters — a bold, mysterious trail that lingers long after he has departed.",
    imageUrl: "/images/cedar-noir.png",
    featured: "false",
  },
  {
    name: "Aqua Serenissima",
    family: "Aquatic",
    gender: "Unisex",
    price: 195,
    notesTop: "Sea Salt, Aquatic Notes, Yuzu",
    notesHeart: "Ambrette, Orris, Jasmine",
    notesBase: "Driftwood, White Musk, Ambergris",
    description: "The crystalline waters of the Mediterranean distilled into a single flacon. Aqua Serenissima is a meditation on purity and freedom — the sensation of warm salt air and endless horizon.",
    imageUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=80",
    featured: "false",
  },
  {
    name: "Velvet Amber",
    family: "Oriental",
    gender: "Women",
    price: 260,
    notesTop: "Mandarin, Cinnamon, Cardamom",
    notesHeart: "Amber, Rose, Benzoin",
    notesBase: "Vanilla, Patchouli, Labdanum",
    description: "An opulent amber reverie wrapped in cashmere-soft florals. Velvet Amber is a declaration of sensuality — a fragrance that envelops the wearer in warmth and elegance from the first breath to the last.",
    imageUrl: "/images/amber-mystique.png",
    featured: "true",
  },
  {
    name: "Jardin de Grasse",
    family: "Floral",
    gender: "Women",
    price: 220,
    notesTop: "Green Leaves, Neroli, Aldehydes",
    notesHeart: "Tuberose, Ylang-Ylang, Magnolia",
    notesBase: "Oakmoss, Sandalwood, Musk",
    description: "Inspired by the legendary flower fields of Grasse, birthplace of perfumery. Jardin de Grasse is an impressionist painting in scent — lush, green, impossibly romantic, and utterly timeless.",
    imageUrl: "/images/white-jasmine.png",
    featured: "false",
  },
  {
    name: "Noir Encens",
    family: "Woody",
    gender: "Unisex",
    price: 310,
    notesTop: "Incense, Frankincense",
    notesHeart: "Myrrh, Olibanum, Dark Rose",
    notesBase: "Oud, Vetiver, Smoked Wood",
    description: "The sacred smoke of ancient rituals transformed into an extraordinary fragrance. Noir Encens bridges the spiritual and the earthly — a cathedral in darkness, where incense spirals toward vaulted heavens.",
    imageUrl: "/images/black-iris.png",
    featured: "true",
  },
  {
    name: "Citrus Soleil",
    family: "Citrus",
    gender: "Men",
    price: 175,
    notesTop: "Sicilian Lemon, Grapefruit, Petitgrain",
    notesHeart: "Neroli, White Tea, Ginger",
    notesBase: "Vetiver, Cedarwood, Ambergris",
    description: "A sun-drenched Mediterranean morning captured in glass. Citrus Soleil radiates the joie de vivre of the Riviera — bright, effortless, and utterly invigorating.",
    imageUrl: "/images/saffron-dreams.png",
    featured: "false",
  },
];

async function seed() {
  const [{ count: existing }] = await db.select({ count: count() }).from(productsTable);

  if (existing > 0) {
    console.log(`Database already has ${existing} products. Skipping seed.`);
    process.exit(0);
  }

  console.log("Seeding database with sample products...");

  for (const product of SAMPLE_PRODUCTS) {
    await db.insert(productsTable).values(product);
    console.log(`  ✓ Inserted: ${product.name}`);
  }

  console.log(`\nSeed complete! Inserted ${SAMPLE_PRODUCTS.length} products.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
