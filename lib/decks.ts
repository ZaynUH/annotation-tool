import { supabase } from './supabase';

export async function createDeckWithImages(deckName: string, userId: string, images: string[]) {
  // Create the deck
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .insert([{ name: deckName, user_id: userId }])
    .select()
    .single();

  if (deckError || !deck) {
    return { error: deckError?.message || 'Failed to create deck' };
  }

  // Insert images linked to deck
  const imageInsert = images.map((url, index) => ({
    deck_id: deck.id,
    image_url: url,
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
      .map((img) => {
        const { data: publicUrl } = supabase
          .storage
          .from('images')
          .getPublicUrl(img.image_url); 
          
        return publicUrl?.publicUrl ?? '';
      });

    return {
      id: deck.id,
      name: deck.name,
      images: sortedImages,
    };
  });

  return { decks };
}

