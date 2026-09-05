package ru.mayusha.multiplication;
import android.app.Activity;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import android.os.Bundle;
import android.graphics.Color;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.net.Uri;
import android.view.View;
import android.view.WindowInsets;
import android.widget.FrameLayout;
import android.window.OnBackInvokedDispatcher;
import java.io.ByteArrayInputStream;
import java.io.IOException;
public class MainActivity extends Activity {
 private WebView web;
 private static final String HOST="mayusha.local";
 @Override public void onCreate(Bundle state){
  super.onCreate(state);
  FrameLayout frame=new FrameLayout(this);frame.setBackgroundColor(Color.rgb(246,243,255));
  web=new WebView(this);web.setBackgroundColor(Color.rgb(246,243,255));
  frame.addView(web,new FrameLayout.LayoutParams(-1,-1));setContentView(frame);
  frame.setOnApplyWindowInsetsListener((v,insets)->{
   if(android.os.Build.VERSION.SDK_INT>=30){android.graphics.Insets i=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());v.setPadding(i.left,i.top,i.right,i.bottom);}
   else{v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());}
   return insets;
  });
  frame.requestApplyInsets();
  getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
  web.getSettings().setJavaScriptEnabled(true);web.getSettings().setDomStorageEnabled(true);
  web.getSettings().setAllowFileAccess(false);web.getSettings().setAllowContentAccess(false);
  web.getSettings().setMediaPlaybackRequiresUserGesture(true);
  web.setWebViewClient(new WebViewClient(){
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest request){return true;}
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest request){
    Uri uri=request.getUrl();String path=uri.getPath();
    if("https".equals(uri.getScheme())&&HOST.equals(uri.getHost())&&path!=null){
     String file=path.equals("/")?"index.html":path.substring(1);
     if(file.equals("index.html")||file.equals("style.css")||file.equals("app.js")||file.equals("engine.js")||file.equals("names.js")||file.equals("petrovich.js")){
      String mime=file.endsWith(".html")?"text/html":file.endsWith(".css")?"text/css":"application/javascript";
      try{return new WebResourceResponse(mime,"UTF-8",getAssets().open(file));}catch(IOException ignored){}
     }
    }
    return new WebResourceResponse("text/plain","UTF-8",404,"Not Found",null,new ByteArrayInputStream(new byte[0]));
   }
  });
  web.addJavascriptInterface(new ShareBridge(), "MayushaAndroid");
  web.loadUrl("https://"+HOST+"/");
  if(android.os.Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_DEFAULT,()->handleBack());
 }
 public final class ShareBridge {
  @JavascriptInterface public void shareText(final String text){
   if(text==null||text.trim().isEmpty()||text.length()>4000)return;
   runOnUiThread(()->{
    if(web==null||isFinishing()||isDestroyed())return;
    Uri current=Uri.parse(web.getUrl()==null?"":web.getUrl());
    if(!"https".equals(current.getScheme())||!HOST.equals(current.getHost()))return;
    Intent send=new Intent(Intent.ACTION_SEND);
    send.setType("text/plain");
    send.putExtra(Intent.EXTRA_TEXT,text);
    send.putExtra(Intent.EXTRA_SUBJECT,"Просьба добавить время");
    try{startActivity(Intent.createChooser(send,"Выбери MAX, затем маму"));}
    catch(ActivityNotFoundException|SecurityException error){
     Toast.makeText(MainActivity.this,"Не удалось открыть отправку. Сообщение доступно в истории копилки.",Toast.LENGTH_LONG).show();
     web.evaluateJavascript("window.MayushaApp && window.MayushaApp.onShareUnavailable()",null);
    }
   });
  }
 }
 private void handleBack(){web.evaluateJavascript("window.MayushaApp ? window.MayushaApp.back() : false",value->{if(!"true".equals(value))finish();});}
 @Override public void onBackPressed(){handleBack();}
 @Override protected void onPause(){web.evaluateJavascript("window.MayushaApp && window.MayushaApp.pause()",null);web.onPause();super.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
 @Override protected void onDestroy(){if(web!=null){web.destroy();web=null;}super.onDestroy();}
}
