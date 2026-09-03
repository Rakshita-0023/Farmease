/**
 * Boundary for trusted agricultural knowledge sources. Implementations should
 * return source metadata, not generated prose: { id, title, url, publisher,
 * accessedAt }. The default provider is intentionally empty until an official
 * ICAR/government source is integrated with permission and provenance.
 */
class KnowledgeProvider {
  async findSources() { return []; }
}

class EmptyKnowledgeProvider extends KnowledgeProvider {
  async findSources() { return []; }
}

module.exports = { KnowledgeProvider, EmptyKnowledgeProvider };
