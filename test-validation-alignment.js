// Quick test to verify the validation alignment
import { isValidUserIdFormat } from '../src/lib/dal/user';
import { CompleteProfileSchema } from '../src/lib/schemas/complete-profile-schema';

// Test cases
const testCases = [
  'validuser123', // Should be valid
  'abc', // Too short (< 4 chars)
  'verylongusernamethatistoolong', // Too long (> 15 chars)
  '123invalid', // Starts with number
  'invalid@user', // Contains invalid character
  'valid_user', // Valid with underscore
  'invalid__user', // Consecutive underscores
  'invalid_', // Ends with underscore
  'user name', // Contains space
];

console.log('Testing validation alignment between Schema and DAL:');
console.log('='.repeat(60));

testCases.forEach((testCase) => {
  // Test with Zod schema directly
  const schemaResult = CompleteProfileSchema.shape.userId.safeParse(testCase);

  // Test with DAL function
  const dalResult = isValidUserIdFormat(testCase);

  // Check if they match
  const match = schemaResult.success === dalResult;
  const status = match ? '✅' : '❌';

  console.log(`${status} "${testCase}"`);
  console.log(
    `  Schema: ${schemaResult.success ? 'valid' : 'invalid'} ${!schemaResult.success ? '(' + schemaResult.error.issues[0]?.message + ')' : ''}`
  );
  console.log(`  DAL:    ${dalResult ? 'valid' : 'invalid'}`);
  if (!match) {
    console.log(`  ⚠️  MISMATCH DETECTED!`);
  }
  console.log();
});
