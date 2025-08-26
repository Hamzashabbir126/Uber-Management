$mongoPath = "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe"
$dbPath = "C:\data\db"

# Create data directory if it doesn't exist
if (-not (Test-Path $dbPath)) {
    New-Item -ItemType Directory -Path $dbPath
}

# Start MongoDB
& $mongoPath --dbpath=$dbPath