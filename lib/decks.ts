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

export async function deleteDeck(deckId: string) {
  // Step 1: Fetch image records for the deck
  const { data: images, error: fetchError } = await supabase
    .from('images')
    .select('id, image_url')
    .eq('deck_id', deckId);

  if (fetchError) return { error: fetchError.message };

  const imageIds = images.map(img => img.id);
  const imagePaths = images.map(img => img.image_url);

  // Step 2: Delete associated layers
  if (imageIds.length > 0) {
    const { error: layerError } = await supabase
      .from('layers')
      .delete()
      .in('image_id', imageIds);
    if (layerError) return { error: layerError.message };
  }

  // Step 3: Delete images from DB
  const { error: imageDbError } = await supabase
    .from('images')
    .delete()
    .eq('deck_id', deckId);
  if (imageDbError) return { error: imageDbError.message };

  // Step 4: Remove image files from storage
  if (imagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('images')
      .remove(imagePaths);
    if (storageError) return { error: storageError.message };
  }

  // Step 5: Delete the deck itself
  const { error: deckError } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId);
  if (deckError) return { error: deckError.message };

  return { success: true };
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
