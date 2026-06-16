Add-Type -AssemblyName System.Drawing
$src = Join-Path (Get-Location) 'apps\web\public\icons\icon-source.png'
$srcImg = [System.Drawing.Image]::FromFile($src)
$sizes = 72,96,128,144,152,192,384,512
foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size,$size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($srcImg,0,0,$size,$size)
    $g.Dispose()
    $outPath = Join-Path (Get-Location) "apps\web\public\icons\icon-$size.png"
    $bmp.Save($outPath,[System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated icon-$size.png"
}
$srcImg.Dispose()
Write-Host "All icons done!"
