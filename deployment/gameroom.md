# Gameroom launch

Istanbul implements Gameroom's shared URL contract at its normal web root:

- `?table=A1B2C3D4&launch=create&name=Ada` creates that exact table.
- `?table=A1B2C3D4&launch=join&name=Bora` waits for the host and joins automatically.
- Reopening either link resumes the authenticated player's seat, including during play.
- Names do not identify players. Independent Firebase identities may use the same name.
- `returnTo` is ignored; no navigation to caller-provided destinations occurs.

The lobby accommodates two to five players. The host can choose the map and add
bots; everyone readies and the host starts play. Normal five-letter invitations
continue to work, and generated invitation links preserve eight-character codes.
`gameroom-launch.json` advertises the contract for launcher tooling.

The integration uses Istanbul's existing immutable events, Firebase Auth and
Firestore rules. No Gameroom source or rule changes are required.

## Catalogue registration

After deployment, review and apply the single-entry catalogue update:

```sh
nix develop --command bun scripts/register-gameroom.ts
nix develop --command bun scripts/register-gameroom.ts --apply
```

Use `--play-url=https://anicolao.github.io/istanbul/prN/` to review a deployed PR.
After main deploys, rerun without that override to point to production.
The script rejects duplicate entries, preserves existing tabletop metadata
(`Title`, `URL`, `Hidden`, `Icon`) and unrelated fields, backs up the catalogue,
and uses an update-time precondition. Dry runs do not write anything.
