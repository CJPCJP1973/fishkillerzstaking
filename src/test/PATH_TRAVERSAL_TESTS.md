# Path Traversal Validation Tests

This directory contains comprehensive unit tests for the path traversal attack mitigation implemented in the Supabase SDK storage operations.

## Test Files

### 1. `pathTraversal.test.ts`
Core validation logic tests covering:
- Basic path validation (detecting `..` in paths)
- Error handling and error messages
- Path construction scenarios from user input
- Real-world attack vectors
- Integration with file operations
- Component-specific validation requirements
- Validation placement and timing

### 2. `pathTraversalIntegration.test.ts`
Integration tests covering:
- File upload flow validation
- Error handling in realistic scenarios
- Validation timing (before storage operations)
- Multiple validation points
- Real-world usage scenarios
- Edge cases and boundary conditions
- Security best practices validation

### 3. `componentPathValidation.test.ts`
Component-specific tests covering:
- **IDVerification.tsx**: Government ID upload path validation
- **ProofUpload.tsx**: Deposit and payout proof validation
- **ScreenshotComparison.tsx**: Screenshot upload and signed URL validation
- **SellerScreenshotUpload.tsx**: Seller screenshot upload validation
- Cross-component consistency
- Validation placement verification
- File extension handling

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test pathTraversal.test.ts

# Run with coverage
npm test -- --coverage
```

## What is Being Tested

### Security Validations
✅ Paths containing `..` are rejected  
✅ Validation happens BEFORE storage operations  
✅ Error messages don't reveal security details  
✅ Paths are rejected, not sanitized  
✅ All user-controlled path components are validated  

### Components Covered
✅ IDVerification.tsx - Government ID uploads  
✅ ProofUpload.tsx - Deposit/payout proof uploads  
✅ ScreenshotComparison.tsx - Admin screenshot verification  
✅ SellerScreenshotUpload.tsx - Seller screenshot uploads  

### Storage Operations Protected
✅ `storage.upload()` - File uploads  
✅ `storage.createSignedUrl()` - Signed URL generation  
✅ `storage.remove()` - File deletion  

### Attack Vectors Tested
✅ Basic directory traversal (`../../../etc/passwd`)  
✅ Malicious session IDs from URL parameters  
✅ Crafted file extensions  
✅ Multiple traversal attempts in one path  
✅ Traversal at different positions (start, middle, end)  
✅ Windows-style paths with backslashes  

## Test Coverage

The tests ensure:
1. **100% coverage** of path validation logic
2. **All components** with storage operations are tested
3. **All storage operations** (upload, createSignedUrl, remove) are validated
4. **Validation timing** is correct (before operations)
5. **Error messages** are consistent and secure
6. **Edge cases** are handled properly

## Known Limitations

The current implementation checks for literal `..` strings. The following are NOT currently detected:
- URL-encoded traversal (`%2e%2e`)
- Unicode variations
- Null byte injection

These limitations are documented in the tests for future enhancement.

## Adding New Tests

When adding new storage operations or components:

1. Add validation logic to the component:
   ```typescript
   if (path.includes('..')) {
     throw new Error('Invalid file path');
   }
   ```

2. Add tests to verify:
   - Valid paths are accepted
   - Malicious paths are rejected
   - Validation happens before storage operation
   - Error message is appropriate

3. Update this README with the new component/operation

## Security Best Practices Verified

✅ **Reject, don't sanitize**: Paths with `..` are rejected entirely  
✅ **Validate early**: Checks happen before any storage operation  
✅ **Standalone validation**: Validation is in separate if-statements  
✅ **Generic errors**: Error messages don't mention "path traversal"  
✅ **Consistent implementation**: Same validation logic across all components  

## References

- Original vulnerability: AIK_supabase_sdk_storage_path_traversal
- Remediation: Validate all user-controlled path variables for `..`
- Implementation: Added validation checks before all storage operations
