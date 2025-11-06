-- Uppdatera datum för nyhetsinlägg till mer rimliga publiceringsdatum

UPDATE news_posts 
SET published_at = '2024-10-15 10:00:00',
    created_at = '2024-10-15 10:00:00',
    updated_at = '2024-10-15 10:00:00'
WHERE id = 'news-1-youtube';

UPDATE news_posts 
SET published_at = '2024-09-20 14:00:00',
    created_at = '2024-09-20 14:00:00',
    updated_at = '2024-09-20 14:00:00'
WHERE id = 'news-2-hallands';

UPDATE news_posts 
SET published_at = '2024-08-15 09:00:00',
    created_at = '2024-08-15 09:00:00',
    updated_at = '2024-08-15 09:00:00'
WHERE id = 'news-3-nettavisen';

UPDATE news_posts 
SET published_at = '2024-07-10 11:00:00',
    created_at = '2024-07-10 11:00:00',
    updated_at = '2024-07-10 11:00:00'
WHERE id = 'news-4-europower';

UPDATE news_posts 
SET published_at = '2024-06-25 16:00:00',
    created_at = '2024-06-25 16:00:00',
    updated_at = '2024-06-25 16:00:00'
WHERE id = 'news-5-tv4';

