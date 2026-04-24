# Converts logo1.png -> axionpad.ico (16/32/48/256 px, PNG-compressed)
# Uses Windows .NET Framework only — no external tools required.
# Windows Vista+ supports PNG chunks inside ICO files natively.

Add-Type -AssemblyName System.Drawing

$sizes   = @(16, 32, 48, 256)
$pngPath = [System.IO.Path]::GetFullPath("$PSScriptRoot\..\src\main\resources\com\axionpad\icons\logo1.png")
$icoPath = [System.IO.Path]::GetFullPath("$PSScriptRoot\..\src\main\resources\com\axionpad\icons\axionpad.ico")

if (-not (Test-Path $pngPath)) {
    Write-Error "logo1.png introuvable : $pngPath"
    exit 1
}

Write-Host "[ICO] Lecture de $pngPath..."
$src = [System.Drawing.Image]::FromFile($pngPath)

# Render each size to PNG bytes
$pngDataList = @()
foreach ($sz in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($sz, $sz, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g   = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode  = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode      = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode    = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $sz, $sz)
    $g.Dispose()

    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $pngDataList += ,($ms.ToArray())
    $ms.Dispose()
    Write-Host "  [ICO] ${sz}x${sz} rendu"
}
$src.Dispose()

# Build ICO binary — header (6 bytes) + directory (16 bytes * N) + image blobs
$out = New-Object System.IO.MemoryStream
$bw  = New-Object System.IO.BinaryWriter($out)

$bw.Write([uint16]0)               # Reserved
$bw.Write([uint16]1)               # Type: 1 = ICO
$bw.Write([uint16]$sizes.Count)    # Number of images

# First image blob starts right after all directory entries
$dataOffset = [uint32](6 + 16 * $sizes.Count)

for ($i = 0; $i -lt $sizes.Count; $i++) {
    $sz   = $sizes[$i]
    $data = $pngDataList[$i]
    # Width/height byte 0 means 256 in the ICO spec
    $bw.Write([byte]$(if ($sz -ge 256) { 0 } else { $sz }))   # Width
    $bw.Write([byte]$(if ($sz -ge 256) { 0 } else { $sz }))   # Height
    $bw.Write([byte]0)      # ColorCount (0 = truecolor, no palette)
    $bw.Write([byte]0)      # Reserved
    $bw.Write([uint16]1)    # ColorPlanes
    $bw.Write([uint16]32)   # BitsPerPixel
    $bw.Write([uint32]$data.Length)   # Size of image data
    $bw.Write([uint32]$dataOffset)    # Offset of image data
    $dataOffset += [uint32]$data.Length
}

foreach ($data in $pngDataList) { $bw.Write($data) }
$bw.Flush()

[System.IO.File]::WriteAllBytes($icoPath, $out.ToArray())
$out.Dispose()
$bw.Dispose()

Write-Host "[ICO] Cree avec succes : $icoPath"
Write-Host "[ICO] Tailles incluses : $($sizes -join 'px, ')px"
