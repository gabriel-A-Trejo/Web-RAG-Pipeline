export type Role = "user" | "assistant";

export type SearchResponse = {
  content: string;
  sources?: string[];
  time?: number;
  error?: string;
};

export type ChatMessage = {
  role: Role;
  searchResponse: SearchResponse;
};