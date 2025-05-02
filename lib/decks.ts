import { supabase } from './supabase';

const PROJECT_URL = 'https://sflyeuxvdpndrwuofgqb.supabase.co'; // ✅ Your project URL
const BUCKET = 'images';

export async function createDeckWithImages(deckName: string, userId: string, images: string[]) {
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .insert([{ name: deckName, user_id: userId }])
    .select()
    .single();

  if (deckError || !deck) {
    return { error: deckError?.message || 'Failed to create deck' };
  }

  const imageInsert = images.map((filename, index) => ({
    deck_id: deck.id,
    image_url: filename, // filename only, not full URL
    index,
  }));

  const { error: imageError } = await supabase.from('images').insert(imageInsert);

  if (imageError) {
    return { error: imageError.message };
  }

  return { deck };
}

export async function fetchDecksByUser(userId: string) {
  const { data, error } = await supabase
    .from('decks')
    .select('id, name, images (image_url, index)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return { error: error.message, decks: [] };

  const decks = data.map((deck) => {
    const sortedImages = (deck.images || [])
      .sort((a, b) => a.index - b.index)
      .map((img) => `${PROJECT_URL}/storage/v1/object/public/${BUCKET}/${img.image_url}`);

    return {
      id: deck.id,
      name: deck.name,
      images: sortedImages,
    };
  });

  return { decks };
}
