// import { normalizeUserId, RESERVED_USER_IDS } from '@/lib/dal/user';
// import { CompleteProfileSchema } from '@/lib/schemas/complete-profile-schema';

// export interface UserIdValidation {
//   isValid: boolean;
//   errors: string[];
// }

// /**
//  * Validates userId format on the client side (synchronous validation)
//  * This is used in conjunction with the async availability check
//  * Uses CompleteProfileSchema for consistent validation rules
//  */
// export function validateUserIdFormat(userId: string): UserIdValidation {
//   const errors: string[] = [];

//   if (!userId || typeof userId !== 'string') {
//     errors.push('User ID is required');
//     return { isValid: false, errors };
//   }

//   // Use the Zod schema validation for format checking
//   const userIdSchema = CompleteProfileSchema.shape.userId;
//   const result = userIdSchema.safeParse(userId);

//   if (!result.success) {
//     // Extract Zod validation errors
//     result.error.issues.forEach((issue) => {
//       errors.push(issue.message);
//     });
//   }

//   // Additional check for reserved words (not covered by Zod schema)
//   const normalized = normalizeUserId(userId);
//   if (RESERVED_USER_IDS.includes(normalized)) {
//     errors.push('This User ID is reserved and cannot be used');
//   }

//   return {
//     isValid: errors.length === 0,
//     errors,
//   };
// }

// /**
//  * Hook for client-side userId validation
//  */
// export function useUserIdValidation(userId: string): UserIdValidation {
//   return validateUserIdFormat(userId);
// }
