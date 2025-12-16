import { relations } from 'drizzle-orm';
import { clients, agents, documents } from './schema';

// An agent can have many clients
export const agentsRelations = relations(agents, ({ many }) => ({
  clients: many(clients),
}));

// A client belongs to one agent
export const clientsRelations = relations(clients, ({ one, many }) => ({
  agent: one(agents, {
    fields: [clients.agentId],
    references: [agents.id],
  }),
  documents: many(documents),
}));

// A document belongs to one client
export const documentsRelations = relations(documents, ({ one }) => ({
    client: one(clients, {
        fields: [documents.clientId],
        references: [clients.id],
    }),
}));
