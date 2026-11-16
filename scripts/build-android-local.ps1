# Local Android builds on Windows (ported from Heartloop).
#   bun run build:android:local                      test APK, signed with the debug key: install on devices, not for Play
#   bun run build:android:aab -- -VersionCode 1       Play-ready AAB signed with your upload key (credentials.json)
# Without -VersionCode the AAB asks EAS for the last versionCode and adds 1 (needs an EAS project + login).
param(
  [ValidateSet('Debug', 'Release')]
  [string]$Configuration = 'Release',
  # Build a Play-ready AAB signed with your upload key instead of a test APK.
  [switch]$Bundle,
  # The AAB's versionCode. Default: EAS's current Android versionCode + 1.
  [int]$VersionCode = 0
)

$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$androidRoot = Join-Path $projectRoot 'android'
$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
$cmake = Join-Path $sdkRoot 'cmake\3.31.6\bin\cmake.exe'

if ($env:OS -ne 'Windows_NT') { throw 'This local build command is for Windows.' }
if (-not (Test-Path $cmake)) {
  throw 'Install Android SDK CMake 3.31.6 first (Android Studio > SDK Manager > SDK Tools > Show Package Details).'
}
if ($Bundle -and $Configuration -ne 'Release') { throw 'An AAB for Play is always a Release build.' }

$gradle = Join-Path $androidRoot 'gradlew.bat'
$gradleProperties = Join-Path $androidRoot 'gradle.properties'
$ready = (Test-Path $gradle) -and (Test-Path $gradleProperties) -and
    (Select-String -Path $gradleProperties -Pattern '^android\.cmakeVersion=3\.31\.6$' -Quiet) -and
    (Select-String -Path $gradleProperties -Pattern '^expo\.android\.cmakeObjectPathMax=250$' -Quiet)

if ($Bundle) {
  # Like EAS's autoIncrement: one past the version code EAS last used.
  if ($VersionCode -le 0) {
    # EAS prints notices on stderr; Windows PowerShell turns any native stderr into a
    # terminating error under 'Stop', so cmd drops stderr before PowerShell sees it.
    Push-Location $projectRoot
    try {
      $raw = (& cmd /c 'bunx eas-cli build:version:get --platform android --json --non-interactive 2>nul') -join "`n"
    } finally { Pop-Location }
    if ($LASTEXITCODE -ne 0 -or $raw.IndexOf('{') -lt 0) {
      throw 'Could not read the versionCode from EAS (no EAS project yet, or not signed in: bunx eas-cli whoami). Pass one instead; the first Play upload uses 1: bun run build:android:aab -- -VersionCode 1'
    }
    $VersionCode = [int](($raw.Substring($raw.IndexOf('{')) | ConvertFrom-Json).versionCode) + 1
  }
  # app.config.js hands this to prebuild, which writes it into build.gradle.
  $env:RS_ANDROID_VERSION_CODE = "$VersionCode"
}

# A Play bundle always re-runs prebuild so android/ carries app.json as it is now
# (version, versionCode, plugins); without --clean, so Gradle's earlier outputs are reused.
# Test APKs reuse android/ when it's already set up.
if ($Bundle -or -not $ready) {
  Push-Location $projectRoot
  try {
    if ($ready) { & bunx expo prebuild --platform android --no-install } else { & bunx expo prebuild --platform android --clean --no-install }
    if ($LASTEXITCODE -ne 0) { throw 'Expo prebuild failed.' }
  } finally { Pop-Location }
}

if (-not $Bundle) {
  $task = "app:assemble$Configuration"
  Push-Location $androidRoot
  try {
    & $gradle $task -x lint -x test --configure-on-demand --build-cache '-PreactNativeArchitectures=arm64-v8a' --console=plain
    if ($LASTEXITCODE -ne 0) { throw "Android $Configuration build failed." }
  } finally { Pop-Location }

  $variant = $Configuration.ToLowerInvariant()
  $apk = Join-Path $androidRoot "app\build\outputs\apk\$variant\app-$variant.apk"
  if (-not (Test-Path $apk)) { throw "Build finished but APK was not found at $apk" }
  Write-Output "Local $Configuration APK: $apk"
  if ($Configuration -eq 'Release') {
    Write-Output 'This APK uses the generated debug signing key for device testing. It cannot replace your Play Store signing key.'
  }
  exit 0
}

