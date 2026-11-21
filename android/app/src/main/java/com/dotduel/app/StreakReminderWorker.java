package com.dotduel.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.Data;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import org.json.JSONObject;

// Runs at reminder time. Asks reminder_status(key) whether the player already
// played the UTC day `day` (anywhere); if so, nothing is shown. When the check
// can't be made (offline), the reminder is shown anyway.
public class StreakReminderWorker extends Worker {
    private static final String CHANNEL = "streak";
    private static final int NOTIFICATION_ID = 4201;

    public StreakReminderWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
    }

    @NonNull
    @Override
    public Result doWork() {
        Data in = getInputData();
        String day = in.getString("day");
        if (day == null) return Result.success();
        // Too late: that UTC day is over (phone was off / deep sleep).
        if (System.currentTimeMillis() >= in.getLong("deadline", Long.MAX_VALUE)) return Result.success();
        if (playedAlready(in.getString("url"), in.getString("apikey"), in.getString("key"), day)) {
            return Result.success();
        }
        show(in.getString("title"), in.getString("body"));
        return Result.success();
    }

    private boolean playedAlready(String url, String apikey, String key, String day) {
        if (url == null || url.isEmpty() || key == null || key.isEmpty()) return false;
        HttpURLConnection c = null;
        try {
            c = (HttpURLConnection) new URL(url + "/rest/v1/rpc/reminder_status").openConnection();
            c.setRequestMethod("POST");
            c.setConnectTimeout(10_000);
            c.setReadTimeout(10_000);
            c.setDoOutput(true);
            c.setRequestProperty("Content-Type", "application/json");
            c.setRequestProperty("apikey", apikey);
            byte[] body = new JSONObject().put("p_key", key).toString().getBytes(StandardCharsets.UTF_8);
            try (OutputStream os = c.getOutputStream()) {
                os.write(body);
            }
            if (c.getResponseCode() != 200) return false;
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            try (InputStream is = c.getInputStream()) {
                byte[] b = new byte[1024];
                int n;
                while ((n = is.read(b)) > 0) buf.write(b, 0, n);
            }
            String text = buf.toString("UTF-8").trim();
            if (!text.startsWith("{")) return false;
            String last = new JSONObject(text).optString("last", "");
            // 'YYYY-MM-DD' strings compare in date order.
            return !last.isEmpty() && !"null".equals(last) && last.compareTo(day) >= 0;
        } catch (Exception e) {
            return false;
        } finally {
            if (c != null) c.disconnect();
        }
    }

    private void show(String title, String body) {
        Context ctx = getApplicationContext();
        NotificationManagerCompat nm = NotificationManagerCompat.from(ctx);
        if (!nm.areNotificationsEnabled()) return;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(CHANNEL, ctx.getString(R.string.streak_channel), NotificationManager.IMPORTANCE_DEFAULT);
            ctx.getSystemService(NotificationManager.class).createNotificationChannel(ch);
        }
        Intent open = ctx.getPackageManager().getLaunchIntentForPackage(ctx.getPackageName());
        PendingIntent tap = open == null ? null
            : PendingIntent.getActivity(ctx, 0, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_dotduel)
            .setColor(0xFF7BDB95)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setAutoCancel(true)
            .setContentIntent(tap);
        try {
            nm.notify(NOTIFICATION_ID, b.build());
        } catch (SecurityException e) {
            // notification permission revoked meanwhile
        }
    }
}
