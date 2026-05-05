param(
    [Parameter(Mandatory=$true)]
    [string]$Name
)

Add-Type -AssemblyName System.Windows.Forms

$img = [System.Windows.Forms.Clipboard]::GetImage()

if ($img -eq $null) {
    Write-Host "Буфер обмена пуст! Сначала сделай скриншот (Win+Shift+S)" -ForegroundColor Red
    exit 1
}

$dir = "$PSScriptRoot\neverlove\website\public\images\maps"
if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }

$path = "$dir\$Name.png"
$img.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Сохранено: $path ($($img.Width)x$($img.Height))" -ForegroundColor Green
