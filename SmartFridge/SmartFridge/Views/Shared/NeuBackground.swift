// Views/Shared/NeuBackground.swift
import SwiftUI

enum NeuScreen {
    case login
    case onboarding(step: Int)
    case inventory
    case shopping
    case planning
    case profile
}

struct NeuBackground: View {
    let screen: NeuScreen

    var body: some View {
        GeometryReader { geo in
            ZStack {
                // Warm cream base
                Color(hex: "#FBF5E8")

                // Background image (subtle, very low opacity)
                Image(bgImageName(for: screen))
                    .resizable()
                    .scaledToFill()
                    .frame(width: geo.size.width, height: geo.size.height)
                    .opacity(0.08)
                    .clipped()

                // Per-screen pixel pattern overlay
                Canvas { ctx, size in
                    drawPixelPattern(ctx, size, screen: screen)
                }
                .opacity(0.55)
            }
        }
        .ignoresSafeArea()
    }

    // MARK: - Background image name per screen

    private func bgImageName(for screen: NeuScreen) -> String {
        switch screen {
        case .login:             return "bg-auth-pixel"
        case .onboarding(let s) where s == 0: return "bg-welcome-pixel"
        case .onboarding:        return "bg-onboarding-pixel"
        case .profile:           return "bg-completion-pixel"
        default:                 return "bg-pixel"
        }
    }

    // MARK: - Pattern dispatcher

    private func drawPixelPattern(_ ctx: GraphicsContext, _ size: CGSize, screen: NeuScreen) {
        switch screen {
        case .login:                   drawPixelDotGrid(ctx, size, spacing: 24, dotSize: 3, opacity: 0.10)
        case .onboarding(let step):    drawOnboardingPixels(ctx, size, step: step)
        case .inventory:               drawShelfGrid(ctx, size)
        case .shopping:                drawCheckerAccents(ctx, size)
        case .planning:                drawPixelDotGrid(ctx, size, spacing: 32, dotSize: 2, opacity: 0.07)
        case .profile:                 drawCornerPixels(ctx, size)
        }
    }

    // MARK: - Dot grid (universal pixel art motif)

    private func drawPixelDotGrid(_ ctx: GraphicsContext, _ size: CGSize,
                                   spacing: CGFloat, dotSize: CGFloat, opacity: Double) {
        let amber = Color(hex: "#E8A04A")
        var col: CGFloat = spacing / 2
        while col < size.width {
            var row: CGFloat = spacing / 2
            while row < size.height {
                let rect = CGRect(x: col - dotSize / 2, y: row - dotSize / 2, width: dotSize, height: dotSize)
                ctx.fill(Path(rect), with: .color(amber.opacity(opacity)))
                row += spacing
            }
            col += spacing
        }
    }

    // MARK: - Onboarding: step-specific pixel patterns

    private func drawOnboardingPixels(_ ctx: GraphicsContext, _ size: CGSize, step: Int) {
        switch step {
        case 0: drawPixelDotGrid(ctx, size, spacing: 28, dotSize: 3, opacity: 0.09)
        case 1: drawPixelStripes(ctx, size, vertical: false)
        case 2: drawPixelStripes(ctx, size, vertical: true)
        case 3: drawPixelRings(ctx, size)
        case 4: drawPixelDotGrid(ctx, size, spacing: 40, dotSize: 2, opacity: 0.07)
        default: drawCheckerAccents(ctx, size)
        }
    }

    // MARK: - Horizontal / vertical pixel stripe rows

