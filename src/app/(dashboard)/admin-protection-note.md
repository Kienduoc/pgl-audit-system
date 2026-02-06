import { authorize } from '@/lib/auth'

// Use this for any sub-route that needs Admin-only access
// Note: This is a placeholder or utility component if we need granular admin checks. 
// For now, we are protecting /audits which covers most staff operations.
// We can also protect specific admin routes if we create /admin folder later.
