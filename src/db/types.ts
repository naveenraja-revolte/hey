import type { memberships, teams, tickets, topics } from './app-schema';
import type { user } from './auth-schema';

export type Team = typeof teams.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Topic = typeof topics.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type AuthUser = typeof user.$inferSelect;
