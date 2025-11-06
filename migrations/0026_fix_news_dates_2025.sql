-- Fixa datum för nyhetsinlägg till 2025 (rätt år)

UPDATE news_posts 
SET published_at = '2025-10-15 10:00:00',
    created_at = '2025-10-15 10:00:00',
    updated_at = '2025-10-15 10:00:00'
WHERE id = 'news-1-youtube';

UPDATE news_posts 
SET published_at = '2025-09-20 14:00:00',
    created_at = '2025-09-20 14:00:00',
    updated_at = '2025-09-20 14:00:00'
WHERE id = 'news-2-hallands';

UPDATE news_posts 
SET published_at = '2025-08-15 09:00:00',
    created_at = '2025-08-15 09:00:00',
    updated_at = '2025-08-15 09:00:00'
WHERE id = 'news-3-nettavisen';

UPDATE news_posts 
SET published_at = '2025-07-10 11:00:00',
    created_at = '2025-07-10 11:00:00',
    updated_at = '2025-07-10 11:00:00'
WHERE id = 'news-4-europower';

UPDATE news_posts 
SET published_at = '2025-06-25 16:00:00',
    created_at = '2025-06-25 16:00:00',
    updated_at = '2025-06-25 16:00:00'
WHERE id = 'news-5-tv4';

