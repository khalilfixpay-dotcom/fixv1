/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Lead data structure
 */
export interface Lead {
  id: number;
  name: string;
  industry: string;
  location: string;
  email: string;
  phone: string;
  website: string;
  emailUnlocked?: boolean;
  phoneUnlocked?: boolean;
  isImported?: boolean;
}

/**
 * Request to add/import leads to source CSV
 */
export interface AddLeadsRequest {
  leads: Lead[];
}

/**
 * Response from adding leads
 */
export interface AddLeadsResponse {
  success: boolean;
  message: string;
  count: number;
}

/**
 * Saved list (for list persistence)
 */
export interface SavedList {
  id: string;
  name: string;
  leads: Lead[];
  createdAt: number;
}

/**
 * Request to save lists
 */
export interface SaveListsRequest {
  lists: SavedList[];
}

/**
 * Response from saving lists
 */
export interface SaveListsResponse {
  success: boolean;
  message: string;
}

/**
 * Response from loading saved lists from file
 */
export interface LoadListsResponse {
  lists: SavedList[];
  success: boolean;
}
