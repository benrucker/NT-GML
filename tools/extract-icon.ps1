# Extracts resources/icon.png from the game's own executable icon resource.
#
#   pwsh tools/extract-icon.ps1 [-Game "D:\...\Nuclear Throne"] [-Size 256]
#
# Windows only: it asks user32's PrivateExtractIcons for the icon at the
# requested size (the .ico inside nuclearthrone.exe carries a real 256x256
# entry, not an upscale) and saves it through System.Drawing as 8-bit RGBA PNG.
# The result is Vlambeer's artwork; see LICENSE, "Nuclear Throne icon".
param(
	[string]$Game = "D:\Games\Steam\steamapps\common\Nuclear Throne",
	[int]$Size = 256,
	[string]$Out = (Join-Path $PSScriptRoot "..\resources\icon.png")
)
$ErrorActionPreference = "Stop"
Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices;
public static class NtIcon {
  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  public static extern uint PrivateExtractIcons(string file, int idx, int cx, int cy, IntPtr[] phicon, uint[] piconid, uint nIcons, uint flags);
  [DllImport("user32.dll")] public static extern bool DestroyIcon(IntPtr h);
}
'@
Add-Type -AssemblyName System.Drawing
$exe = Join-Path $Game "nuclearthrone.exe"
$handles = New-Object IntPtr[] 1
$ids = New-Object uint32[] 1
$n = [NtIcon]::PrivateExtractIcons($exe, 0, $Size, $Size, $handles, $ids, 1, 0)
if ($n -lt 1 -or $handles[0] -eq [IntPtr]::Zero) { throw "no ${Size}x${Size} icon in $exe" }
$bitmap = [System.Drawing.Icon]::FromHandle($handles[0]).ToBitmap()
if ($bitmap.Width -ne $Size -or $bitmap.Height -ne $Size) { throw "got $($bitmap.Width)x$($bitmap.Height), wanted $Size" }
$bitmap.Save((Resolve-Path (Split-Path $Out)).Path + "\" + (Split-Path $Out -Leaf), [System.Drawing.Imaging.ImageFormat]::Png)
$bitmap.Dispose()
[NtIcon]::DestroyIcon($handles[0]) | Out-Null
"wrote $Out ($((Get-Item $Out).Length) bytes)"
