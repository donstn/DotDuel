package com.dotduel.app;

import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.getcapacitor.Plugin;
import com.getcapacitor.annotation.CapacitorPlugin;

// The WebView would scale every font itself (px and vw included) by the system
// font size. Hand the scale to the page instead (main.tsx sets it as the root
// font size), so the web and the app enlarge text the same way. Plugins load
// before the page, so the interface is there on the first load. A font-size
// change recreates the activity (fontScale is not in the manifest's
// configChanges), so reading it once is enough.
@CapacitorPlugin(name = "FontScale")
public class FontScalePlugin extends Plugin {
    @Override
    public void load() {
        final float fontScale = getContext().getResources().getConfiguration().fontScale;
        WebView webView = getBridge().getWebView();
        webView.getSettings().setTextZoom(100);
        webView.addJavascriptInterface(new Object() {
            @JavascriptInterface
            public float fontScale() {
                return fontScale;
            }
        }, "DotDuelNative");
    }
}
