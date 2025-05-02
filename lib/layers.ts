import { supabase } from './supabase';
import { Layer } from '../context/AnnotationContext';

export async function saveLayersForImage(imageId: string, layers: Layer[]) {
  // Clean up existing layers first
  const { error: deleteError } = await supabase
    .from('layers')
    .delete()
    .eq('image_id', imageId);

  if (deleteError) return { error: deleteError };

  // Save new layers
  const inserts = layers.map((layer) => ({
    image_id: imageId,
    type: layer.type,
    colour: layer.colour,
    points: layer.points,
  }));

  const { error: insertError } = await supabase
    .from('layers')
    .insert(inserts);

  return { error: insertError };
}
