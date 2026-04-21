import SwiftUI

struct AlertView: View {
    let params: AlertParameters
    let onClose: () -> Void

    var body: some View {
        ZStack {
            Color(nsColor: params.nsColor)
                .ignoresSafeArea()

            VStack(spacing: 32) {
                Spacer()

                Text(params.title)
                    .font(.system(size: 72, weight: .bold))
                    .foregroundColor(.white)
                    .multilineTextAlignment(.center)
                    .shadow(radius: 4)

                Text(params.message)
                    .font(.system(size: 36))
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)

                Spacer()

                Button(action: onClose) {
                    HStack(spacing: 8) {
                        Image(systemName: "xmark.circle.fill")
                            .font(.title2)
                        Text("閉じる")
                            .font(.title2.weight(.medium))
                    }
                    .foregroundColor(.white)
                    .padding(.horizontal, 48)
                    .padding(.vertical, 16)
                    .background(.white.opacity(0.2))
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                }
                .buttonStyle(.plain)
                .keyboardShortcut(.escape, modifiers: [])
                .padding(.bottom, 80)
            }
            .padding(40)
        }
    }
}
