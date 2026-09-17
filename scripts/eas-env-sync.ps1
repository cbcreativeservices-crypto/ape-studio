<#
  eas-env-sync.ps1 - push the build-time environment variables from the local
  .env up to EAS, for all three environments (2026-09-17).

  WHY THIS EXISTS
  ---------------
  EAS builds in the cloud and `.env` is git-ignored, so the build NEVER sees
  your local file. Whatever is not in EAS is simply absent at build time. As of
  2026-09-17 EAS held only the two Supabase variables, which means a build would
  have shipped with crash reporting and analytics silently OFF - both SDKs
  no-op when their key is blank (src/features/telemetry/telemetry.ts).

  WHAT IT PUSHES
  --------------
    EXPO_PUBLIC_SENTRY_DSN        sensitive  - client identifier, ships in the binary by design
    EXPO_PUBLIC_APTABASE_APP_KEY  sensitive  - same
    SENTRY_ORG                    plaintext  - org slug, build-time only
    SENTRY_AUTH_TOKEN             secret     - REAL SECRET, build-time only, never in the bundle

  The first two already live in your .env. The last two you must fill in first:
  see the block at the bottom of .env for where to get them.

  ENCODING (learned the hard way 2026-09-17): this file must stay PURE ASCII and
  is saved UTF-8 WITH BOM. Windows PowerShell 5.1 decodes a BOM-less .ps1 as
  CP1252, so a UTF-8 em dash turns into bytes containing a double quote, which
  ends a string early and throws a bogus "Missing closing '}'" parse error.

  USAGE
      cd C:\Users\profe\dev\ape-studio; ./scripts/eas-env-sync.ps1
      cd C:\Users\profe\dev\ape-studio; ./scripts/eas-env-sync.ps1 -WhatIf

  Re-running is safe: --force overwrites an existing value. Nothing is printed
  except variable NAMES - no value is ever echoed to the console. The CLI's own
  chatter goes straight to the console; that is deliberate (see the note inside
  the loop about PowerShell 5.1 and NativeCommandError).
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string] $EnvFile = ".env",
    [string[]] $Environments = @("production", "preview", "development")
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
    Write-Error "No $EnvFile here. Run this from the repo root: cd C:\Users\profe\dev\ape-studio"
}

# --- read .env into a hashtable (values never printed) ----------------------
$vals = @{}
foreach ($line in Get-Content $EnvFile) {
    $t = $line.Trim()
    if ($t -eq "" -or $t.StartsWith("#")) { continue }
    $i = $t.IndexOf("=")
    if ($i -lt 1) { continue }
    $vals[$t.Substring(0, $i).Trim()] = $t.Substring($i + 1).Trim()
}

# name -> visibility
$plan = [ordered]@{
    "EXPO_PUBLIC_SENTRY_DSN"       = "sensitive"
    "EXPO_PUBLIC_APTABASE_APP_KEY" = "sensitive"
    "SENTRY_ORG"                   = "plaintext"
    "SENTRY_AUTH_TOKEN"            = "secret"
}

$missing = @()
foreach ($name in $plan.Keys) {
    if (-not $vals.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($vals[$name])) {
        $missing += $name
    }
}
if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "BLANK in $EnvFile, so they will be SKIPPED:" -ForegroundColor Yellow
    $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host ""
    Write-Host "SENTRY_ORG / SENTRY_AUTH_TOKEN only affect whether native crash" -ForegroundColor Yellow
    Write-Host "stack traces arrive readable. The build succeeds without them." -ForegroundColor Yellow
    Write-Host ""
}

$envArgs = @()
foreach ($e in $Environments) { $envArgs += "--environment"; $envArgs += $e }

foreach ($name in $plan.Keys) {
    if ($missing -contains $name) { continue }
    $visibility = $plan[$name]
    $target = "$name ($visibility) -> $($Environments -join ', ')"

    if ($PSCmdlet.ShouldProcess($target, "eas env:create")) {
        Write-Host "pushing $name ($visibility) ..." -NoNewline
        # WINDOWS POWERSHELL 5.1 TRAP (hit 2026-09-17): do NOT redirect a native
        # exe's stderr with 2>&1, and do not let $ErrorActionPreference='Stop'
        # cover this call. The eas CLI prints its "a new version is available"
        # notice on stderr; 5.1 wraps each such line in a NativeCommandError,
        # which under 'Stop' TERMINATES the script even though eas exited 0.
        # That killed this script halfway through its first real run, after the
        # Sentry DSN was pushed but before the Aptabase key. Let stderr go
        # straight to the console and judge success by $LASTEXITCODE alone.
        $prev = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        & npx eas env:create `
            --name $name `
            --value $vals[$name] `
            --visibility $visibility `
            --scope project `
            --force `
            --non-interactive `
            @envArgs
        $code = $LASTEXITCODE
        $ErrorActionPreference = $prev
        if ($code -eq 0) {
            Write-Host " ok" -ForegroundColor Green
        }
        else {
            Write-Host " FAILED (exit $code) - see the CLI output above" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Verify with:" -ForegroundColor Cyan
Write-Host "  npx eas env:list production" -ForegroundColor Cyan
Write-Host ""
Write-Host "A 'secret' variable is write-only: EAS will show the name but never" -ForegroundColor DarkGray
Write-Host "the value again, including to you. That is expected." -ForegroundColor DarkGray