    private func drawPixelStripes(_ ctx: GraphicsContext, _ size: CGSize, vertical: Bool) {
        let amber = Color(hex: "#E8A04A")
        let spacing: CGFloat = 48
        let thickness: CGFloat = 2

        if vertical {
            var x: CGFloat = spacing
            while x < size.width {
                let rect = CGRect(x: x, y: 0, width: thickness, height: size.height)
                ctx.fill(Path(rect), with: .color(amber.opacity(0.07)))
                x += spacing
            }
        } else {
            var y: CGFloat = spacing
            while y < size.height {
                let rect = CGRect(x: 0, y: y, width: size.width, height: thickness)
                ctx.fill(Path(rect), with: .color(amber.opacity(0.07)))
                y += spacing
            }
        }
        // Overlay dots at intersections
        drawPixelDotGrid(ctx, size, spacing: spacing, dotSize: 3, opacity: 0.10)
    }

    // MARK: - Inventory: shelf lines + diamond markers

    private func drawShelfGrid(_ ctx: GraphicsContext, _ size: CGSize) {
        let amber = Color(hex: "#E8A04A")
        let border = Color(hex: "#1A1630")
        let shelfSpacing: CGFloat = 110

        var row: CGFloat = 80
        while row < size.height {
            let rect = CGRect(x: 16, y: row, width: size.width - 32, height: 2)
            ctx.fill(Path(rect), with: .color(border.opacity(0.06)))
            row += shelfSpacing
        }

        let colSpacing: CGFloat = 72
        var col: CGFloat = colSpacing / 2
        while col < size.width {
            var r: CGFloat = 55
            while r < size.height {
                let d: CGFloat = 5
                var diamond = Path()
                diamond.move(to: CGPoint(x: col, y: r - d))
                diamond.addLine(to: CGPoint(x: col + d, y: r))
                diamond.addLine(to: CGPoint(x: col, y: r + d))
                diamond.addLine(to: CGPoint(x: col - d, y: r))
                diamond.closeSubpath()
                ctx.fill(diamond, with: .color(amber.opacity(0.18)))
                r += shelfSpacing
            }
            col += colSpacing
        }
    }

    // MARK: - Shopping: checker accent squares

    private func drawCheckerAccents(_ ctx: GraphicsContext, _ size: CGSize) {
        let amber = Color(hex: "#E8A04A")
        let sq: CGFloat = 12
        let gap: CGFloat = sq * 2
        var row: Int = 0
        var y: CGFloat = 0
        while y < size.height {
            var x: CGFloat = row % 2 == 0 ? 0 : gap
            while x < size.width {
                let rect = CGRect(x: x, y: y, width: sq, height: sq)
                ctx.fill(Path(rect), with: .color(amber.opacity(0.06)))
                x += gap * 2
            }
            y += gap
            row += 1
        }
    }

    // MARK: - Budget: concentric pixel rings

    private func drawPixelRings(_ ctx: GraphicsContext, _ size: CGSize) {
        let amber = Color(hex: "#E8A04A")
        let center = CGPoint(x: size.width / 2, y: size.height)
        var r: CGFloat = 80
        while r < 600 {
            let ringPath = Path { p in
                p.addArc(center: center, radius: r,
                         startAngle: .degrees(180), endAngle: .degrees(360),
                         clockwise: false)
            }
            ctx.stroke(ringPath, with: .color(amber.opacity(0.08)),
                       style: StrokeStyle(lineWidth: 2))
            r += 56
        }
        drawPixelDotGrid(ctx, size, spacing: 48, dotSize: 2, opacity: 0.06)
    }

    // MARK: - Profile: corner pixel cluster

    private func drawCornerPixels(_ ctx: GraphicsContext, _ size: CGSize) {
        let amber = Color(hex: "#E8A04A")
        // Pixel cluster top-right
        let positions: [(CGFloat, CGFloat)] = [
            (size.width - 20, 20), (size.width - 32, 20), (size.width - 20, 32),
            (size.width - 44, 20), (size.width - 20, 44), (size.width - 32, 32),
        ]
        for (x, y) in positions {
            let rect = CGRect(x: x - 5, y: y - 5, width: 10, height: 10)
            ctx.fill(Path(rect), with: .color(amber.opacity(0.30)))
        }
        drawPixelDotGrid(ctx, size, spacing: 36, dotSize: 2, opacity: 0.07)
    }
}
