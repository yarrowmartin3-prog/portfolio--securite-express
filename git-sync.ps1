param([string]$Msg = "chore: sync $(Get-Date -Format yyyy-MM-dd HH:mm)")

Write-Host "? Staging changes…" -ForegroundColor Cyan
git add -A

Write-Host "? Committing…" -ForegroundColor Cyan
git commit -m "$Msg" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "(nothing to commit)" -ForegroundColor DarkGray }

Write-Host "? Pull --rebase (sync with GitHub)…" -ForegroundColor Cyan
git pull --rebase origin main
if ($LASTEXITCODE -ne 0) {
  Write-Host "?? Rebase conflict. Open the red files in VS Code, fix, then run: git add -A; git rebase --continue" -ForegroundColor Yellow
  exit 1
}

Write-Host "? Push to GitHub…" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -eq 0) { Write-Host "? Done. GitHub Pages will update in ~60s." -ForegroundColor Green }
