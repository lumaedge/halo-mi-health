package com.halomibealth.app

import android.os.Bundle
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : TauriActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    window?.let { win ->
      win.statusBarColor = android.graphics.Color.parseColor("#f5f5f7")
      WindowInsetsControllerCompat(win, win.decorView).isAppearanceLightStatusBars = true
    }
  }
}
