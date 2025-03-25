Remove-Item -Force -Recurse -Path "public\*"
git add -A
git commit -m "%1"
git push origin main