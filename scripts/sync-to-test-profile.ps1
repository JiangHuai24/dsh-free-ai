# Sync the repo into the isolated test profile's node_modules.
# Why not link: a linked plugin resolves @deepseek-ai/* from its real path,
# which is outside the profile, so the host-provided modules are not found.
# A real copy under the profile's node_modules resolves them normally.
$src = 'D:\WorkBuddy\dsh-free-ai'
$dst = 'D:\WorkBuddy\dsh-iso\home\profiles\iso\node_modules\free-ai-by-jh'
if (-not (Test-Path $src)) { Write-Host 'src missing'; exit 1 }
if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
New-Item -ItemType Directory -Path $dst -Force | Out-Null
robocopy $src $dst /E /XD .git node_modules /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { Write-Host ('copy failed: ' + $LASTEXITCODE); exit 1 }
Write-Host ('synced -> ' + $dst)
Write-Host 'restart the isolated instance to load the new code.'