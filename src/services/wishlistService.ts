import { supabase } from '../lib/supabase';
import { WishlistItem } from '../types/wishlist';

/**
 * Add a course to a user's wishlist.
 */
export async function addToWishlist(
  userId: string,
  courseId: string
): Promise<{ data: WishlistItem | null; error: Error | null }> {
  try {
    const payload = {
      user_id: userId,
      course_id: courseId,
    };

    const { data, error } = await supabase
      .from('wishlist')
      .insert(payload)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }
    return { data: data as WishlistItem, error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
}

/**
 * Remove a course from a user's wishlist.
 */
export async function removeFromWishlist(
  userId: string,
  courseId: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
}

/**
 * Check if a course is in a user's wishlist.
 */
export async function isWishlisted(
  userId: string,
  courseId: string
): Promise<{ isWishlisted: boolean; item: WishlistItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      return { isWishlisted: false, item: null, error };
    }

    return {
      isWishlisted: !!data,
      item: (data as WishlistItem) || null,
      error: null,
    };
  } catch (err: any) {
    return { isWishlisted: false, item: null, error: err };
  }
}

/**
 * Toggle wishlist status for a course (adds if not wishlisted, removes if wishlisted).
 */
export async function toggleWishlist(
  userId: string,
  courseId: string
): Promise<{ isWishlisted: boolean; data: WishlistItem | null; error: Error | null }> {
  try {
    const checkResult = await isWishlisted(userId, courseId);
    if (checkResult.error) {
      return { isWishlisted: false, data: null, error: checkResult.error };
    }

    if (checkResult.isWishlisted) {
      const removeResult = await removeFromWishlist(userId, courseId);
      if (removeResult.error) {
        return { isWishlisted: true, data: checkResult.item, error: removeResult.error };
      }
      return { isWishlisted: false, data: null, error: null };
    } else {
      const addResult = await addToWishlist(userId, courseId);
      if (addResult.error) {
        return { isWishlisted: false, data: null, error: addResult.error };
      }
      return { isWishlisted: true, data: addResult.data, error: null };
    }
  } catch (err: any) {
    return { isWishlisted: false, data: null, error: err };
  }
}

/**
 * Fetch all wishlist items for a user.
 */
export async function getWishlist(
  userId: string
): Promise<{ data: WishlistItem[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error };
    }
    return { data: (data as WishlistItem[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
}

export const wishlistService = {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  isWishlisted,
  getWishlist,
};

export default wishlistService;
