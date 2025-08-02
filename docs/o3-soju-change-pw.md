### ✅ Soju **does** support changing a user’s password at runtime

| Feature                                                                                                                                      | Present in **v0.8.0**?                                       | Evidence                                                                                                                                                          | Notes                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `sojuctl user update` sub‑command                                                                                                            | **Yes**                                                      | Man page entry shows                                                                                                                                              |                                                                                          |
| `user update [username] [options…]` and states *“The options are the same as the user create command.”* ([Ubuntu Manpages][1])               | Works via CLI or any BouncerServ admin connection.           |                                                                                                                                                                   |                                                                                          |
| `‑password <plaintext>` option accepted by `user update`                                                                                     | **Yes**                                                      | The shared options list for `user create` includes `‑password <password>`; since `user update` re‑uses that option set, the flag is valid. ([Ubuntu Manpages][1]) | Soju hashes the plaintext with bcrypt before saving, so you **do not** hash it yourself. |
| Limitations                                                                                                                                  | • Username **cannot** be changed (`‑username` flag invalid). |                                                                                                                                                                   |                                                                                          |
| • Only admins may update other users; a user may update their **own** password by omitting the `<username>` argument. ([Ubuntu Manpages][1]) |                                                              |                                                                                                                                                                   |                                                                                          |

---

## How to invoke it

```bash
# As an admin, change Alice’s password
sojuctl user update alice -password "xK3!nfV9rLD2"
```

* `sojuctl` finds the admin socket (default `/run/soju/admin`) via the same config file you already mounted for other commands.
* Exit status 0 means success; any non‑zero exit status or stderr output indicates an error (e.g., user not found).

### From Node/Next .js

```ts
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

export async function changeSojuPassword(username: string, newPassword: string) {
  const cmd =
    `sojuctl user update ${username} -password "${newPassword.replace(/"/g, '\\"')}"`;
  try {
    const { stdout, stderr } = await execAsync(cmd, { timeout: 10_000 });
    if (stderr) throw new Error(stderr.trim());
    return { ok: true, output: stdout.trim() };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
```

*Run this right after a successful login or account‑provision step to rotate the password while keeping the same Soju account and history.*

---

## Pros & Cons of updating on every login

| ✔ Pros                                                                                                                               | ✖ Cons                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| *Clean state* – no need to track the bcrypt hash in your own DB; you always know the current plaintext (the one you just generated). | Requires running `sojuctl` (extra process spawn) on every sign‑in; modest overhead but noticeable under very high load.                                              |
| User keeps the same Soju account, backlog, and network settings.                                                                     | If two concurrent logins occur and each rotates the password, the second rotation wins; the first client might be kicked if it reconnects later with the old secret. |
| Keeps bcrypt cost, format, and any future Soju changes abstracted; you just supply plaintext.                                        | You must hold the plaintext password in memory long enough to send it to both Soju **and** the IRC client (The Lounge). Store/handle it carefully.                   |

**Mitigation for race conditions:** throttle password change to “first login per 24 h” or wrap the exec call in a mutex keyed by username.

---

### Bottom line

* **Yes,** `sojuctl user update ‑password` is fully supported in Soju v0.8.0.
* Use it exactly as you would `user create`, but omit other flags unless you need them.
* Integrating it with your Next.js backend is just a small `child_process.exec` call against the shared admin socket.

[1]: https://manpages.ubuntu.com/manpages/noble/man1/soju.1.html "Ubuntu Manpage:

       soju - IRC bouncer
    "
