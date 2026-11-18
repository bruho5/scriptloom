$ErrorActionPreference = 'Stop'
npm ci
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run build:web
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
go test ./...
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
go run github.com/tc-hib/go-winres@v0.3.3 make --arch amd64
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
$env:GOOS='windows'; $env:GOARCH='amd64'; $env:CGO_ENABLED='0'
go build -buildvcs=false -trimpath -ldflags='-s -w -H windowsgui' -o out/Scriptloom.exe .
exit $LASTEXITCODE
