import SwiftUI

struct ContentView: View {
    @StateObject var whisperState = WhisperState()
    @StateObject var audioRecorder = AudioRecorder()

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("Whisper.cpp iOS")
                    .font(.headline)
                Spacer()
                StatusIndicator(isLoaded: whisperState.isModelLoaded)
            }
            .padding()
            .background(Color(UIColor.secondarySystemBackground))

            Divider()

            // Main Content Area
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    Text(whisperState.currentText.isEmpty ? "Transcription will appear here..." : whisperState.currentText)
                        .font(.body)
                        .padding()
                        .frame(maxWidth: .infinity, alignment: .leading)

                    if !whisperState.messageLog.isEmpty {
                        Divider()
                        Text("Debug Log:")
                            .font(.caption)
                            .bold()
                            .padding(.horizontal)
                        Text(whisperState.messageLog)
                            .font(.caption2)
                            .monospaced()
                            .padding(.horizontal)
                            .foregroundColor(.secondary)
                    }
                }
            }

            Divider()

            // Footer / Controls
            VStack {
                if whisperState.isTranscribing {
                    HStack {
                        ProgressView()
                        Text("Transcribing...")
                            .font(.caption)
                    }
                    .padding(.top, 10)
                }

                Button(action: toggleRecording) {
                    ZStack {
                        Circle()
                            .fill(audioRecorder.isRecording ? Color.red : Color.blue)
                            .frame(width: 70, height: 70)
                            .shadow(radius: 4)

                        Image(systemName: audioRecorder.isRecording ? "stop.fill" : "mic.fill")
                            .font(.title)
                            .foregroundColor(.white)
                    }
                }
                .disabled(!whisperState.isModelLoaded || whisperState.isTranscribing)
                .opacity((!whisperState.isModelLoaded || whisperState.isTranscribing) ? 0.5 : 1.0)
                .padding()
            }
            .background(Color(UIColor.secondarySystemBackground))
        }
        .onAppear {
            // Load model on appear
            whisperState.loadModel()

            // Request permission
            Task {
                _ = await audioRecorder.requestPermission()
            }
        }
        .alert("Error", isPresented: Binding<Bool>(
            get: { audioRecorder.errorMessage != nil },
            set: { if !$0 { audioRecorder.errorMessage = nil } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(audioRecorder.errorMessage ?? "Unknown error")
        }
    }

    private func toggleRecording() {
        Task {
            if audioRecorder.isRecording {
                await audioRecorder.stopRecording()
                // Start transcription automatically after recording stops
                await whisperState.transcribe(audioFrames: audioRecorder.recordedData)
            } else {
                do {
                    try audioRecorder.startRecording()
                } catch {
                    audioRecorder.errorMessage = error.localizedDescription
                }
            }
        }
    }
}

struct StatusIndicator: View {
    let isLoaded: Bool

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(isLoaded ? Color.green : Color.orange)
                .frame(width: 10, height: 10)
            Text(isLoaded ? "Model Ready" : "Loading...")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}