# ── Play bundle ──────────────────────────────────────────────────────────────
# Your own upload key instead of EAS's (no Expo account needed):
#   keytool -genkeypair -v -storetype JKS -keystore credentials/android/upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
# then write credentials.json beside package.json:
#   { "android": { "keystore": { "keystorePath": "credentials/android/upload.jks", "keystorePassword": "…", "keyAlias": "upload", "keyPassword": "…" } } }
# Keep both safe and backed up: every future upload (local or EAS) must be signed with this same key.
# The upload key comes from credentials.json (EAS's format; download it with
# `bunx eas-cli credentials -p android` → Download credentials). It is gitignored
# and never printed. Gradle gets the key through ORG_GRADLE_PROJECT_* variables
# (Android Studio's injected signing properties), so passwords stay off the
# command line and android/ is never edited by hand.
$credentialsFile = Join-Path $projectRoot 'credentials.json'
if (-not (Test-Path $credentialsFile)) {
  throw 'credentials.json not found. Either run: bunx eas-cli credentials -p android, pick production, then "Download credentials" (saves credentials.json and the keystore here), or make your own upload key (see the note at the top of this section).'
}
$keystore = (Get-Content $credentialsFile -Raw | ConvertFrom-Json).android.keystore
if ($null -eq $keystore -or -not $keystore.keystorePath) { throw 'credentials.json has no android.keystore entry.' }
$storeFile = if ([System.IO.Path]::IsPathRooted($keystore.keystorePath)) { $keystore.keystorePath } else { Join-Path $projectRoot $keystore.keystorePath }
if (-not (Test-Path $storeFile)) { throw "Keystore not found at $storeFile" }

$appConfig = (Get-Content (Join-Path $projectRoot 'app.json') -Raw | ConvertFrom-Json).expo
$versionName = $appConfig.version

$buildGradle = Join-Path $androidRoot 'app\build.gradle'
if (-not (Select-String -Path $buildGradle -Pattern "versionCode $VersionCode\b" -Quiet)) {
  throw "Prebuild didn't write versionCode $VersionCode into android\app\build.gradle."
}
Write-Output "Building $($appConfig.android.package) $versionName ($VersionCode) as an AAB for Play..."

$injected = @{
  'ORG_GRADLE_PROJECT_android.injected.signing.store.file'     = $storeFile
  'ORG_GRADLE_PROJECT_android.injected.signing.store.password' = $keystore.keystorePassword
  'ORG_GRADLE_PROJECT_android.injected.signing.key.alias'      = $keystore.keyAlias
  'ORG_GRADLE_PROJECT_android.injected.signing.key.password'   = $keystore.keyPassword
}
foreach ($k in $injected.Keys) { [Environment]::SetEnvironmentVariable($k, $injected[$k], 'Process') }

Push-Location $androidRoot
try {
  # Every architecture (the gradle.properties default): Play serves each device its own slice.
  & $gradle 'app:bundleRelease' -x lint -x test --configure-on-demand --build-cache --console=plain
  if ($LASTEXITCODE -ne 0) { throw 'Android bundle build failed.' }
} finally {
  Pop-Location
  foreach ($k in $injected.Keys) { [Environment]::SetEnvironmentVariable($k, $null, 'Process') }
}

$aab = Join-Path $androidRoot 'app\build\outputs\bundle\release\app-release.aab'
if (-not (Test-Path $aab)) { throw "Build finished but the AAB was not found at $aab" }

# Check the bundle really carries the version we asked for before it goes to Play.
$manifest = Get-ChildItem (Join-Path $androidRoot 'app\build\intermediates') -Recurse -Filter AndroidManifest.xml |
  Where-Object { $_.FullName -match 'bundle' -and $_.FullName -match 'release' } | Select-Object -First 1
if (-not $manifest -or -not (Select-String -Path $manifest.FullName -Pattern "android:versionCode=`"$VersionCode`"" -Quiet)) {
  throw "The bundle's manifest doesn't carry versionCode $VersionCode ($($manifest.FullName)). Don't upload it."
}

$out = Join-Path $projectRoot "buildapidslush-$versionName-$VersionCode.aab"
New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
Copy-Item $aab $out -Force
Write-Output "Play bundle: $out"
Write-Output "Signed with your upload key. Next EAS build must use a higher versionCode: run  bunx eas-cli build:version:set -p android  and enter $VersionCode."
