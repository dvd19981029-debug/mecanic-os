package com.mecanicos.app;

import android.content.Context;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private WebView printWebView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new AndroidPrintBridge(), "AndroidPrint");
        }
    }

    public class AndroidPrintBridge {
        @JavascriptInterface
        public void printHtml(final String html, final String jobName) {
            runOnUiThread(() -> {
                if (printWebView != null) {
                    printWebView.destroy();
                }
                printWebView = new WebView(MainActivity.this);
                WebSettings settings = printWebView.getSettings();
                settings.setJavaScriptEnabled(false);
                settings.setLoadsImagesAutomatically(true);
                settings.setDomStorageEnabled(true);

                final boolean[] printed = { false };
                printWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                        return false;
                    }

                    @Override
                    public void onPageFinished(final WebView view, String url) {
                        if (printed[0]) return;
                        printed[0] = true;
                        view.postDelayed(() -> {
                            PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                            if (printManager == null || isFinishing()) return;
                            String safeName = (jobName != null && !jobName.trim().isEmpty())
                                ? jobName.trim().replaceAll("(?i)\\.pdf$", "")
                                : "Presupuesto";
                            PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(safeName);
                            PrintAttributes attributes = new PrintAttributes.Builder()
                                .setMediaSize(PrintAttributes.MediaSize.NA_LETTER)
                                .setResolution(new PrintAttributes.Resolution("pdf", "pdf", 600, 600))
                                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                                .build();
                            printManager.print(safeName, adapter, attributes);
                        }, 300);
                    }
                });

                printWebView.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
            });
        }
    }
}

