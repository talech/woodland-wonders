# ADR-0007: Persistence

- Status: Accepted
- Date: 2026-11-26
- Deciders: human owner (approved M0-REVIEW "approve all"), director
- Source: [M0-REVIEW.md](../M0-REVIEW.md) §6.5

## Decision

- Save data follows `SaveDataV1` (M0-REVIEW §6.5), validated with zod and migrated through an ordered `vN→vN+1` chain.
- Revision mismatch discards the active board but keeps completion.
- Corrupt data is backed up under a separate key and replaced with defaults, never crashing.
- Storage is reached only through `StorageAdapter`; the app owns the adapter and save schema.
