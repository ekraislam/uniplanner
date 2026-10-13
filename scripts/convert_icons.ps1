Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\hp\.gemini\antigravity-ide\brain\26ffed42-fa0e-4dc5-aae0-943859fb1609\.user_uploaded\media_1791922544353.jpg"
if (-not (Test-Path $srcPath)) {
    Write-Error "Source image not found: $srcPath"
    exit 1
}

$src = [System.Drawing.Image]::FromFile($srcPath)

function Resize-Image($source, $width, $height, $targetPath) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($source, 0, 0, $width, $height)
    $g.Dispose()
    
    $dir = [System.IO.Path]::GetDirectoryName($targetPath)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated: $targetPath ($($width)x$($height))"
}

Resize-Image $src 512 512 "c:\Users\hp\Desktop\UniPlanner\public\icons\icon-512.png"
Resize-Image $src 192 192 "c:\Users\hp\Desktop\UniPlanner\public\icons\icon-192.png"
Resize-Image $src 512 512 "c:\Users\hp\Desktop\UniPlanner\public\icons\icon-maskable-512.png"
Resize-Image $src 192 192 "c:\Users\hp\Desktop\UniPlanner\public\icons\icon-maskable-192.png"
Resize-Image $src 512 512 "c:\Users\hp\Desktop\UniPlanner\public\app-logo.png"

$src.Dispose()
Write-Host "All icons converted and saved successfully!"
