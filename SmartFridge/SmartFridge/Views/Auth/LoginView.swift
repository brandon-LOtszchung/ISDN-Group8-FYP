// Views/Auth/LoginView.swift
import SwiftUI
import UIKit

private enum PhoneAuthStep { case phone, otp }

struct LoginView: View {
    @Environment(ThemeManager.self) private var theme

    @State private var step: PhoneAuthStep = .phone
    @State private var phoneDigits = ""
    @State private var otpCode = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var resendCooldown = 0
    @State private var resendTask: Task<Void, Never>?
    @State private var autoVerifyTask: Task<Void, Never>? = nil

    @State private var formAppeared = false
    @State private var shakeOffset: CGFloat = 0

    private let countryCode = "+852"

    private var fullPhone: String { "\(countryCode)\(phoneDigits)" }
    private var isPhoneValid: Bool {
        let e164 = fullPhone.filter { $0.isNumber || $0 == "+" }
        return e164.hasPrefix("+") && e164.count >= 8 && e164.count <= 16
    }
    private var isOTPValid: Bool { otpCode.count == 6 }

    var body: some View {
        ZStack {
            NeuBackground(screen: .login)
                .environment(theme)

            ScrollView {
                VStack(spacing: 32) {
                    hero

                    formCard

                    if let msg = errorMessage {
                        Text(msg)
                            .font(.spaceGrotesk(.regular, size: 14))
                            .foregroundStyle(theme.colors.danger)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal)
                            .padding(10)
                            .background(theme.colors.danger.opacity(0.08))
                            .clipShape(Rectangle())
                            .overlay(Rectangle().stroke(theme.colors.danger, lineWidth: 1.5))
                            .offset(x: shakeOffset)
                    }

                    if step == .phone {
                        sendCodeButton
                    } else {
                        verifyButton
                        resendButton
                    }

                    if step == .phone {
                        Text(String(localized: "login.privacy_notice"))
                            .font(.spaceGrotesk(.regular, size: 12))
                            .foregroundStyle(theme.colors.textMuted)
                            .multilineTextAlignment(.center)
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, 48)
                .offset(y: formAppeared ? 0 : 40)
                .opacity(formAppeared ? 1 : 0)
            }
            .toolbar {
                ToolbarItemGroup(placement: .keyboard) {
                    Spacer()
                    Button(String(localized: "common.done")) {
                        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
                    }
                }
            }
        }
        .animation(.easeInOut(duration: 0.2), value: step)
        .onAppear {
            withAnimation(.spring(response: 0.5, dampingFraction: 0.7)) {
                formAppeared = true
            }
        }
        .onDisappear {
            resendTask?.cancel()
            autoVerifyTask?.cancel()
        }
        .onChange(of: errorMessage) { _, newValue in
            if newValue != nil { triggerShake() }
        }
    }

    // MARK: - Hero

