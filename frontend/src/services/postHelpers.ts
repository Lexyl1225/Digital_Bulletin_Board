import type { Category, Post } from '../types';

/**
 * Pure post-list mutation shared by the self-service "Save Post" flow and the
 * admin dashboard's "Edit Post" flow, so both stay in sync on category
 * movement / completion rules instead of drifting apart.
 */
export const applyPostSave = (
  existingPosts: Post[],
  postData: Partial<Post>,
  targetCategoryForAdd: Category
): Post[] => {
  const now = new Date().toISOString();
  const isCompleted = postData.status === 'Completed' || postData.category === 'Completed Works';

  if (postData.id) {
    return existingPosts.map((p) => {
      if (p.id !== postData.id) return p;

      const originalCat =
        p.category !== 'Completed Works' ? p.category : p.originalCategory || 'Ongoing Works';
      const finalCategory = isCompleted ? 'Completed Works' : postData.category || originalCat;

      return {
        ...p,
        ...postData,
        category: finalCategory,
        originalCategory: originalCat,
        status: isCompleted ? 'Completed' : postData.status || p.status,
        completionPercent: isCompleted ? 100 : postData.completionPercent ?? p.completionPercent,
        completedAt: isCompleted ? p.completedAt || now : undefined,
        updatedAt: now,
      } as Post;
    });
  }

  const targetCat = postData.category || targetCategoryForAdd;
  const finalCategory = isCompleted ? 'Completed Works' : targetCat;

  const newPost: Post = {
    id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title: postData.title || 'Untitled Work',
    category: finalCategory,
    originalCategory: targetCat !== 'Completed Works' ? targetCat : 'Ongoing Works',
    content: postData.content || '',
    status: isCompleted ? 'Completed' : postData.status || 'In Progress',
    priority: postData.priority || 'Medium',
    startDate: postData.startDate,
    dueDate: postData.dueDate,
    tags: postData.tags || [],
    createdAt: now,
    updatedAt: now,
    completedAt: isCompleted ? now : undefined,
    assigneeNotes: postData.assigneeNotes,
    completionPercent: isCompleted ? 100 : postData.completionPercent ?? 0,
  };

  return [newPost, ...existingPosts];
};
