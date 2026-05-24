export interface Product {
  id: string;
  name: string;
  family: string;
  gender: string;
  price: number;
  image: string;
  notes: {
    top: string;
    heart: string;
    base: string;
  };
  description: string;
}

export const products: Product[] = [
  {
    id: "oud-royale",
    name: "Oud Royale",
    family: "Oriental",
    gender: "Unisex",
    price: 185,
    image: "/images/oud-royale.png",
    notes: {
      top: "Saffron, Nutmeg",
      heart: "Agarwood (Oud), Rose",
      base: "Patchouli, Amber, Vanilla",
    },
    description: "A majestic blend of rich oud and warm spices, evoking the opulence of a Middle Eastern palace.",
  },
  {
    id: "rose-de-nuit",
    name: "Rose de Nuit",
    family: "Floral",
    gender: "Women",
    price: 145,
    image: "/images/rose-de-nuit.png",
    notes: {
      top: "Bergamot, Pink Pepper",
      heart: "Damask Rose, Peony",
      base: "Musk, Vetiver",
    },
    description: "An intoxicating midnight rose, blooming in the shadows. Sensual, mysterious, and deeply romantic.",
  },
  {
    id: "amber-mystique",
    name: "Amber Mystique",
    family: "Oriental",
    gender: "Unisex",
    price: 165,
    image: "/images/amber-mystique.png",
    notes: {
      top: "Incense, Cinnamon",
      heart: "Amber, Labdanum",
      base: "Sandalwood, Vanilla",
    },
    description: "A glowing elixir of golden amber and ancient resins, radiating warmth and timeless elegance.",
  },
  {
    id: "cedar-noir",
    name: "Cedar Noir",
    family: "Woody",
    gender: "Men",
    price: 155,
    image: "/images/cedar-noir.png",
    notes: {
      top: "Cardamom, Grapefruit",
      heart: "Virginia Cedar, Vetiver",
      base: "Leather, Oakmoss",
    },
    description: "A bold and assertive woody fragrance. The dark strength of cedarwood wrapped in smooth leather.",
  },
  {
    id: "saffron-dreams",
    name: "Saffron Dreams",
    family: "Oriental",
    gender: "Unisex",
    price: 195,
    image: "/images/saffron-dreams.png",
    notes: {
      top: "Red Saffron, Bitter Orange",
      heart: "Jasmine, Caramel",
      base: "Ambergris, Cedarwood",
    },
    description: "The precious 'red gold' takes center stage in this gourmand-spicy masterpiece of supreme luxury.",
  },
  {
    id: "white-jasmine",
    name: "White Jasmine",
    family: "Floral",
    gender: "Women",
    price: 135,
    image: "/images/white-jasmine.png",
    notes: {
      top: "Neroli, Green Mandarin",
      heart: "Sambac Jasmine, Orange Blossom",
      base: "White Musk, Cedar",
    },
    description: "A pristine and luminous floral bouquet. The pure essence of jasmine caught in the morning dew.",
  },
  {
    id: "black-iris",
    name: "Black Iris",
    family: "Woody",
    gender: "Unisex",
    price: 175,
    image: "/images/black-iris.png",
    notes: {
      top: "Juniper Berries, Cypress",
      heart: "Iris Pallida, Myrrh",
      base: "Vanilla, Patchouli",
    },
    description: "A sophisticated and powdery scent, built around the rare and noble black iris.",
  },
  {
    id: "sandalwood-elixir",
    name: "Sandalwood Elixir",
    family: "Woody",
    gender: "Men",
    price: 160,
    image: "/images/sandalwood-elixir.png",
    notes: {
      top: "Coriander, Bergamot",
      heart: "Australian Sandalwood, Violet",
      base: "Tonka Bean, Musk",
    },
    description: "Creamy, smooth sandalwood elevated by subtle spices and soft florals. A modern classic.",
  },
  {
    id: "midnight-bergamot",
    name: "Midnight Bergamot",
    family: "Fresh",
    gender: "Unisex",
    price: 140,
    image: "/images/midnight-bergamot.png",
    notes: {
      top: "Calabrian Bergamot, Lemon",
      heart: "Lavender, Rosemary",
      base: "Amberwood, Vetiver",
    },
    description: "A sharp, exhilarating burst of nocturnal citrus, anchored by deep and aromatic woods.",
  },
  {
    id: "velvet-oud",
    name: "Velvet Oud",
    family: "Oriental",
    gender: "Men",
    price: 210,
    image: "/images/velvet-oud.png",
    notes: {
      top: "Davana, Black Pepper",
      heart: "Oud Wood, Leather",
      base: "Frankincense, Musk",
    },
    description: "The absolute pinnacle of our collection. A dark, velvet-smooth oud of unparalleled intensity and grace.",
  },
  {
    id: "gardenia-lumiere",
    name: "Gardenia Lumière",
    family: "Floral",
    gender: "Women",
    price: 150,
    image: "/images/gardenia-lumiere.png",
    notes: {
      top: "Pear, Red Berries",
      heart: "Gardenia, Frangipani",
      base: "Patchouli, Brown Sugar",
    },
    description: "A radiant and enchanting gardenia, sweetened with pear and grounded in warm, earthy patchouli.",
  },
  {
    id: "desert-wind",
    name: "Desert Wind",
    family: "Oriental",
    gender: "Unisex",
    price: 180,
    image: "/images/desert-wind.png",
    notes: {
      top: "Pink Pepper, Olibanum",
      heart: "Cinnamon, Dates",
      base: "Myrrh, Cedarwood",
    },
    description: "A warm and swirling tempest of desert spices and ancient resins. An unforgettable journey.",
  },
];