    private var hero: some View {
        VStack(spacing: 12) {
            ZStack {
                Rectangle()
                    .fill(theme.colors.primary)
                    .frame(width: 80, height: 80)
                    .overlay(Rectangle().stroke(Color(hex: "#1A1630"), lineWidth: 2))
                    .shadow(color: Color(hex: "#1A1630"), radius: 0, x: 4, y: 4)
                Image("ic-tab-fridge")
                    .renderingMode(.original)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 40, height: 40)
                    .accessibilityHidden(true)
            }
            .padding(.top, 56)

            Text("SmartFridge")
                .font(.pixelify(34, weight: .bold))
                .foregroundStyle(theme.colors.text)

            Text(String(localized: "login.subtitle"))
                .font(.dotGothic(15))
                .foregroundStyle(theme.colors.textMuted)
                .multilineTextAlignment(.center)
        }
    }

    // MARK: - Form card

    private var formCard: some View {
        Group {
            if step == .phone {
                phoneSection
            } else {
                otpSection
            }
        }
        .padding(20)
        .background(Color(hex: "#F5EFE0"))
        .clipShape(Rectangle())
        .overlay(Rectangle().stroke(Color(hex: "#1A1630"), lineWidth: 2))
        .shadow(color: Color(hex: "#1A1630"), radius: 0, x: 4, y: 4)
        .offset(x: shakeOffset)
    }

    // MARK: - Phone step

    private var phoneSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(String(localized: "login.phone_number"))
                .font(.spaceGrotesk(.semibold, size: 13))
                .foregroundStyle(theme.colors.text)
                .textCase(.uppercase)
                .tracking(0.5)

            HStack(spacing: 0) {
                Text("+852")
                    .font(.spaceGrotesk(.semibold, size: 16))
                    .frame(width: 86, alignment: .center)

                Rectangle()
                    .fill(Color(hex: "#E8A04A"))
                    .frame(width: 2, height: 44)

                TextField("91234567", text: $phoneDigits)
                    .keyboardType(.phonePad)
                    .textContentType(.telephoneNumber)
                    .font(.spaceGrotesk(.semibold, size: 16))
                    .padding(.vertical, 13)
                    .padding(.horizontal, 12)
                    .frame(maxWidth: .infinity)
                    .onChange(of: phoneDigits) { _, v in
                        phoneDigits = v.filter(\.isNumber)
                    }
            }
            .frame(height: 50)
            .foregroundStyle(Color(hex: "#1A1630"))
            .background(Color(hex: "#FBF5E8"))
            .clipShape(Rectangle())
            .overlay(Rectangle().stroke(Color(hex: "#E8A04A").opacity(0.5), lineWidth: 2))
            .shadow(color: Color(hex: "#E8A04A").opacity(0.3), radius: 0, x: 3, y: 3)

            Text(String(localized: "login.hk_phone_hint"))
                .font(.spaceGrotesk(.light, size: 12))
                .foregroundStyle(theme.colors.textMuted)
        }
    }

    // MARK: - OTP step

    private var otpSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Button {
                withAnimation { step = .phone; otpCode = ""; errorMessage = nil }
            } label: {
                HStack(spacing: 4) {
                    Image("ic-back").renderingMode(.template)
                        .resizable().scaledToFit().frame(width: 14, height: 14)
                    Text(fullPhone)
                        .font(.spaceGrotesk(.medium, size: 14))
                }
                .foregroundStyle(theme.colors.text)
                .padding(.horizontal, 10)
                .padding(.vertical, 6)
                .background(theme.colors.primary.opacity(0.25))
                .clipShape(Rectangle())
                .overlay(Rectangle().stroke(Color(hex: "#1A1A1A"), lineWidth: 1.5))
            }
            .disabled(isLoading)
            .padding(.bottom, 4)

            Text(String(localized: "login.verification_code"))
                .font(.spaceGrotesk(.semibold, size: 13))
                .foregroundStyle(theme.colors.text)
                .textCase(.uppercase)
                .tracking(0.5)

            TextField(String(localized: "login.otp_placeholder"), text: $otpCode)
                .keyboardType(.numberPad)
                .textContentType(.oneTimeCode)
                .font(.spaceGrotesk(.bold, size: 28).monospacedDigit())
                .foregroundStyle(Color(hex: "#1A1630"))
                .multilineTextAlignment(.center)
                .padding(14)
                .background(Color(hex: "#FBF5E8"))
                .clipShape(Rectangle())
                .overlay(Rectangle().stroke(Color(hex: "#E8A04A").opacity(0.5), lineWidth: 2))
                .shadow(color: Color(hex: "#E8A04A").opacity(0.3), radius: 0, x: 3, y: 3)
                .onChange(of: otpCode) { _, v in
                    let filtered = String(v.filter(\.isNumber).prefix(6))
                    if filtered != v { otpCode = filtered }
                    if otpCode.count == 6 {
                        autoVerifyTask?.cancel()
                        autoVerifyTask = Task {
                            try? await Task.sleep(for: .milliseconds(300))
                            if !Task.isCancelled && otpCode.count == 6 {
                                verify()
                            }
                        }
                    }
                }

            Text(String(format: String(localized: "login.sent_to"), fullPhone))
                .font(.spaceGrotesk(.light, size: 12))
                .foregroundStyle(theme.colors.textMuted)
        }
    }

    // MARK: - Buttons

    private var sendCodeButton: some View {
        Button(action: sendCode) {
            Group {
                if isLoading {
                    ProgressView().tint(Color(hex: "#1A1A1A"))
                } else {
                    Text(String(localized: "login.send_code"))
                }
            }
            .frame(height: 24)
        }
        .buttonStyle(NeuButtonStyle(backgroundColor: theme.colors.primary))
        .disabled(!isPhoneValid || isLoading)
        .opacity(!isPhoneValid || isLoading ? 0.5 : 1)
    }

    private var verifyButton: some View {
        Button(action: verify) {
            Group {
                if isLoading {
                    ProgressView().tint(Color(hex: "#1A1A1A"))
                } else {
                    Text(String(localized: "login.verify"))
                }
            }
            .frame(height: 24)
        }
        .buttonStyle(NeuButtonStyle(backgroundColor: theme.colors.primary))
        .disabled(!isOTPValid || isLoading)
        .opacity(!isOTPValid || isLoading ? 0.5 : 1)
    }

    private var resendButton: some View {
        Button {
            otpCode = ""
            errorMessage = nil
            sendCode()
        } label: {
            if resendCooldown > 0 {
                Text(String(format: String(localized: "login.resend_in"), resendCooldown))
                    .font(.spaceGrotesk(.medium, size: 14))
                    .foregroundStyle(theme.colors.textMuted)
            } else {
                Text(String(localized: "login.resend_code"))
                    .font(.spaceGrotesk(.medium, size: 14))
                    .foregroundStyle(theme.colors.text)
                    .underline()
            }
        }
        .disabled(isLoading || resendCooldown > 0)
    }

    // MARK: - Shake

    private func triggerShake() {
        let keyframes: [(CGFloat, Double)] = [
            (-8, 0.0), (8, 0.07), (-6, 0.14), (6, 0.21), (-4, 0.28), (0, 0.35)
        ]
        for (offset, delay) in keyframes {
            DispatchQueue.main.asyncAfter(deadline: .now() + delay) {
                withAnimation(.spring(response: 0.12, dampingFraction: 0.4)) {
                    shakeOffset = offset
                }
            }
        }
    }

    // MARK: - Actions

    private func friendlyError(_ error: Error) -> String {
        let msg = error.localizedDescription.lowercased()
        if msg.contains("invalid") || msg.contains("expired") || msg.contains("otp") {
            return String(localized: "login.error.invalid_otp")
        } else if msg.contains("rate") || msg.contains("too many") {
            return String(localized: "login.error.rate_limit")
        } else if msg.contains("network") || msg.contains("connection") || msg.contains("offline") {
            return String(localized: "login.error.network")
        }
        return String(localized: "login.error.generic")
    }

    private func sendCode() {
        errorMessage = nil
        isLoading = true
#if DEBUG
        print("[LoginView] sendCode — phone=\(fullPhone)")
#endif
        Task {
            defer { isLoading = false }
            do {
                try await SupabaseService.shared.sendPhoneOTP(phone: fullPhone)
#if DEBUG
                print("[LoginView] sendCode ✓ — transitioning to OTP step, cooldown=60s")
#endif
                withAnimation { step = .otp }
                startResendCooldown()
            } catch {
#if DEBUG
                print("[LoginView] sendCode ✗ — \(error)")
#endif
                errorMessage = friendlyError(error)
            }
        }
    }

    private func startResendCooldown() {
        resendTask?.cancel()
        resendCooldown = 60
        resendTask = Task {
            while resendCooldown > 0 && !Task.isCancelled {
                try? await Task.sleep(for: .seconds(1))
                if !Task.isCancelled {
                    resendCooldown -= 1
                }
            }
        }
    }

    private func verify() {
        errorMessage = nil
        isLoading = true
#if DEBUG
        print("[LoginView] verify — phone=\(fullPhone) otpLength=\(otpCode.count)")
#endif
        Task {
            defer { isLoading = false }
            do {
                try await SupabaseService.shared.verifyPhoneOTP(phone: fullPhone, token: otpCode)
#if DEBUG
                print("[LoginView] verify ✓ — auth event will drive loadAll")
#endif
            } catch {
#if DEBUG
                print("[LoginView] verify ✗ — \(error)")
#endif
                errorMessage = friendlyError(error)
            }
        }
    }
}
