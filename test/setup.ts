import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Each test gets a fresh document. Without this, a component from one test is
// still mounted while the next one queries for its own, and the failure looks
// like a duplicate-match error somewhere unrelated.
afterEach(cleanup);
