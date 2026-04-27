export type { ConversationRepository } from "./repository.js"
export { SqliteRepository } from "./sqlite.js"

import { SqliteRepository } from "./sqlite.js"
import type { ConversationRepository } from "./repository.js"

export function createRepository(): ConversationRepository {
  // Future: check DATABASE_URL env var and return a PostgresRepository instead
  return new SqliteRepository(process.env.DATABASE_PATH)
}
