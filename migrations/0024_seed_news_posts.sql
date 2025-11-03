-- Seed data för news_posts
-- Lägger till fem initiala nyhetsinlägg

INSERT INTO news_posts (
  id, 
  title, 
  excerpt, 
  content, 
  image_url, 
  external_link, 
  published_at, 
  is_published, 
  created_at, 
  updated_at
) VALUES 
(
  'news-1-youtube',
  'Elbespararen - YouTube Video',
  'Se vår video om hur Elbespararen hjälper dig spara pengar på elräkningen',
  'Här kan du se vår video om hur Elbespararen fungerar och hjälper hushåll att spara pengar på sina elräkningar.',
  'https://img.youtube.com/vi/upV45wGq1xM/maxresdefault.jpg',
  'https://www.youtube.com/watch?v=upV45wGq1xM&feature=youtu.be',
  datetime('now'),
  1,
  datetime('now'),
  datetime('now')
),
(
  'news-2-hallands',
  'Hallanningen Mathias vill ha billigare el åt folket',
  'Hallands Affärer intervjuar Mathias om hans mission att göra el billigare för alla',
  'Hallands Affärer har skrivit en artikel om Mathias och Elbespararen, och hur han arbetar för att hjälpa hushåll få billigare el.',
  NULL,
  'https://www.hn.se/hallands-affarer/hallanningen-mathias-vill-ha-billigare-el-at-folket.8d348169-2735-4eb6-aac6-2564991592cb',
  datetime('now'),
  1,
  datetime('now'),
  datetime('now')
),
(
  'news-3-nettavisen',
  'Strømmarkedets Robin Hood tar oppgaven',
  'Norsk debatt om Elbespararen och hur den hjälper konsumenter spara pengar',
  'En artikel i Nettavisen där Elbespararen beskrivs som strømmarkedets Robin Hood - en tjänst som gör det som norska byråkrater och politiker borde ha gjort för länge sedan.',
  NULL,
  'https://www.nettavisen.no/norsk-debatt/strommarkedets-robin-hood-tar-oppgaven-norske-byrakrater-og-politikere-skulle-ha-gjort-for-lenge-siden/o/5-95-340860',
  datetime('now'),
  1,
  datetime('now'),
  datetime('now')
),
(
  'news-4-europower',
  'Influenseren som endret strømsalg-bransjen',
  'Europower skriver om hur Elbespararen förändrar elbranschen',
  'Europower diskuterar hur Elbespararen och dess skapare har påverkat och förändrat sättet vi tänker på elförsäljning och konsumenternas möjligheter att spara pengar.',
  NULL,
  'https://www.europower.no/forbruker/influenseren-som-endret-stromsalg-bransjen/2-1-1536646',
  datetime('now'),
  1,
  datetime('now'),
  datetime('now')
),
(
  'news-5-tv4',
  'Elens Robin Hood – så tjänar du tusenlappar på några sekunder',
  'TV4 berättar om Elbespararen och hur man kan spara stora summor på sina elräkningar',
  'TV4 har gjort en artikel om Elbespararen och hur den hjälper hushåll att spara pengar genom att hitta bättre elavtal. Artikeln beskriver tjänsten som "Elens Robin Hood".',
  NULL,
  'https://www.tv4.se/artikel/74FUjPcjANGlHisSDgUePQ/elens-robin-hood-sa-tjaenar-du-tusenlappar-pa-nagra-sekunder',
  datetime('now'),
  1,
  datetime('now'),
  datetime('now')
);

