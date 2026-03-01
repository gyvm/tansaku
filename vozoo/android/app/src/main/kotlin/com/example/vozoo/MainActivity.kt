package com.example.vozoo

import android.Manifest
import android.content.pm.PackageManager
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.app.ActivityCompat
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.io.FileOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder

class MainActivity : FlutterActivity() {
    private val CHANNEL = "com.example.vozoo/recorder"
    private val EVENT_CHANNEL = "com.example.vozoo/recorder_events"
    private var recorderService: RecorderService? = null

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        recorderService = RecorderService(this)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL).setMethodCallHandler { call, result ->
            recorderService?.handle(call, result)
        }

        EventChannel(flutterEngine.dartExecutor.binaryMessenger, EVENT_CHANNEL).setStreamHandler(recorderService)
    }
}

class RecorderService(private val activity: MainActivity) : EventChannel.StreamHandler {
    private var isRecording = false
    private var audioRecord: AudioRecord? = null
    private var recordingThread: Thread? = null
    private var startTime: Long = 0
    private var eventSink: EventChannel.EventSink? = null
    private val handler = Handler(Looper.getMainLooper())
    private var timerRunnable: Runnable? = null

    companion object {
        const val SAMPLE_RATE = 48000
        const val CHANNEL_CONFIG = AudioFormat.CHANNEL_IN_MONO
        const val AUDIO_FORMAT = AudioFormat.ENCODING_PCM_16BIT
    }

    fun handle(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "start" -> startRecording(result)
            "stop" -> stopRecording(result)
            else -> result.notImplemented()
        }
    }

    private fun startRecording(result: MethodChannel.Result) {
        if (ActivityCompat.checkSelfPermission(activity, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(activity, arrayOf(Manifest.permission.RECORD_AUDIO), 1)
            result.error("PERM_ERROR", "Permission not granted", null)
            return
        }

        val minBufferSize = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT)
        audioRecord = AudioRecord(MediaRecorder.AudioSource.MIC, SAMPLE_RATE, CHANNEL_CONFIG, AUDIO_FORMAT, minBufferSize)

        if (audioRecord?.state != AudioRecord.STATE_INITIALIZED) {
            result.error("REC_ERROR", "AudioRecord initialization failed", null)
            return
        }

        val outputFile = File(activity.filesDir, "recording.wav")

        isRecording = true
        startTime = System.currentTimeMillis()
        audioRecord?.startRecording()

        recordingThread = Thread {
            writeAudioDataToFile(outputFile, minBufferSize)
        }
        recordingThread?.start()
        startTimer()

        result.success(null)
    }

    private fun stopRecording(result: MethodChannel.Result) {
        if (!isRecording) {
            result.error("REC_ERROR", "Not recording", null)
            return
        }

        isRecording = false
        audioRecord?.stop()
        audioRecord?.release()
        audioRecord = null
        recordingThread?.join()
        stopTimer()

        val duration = System.currentTimeMillis() - startTime
        val outputFile = File(activity.filesDir, "recording.wav")

        // Update WAV header with correct sizes
        updateWavHeader(outputFile)

        val response = mapOf(
            "path" to outputFile.absolutePath,
            "duration" to duration
        )
        result.success(response)
    }

    private fun writeAudioDataToFile(file: File, bufferSize: Int) {
        val data = ByteArray(bufferSize)
        val fos = FileOutputStream(file)

        // Write placeholder header
        writeWavHeader(fos, 0, 0, SAMPLE_RATE, 1, 16)

        while (isRecording) {
            val read = audioRecord?.read(data, 0, bufferSize) ?: 0
            if (read > 0) {
                fos.write(data, 0, read)
            }
        }

        fos.close()
    }

    private fun writeWavHeader(fos: FileOutputStream, totalAudioLen: Long, totalDataLen: Long, sampleRate: Int, channels: Int, byteRate: Int) {
        val header = ByteArray(44)
        val byteRateVal = sampleRate * channels * 16 / 8

        header[0] = 'R'.code.toByte()
        header[1] = 'I'.code.toByte()
        header[2] = 'F'.code.toByte()
        header[3] = 'F'.code.toByte()
        // 4-7 size placeholder
        header[8] = 'W'.code.toByte()
        header[9] = 'A'.code.toByte()
        header[10] = 'V'.code.toByte()
        header[11] = 'E'.code.toByte()
        header[12] = 'f'.code.toByte()
        header[13] = 'm'.code.toByte()
        header[14] = 't'.code.toByte()
        header[15] = ' '.code.toByte()
        header[16] = 16
        header[17] = 0
        header[18] = 0
        header[19] = 0
        header[20] = 1
        header[21] = 0
        header[22] = channels.toByte()
        header[23] = 0
        header[24] = (sampleRate and 0xff).toByte()
        header[25] = ((sampleRate shr 8) and 0xff).toByte()
        header[26] = ((sampleRate shr 16) and 0xff).toByte()
        header[27] = ((sampleRate shr 24) and 0xff).toByte()
        header[28] = (byteRateVal and 0xff).toByte()
        header[29] = ((byteRateVal shr 8) and 0xff).toByte()
        header[30] = ((byteRateVal shr 16) and 0xff).toByte()
        header[31] = ((byteRateVal shr 24) and 0xff).toByte()
        header[32] = (channels * 16 / 8).toByte()
        header[33] = 0
        header[34] = 16
        header[35] = 0
        header[36] = 'd'.code.toByte()
        header[37] = 'a'.code.toByte()
        header[38] = 't'.code.toByte()
        header[39] = 'a'.code.toByte()
        // 40-43 data size placeholder

        fos.write(header, 0, 44)
    }

    private fun updateWavHeader(file: File) {
        val fileLength = file.length()
        val dataLength = fileLength - 44
        val totalLength = fileLength - 8

        val randomAccessFile = java.io.RandomAccessFile(file, "rw")
        randomAccessFile.seek(4)
        randomAccessFile.write(intToByteArray(totalLength.toInt()), 0, 4)
        randomAccessFile.seek(40)
        randomAccessFile.write(intToByteArray(dataLength.toInt()), 0, 4)
        randomAccessFile.close()
    }

    private fun intToByteArray(value: Int): ByteArray {
        return ByteBuffer.allocate(4).order(ByteOrder.LITTLE_ENDIAN).putInt(value).array()
    }

    private fun startTimer() {
        timerRunnable = object : Runnable {
            override fun run() {
                if (isRecording) {
                    val duration = System.currentTimeMillis() - startTime
                    eventSink?.success(duration.toInt())
                    handler.postDelayed(this, 100)
                }
            }
        }
        handler.post(timerRunnable!!)
    }

    private fun stopTimer() {
        timerRunnable?.let { handler.removeCallbacks(it) }
    }

    override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
        eventSink = events
    }

    override fun onCancel(arguments: Any?) {
        eventSink = null
    }
}
