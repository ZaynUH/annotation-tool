import { supabase } from './supabase';

export async function saveLayersForImage(imageId: string, layers: any[]) 
{
  // Clean old layers
  const { error: deleteError } = await supabase
    .from('layers')
    .delete()
    .eq('image_id', imageId);

  if (deleteError) {
    return { error: deleteError.message };
  }

  // Prepare new layers to insert
  const layerInsert = layers.map((layer) => (
  {
    image_id: imageId,
    type: layer.type,
    colour: layer.colour,
    points: layer.points,
  }));

  const { error: insertError } = await supabase
    .from('layers')
    .insert(layerInsert);

  if (insertError) 
  {
    return { error: insertError.message };
  }

  return { success: true };
}
