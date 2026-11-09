package com.mecanicos.app;

import android.content.ClipData;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends BridgeActivity {
    private WebView printWebView;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        try {
            WebView.enableSlowWholeDocumentDraw();
        } catch (Throwable ignored) {}
        registerPlugin(AndroidPrintPlugin.class);
        super.onCreate(savedInstanceState);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new AndroidPrintBridge(), "AndroidPrint");
        }
    }

    @CapacitorPlugin(name = "AndroidPrint")
    public static class AndroidPrintPlugin extends Plugin {
        @Override
        public void load() {
            super.load();
            if (getActivity() instanceof MainActivity && getBridge() != null && getBridge().getWebView() != null) {
                MainActivity activity = (MainActivity) getActivity();
                getBridge().getWebView().addJavascriptInterface(activity.new AndroidPrintBridge(), "AndroidPrint");
            }
        }

        @PluginMethod
        public void printHtml(PluginCall call) {
            String html = call.getString("html", "");
            String jobName = call.getString("jobName", "Presupuesto");
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).generateAndSharePdfFromHtml(html, jobName);
            }
            call.resolve();
        }

        @PluginMethod
        public void shareBase64Pdf(PluginCall call) {
            String base64 = call.getString("base64", "");
            String fileName = call.getString("fileName", "Documento.pdf");
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).saveAndShareBase64Pdf(base64, fileName);
            }
            call.resolve();
        }
    }

    public class AndroidPrintBridge {
        @JavascriptInterface
        public void printHtml(final String html, final String jobName) {
            generateAndSharePdfFromHtml(html, jobName);
        }

        @JavascriptInterface
        public void shareBase64Pdf(final String base64Pdf, final String fileName) {
            saveAndShareBase64Pdf(base64Pdf, fileName);
        }
    }

    public void generateAndSharePdfFromHtml(final String html, final String jobName) {
        runOnUiThread(() -> {
            if (isFinishing()) return;
            Toast.makeText(MainActivity.this, "Generando PDF...", Toast.LENGTH_SHORT).show();

            String cleanName = (jobName != null && !jobName.trim().isEmpty())
                ? jobName.trim().replaceAll("(?i)\\.pdf$", "").replaceAll("[^0-9A-Za-z_\\-]", "_")
                : "Presupuesto";
            if (cleanName.isEmpty()) cleanName = "Presupuesto";
            final String fileName = cleanName + ".pdf";

            ViewGroup rootView = findViewById(android.R.id.content);
            if (printWebView != null) {
                try {
                    if (printWebView.getParent() instanceof ViewGroup) {
                        ((ViewGroup) printWebView.getParent()).removeView(printWebView);
                    }
                    printWebView.destroy();
                } catch (Throwable ignored) {}
                printWebView = null;
            }

            final int pageWidth = 816;   // 8.5 in * 96 dpi
            final int pageHeight = 1056; // 11 in * 96 dpi

            printWebView = new WebView(MainActivity.this);
            printWebView.setTranslationX(-20000f);
            if (rootView != null) {
                rootView.addView(printWebView, new FrameLayout.LayoutParams(pageWidth, FrameLayout.LayoutParams.WRAP_CONTENT));
            }

            WebSettings settings = printWebView.getSettings();
            settings.setJavaScriptEnabled(false);
            settings.setLoadsImagesAutomatically(true);
            settings.setDomStorageEnabled(true);
            settings.setUseWideViewPort(false);
            settings.setLoadWithOverviewMode(false);

            String printCss = "<style>" +
                ".no-print-toolbar{display:none!important;}" +
                "html,body{background:#ffffff!important;margin:0!important;padding:0!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}" +
                ".page-container{box-shadow:none!important;margin:0!important;width:100%!important;max-width:100%!important;box-sizing:border-box!important;}" +
                "</style>";
            String modifiedHtml = (html != null && html.contains("</head>"))
                ? html.replace("</head>", printCss + "</head>")
                : (printCss + (html != null ? html : ""));

            final boolean[] rendered = { false };
            printWebView.setWebViewClient(new WebViewClient() {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    return false;
                }

                @Override
                public void onPageFinished(final WebView view, String url) {
                    if (rendered[0]) return;
                    rendered[0] = true;
                    view.postDelayed(() -> {
                        if (isFinishing()) return;
                        try {
                            view.measure(
                                View.MeasureSpec.makeMeasureSpec(pageWidth, View.MeasureSpec.EXACTLY),
                                View.MeasureSpec.makeMeasureSpec(0, View.MeasureSpec.UNSPECIFIED)
                            );
                            int measuredHeight = view.getMeasuredHeight();
                            int totalHeight = Math.max(measuredHeight, pageHeight);
                            view.layout(0, 0, pageWidth, totalHeight);

                            int totalPages = Math.max(1, (int) Math.ceil((double) totalHeight / pageHeight));
                            if (totalPages > 1 && (totalHeight % pageHeight) > 0 && (totalHeight % pageHeight) < 30) {
                                totalPages -= 1;
                            }
                            if (totalPages > 25) totalPages = 25;

                            PdfDocument pdfDocument = new PdfDocument();
                            for (int i = 0; i < totalPages; i++) {
                                PdfDocument.PageInfo pageInfo = new PdfDocument.PageInfo.Builder(pageWidth, pageHeight, i + 1).create();
                                PdfDocument.Page page = pdfDocument.startPage(pageInfo);
                                Canvas canvas = page.getCanvas();
                                canvas.drawColor(Color.WHITE);
                                canvas.save();
                                canvas.translate(0, -i * pageHeight);
                                view.draw(canvas);
                                canvas.restore();
                                pdfDocument.finishPage(page);
                            }

                            File pdfFile = new File(getCacheDir(), fileName);
                            try (FileOutputStream fos = new FileOutputStream(pdfFile)) {
                                pdfDocument.writeTo(fos);
                            }
                            pdfDocument.close();

                            saveFileToDownloads(pdfFile, fileName);
                            sharePdfFile(pdfFile, fileName);
                        } catch (Throwable err) {
                            Toast.makeText(MainActivity.this, "Error al generar PDF: " + err.getMessage(), Toast.LENGTH_LONG).show();
                        } finally {
                            try {
                                if (view.getParent() instanceof ViewGroup) {
                                    ((ViewGroup) view.getParent()).removeView(view);
                                }
                                view.destroy();
                            } catch (Throwable ignored) {}
                            if (printWebView == view) printWebView = null;
                        }
                    }, 450);
                }
            });

            printWebView.loadDataWithBaseURL("https://localhost/", modifiedHtml, "text/html", "UTF-8", null);
        });
    }

    public void saveAndShareBase64Pdf(final String base64Pdf, final String rawFileName) {
        runOnUiThread(() -> {
            if (isFinishing()) return;
            try {
                String cleanName = (rawFileName != null && !rawFileName.trim().isEmpty())
                    ? rawFileName.trim().replaceAll("(?i)\\.pdf$", "").replaceAll("[^0-9A-Za-z_\\-]", "_")
                    : "Documento";
                final String fileName = cleanName + ".pdf";
                byte[] pdfBytes = Base64.decode(base64Pdf, Base64.DEFAULT);
                File pdfFile = new File(getCacheDir(), fileName);
                try (FileOutputStream fos = new FileOutputStream(pdfFile)) {
                    fos.write(pdfBytes);
                }
                saveFileToDownloads(pdfFile, fileName);
                sharePdfFile(pdfFile, fileName);
            } catch (Throwable err) {
                Toast.makeText(MainActivity.this, "Error al guardar PDF: " + err.getMessage(), Toast.LENGTH_LONG).show();
            }
        });
    }

    private void saveFileToDownloads(File sourceFile, String fileName) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ContentValues values = new ContentValues();
                values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
                values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);
                ContentResolver resolver = getContentResolver();
                Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                if (uri != null) {
                    try (OutputStream os = resolver.openOutputStream(uri);
                         FileInputStream fis = new FileInputStream(sourceFile)) {
                        if (os != null) {
                            byte[] buffer = new byte[8192];
                            int len;
                            while ((len = fis.read(buffer)) != -1) {
                                os.write(buffer, 0, len);
                            }
                        }
                    }
                    Toast.makeText(MainActivity.this, "PDF descargado: " + fileName, Toast.LENGTH_SHORT).show();
                }
            }
        } catch (Throwable ignored) {}
    }

    private void sharePdfFile(File pdfFile, String fileName) {
        Uri contentUri = FileProvider.getUriForFile(
            MainActivity.this,
            getPackageName() + ".fileprovider",
            pdfFile
        );
        Intent shareIntent = new Intent(Intent.ACTION_SEND);
        shareIntent.setType("application/pdf");
        shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
        shareIntent.putExtra(Intent.EXTRA_TITLE, fileName);
        shareIntent.setClipData(ClipData.newRawUri(fileName, contentUri));
        shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

        Intent chooser = Intent.createChooser(shareIntent, "Compartir o Guardar PDF");
        chooser.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        startActivity(chooser);
    }
}
