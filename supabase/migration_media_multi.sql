-- Amber — multiple attachments per memory
-- Run in the Supabase SQL Editor. Adds a jsonb array of attachments to each memory.
-- Existing single-file memories keep working: the app falls back to the old
-- media_path columns when this array is empty.

alter table public.content_items
  add column if not exists media jsonb not null default '[]'::jsonb;

-- Backfill existing single-file rows into the new array (safe to run once).
update public.content_items
set media = jsonb_build_array(
      jsonb_build_object(
        'path', media_path,
        'mime', coalesce(media_mime, 'application/octet-stream'),
        'filename', media_filename,
        'duration', media_duration,
        'kind', type
      )
    )
where media_path is not null
  and (media is null or jsonb_array_length(media) = 0);
