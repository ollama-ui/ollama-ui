if (-Not (Get-Command Get-FileHash -ErrorAction SilentlyContinue)) {
    Write-Error 'PowerShell 5.0 or newer is required.' -ErrorAction Stop
} else {
    $hashes = Get-Content -Path .\resources.hash
    $files = Get-ChildItem -Path .\resources\*
    foreach ($file in $files) {
        $fileHash = (Get-FileHash -Path $file.FullName -Algorithm SHA256).Hash
        $expectedHash = ($hashes | Where-Object { $_ -match $file.Name }).Split(' ')[0]
        if ($fileHash -ne $expectedHash) {
            Write-Error "SHA256 check failed for $($file.Name)." -ErrorAction Stop
        }
    }
}
