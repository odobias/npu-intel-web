# Intel NPU web presentation

This is the page-by-page web version of `NPU-Performance-Through-Constraints-Intel-reworked.pptx`.

## Run locally

From `C:\Sources\AvastClient`:

```powershell
python -m http.server 8123 --directory presentations/npu-intel-web
```

Open <http://localhost:8123>.

The presentation is rendered on a fixed 1600×900 16:9 stage and scaled uniformly to fit the window. Non-16:9 windows receive letterboxing; the slide composition itself does not reflow.

## Controls

- `ArrowLeft` / `ArrowRight`, `PageUp` / `PageDown`, or `Space`: navigate
- Click the left or right half of the slide: navigate
- `Home` / `End`: first or last slide
- `F`: browser fullscreen
- `N`: toggle speaker notes
- `#slide-4`: open a specific slide directly

The site has no runtime dependencies or network-loaded assets. Use the browser's print dialog if a PDF export is needed.
