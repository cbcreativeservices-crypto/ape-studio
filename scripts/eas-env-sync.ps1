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

# --- validate the Sentry auth token BEFORE pushing it -----------------------
# WHY THIS EXISTS (2026-09-17): a WRONG token is worse than no token. Its mere
# presence makes the Sentry source-map upload MANDATORY in
# node_modules/@sentry/react-native/sentry.gradle, so a build runs ~21 minutes
# of Gradle and THEN dies on "401 Invalid token". That has already cost two
# builds. The Client Secret of the Sentry internal integration is NOT an auth
# token - pasting it is exactly what produced the 401. A real token comes from
# the TOKENS section of that integration.
#
# Verified 2026-09-17: the token then sitting in .env was REJECTED (401). So we
# now test it in two seconds and refuse to push one Sentry rejects, and we drive
# SENTRY_DISABLE_AUTO_UPLOAD from the result so EAS can never be left in the
# broken combination (upload demanded + no usable token).
$tokenOk = $false
if ($vals.ContainsKey("SENTRY_AUTH_TOKEN") -and -not [string]::IsNullOrWhiteSpace($vals["SENTRY_AUTH_TOKEN"])) {
    Write-Host "validating SENTRY_AUTH_TOKEN against sentry.io ..." -NoNewline
    # Same PowerShell 5.1 stderr trap as the push loop below: judge by exit code.
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    $null = & npx --yes @sentry/cli@latest --auth-token $vals["SENTRY_AUTH_TOKEN"] info
    $code = $LASTEXITCODE
    $ErrorActionPreference = $prev
    if ($code -eq 0) {
        $tokenOk = $true
        Write-Host " valid" -ForegroundColor Green
    }
    else {
        Write-Host " REJECTED BY SENTRY - not pushing it" -ForegroundColor Red
    }
}

if ($tokenOk) {
    # Real token: allow the upload, so crash reports arrive symbolicated.
    $vals["SENTRY_DISABLE_AUTO_UPLOAD"] = "false"
}
else {
    # No usable token: turn the upload OFF so the build cannot fail on it.
    # Crash reports still arrive, just unsymbolicated.
    $vals["SENTRY_DISABLE_AUTO_UPLOAD"] = "true"
    if ($vals.ContainsKey("SENTRY_AUTH_TOKEN")) { $vals.Remove("SENTRY_AUTH_TOKEN") }
    Write-Host ""
    Write-Host "SENTRY_DISABLE_AUTO_UPLOAD will be pushed as 'true' (upload off)." -ForegroundColor Yellow
    Write-Host "Builds will PASS; native crash reports arrive UNSYMBOLICATED." -ForegroundColor Yellow
    Write-Host "To get symbolication: put a token from the TOKENS section of the" -ForegroundColor Yellow
    Write-Host "Sentry internal integration in .env, then re-run this script." -ForegroundColor Yellow
    Write-Host ""
}

# name -> visibility
$plan = [ordered]@{
    "EXPO_PUBLIC_SENTRY_DSN"        = "sensitive"
    "EXPO_PUBLIC_APTABASE_APP_KEY"  = "sensitive"
    "SENTRY_ORG"                    = "plaintext"
    "SENTRY_AUTH_TOKEN"             = "secret"
    "SENTRY_DISABLE_AUTO_UPLOAD"    = "plaintext"
}

$missing = @()
foreach ($name in $plan.Keys) {
    if (-not $vals.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($vals[$name])) {
        $missing += $name
    }
}
if ($missing.Count -gt 0) {
    Write-Host ""
    Write-Host "NOT SET in $EnvFile, so they will be SKIPPED:" -ForegroundColor Yellow
    $missing | ForEach-Object {
        # SENTRY_AUTH_TOKEN can land here for either reason: genuinely absent, or
        # dropped just above because Sentry rejected it. Say which, so nobody
        # goes hunting in .env for a blank that is not there.
        if ($_ -eq "SENTRY_AUTH_TOKEN" -and -not $tokenOk) {
            Write-Host "  - $_  (present but REJECTED by Sentry, or blank)" -ForegroundColor Yellow
        }
        else {
            Write-Host "  - $_" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    Write-Host "SENTRY_ORG / SENTRY_AUTH_TOKEN only affect whether native crash" -ForegroundColor Yellow
    Write-Host "stack traces arrive readable. The build succeeds without them." -ForegroundColor Yellow
    Write-Host ""
}

$envArgs = @()
foreach ($e in $Environments) { $envArgs += "--environment"; $envArgs += $e }

# Counts real push failures only. Without this the script exits with whatever
# the LAST native command happened to return - e.g. the sentry-cli 401 above
# made a completely successful sync report exit 1.
$pushFailures = 0

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
            $pushFailures++
        }
    }
}

Write-Host ""
Write-Host "Verify with:" -ForegroundColor Cyan
Write-Host "  npx eas env:list production" -ForegroundColor Cyan
Write-Host ""
Write-Host "A 'secret' variable is write-only: EAS will show the name but never" -ForegroundColor DarkGray
Write-Host "the value again, including to you. That is expected." -ForegroundColor DarkGray

if ($pushFailures -gt 0) {
    Write-Host ""
    Write-Host "$pushFailures variable(s) FAILED to push." -ForegroundColor Red
    exit 1
}
exit 0
