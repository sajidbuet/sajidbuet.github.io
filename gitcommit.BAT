Remove-Item -Force -Recurse -Path "isableFastRender\*"
Remove-Item -Force -Recurse -Path "public\*"
rm public
Remove-Item -Force -Path "*.zip"
git add -A
git commit -m "%1"
git push origin main