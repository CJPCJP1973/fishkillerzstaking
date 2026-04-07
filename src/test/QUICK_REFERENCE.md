# Path Traversal Validation - Quick Reference

## For Developers: How to Add Validation

When working with Supabase Storage operations, always validate user-controlled path variables.

### ✅ Correct Implementation

```typescript
// 1. Construct the path
const path = `${sessionId}/${type}-${timestamp}.${ext}`;

// 2. Validate BEFORE storage operation
if (path.includes('..')) {
  throw new Error('Invalid file path');
}

// 3. Now safe to use
const { error } = await supabase.storage
  .from('bucket-name')
  .upload(path, file);
```

### ❌ Incorrect Implementation

```typescript
// DON'T: Validate inside the method chain
const { error } = await supabase.storage
  .from('bucket-name')
  .upload(path.includes('..') ? null : path, file); // ❌

// DON'T: Sanitize the path
const sanitized = path.replace(/\.\./g, ''); // ❌

// DON'T: Skip validation
const { error } = await supabase.storage
  .from('bucket-name')
  .upload(path, file); // ❌ No validation!
```

## Validation Checklist

When adding a new storage operation:

- [ ] Identify all user-controlled variables in the path
- [ ] Add validation check BEFORE the storage operation
- [ ] Use standalone if-statement (not inline)
- [ ] Throw generic error message
- [ ] Add tests for the new validation
- [ ] Test with malicious inputs

## User-Controlled Variables

Variables that need validation:
- ✅ Session IDs from URL parameters
- ✅ User IDs from auth
- ✅ File extensions from uploaded files
- ✅ Any path component from user input
- ✅ Storage paths from database

## Storage Operations to Protect

| Operation | Example | Needs Validation |
|-----------|---------|------------------|
| `upload()` | `storage.from('bucket').upload(path, file)` | ✅ Yes |
| `createSignedUrl()` | `storage.from('bucket').createSignedUrl(path, 300)` | ✅ Yes |
| `remove()` | `storage.from('bucket').remove([path])` | ✅ Yes |
| `download()` | `storage.from('bucket').download(path)` | ✅ Yes |
| `move()` | `storage.from('bucket').move(from, to)` | ✅ Yes (both paths) |

## Error Messages

Use these generic error messages:

```typescript
// For file paths
throw new Error('Invalid file path');

// For storage paths
throw new Error('Invalid storage path');

// Generic
throw new Error('Invalid path');
```

**Don't mention:**
- ❌ "path traversal"
- ❌ "directory traversal"
- ❌ "security"
- ❌ "attack"

## Testing Your Validation

Add tests to verify:

```typescript
it('should validate path before upload', () => {
  const maliciousPath = '../admin/file.jpg';
  
  expect(() => {
    if (maliciousPath.includes('..')) {
      throw new Error('Invalid file path');
    }
  }).toThrow('Invalid file path');
});

it('should accept valid paths', () => {
  const validPath = 'session-123/file.jpg';
  
  expect(() => {
    if (validPath.includes('..')) {
      throw new Error('Invalid file path');
    }
  }).not.toThrow();
});
```

## Common Patterns

### Pattern 1: File Upload

```typescript
const handleUpload = async (file: File) => {
  const ext = file.name.split('.').pop();
  const path = `${sessionId}/${type}-${Date.now()}.${ext}`;
  
  if (path.includes('..')) {
    throw new Error('Invalid file path');
  }
  
  await supabase.storage.from('bucket').upload(path, file);
};
```

### Pattern 2: Signed URL

```typescript
const getSignedUrl = async (storagePath: string) => {
  if (storagePath.includes('..')) {
    throw new Error('Invalid storage path');
  }
  
  const { data } = await supabase.storage
    .from('bucket')
    .createSignedUrl(storagePath, 300);
  
  return data?.signedUrl;
};
```

### Pattern 3: File Removal

```typescript
const removeFile = async (filePath: string) => {
  if (filePath.includes('..')) {
    throw new Error('Invalid file path');
  }
  
  await supabase.storage.from('bucket').remove([filePath]);
};
```

## Examples from Codebase

### IDVerification.tsx
```typescript
const ext = file.name.split(".").pop();
const filePath = `${user.id}/government-id.${ext}`;

if (filePath.includes('..')) throw new Error("Invalid file path");

await supabase.storage.from("user-ids").remove([filePath]);
await supabase.storage.from("user-ids").upload(filePath, file);
```

### ProofUpload.tsx
```typescript
const ext = file.name.split(".").pop();
const path = `${sessionId}/${type}-proof-${Date.now()}.${ext}`;

if (path.includes('..')) throw new Error('Invalid file path');

await supabase.storage.from("session-screenshots").upload(path, file);
```

### ScreenshotComparison.tsx
```typescript
// Upload validation
const path = `${sessionId}/${type}-${Date.now()}.${ext}`;
if (path.includes('..')) {
  throw new Error("Invalid file path");
}
await supabase.storage.from("session-screenshots").upload(path, file);

// Signed URL validation
const getSignedUrl = async (storagePath: string) => {
  if (storagePath.includes('..')) {
    throw new Error('Invalid storage path');
  }
  const { data } = await supabase.storage
    .from("session-screenshots")
    .createSignedUrl(storagePath, 300);
  return data?.signedUrl;
};
```

### SellerScreenshotUpload.tsx
```typescript
// useEffect validation
useEffect(() => {
  if (currentUrl) {
    if (currentUrl.includes('..')) {
      throw new Error('Invalid file path');
    }
    supabase.storage
      .from("session-screenshots")
      .createSignedUrl(currentUrl, 300);
  }
}, [currentUrl]);

// Upload validation
const path = `${sessionId}/${type}-${Date.now()}.${ext}`;
if (path.includes('..')) throw new Error('Invalid path');
await supabase.storage.from("session-screenshots").upload(path, file);
```

## FAQ

**Q: Why not just sanitize the path by removing `..`?**  
A: Sanitization can be bypassed. Rejection is more secure.

**Q: Should I validate paths from the database?**  
A: Yes, if they're used in storage operations. Defense in depth.

**Q: What about URL-encoded `..` like `%2e%2e`?**  
A: Current implementation doesn't catch this. It's a known limitation.

**Q: Can I validate once and reuse the path?**  
A: Yes! Validate once after construction, then use freely.

**Q: Should I validate in both frontend and backend?**  
A: Yes, always validate on the backend. Frontend validation is UX only.

## Need Help?

- See full test suite: `src/test/PATH_TRAVERSAL_TESTS.md`
- See test examples: `src/test/pathTraversal.test.ts`
- See component tests: `src/test/componentPathValidation.test.ts`

## Quick Test Command

```bash
# Test your changes
npm test pathTraversal

# Watch mode while developing
npm run test:watch
```
