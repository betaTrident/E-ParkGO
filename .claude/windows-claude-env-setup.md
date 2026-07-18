# Windows Claude Environment Setup

Use this guide when Claude Code needs to run against OpenRouter on Windows and
you want the environment set at the OS or shell level instead of depending on a
settings file.

Reference: [OpenRouter Claude Code integration guide](https://openrouter.ai/docs/cookbook/coding-agents/claude-code-integration)

## Recommended Setup

Use one auth path at a time.

OpenRouter path:

- Set `OPENROUTER_API_KEY`
- Set `ANTHROPIC_BASE_URL` to `https://openrouter.ai/api`
- Set `ANTHROPIC_AUTH_TOKEN` to the same OpenRouter key
- Leave `ANTHROPIC_API_KEY` empty

Managed login path:

- Run `claude /login`
- Unset `ANTHROPIC_AUTH_TOKEN`
- Do not keep an OpenRouter auth token active in the same shell

## PowerShell Session Example

```powershell
$env:OPENROUTER_API_KEY = "OPENROUTER_API_KEY"
$env:ANTHROPIC_BASE_URL = "https://openrouter.ai/api"
$env:ANTHROPIC_AUTH_TOKEN = $env:OPENROUTER_API_KEY
$env:ANTHROPIC_API_KEY = ""
```

## Persistent Windows Setup

If you want the values to survive new terminals, set them in your Windows user
environment instead of only in a transient shell session.

```powershell
[Environment]::SetEnvironmentVariable(
  "OPENROUTER_API_KEY",
  "OPENROUTER_API_KEY",
  "User"
)
[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_BASE_URL",
  "https://openrouter.ai/api",
  "User"
)
[Environment]::SetEnvironmentVariable(
  "ANTHROPIC_AUTH_TOKEN",
  "OPENROUTER_API_KEY",
  "User"
)
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "", "User")
```

## Auth Conflicts

If both `ANTHROPIC_AUTH_TOKEN` and a managed `/login` key are present,
authentication can behave inconsistently.

To switch back to the OpenRouter path:

- Run `claude /logout`
- Remove the managed login key from the shell
- Restart the terminal so the new environment is picked up

To switch back to managed login:

- Unset `ANTHROPIC_AUTH_TOKEN`
- Clear any OpenRouter-specific shell overrides
- Re-run `claude /login`

## Quick Check

After updating the environment, open a fresh terminal and verify the active
values before launching Claude Code.
